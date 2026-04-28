/**
 * MEDICAL INTELLIGENCE LAYER
 * Basic rule engine to assist medical admins with interpretations.
 */

export interface MedicalIndicator {
  value: number | string;
  unit: string;
  range: string;
}

export function generateInterpretation(indicatorName: string, data: MedicalIndicator): string {
  const value = typeof data.value === 'string' ? parseFloat(data.value) : data.value;
  
  if (isNaN(value)) return "";

  const name = indicatorName.toLowerCase();

  // CHOLESTEROL
  if (name.includes('cholesterol') || name.includes('ldl')) {
    if (value > 5.0) return "Elevated cholesterol levels may increase cardiovascular risk. Recommend lifestyle modification.";
    if (value > 4.0) return "Borderline high cholesterol. Monitor intake of saturated fats.";
  }

  // GLUCOSE / DIABETES
  if (name.includes('glucose') || name.includes('hba1c')) {
    if (name.includes('glucose')) {
      if (value > 7.0) return "Fast blood glucose is high. Suggests diabetes risk. Clinical correlation required.";
      if (value > 5.6) return "Pre-diabetic glucose levels detected. Recommend HbA1c for confirmation.";
    }
    if (name.includes('hba1c')) {
      if (value > 6.5) return "HbA1c levels indicate diabetes. Urgent physician consultation recommended.";
      if (value > 5.7) return "HbA1c suggests pre-diabetes range.";
    }
  }

  // BLOOD PRESSURE (Rough markers if provided as indicators)
  if (name.includes('systolic')) {
    if (value >= 140) return "Systolic blood pressure is high (Hypertension Stage 2). Urgent review needed.";
    if (value >= 130) return "Elevated blood pressure detected.";
  }

  return "";
}

/**
 * Suggests a flag based on results
 */
export function suggestFlag(rawResults: Record<string, any>): 'NORMAL' | 'ATTENTION' | 'URGENT' {
  let highestSeverity: 'NORMAL' | 'ATTENTION' | 'URGENT' = 'NORMAL';

  for (const [key, data] of Object.entries(rawResults)) {
    const interpretation = generateInterpretation(key, data);
    if (interpretation.includes('Urgent') || interpretation.includes('high') && interpretation.includes('Stage 2')) {
      return 'URGENT';
    }
    if (interpretation.length > 0) {
      highestSeverity = 'ATTENTION';
    }
  }

  return highestSeverity;
}
