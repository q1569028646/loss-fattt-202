export interface HealthData {
  weightKg?: number;
  bodyFatPercent?: number;
  steps?: number;
  activeCalories?: number;
}

export async function readHealthData(): Promise<HealthData> {
  return {};
}

export async function writeWeightToHealth(weightKg: number, date: Date): Promise<void> {
}

export async function requestHealthPermissions(): Promise<boolean> {
  return false;
}
