import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { FriendsComponent } from './friends/friends';
import { ProfileComponent } from './profile/profile';

@NgModule({
	declarations: [
		FriendsComponent,
		ProfileComponent
	],
	imports: [IonicModule],
	exports: [
		FriendsComponent,
		ProfileComponent
	]
})
export class UserComponentsModule {}
