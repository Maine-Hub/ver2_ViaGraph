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

/**
 * Rounds a number to the nearest whole peso (nearest integer).
 * @param value The number to round.
 * @returns The rounded number.
 */
function roundToNearestPeso(value: number): number {
  return Math.round(value);
}

/**
 * Calculates the regular fare based on the vehicle type (always base fare for a single ride segment).
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
  return roundToNearestPeso(baseFare);
}

/**
 * Calculates the discounted fare for students, seniors, and PWDs based on vehicle type (always base fare discount).
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
  const discountPercentage = Number(rules.discount_percentage);

  // Apply discount to the base fare
  const rawDiscountedFare = baseFare * (1 - discountPercentage);

  // Round up to the nearest whole peso (e.g. 10.40 becomes 11.00)
  return Math.ceil(rawDiscountedFare);
}
