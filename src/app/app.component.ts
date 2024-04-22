import { Component, OnInit } from '@angular/core';
import { KafdropApiService, KafkaTopic } from './kafdrop-api.service';
import { catchError, finalize } from 'rxjs/operators';
import { AppError, ErrorAlertingService } from './alert/error-alerting.service';
import { StorageService } from './storage.service';
import { PartitionerService } from './partitioner.service';
import { Settings, SettingsService } from './settings.service';
import { SearchService } from './search.service';
import { KafdropConsts } from './kafdrop-consts';

interface AppFormData {
  topic: KafkaTopic;
  key: string;
  timestamp: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AppFormData, OnInit {
  topics: KafkaTopic[];
  filteredTopics: KafkaTopic[];
  topic: KafkaTopic;
  key: string;
  timestamp: string;
  isValidTimestamp: boolean;
  readonly timestampPattern = String.raw`\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([\\-\\+]\d\d(:?\d\d)?)|Z)?`;
  partition: number;

  kafdropUrl: string;
  pristineKafdropUrl: string;
  autoScrollPages?: number;

  initializing = true;
  searching = false;
  searchProgress: string;

  private initFormPromise: Promise<([KafkaTopic[], { formData: AppFormData }])>;
  private initSettingsPromise: Promise<Settings>;

  constructor(
    private kafdropApi: KafdropApiService,
    private partitioner: PartitionerService,
    private alerter: ErrorAlertingService,
    private storage: StorageService,
    private settings: SettingsService,
    private searcher: SearchService
  ) {
    this.initFormPromise = this.storage.get<'topics', KafkaTopic[]>('topics')
      .then(topicsData => topicsData.topics || [])
      .then(topics => {
        const topicsPromise = topics.length ?
          Promise.resolve(topics) :
          kafdropApi.getTopics()
            .pipe(finalize(() => this.initializing = false))
            .toPromise();

        return Promise.all([topicsPromise, storage.get<'formData', AppFormData>('formData')]);
      });

    this.initSettingsPromise = this.settings.get();
  }

  ngOnInit(): void {
    const formPromise = this.initFormPromise.then(([topics, storage]) => {
      this.setTopics(topics);
      Object.assign<AppComponent, AppFormData>(this, storage.formData);
      this.updatePartition();
      this.validateTimestamp();
    });

    const settingsPromise = this.initSettingsPromise.then(settings => {
      Object.assign<AppComponent, Settings>(this, settings);
      this.pristineKafdropUrl = settings.kafdropUrl;
    });

    Promise.all([formPromise, settingsPromise].map(promise => promise.catch()))
      .then(() => {
        this.initializing = false;
      });
  }

  filterTopics(topicName: string) {
    this.filteredTopics = this.topics.filter(topic => topic.name.includes(topicName));
  }

  updatePartition(): void {
    if (!this.topic || !this.key) {
      this.partition = null;
      return;
    }

    const numPartitions = this.topic.partitions.length;
    this.partition = this.partitioner.getPartition(this.key, numPartitions);
  }

  selectOnFocus(event: FocusEvent): void {
    (event.srcElement as HTMLInputElement).select();
  }

  validateTimestamp(): void {
    this.isValidTimestamp = RegExp(`^${this.timestampPattern}$`).test(this.timestamp);
  }

  storeFormData(): void {
    this.storage.save({ formData: this.getFormData() });
  }

  storeSettings(): void {
    this.settings.save(this.getSettings());
  }

  resetDefaultSettings(): void {
    this.setPristineKafdropUrl();
    this.settings.reset();
    this.reloadSettings().then(() => this.handleKafdropUrlChange());
  }

  handleKafdropUrlInput(): void {
    this.storeSettings();
  }

  handleKafdropUrlChange(): void {
    if (this.isKafdropUrlDirty()) {
      this.topic = null;
      this.handleUnselectedTopic();
      this.reloadTopics();
    }
    this.setPristineKafdropUrl();
  }

  setPristineKafdropUrl(): void {
    this.pristineKafdropUrl = this.kafdropUrl;
  }

  isKafdropUrlDirty(): boolean {
    return this.kafdropUrl !== this.pristineKafdropUrl;
  }

  handleUnselectedTopic(): void {
    if (!this.topic) {
      this.storeFormData();
      this.updatePartition();
    }
  }

  reloadTopics(): void {
    this.alerter.clear();
    this.topics = null;
    this.storage.save({ topics: null });
    this.initializing = true;
    this.kafdropApi.getTopics()
      .pipe(finalize(() => this.initializing = false))
      .subscribe(this.setTopics);
  }

  search(): void {
    this.alerter.clear();
    this.searching = true;
    this.searcher.search(
      {
        key: this.key, topic: this.topic.name, partition: this.partition, timestamp: new Date(this.timestamp.trim()),
        settings: { autoScrollPages: this.autoScrollPages },
        callbacks: { onProgress: progress => this.searchProgress = progress }
      })
      .pipe(
        catchError((err, _caught): never => {
          if (err instanceof AppError) {
            this.alerter.alert(err);
          }
          throw err;
        }),
        finalize(() => {
          this.searching = false;
          this.searchProgress = '';
        })
      )
      .subscribe(offset => {
        this.kafdropApi.topicMessagesApiUrl(this.topic.name).then(topicMessagesApi => {
          const params = `partition=${this.partition}&offset=${offset}&count=${KafdropConsts.MaxPageSize}`;
          window.open(`${topicMessagesApi}?${params}`, '_blank');
        });
      });
  }

  private getFormData(): AppFormData {
    const { topic, key, timestamp } = this;
    return { topic, key, timestamp };
  }

  private getSettings(): Settings {
    const { kafdropUrl, autoScrollPages } = this;
    return { kafdropUrl, autoScrollPages };
  }

  private setTopics = (topics: KafkaTopic[]): void => {
    this.topics = topics;
    this.storage.save({ topics });
  }

  private reloadSettings(): Promise<void> {
    return this.settings.get().then(settings => {
      Object.assign<AppComponent, Settings>(this, settings);
    });
  }
}
