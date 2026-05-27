// Rules derived from LTFRB fare matrices, now can be managed via DB
export type VehicleType = 'jeepney' | 'minibus' | 'bus' | 'walking';

export interface FareRule {
  vehicle_type: string;
  base_fare: number;
  first_km: number;
  succeeding_km_fare: number;
  discount_percentage: number;
}

export const defaultFareRules: Record<Exclude<VehicleType, 'walking'>, FareRule> = {
  jeepney: {
    vehicle_type: 'jeepney',
    base_fare: 13.0,
    first_km: 4,
    succeeding_km_fare: 1.8,
    discount_percentage: 0.20,
  },
  minibus: {
    vehicle_type: 'minibus',
    base_fare: 15.0,
    first_km: 4,
    succeeding_km_fare: 2.2,
    discount_percentage: 0.20,
  },
  bus: {
    vehicle_type: 'bus',
    base_fare: 15.0,
    first_km: 4,
    succeeding_km_fare: 2.2,
    discount_percentage: 0.20,
  },
};

const roundingIncrement = 0.25;

/**
 * Rounds a number to the nearest quarter (0.25).
 * @param value The number to round.
 * @returns The rounded number.
 */
function roundToNearestQuarter(value: number): number {
  return Math.round(value / roundingIncrement) * roundingIncrement;
}

/**
 * Calculates the regular fare based on the distance and vehicle type.
 * @param distance in kilometers
 * @param type vehicle type (jeepney, minibus, walking)
 * @param specificRule optional dynamic rules from DB
 * @returns the calculated and rounded regular fare
 */
export function calculateFare(distance: number, type: VehicleType = 'jeepney', specificRule?: FareRule): number {
  if (distance <= 0 || type === 'walking') {
    return 0;
  }

  const rules = specificRule || defaultFareRules[type as keyof typeof defaultFareRules];
  if (!rules) return 0;

  const baseFare = Number(rules.base_fare);
  const firstKm = Number(rules.first_km);
  const succeedingKmFare = Number(rules.succeeding_km_fare);

  if (distance <= firstKm) {
    return baseFare;
  }

  const additionalDistance = distance - firstKm;
  const rawFare = baseFare + (additionalDistance * succeedingKmFare);

  return roundToNearestQuarter(rawFare);
}

/**
 * Calculates the discounted fare for students, seniors, and PWDs based on distance and vehicle type.
 * @param distance in kilometers
 * @param type vehicle type (jeepney, minibus, walking)
 * @param specificRule optional dynamic rules from DB
 * @returns the calculated and rounded discounted fare
 */
export function calculateDiscountedFare(distance: number, type: VehicleType = 'jeepney', specificRule?: FareRule): number {
  if (distance <= 0 || type === 'walking') {
    return 0;
  }

  const rules = specificRule || defaultFareRules[type as keyof typeof defaultFareRules];
  if (!rules) return 0;

  const baseFare = Number(rules.base_fare);
  const firstKm = Number(rules.first_km);
  const succeedingKmFare = Number(rules.succeeding_km_fare);
  const discountPercentage = Number(rules.discount_percentage);

  let rawRegularFare: number;
  if (distance <= firstKm) {
    rawRegularFare = baseFare;
  } else {
    const additionalDistance = distance - firstKm;
    rawRegularFare = baseFare + (additionalDistance * succeedingKmFare);
  }

  // Apply discount to the un-rounded regular fare
  const rawDiscountedFare = rawRegularFare * (1 - discountPercentage);

  // Round the final discounted value to the nearest quarter
  return roundToNearestQuarter(rawDiscountedFare);
}
