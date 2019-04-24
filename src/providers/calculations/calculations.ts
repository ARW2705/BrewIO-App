import { Injectable } from '@angular/core';

import * as Constant from '../../shared/constants/factors';
import { GrainBill } from '../../shared/interfaces/grain-bill';
import { HopsSchedule } from '../../shared/interfaces/hops-schedule';
import { YeastBatch } from '../../shared/interfaces/yeast-batch';
import { Grains, Hops, Yeast } from '../../shared/interfaces/library';
import { Recipe } from '../../shared/interfaces/recipe';

@Injectable()
export class CalculationsProvider {

  constructor() {
    console.log('Hello CalculationsProvider Provider');
  }

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
    return grainBill
      .map((grainsItem: GrainBill) => {
        return this.getOriginalGravity(
          grainsItem.grainType.gravity,
          grainsItem.quantity,
          batchVolume,
          efficiency);
      })
      .reduce((arr: number, curr: number) => arr + curr - 1);
  }

  calculateTotalIBU(hopsSchedule: Array<HopsSchedule>, og: number, batchVolume: number, boilVolume: number): number {
    return hopsSchedule
      .map(hops => {
        if (hops.dryHop) return 0;
        return this.getIBU(hops.hopsType, hops, og, batchVolume, boilVolume);
      })
      .reduce((arr: number, curr: number) => arr + curr);
  }

  calculateTotalSRM(grainBill: Array<GrainBill>, batchVolume: number): number {
    return this.getSRM(
      grainBill
        .map(grains => {
          return this.getMCU(grains.grainType, grains, batchVolume);
        })
        .reduce((arr: number, curr: number) => arr + curr)
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
    return total / count;
  }

  getABV(og: number, fg: number): number {
    return (og - fg) * Constant.ABVFactor;
  }

  getOriginalGravity(pps: number,
    quantity: number,
    volume: number,
    efficiency: number): number {
      return 1 + ((pps - 1) * quantity * efficiency / volume);
  }

  getFinalGravity(og: number, attenuation: number): number {
    return 1 + ((og - 1) * (1 - (attenuation / 100)));
  }

  getBoilGravity(og: number, batchVolume: number, boilVolume: number): number {
    return (batchVolume / boilVolume) * (og - 1);
  }

  getBignessFactor(boilGravity: number) {
    return Constant.BignessFactor * Math.pow(Constant.BignessBase, boilGravity);
  }

  getBoilTimeFactor(boilTime: number): number {
    return (1 - Math.pow(Math.E, (Constant.BoilTimeExp * boilTime))) / Constant.BoilTimeFactor;
  }

  getUtilization(bignessFactor: number, boilTimeFactor: number): number {
    return bignessFactor * boilTimeFactor;
  }

  getIBU(hops: Hops, hopsInstance: HopsSchedule, og: number, batchVolume: number, boilVolume: number): number {
    return hops.alphaAcid
           * hopsInstance.quantity
           * this.getUtilization(
               this.getBignessFactor(
                 this.getBoilGravity(og, batchVolume, boilVolume)), this.getBoilTimeFactor(hopsInstance.addAt))
           * Constant.IBUFactor
           / batchVolume;
  }

  getMCU(grains: Grains, grainsInstance: GrainBill, batchVolume: number): number {
    return grains.lovibond * grainsInstance.quantity / batchVolume;
  }

  getSRM(mcu: number): number {
    return Constant.SRMFactor * (Math.pow(mcu, Constant.SRMExp));
  }

}
