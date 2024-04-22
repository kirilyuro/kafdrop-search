import { Injectable } from '@angular/core';
import { Murmur2Service } from './murmur2.service';

@Injectable({
  providedIn: 'root'
})
export class PartitionerService {
  constructor(private hash: Murmur2Service) {
  }

  getPartition(key: string, numPartitions: number): number {
    return this.hash.compute(key) % numPartitions;
  }
}
