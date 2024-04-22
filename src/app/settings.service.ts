import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { KafdropConsts } from './kafdrop-consts';

export interface Settings {
  kafdropUrl: string;
  autoScrollPages?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly defaultSettings: Settings = {
    kafdropUrl: KafdropConsts.DefaultUrl,
    autoScrollPages: 10
  };

  constructor(private storage: StorageService) {
  }

  save(settings: Settings): void {
    this.storage.save({ settings });
  }

  get(): Promise<Settings> {
    return this.storage.get<'settings', Settings>('settings')
      .then(settingsStore => settingsStore.settings || this.defaultSettings);
  }

  reset(): void {
    this.save(this.defaultSettings);
  }
}
