import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export class AppError {
  constructor(
    public message: string | string[],
    public code?: number,
    public ok?: boolean
  ) {}
}

@Injectable({
  providedIn: 'root'
})
export class ErrorAlertingService {
  subject: BehaviorSubject<AppError> = new BehaviorSubject<AppError>(null);

  alert(error: AppError): void {
    this.subject.next(error);
  }

  clear(): void {
    this.alert(null);
  }
}
