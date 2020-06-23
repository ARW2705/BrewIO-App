/* Module imports */
import { Injectable } from '@angular/core';

/* Constants imports */
import * as Constant from '../../shared/constants/factors';

/* Interface imports */
import { GrainBill } from '../../shared/interfaces/grain-bill';
import { HopsSchedule } from '../../shared/interfaces/hops-schedule';
import { YeastBatch } from '../../shared/interfaces/yeast-batch';
import { Grains, Hops } from '../../shared/interfaces/library';
import { RecipeVariant } from '../../shared/interfaces/recipe-variant';

/* Utility function imports */
import { roundToDecimalPlace } from '../../shared/utility-functions/utilities';


@Injectable()
export class CalculationsProvider {

  constructor() { }

  /**
   * Calculate original gravity, final gravity, IBU, SRM, and ABV for a given recipe
   *
   * @params: variant - recipe variant values to calculate with
   *
   * @return: none
  **/
  calculateRecipeValues(variant: RecipeVariant): void {
    let og = 1;
    let fg = 1;
    let ibu = 0;
    let srm = 0;
    let abv = 0;
    if (variant.grains.length) {
      og = this.calculateTotalOriginalGravity(variant.batchVolume, (variant.efficiency / 100), variant.grains);
      const attenuationRate = variant.yeast.length ? this.getAverageAttenuation(variant.yeast): 75;
      fg = this.getFinalGravity(og, attenuationRate);
      srm = this.calculateTotalSRM(variant.grains, variant.batchVolume);
      abv = this.getABV(og, fg);
    }
    if (variant.hops.length) {
      ibu = this.calculateTotalIBU(variant.hops, og, variant.batchVolume, variant.boilVolume);
    }
    variant.originalGravity = og;
    variant.finalGravity = fg;
    variant.IBU = ibu;
    variant.SRM = srm;
    variant.ABV = abv;
  }

  /**
   * Get original gravity for all grains instances
   *
   * @params: batchVolume - volume in gallons to add to fermenter
   * @params: efficiency - expected mash efficiency as decimal between 0 - 1
   * @params: grainBill - array of grains instances
   *
   * @return: total original gravity
  **/
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

  /**
   * Get IBU for all hops instances
   *
   * @params: hopsSchedule - array of hops instances
   * @params: og - original gravity
   * @params: batchVolume - volume in gallons to add to fermenter
   * @params: boilVolume - volume in gallons at boil start
   *
   * @return: total IBUs
  **/
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

  /**
   * Get total SRM for all grains instances
   *
   * @params: grainBill - array of grains instances
   * @params: batchVolume - volume in gallons to add to fermenter
   *
   * @return: total SRM value for batch
  **/
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

  /**
   * Get average attenuation of yeast instances
   *
   * @params: yeast - array of yeast instances
   *
   * @return: average attenuation of yeast types in whole numbers
  **/
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

  /**
   * Get ABV value from gravities
   *
   * @params: og - original gravity
   * @params: fg - final gravity
   *
   * @return: ABV percentage
   *
   * @example: (1.050, 1.010) => 5.339
  **/
  getABV(og: number, fg: number): number {
    return roundToDecimalPlace(
      (Constant.ABVFactors[0] * (og - fg) / (Constant.ABVFactors[1] - og)) * (fg / Constant.ABVFactors[2])
      , 3
    );
  }

  /**
   * Get original gravity by grains' gravity points
   *
   * @params: pps - gravity points from grains instance
   * @params: quantity - amount of grains in pounds
   * @params: batchVolume - batch volume in gallons to add to fermenter
   * @params: efficiency - expected mash efficiency in decimal between 0 - 1
   *
   * @return: original gravity value
   *
   * @example: (1.037, 10, 5, 0.7) => 1.052
  **/
  getOriginalGravity(pps: number, quantity: number, batchVolume: number, efficiency: number): number {
      return roundToDecimalPlace(1 + ((pps - 1) * quantity * efficiency / batchVolume), 3);
  }

  /**
   * Get final gravity by original gravity value and expected yeast attenuation
   *
   * @params: og - original gravity
   * @params: attenuation - expected yeast attenuation as whole number
   *
   * @return: final gravity
   *
   * @example: (1.050, 70) => 1.015
  **/
  getFinalGravity(og: number, attenuation: number): number {
    return roundToDecimalPlace(1 + ((og - 1) * (1 - (attenuation / 100))), 3);
  }

  /**
   * Get original gravity at start of boil
   *
   * @params: og - original gravity
   * @params: batchVolume - volume in gallons to add to fermenter
   * @params: boilVolume - volume in gallons at start of boil
   *
   * @return: original gravity at start of boil
   *
   * @example: (1.050, 5, 6) => 0.041666667
  **/
  getBoilGravity(og: number, batchVolume: number, boilVolume: number): number {
    return roundToDecimalPlace((batchVolume / boilVolume) * (og - 1), 9);
  }

  /**
   * Get factor for reduced utilization from wort gravity
   *
   * @params: boilGravity - original gravity at start of boil
   *
   * @return: "bigness" factor
   *
   * @example: (0.041666667) => 1.134632433
  **/
  getBignessFactor(boilGravity: number) {
    return roundToDecimalPlace(Constant.BignessFactor * Math.pow(Constant.BignessBase, boilGravity), 9);
  }

  /**
   * Get factor for change in utilization from boil time
   *
   * @params: boilTime - the boil time in minutes
   *
   * @return: boil time factor
   *
   * @example: (60) => 0.219104108
  **/
  getBoilTimeFactor(boilTime: number): number {
    return roundToDecimalPlace((1 - Math.pow(Math.E, (Constant.BoilTimeExp * boilTime))) / Constant.BoilTimeFactor, 9);
  }

  /**
   * Get utilization of hops for given bigness and boil time factors
   *
   * @params: bignessFactor - calculated bigness factor
   * @params: boilTimeFactor - calculated boil time factor
   *
   * @return: utilization factor
   *
   * @example: 1.134632433, 0.219104108) => 0.248602627
  **/
  getUtilization(bignessFactor: number, boilTimeFactor: number): number {
    return roundToDecimalPlace(bignessFactor * boilTimeFactor, 9);
  }

  /**
   * Get IBU for hops instance
   *
   * @params: hops - hops-type information
   * @params: hopsInstance - a hops instance
   * @params: og - original gravity
   * @params: batchVolume - volume in gallons to add to fermenter
   * @params: boilVolume - volume in gallons at start of boil
   *
   * @return: IBUs for hops instance
  **/
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

  /**
   * Get MCU value of given grains instance
   *
   * @params: grains - grains-type information
   * @params: grainsInstance - grains instance
   * @params: batchVolume - volume in gallons to add to fermenter
   *
   * @return: MCU value for grains instance
  **/
  getMCU(grains: Grains, grainsInstance: GrainBill, batchVolume: number): number {
    return roundToDecimalPlace(grains.lovibond * grainsInstance.quantity / batchVolume, 2);
  }

  /**
   * Calculate SRM value from MCU
   *
   * @params: mcu - batch mcu value
   *
   * @return: SRM value rounded to whole number
  **/
  getSRM(mcu: number): number {
    return roundToDecimalPlace(Constant.SRMFactor * (Math.pow(mcu, Constant.SRMExp)), 1);
  }

}
