import { NgModule } from '@angular/core';
import { SortPipe } from './sort/sort';
import { UnitConversionPipe } from './unit-conversion/unit-conversion';
import { RatioPipe } from './ratio/ratio';
import { CalculatePipe } from './calculate/calculate';
import { TruncatePipe } from './truncate/truncate';
import { RoundPipe } from './round/round';
import { FormatStockPipe } from './format-stock/format-stock';
import { MomentPipe } from './moment/moment';
import { FormatTimePipe } from './format-time/format-time';
@NgModule({
	declarations: [
		SortPipe,
    UnitConversionPipe,
    RatioPipe,
    CalculatePipe,
    TruncatePipe,
    RoundPipe,
    FormatStockPipe,
    MomentPipe,
    FormatTimePipe
  ],
	exports: [
		SortPipe,
    UnitConversionPipe,
    RatioPipe,
    CalculatePipe,
    TruncatePipe,
    RoundPipe,
    FormatStockPipe,
    MomentPipe,
    FormatTimePipe
	]
})
export class PipesModule {}
