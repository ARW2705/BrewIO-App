import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { UserPage } from './user';
import { UserComponentsModule } from './user-components/user.components.module';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    UserPage,
  ],
  imports: [
    UserComponentsModule,
    ComponentsModule,
    IonicPageModule.forChild(UserPage),
  ]
})
export class UserPageModule {}
