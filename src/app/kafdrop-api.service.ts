import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, OperatorFunction, of } from 'rxjs';
import { AppError, ErrorAlertingService } from './alert/error-alerting.service';
import { catchError, map, flatMap } from 'rxjs/operators';
import { SettingsService } from './settings.service';

interface Dictionary { [key: string]: any; }

export type KafkaOffset = number;

export interface TopicMessagesParams extends Dictionary {
  partition: number;
  offset: KafkaOffset;
  count: number;
}

export interface KafkaTopic {
  name: string;
  partitions: { id: number }[];
}

export interface KafkaPartition {
  partition: number;
  firstOffset: KafkaOffset;
  lastOffset: KafkaOffset;
}

interface BaseKafkaMessage {
  key: string;
  partition: number;
  offset: KafkaOffset;
  message: string;
}

interface RawKafkaMessage extends BaseKafkaMessage {
  timestamp: string;
}

export interface KafkaMessage extends BaseKafkaMessage {
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class KafdropApiService {
  constructor(
    private http: HttpClient,
    private alerter: ErrorAlertingService,
    private settings: SettingsService
  ) {}

  topicMessagesApiUrl(topic: string): Promise<string> {
    return this.topicsApiUrl()
      .then(topicsApi => `${topicsApi}/${topic}/messages`);
  }

  topicsApiUrl(): Promise<string> {
    return this.getBaseUrl()
      .then(baseUrl => `${baseUrl}/topic`);
  }

  getPartitions(topic: string): Observable<KafkaPartition[]> {
    return from(this.topicMessagesApiUrl(topic)).pipe(
      flatMap(url =>
        this.http.get<KafkaPartition[]>(url).pipe(this.alertOnError())
      )
    );
  }

  getMessages(topic: string, params: TopicMessagesParams): Observable<KafkaMessage[]> {
    if (params.offset < 0) {
      if (params.offset + params.count > 0) {
        params.offset = 0;
        params.count += params.offset;
      }
      else return of<KafkaMessage[]>([]);
    }

    return from(this.topicMessagesApiUrl(topic)).pipe(
      flatMap(url =>
        this.http.get<RawKafkaMessage[]>(url, { params: {...params, isAnyProto: false} as any })
          .pipe(
            this.alertOnError(),
            map<RawKafkaMessage[], KafkaMessage[]>(messages =>
              messages.map(message => ({ ...message, timestamp: new Date(message.timestamp) }))
            )
          )
      )
    );
  }

  getTopics(): Observable<KafkaTopic[]> {
    return from(this.topicsApiUrl()).pipe(
      flatMap(url =>
        this.http.get<KafkaTopic[]>(url).pipe(this.alertOnError())
      )
    );
  }

  private getBaseUrl(): Promise<string> {
    return this.settings.get()
      .then(({ kafdropUrl }) => {
        if (!kafdropUrl) {
          const error = new AppError(`Invalid Kafdrop URL: "${kafdropUrl}"`);
          this.alerter.alert(error);
          throw error;
        }
        return kafdropUrl;
      });
  }

  private alertOnError<T>(): OperatorFunction<T, any> {
    return catchError<T>((err): never => {
      this.alerter.alert(new AppError(err.message, err.status, err.ok));
      throw err;
    });
  }
}
