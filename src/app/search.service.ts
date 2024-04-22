import { Injectable } from '@angular/core';
import { Observable, of, zip } from 'rxjs';
import { flatMap, map, mergeMap } from 'rxjs/operators';
import { AppError } from './alert/error-alerting.service';
import { KafdropApiService, KafkaMessage, KafkaOffset } from './kafdrop-api.service';
import { KafdropConsts } from './kafdrop-consts';

interface SearchSettings {
  autoScrollPages?: number;
}

interface SearchCallbacks {
  onProgress?: (progress: string) => void;
}

interface BaseSearchParam {
  key: string;
  topic: string;
  partition: number;
  settings: SearchSettings;
  callbacks?: SearchCallbacks;
}

export interface SearchParams extends BaseSearchParam {
  timestamp: Date;
}

interface SearchRefinementParams extends SearchParams {
  fromOffset: KafkaOffset;
  toOffset: KafkaOffset;
  attempt: number;
}

interface SearchFinalizationParams extends SearchRefinementParams {
  refinedOffset: KafkaOffset;
}

interface PageScrollingParams extends SearchFinalizationParams {
  scrollsLeft: number;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private readonly maxRefinementAttempts = 30;

  constructor(private kafdropApi: KafdropApiService) {
  }

  private static reportProgress(progress: string, callbacks?: SearchCallbacks): void {
    if (callbacks && callbacks.onProgress) {
      callbacks.onProgress(progress);
    }
  }

  search(params: SearchParams): Observable<KafkaOffset> {
    const { topic, partition, timestamp } = params;

    SearchService.reportProgress('Searching...', params.callbacks);

    return this.kafdropApi.getPartitions(topic)
      .pipe(mergeMap(partitions => {
        const partitionData = partitions.find(p => p.partition === partition);

        if (partitionData.firstOffset === partitionData.lastOffset) {
          throw new AppError('Search rejected:\nPartition is empty');
        }

        return (
          zip(
            this.kafdropApi.getMessages(topic, { partition, offset: partitionData.firstOffset, count: 1 }),
            this.kafdropApi.getMessages(topic, { partition, offset: partitionData.lastOffset - 1, count: 1 })
          )
          .pipe(mergeMap(([[firstMessage], [lastMessage]]) => {
            if (timestamp < firstMessage.timestamp || timestamp > lastMessage.timestamp) {
              throw new AppError('Search rejected:\nTarget timestamp is out of range of timestamps in the partition');
            }

            return this.refineSearch(
              { ...params, fromOffset: partitionData.firstOffset, toOffset: partitionData.lastOffset, attempt: 1 }
            );
          }))
        );
      }));
  }

  private refineSearch(params: SearchRefinementParams): Observable<KafkaOffset> {
    const { topic, partition, timestamp, attempt } = params;
    let { fromOffset, toOffset } = params;

    SearchService.reportProgress(`Refining search... ${attempt}`, params.callbacks);

    if (attempt > this.maxRefinementAttempts) {
      throw new AppError('Search failed:\nExceeded max search refinement attempts');
    }

    if (toOffset - fromOffset <= KafdropConsts.MaxPageSize) {
      return this.finalizeSearch({ ...params, refinedOffset: fromOffset });
    }

    const offset = Math.round((fromOffset + toOffset) / 2);
    return this.kafdropApi.getMessages(topic, { partition, offset, count: 1 })
      .pipe(mergeMap(([message]) => {
        if (message.timestamp < timestamp) {
          fromOffset = message.offset;
        } else {
          toOffset = message.offset;
        }
        return this.refineSearch({ ...params, fromOffset, toOffset, attempt: attempt + 1 });
      }));
  }

  private finalizeSearch(params: SearchFinalizationParams): Observable<KafkaOffset> {
    const { refinedOffset } = params;

    SearchService.reportProgress('Finalizing search...', params.callbacks);

    return this.scrollPages({ ...params, scrollsLeft: (params.settings.autoScrollPages || 0) * 2 })
      .pipe(map(message => message ? message.offset : refinedOffset));
  }

  private scrollPages(params: PageScrollingParams): Observable<KafkaMessage> {
    const {key, topic, partition, refinedOffset, scrollsLeft, settings: { autoScrollPages } } = params;

    if (scrollsLeft < 0) { return of(null); }

    const scrollFactor =
      ((autoScrollPages * 2 - scrollsLeft) % 2) * ((autoScrollPages * 2 - scrollsLeft + 1) / 2)
      + ((autoScrollPages * 2 - scrollsLeft + 1) % 2) * (scrollsLeft / 2 - autoScrollPages);

    SearchService.reportProgress(`Scrolling pages... ${scrollFactor}`, params.callbacks);

    const scrollOffset = refinedOffset + KafdropConsts.MaxPageSize * scrollFactor;

    return this.kafdropApi.getMessages(topic, { partition, offset: scrollOffset, count: KafdropConsts.MaxPageSize })
      .pipe(flatMap(messages => {
        const targetMessage = messages.find(message => message.key === key);
        return targetMessage ?
          of(targetMessage) :
          this.scrollPages({ ...params, scrollsLeft: scrollsLeft - 1 });
      }));
  }
}
