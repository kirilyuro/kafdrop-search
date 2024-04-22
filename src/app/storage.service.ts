import { Injectable } from '@angular/core';
declare const chrome: any;

type StoredData<T, K extends string> = { [key in K]: T };

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  save<T>(data: StoredData<T, string>): void {
    chrome.storage.local.set(data);
  }

  get<K extends string, T>(key: K): Promise<StoredData<T, K>> {
    return new Promise<StoredData<T, K>>(resolve => {
      chrome.storage.local.get(key, result => resolve(result));
    });
  }
}
