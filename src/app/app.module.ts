import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ErrorHandler, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { AccordionModule } from 'primeng/accordion';
import { TooltipModule } from 'primeng/tooltip';
import { AppComponent } from './app.component';
import { AlertComponent } from './alert/alert.component';
import { GlobalErrorHandler } from './global-error-handler';

@NgModule({
  declarations: [
    AppComponent,
    AlertComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ButtonModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    InputTextModule,
    AutoCompleteModule,
    AccordionModule,
    TooltipModule
  ],
  providers: [{provide: ErrorHandler, useClass: GlobalErrorHandler}],
  bootstrap: [AppComponent]
})
export class AppModule {
}
