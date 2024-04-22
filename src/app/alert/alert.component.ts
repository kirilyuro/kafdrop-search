import { Component } from '@angular/core';
import { AppError, ErrorAlertingService } from './error-alerting.service';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss']
})
export class AlertComponent {
  error: AppError;
  kafdropUrl: Promise<string>;

  constructor(
    private alertingService: ErrorAlertingService,
    private settings: SettingsService
  ) {
    alertingService.subject.subscribe(error => {
      this.error = error;
    });
    this.kafdropUrl = settings.get().then(({ kafdropUrl }) => kafdropUrl);
  }

  errorCodeDefined(): boolean {
    return typeof this.error.code === 'number';
  }
}
