/* Module imports */
import { Injectable } from '@angular/core';

/* Constants imports */
import * as Constant from '../../shared/constants/factors';
import * as Units from '../../shared/constants/units';

/* Interface imports */
import { GrainBill } from '../../shared/interfaces/grain-bill';
import { HopsSchedule } from '../../shared/interfaces/hops-schedule';
import { YeastBatch } from '../../shared/interfaces/yeast-batch';
import { Grains, Hops } from '../../shared/interfaces/library';
import { RecipeVariant } from '../../shared/interfaces/recipe-variant';
import { SelectedUnits } from '../../shared/interfaces/units';

/* Utility function imports */
import { roundToDecimalPlace } from '../../shared/utility-functions/utilities';

/* Provider imports */
import { PreferencesProvider } from '../../providers/preferences/preferences';


@Injectable()
export class CalculationsProvider {

  constructor(public preferenceService: PreferencesProvider) { }

  /***** Unit Conversions *****/

  /**
   * Convert density values between specific gravity, plato, and brix
   *
   * Conversions use the following formulas:
   *   SG to Plato = 135.997sg^3 - 630.272sg^2 + 1111.14sg - 616.868
   *   Plato to SG = (plato / (258.6 - (227.1plato / 258.2))) + 1
   *   Plato <-> Brix considered 1:1
   *
   * @params: density - value to convert
   * @params: inputUnit - the original value unit
   * @params: outputUnit - the target value unit
   *
   * @return: converted density value or -1 if units are not valid
  **/
  convertDensity(
    density: number,
    inputUnit: string,
    outputUnit: string
  ): number {
    if (
      inputUnit === Units.SPECIFIC_GRAVITY.longName
      && (
        outputUnit === Units.PLATO.longName
        || outputUnit === Units.BRIX.longName
      )
    ) {
      return (Math.abs(
        (Constant.SG_TO_PLATO[0] * Math.pow(density, 3))
        - (Constant.SG_TO_PLATO[1] * Math.pow(density, 2))
        + (Constant.SG_TO_PLATO[2] * density)
        - Constant.SG_TO_PLATO[3]
      ));
    } else if (
      outputUnit === Units.SPECIFIC_GRAVITY.longName
      && (
        inputUnit === Units.PLATO.longName
        || inputUnit === Units.BRIX.longName
      )
    ) {
      return (
        (density / (Constant.PLATO_TO_SG[0] - (density * Constant.PLATO_TO_SG[1] / Constant.PLATO_TO_SG[2]))) + 1
      );
    } else if (
      (
        inputUnit === Units.SPECIFIC_GRAVITY.longName
        || inputUnit === Units.PLATO.longName
        || inputUnit === Units.BRIX.longName
      )
      &&
      (
        outputUnit === Units.SPECIFIC_GRAVITY.longName
        || outputUnit === Units.PLATO.longName
        || outputUnit === Units.BRIX.longName
      )
    ) {
      return density;
    }

    return -1;
  }

  /**
   * Convert temperature value between celsius and fahrenheit
   *
   * @params: temperature - value to convert
   * @params: toF - true if converting from celsius to fahrenheit,
   *          false for C -> F
   *
   * @return: converted temperature value
  **/
  convertTemperature(temperature: number, toF: boolean): number {
    if (toF) {
      return temperature * 1.8 + 32;
    }
    return (temperature - 32) / 1.8;
  }

  /**
   * Convert volume values between metric and english standard
   *
   * @params: volume - volume value to convert
   * @params: isLarge - true for large volume unit, false for small
   * @params: toEn - true to convert to english standard, false for metric
   *
   * @return: converted volume value
  **/
  convertVolume(volume: number, isLarge: boolean, toEn: boolean): number {
    if (isLarge) {
      return volume * (toEn ? Constant.L_TO_GAL: Constant.GAL_TO_L);
    } else {
      return volume * (toEn ? Constant.ML_TO_FL: Constant.FL_TO_ML);
    }
  }

  /**
   * Convert weight values between metric and english standard
   *
   * @params: weight - weight value to convert
   * @params: isLarge - true for large weight unit, false for small
   * @params: toEn - true to convert to english standard, false for metric
   *
   * @return: converted weight value
  **/
  convertWeight(weight: number, isLarge: boolean, toEn: boolean): number {
    if (isLarge) {
      return weight * (toEn ? Constant.KG_TO_LB: Constant.LB_TO_KG);
    } else {
      return weight * (toEn ? Constant.G_TO_OZ: Constant.OZ_TO_G);
    }
  }

  /**
   * Data is stored in english standard units and requires conversion otherwise
   *
   * @params: unitType - the unit type to check
   * @params: unit - the unit object to check
   *
   * @return: true if the given unit requires conversion
  **/
  requiresConversion(unitType: string, unit: SelectedUnits): boolean {
    switch(unitType) {
      case 'density':
        return unit.density.longName !== Units.SPECIFIC_GRAVITY.longName;
      case 'temperature':
        return unit.temperature.longName !== Units.TEMPERATURE_ENGLISH.longName;
      case 'volumeLarge':
        return unit.volumeLarge.longName !== Units.VOLUME_ENGLISH_LARGE.longName;
      case 'volumeSmall':
        return unit.volumeSmall.longName !== Units.VOLUME_ENGLISH_SMALL.longName;
      case 'weightLarge':
        return unit.weightLarge.longName !== Units.WEIGHT_ENGLISH_LARGE.longName;
      case 'weightSmall':
        return unit.weightSmall.longName !== Units.WEIGHT_ENGLISH_SMALL.longName;
      default:
        return false;
    }
  }

  /***** End Unit Conversions *****/


  /***** Recipe Calculations *****/

  /**
   * Calculate mash efficiency from grain bill, and measured original gravity
   * with measured batch volume
   *
   * @params: grainBill - array of grains instances
   * @params: measuredOriginalGravity - measured original gravity after mash out
   * @params: measuredBatchVolume - measured volume added to the fermenter
   *
   * @return: updated mash efficiency
  **/
  calculateMashEfficiency(
    grainBill: GrainBill[],
    measuredOriginalGravity: number,
    measuredBatchVolume: number
  ): number {
    const maxEfficiencyGravity: number = this.calculateTotalOriginalGravity(
      measuredBatchVolume,
      1,
      grainBill
    );

    return Math.round(
      (measuredOriginalGravity - 1) / (maxEfficiencyGravity - 1) * 100
    );
  }

  /**
   * Calculate original gravity, final gravity, IBU, SRM,
   * and ABV for a given recipe
   *
   * @params: variant - recipe variant values to calculate with
   *
   * @return: none
  **/
  calculateRecipeValues(variant: RecipeVariant): void {
    let og: number = 1;
    let fg: number = 1;
    let ibu: number = 0;
    let srm: number = 0;
    let abv: number = 0;

    if (variant.grains.length) {
      const attenuationRate: number
        = variant.yeast.length
          ? this.getAverageAttenuation(variant.yeast)
          : 75;

      og = this.calculateTotalOriginalGravity(
        variant.batchVolume,
        (variant.efficiency / 100),
        variant.grains
      );
      fg = this.getFinalGravity(og, attenuationRate);
      srm = this.calculateTotalSRM(variant.grains, variant.batchVolume);
      abv = this.getABV(og, fg);
    }

    if (variant.hops.length) {
      ibu = this.calculateTotalIBU(
        variant.hops,
        og,
        variant.batchVolume,
        variant.boilVolume
      );
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
   * @params: batchVolume - volume to add to fermenter
   * @params: efficiency - expected mash efficiency as decimal between 0 - 1
   * @params: grainBill - array of grains instances
   *
   * @return: total original gravity
  **/
  calculateTotalOriginalGravity(
    batchVolume: number,
    efficiency: number,
    grainBill: GrainBill[]
  ): number {
    if (!grainBill.length) {
      return 0;
    }

    return roundToDecimalPlace(
      (grainBill
        .map((grainsItem: GrainBill): number => {
          return this.getOriginalGravity(
            grainsItem.grainType.gravity,
            grainsItem.quantity,
            batchVolume,
            efficiency
          );
        })
        .reduce((arr: number, curr: number): number => arr + curr - 1)
      ),
      3
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
  calculateTotalIBU(
    hopsSchedule: HopsSchedule[],
    og: number,
    batchVolume: number,
    boilVolume: number
  ): number {
    if (!hopsSchedule.length) {
      return 0;
    }

    return roundToDecimalPlace(
      hopsSchedule
        .map((hops: HopsSchedule): number => {
          if (hops.dryHop) return 0;
          return this.getIBU(hops.hopsType, hops, og, batchVolume, boilVolume);
        })
        .reduce((arr: number, curr: number): number => arr + curr),
      1
    );
  }

  /**
   * Get total Standard Reference Method for all grains instances
   *
   * @params: grainBill - array of grains instances
   * @params: batchVolume - volume in gallons to add to fermenter
   *
   * @return: total SRM value for batch
  **/
  calculateTotalSRM(grainBill: GrainBill[], batchVolume: number): number {
    if (!grainBill.length) {
      return 0;
    }

    return roundToDecimalPlace(
      this.getSRM(
        grainBill
          .map((grains: GrainBill): number => {
            return this.getMCU(grains.grainType, grains, batchVolume);
          })
          .reduce((arr: number, curr: number): number => arr + curr)
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
  getAverageAttenuation(yeast: YeastBatch[]): number {
    let total: number = 0;
    let count: number = 0;
    yeast.forEach((yeastInstance: YeastBatch): void => {
      yeastInstance.yeastType.attenuation.forEach((attn: number): void => {
        total += attn;
        count++;
      })
    });
    return roundToDecimalPlace(total / count, 1);
  }

  /**
   * Get ABV value from original and final gravities
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
      (
        (
          Constant.ABV_FACTORS[0]
          * (og - fg)
          / (Constant.ABV_FACTORS[1] - og)
        )
        * (fg / Constant.ABV_FACTORS[2])
      ),
      3
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
  getOriginalGravity(
    pps: number,
    quantity: number,
    batchVolume: number,
    efficiency: number
  ): number {
    if (pps === 0) {
      return 1;
    }

    return roundToDecimalPlace(
      1 + ((pps - 1) * quantity * efficiency / batchVolume),
      3
    );
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
    return roundToDecimalPlace(
      1 + ((og - 1) * (1 - (attenuation / 100))),
      3
    );
  }

  /**
   * Get original gravity at start of boil
   * Part of Tinseth formula for IBU
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
    return roundToDecimalPlace(
      (batchVolume / boilVolume) * (og - 1),
      9
    );
  }

  /**
   * Get factor for reduced utilization from wort gravity
   * Part of Tinseth formula for IBU
   *
   * @params: boilGravity - original gravity at start of boil
   *
   * @return: "bigness" factor
   *
   * @example: (0.041666667) => 1.134632433
  **/
  getBignessFactor(boilGravity: number) {
    return roundToDecimalPlace(
      Constant.BIGNESS_FACTOR * Math.pow(Constant.BIGNESS_BASE, boilGravity),
      9
    );
  }

  /**
   * Get factor for change in utilization from boil time
   * Part of Tinseth formula for IBU
   *
   * @params: boilTime - the boil time in minutes
   *
   * @return: boil time factor
   *
   * @example: (60) => 0.219104108
  **/
  getBoilTimeFactor(boilTime: number): number {
    return roundToDecimalPlace(
      (
        (1 - Math.pow(Math.E, (Constant.BOIL_TIME_EXP * boilTime)))
        / Constant.BOIL_TIME_FACTOR
      ),
      9
    );
  }

  /**
   * Get utilization of hops for given bigness and boil time factors
   * Part of Tinseth formula for IBU
   *
   * @params: bignessFactor - calculated bigness factor
   * @params: boilTimeFactor - calculated boil time factor
   *
   * @return: utilization factor
   *
   * @example: (1.134632433, 0.219104108) => 0.248602627
  **/
  getUtilization(bignessFactor: number, boilTimeFactor: number): number {
    return roundToDecimalPlace(bignessFactor * boilTimeFactor, 9);
  }

  /**
   * Get IBU for hops instance
   * Use Tinseth formula
   *
   * @params: hops - hops-type information
   * @params: hopsInstance - a hops instance
   * @params: og - original gravity
   * @params: batchVolume - volume in gallons to add to fermenter
   * @params: boilVolume - volume in gallons at start of boil
   *
   * @return: IBUs for hops instance
  **/
  getIBU(
    hops: Hops,
    hopsInstance: HopsSchedule,
    og: number,
    batchVolume: number,
    boilVolume: number
  ): number {
    const bignessFactor: number = this.getBignessFactor(
      this.getBoilGravity(og, batchVolume, boilVolume)
    );
    const boilTimeFactor: number = this.getBoilTimeFactor(hopsInstance.addAt);

    return roundToDecimalPlace(
      (
        hops.alphaAcid
        * hopsInstance.quantity
        * this.getUtilization(bignessFactor, boilTimeFactor)
        * Constant.IBU_FACTOR
        / batchVolume
      ),
      1
    );
  }

  /**
   * Get Malt Color Units value of given grains instance
   *
   * @params: grains - grains-type information
   * @params: grainsInstance - grains instance
   * @params: batchVolume - volume in gallons to add to fermenter
   *
   * @return: MCU value for grains instance
  **/
  getMCU(
    grains: Grains,
    grainsInstance: GrainBill,
    batchVolume: number
  ): number {
    return roundToDecimalPlace(
      grains.lovibond * grainsInstance.quantity / batchVolume, 2
    );
  }

  /**
   * Calculate Standard Reference Method value from MCU
   *
   * @params: mcu - batch mcu value
   *
   * @return: SRM value rounded to whole number
  **/
  getSRM(mcu: number): number {
    return roundToDecimalPlace(
      Constant.SRM_FACTOR * (Math.pow(mcu, Constant.SRM_EXP)),
      1
    );
  }

  /***** End Recipe Calculations *****/

}
