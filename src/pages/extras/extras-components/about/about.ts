/* Module imports */
import { Component } from '@angular/core';

/* Constant imports */
import { API_VERSION } from '../../../../shared/constants/api-version';
import { APP_VERSION } from '../../../../shared/constants/app-version';


@Component({
  selector: 'about',
  templateUrl: 'about.html'
})
export class AboutComponent {
  appDescription: string = `
    BrewIO is a multi-purpose tool to design homebrews, organize production, and
    track inventory.
  `;  apiVersion: string = API_VERSION.split('v')[1];
  appVersion: string = APP_VERSION;
  readonly githubURL: string = 'https://github.com/ARW2705/BrewIO-App';

  constructor() { }

}
