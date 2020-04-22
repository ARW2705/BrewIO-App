import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { PreferencesComponent } from './preferences/preferences';
import { AboutComponent } from './about/about';
import { FriendsComponent } from './friends/friends';
import { ProfileComponent } from './profile/profile';

@NgModule({
	declarations: [
		PreferencesComponent,
		AboutComponent,
		FriendsComponent,
		ProfileComponent
	],
	imports: [IonicModule],
	exports: [
		PreferencesComponent,
		AboutComponent,
		FriendsComponent,
		ProfileComponent
	]
})
export class UserComponentsModule {}
