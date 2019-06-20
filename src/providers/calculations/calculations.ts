import { Injectable } from '@angular/core';

import * as Constant from '../../shared/constants/factors';
import { GrainBill } from '../../shared/interfaces/grain-bill';
import { HopsSchedule } from '../../shared/interfaces/hops-schedule';
import { YeastBatch } from '../../shared/interfaces/yeast-batch';
import { Grains, Hops } from '../../shared/interfaces/library';
import { Recipe } from '../../shared/interfaces/recipe';

import { roundToDecimalPlace } from '../../shared/utility-functions/utilities';

@Injectable()
export class CalculationsProvider {

  constructor() { }

  calculateRecipeValues(recipe: Recipe) {
    let og = 1;
    let fg = 1;
    let ibu = 0;
    let srm = 0;
    let abv = 0;
    if (recipe.grains.length) {
      og = this.calculateTotalOriginalGravity(recipe.batchVolume, (recipe.efficiency / 100), recipe.grains);
      const attenuationRate = recipe.yeast.length ? this.getAverageAttenuation(recipe.yeast): 75;
      fg = this.getFinalGravity(og, attenuationRate);
      srm = this.calculateTotalSRM(recipe.grains, recipe.batchVolume);
      abv = this.getABV(og, fg);
    }
    if (recipe.hops.length) {
      ibu = this.calculateTotalIBU(recipe.hops, og, recipe.batchVolume, recipe.boilVolume);
    }
    recipe.originalGravity = og;
    recipe.finalGravity = fg;
    recipe.IBU = ibu;
    recipe.SRM = srm;
    recipe.ABV = abv;
  }

  calculateTotalOriginalGravity(batchVolume: number, efficiency: number, grainBill: Array<GrainBill>): number {
    return roundToDecimalPlace(
      grainBill
        .map((grainsItem: GrainBill) => {
          return this.getOriginalGravity(
            grainsItem.grainType.gravity,
            grainsItem.quantity,
            batchVolume,
            efficiency);
        })
        .reduce((arr: number, curr: number) => arr + curr - 1), 3
    );
  }

  calculateTotalIBU(hopsSchedule: Array<HopsSchedule>, og: number, batchVolume: number, boilVolume: number): number {
    return roundToDecimalPlace(
      hopsSchedule
        .map(hops => {
          if (hops.dryHop) return 0;
          return this.getIBU(hops.hopsType, hops, og, batchVolume, boilVolume);
        })
        .reduce((arr: number, curr: number) => arr + curr),
      1
    );
  }

  calculateTotalSRM(grainBill: Array<GrainBill>, batchVolume: number): number {
    return roundToDecimalPlace(
      this.getSRM(
        grainBill
          .map(grains => {
            return this.getMCU(grains.grainType, grains, batchVolume);
          })
          .reduce((arr: number, curr: number) => arr + curr)
      ),
      1
    );
  }

  getAverageAttenuation(yeast: Array<YeastBatch>): number {
    let total = 0;
    let count = 0;
    yeast.forEach(item => {
      item.yeastType.attenuation.forEach(type => {
        total += type;
        count++;
      })
    });
    return roundToDecimalPlace(total / count, 1);
  }

  getABV(og: number, fg: number): number {
    return roundToDecimalPlace(
      (Constant.ABVFactors[0] * (og - fg) / (Constant.ABVFactors[1] - og)) * (fg / Constant.ABVFactors[2])
      ,3
    );
  }

  getOriginalGravity(pps: number,
    quantity: number,
    volume: number,
    efficiency: number): number {
      return roundToDecimalPlace(1 + ((pps - 1) * quantity * efficiency / volume), 3);
  }

  getFinalGravity(og: number, attenuation: number): number {
    return roundToDecimalPlace(1 + ((og - 1) * (1 - (attenuation / 100))), 3);
  }

  getBoilGravity(og: number, batchVolume: number, boilVolume: number): number {
    return roundToDecimalPlace((batchVolume / boilVolume) * (og - 1), 9);
  }

  getBignessFactor(boilGravity: number) {
    return roundToDecimalPlace(Constant.BignessFactor * Math.pow(Constant.BignessBase, boilGravity), 9);
  }

  getBoilTimeFactor(boilTime: number): number {
    return roundToDecimalPlace((1 - Math.pow(Math.E, (Constant.BoilTimeExp * boilTime))) / Constant.BoilTimeFactor, 9);
  }

  getUtilization(bignessFactor: number, boilTimeFactor: number): number {
    return roundToDecimalPlace(bignessFactor * boilTimeFactor, 9);
  }

  getIBU(hops: Hops, hopsInstance: HopsSchedule, og: number, batchVolume: number, boilVolume: number): number {
    const bignessFactor = this.getBignessFactor(this.getBoilGravity(og, batchVolume, boilVolume));
    const boilTimeFactor = this.getBoilTimeFactor(hopsInstance.addAt);

    return roundToDecimalPlace(
      hops.alphaAcid
      * hopsInstance.quantity
      * this.getUtilization(bignessFactor, boilTimeFactor)
      * Constant.IBUFactor
      / batchVolume,
      1
    );
  }

  getMCU(grains: Grains, grainsInstance: GrainBill, batchVolume: number): number {
    return roundToDecimalPlace(grains.lovibond * grainsInstance.quantity / batchVolume, 2);
  }

  getSRM(mcu: number): number {
    return roundToDecimalPlace(Constant.SRMFactor * (Math.pow(mcu, Constant.SRMExp)), 1);
  }

}
