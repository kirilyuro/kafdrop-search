import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { ignoreSpuriousPopupResize } from './app/primeng-overlay-resize-fix';

ignoreSpuriousPopupResize();

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
