import { NgModule } from '@angular/core';
import { SortPipe } from './sort/sort';
@NgModule({
	declarations: [SortPipe],
	exports: [SortPipe]
})
export class PipesModule {}
