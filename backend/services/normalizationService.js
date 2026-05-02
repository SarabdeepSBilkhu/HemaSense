const normalizationConfig = {
  rules: {
    "Calcium, Serum": {
      canonical: "mmol/L",
      units: { "mmol/L": 1, "mg/dL": 0.25 }
    },
    "Creatinine, Serum": {
      canonical: "µmol/L",
      units: { "µmol/L": 1, "mg/dL": 88.4 }
    },
    "Urea, Serum": {
      canonical: "mmol/L",
      units: { "mmol/L": 1, "mg/dL": 0.1665 }
    },
    "Blood Urea Nitrogen": {
      canonical: "mmol/L",
      units: { "mmol/L": 1, "mg/dL": 0.357 }
    },
    "Sodium, Serum": {
      canonical: "mmol/L",
      units: { "mmol/L": 1, "mEq/L": 1 }
    },
    "Potassium, Serum": {
      canonical: "mmol/L",
      units: { "mmol/L": 1, "mEq/L": 1 }
    },
    "Chloride, Serum": {
      canonical: "mmol/L",
      units: { "mmol/L": 1, "mEq/L": 1 }
    },
    "Uric Acid, Serum": {
      canonical: "µmol/L",
      units: { "µmol/L": 1, "mg/dL": 59.48, "mmol/L": 1000 }
    },
    "Total Cholesterol": {
      canonical: "mmol/L",
      units: { "mmol/L": 1, "mg/dL": 0.02586 }
    },
    "High-Density Lipoprotein (HDL)": {
      canonical: "mmol/L",
      units: { "mmol/L": 1, "mg/dL": 0.02586 }
    },
    "Triglycerides": {
      canonical: "mmol/L",
      units: { "mmol/L": 1, "mg/dL": 0.01129 }
    },
    "Low-Density Lipoprotein (LDL)": {
      canonical: "mmol/L",
      units: { "mmol/L": 1, "mg/dL": 0.02586 }
    },
    "Very Low-Density Lipoprotein (VLDL)": {
      canonical: "mmol/L",
      units: { "mmol/L": 1, "mg/dL": 0.02586 }
    },
    "Total Bilirubin": {
      canonical: "µmol/L",
      units: { "µmol/L": 1, "mg/dL": 17.1 }
    },
    "Direct (Conjugated) Bilirubin": {
      canonical: "µmol/L",
      units: { "µmol/L": 1, "mg/dL": 17.1 }
    },
    "Indirect (Unconjugated) Bilirubin": {
      canonical: "µmol/L",
      units: { "µmol/L": 1, "mg/dL": 17.1 }
    },
    "Total Protein": {
      canonical: "g/L",
      units: { "g/L": 1, "g/dL": 10 }
    },
    "Albumin, Serum": {
      canonical: "g/L",
      units: { "g/L": 1, "g/dL": 10 }
    },
    "Globulin": {
      canonical: "g/L",
      units: { "g/L": 1, "g/dL": 10 }
    },
    "Fasting Plasma Glucose": {
      canonical: "mmol/L",
      units: { "mmol/L": 1, "mg/dL": 0.0555 }
    },
    "Estimated Average Glucose": {
      canonical: "mmol/L",
      units: { "mmol/L": 1, "mg/dL": 0.0555 }
    },
    "HbA1c": {
      canonical: "%",
      units: { "%": 1, "mmol/mol": 0.0915 }
    },
    "Hemoglobin": {
      canonical: "g/L",
      units: { "g/L": 1, "g/dL": 10, "gms%": 10, "gm%": 10 }
    },
    "RBC Count": {
      canonical: "×10¹²/L",
      units: { "×10¹²/L": 1, "million/uL": 1, "mil/cumm": 1 }
    },
    "WBC Count": {
      canonical: "×10⁹/L",
      units: { 
        "×10⁹/L": 1, 
        "thou/uL": 1, 
        "cells/cumm": 0.001,
        "cells/uL": 0.001,
        "cells/µL": 0.001 
      }
    },
    "Platelets": {
      canonical: "×10⁹/L",
      units: { 
        "×10⁹/L": 1, 
        "thou/uL": 1, 
        "lakh/cumm": 100, 
        "lakh/Cumm": 100,
        "Lakh/Cumm": 100,
        "cells/uL": 0.001,
        "cells/cumm": 0.001 
      }
    },
    "Hematocrit": {
      canonical: "%",
      units: { "%": 1, "L/L": 100, "PCV": 1 }
    },
    "MCHC": {
      canonical: "g/dL",
      units: { "g/dL": 1, "g/L": 0.1, "gm%": 1, "gms%": 1 }
    },
    "Urine Protein": {
      canonical: "g/L",
      units: { "g/L": 1, "mg/dL": 0.1 }
    },
    "Urine Glucose": {
      canonical: "mmol/L",
      units: { "mmol/L": 1, "mg/dL": 0.0555 }
    },
    "Urine Urobilinogen": {
      canonical: "mg/dL",
      units: { "mg/dL": 1, "EU/dL": 1 }
    },
    "Urine Bilirubin": {
      canonical: "µmol/L",
      units: { "µmol/L": 1, "mg/dL": 17.1 }
    }
  },
  qualitativeMap: {
    "negative": 0,
    "nil": 0,
    "trace": 1,
    "+": 2,
    "++": 3,
    "+++": 4,
    "normal": 0
  },
  unitMap: {
    "gms%": "g/dL",
    "gm%": "g/dL"
  }
};

/**
 * Normalizes a numerical value based on the parameter and input unit.
 * @param {string} parameter 
 * @param {number} value 
 * @param {string} unit 
 * @returns {object} { normalized_value, canonical_unit }
 */
const aliasRegistry = {
  "wbc": "WBC Count",
  "leucocyte": "WBC Count",
  "rbc": "RBC Count",
  "erythrocyte": "RBC Count",
  "plt": "Platelets",
  "platelet": "Platelets",
  "hb": "Hemoglobin",
  "hemo": "Hemoglobin",
  "pcv": "Hematocrit",
  "esr": "ESR",
  "e.s.r": "ESR",
  "glucose": "Fasting Plasma Glucose",
  "sugar": "Fasting Plasma Glucose"
};

/**
 * Finds a rule by name or alias (deterministic)
 */
function getRule(parameter) {
  const p = parameter.toLowerCase().trim();
  
  // 1. Direct match
  if (normalizationConfig.rules[parameter]) return normalizationConfig.rules[parameter];
  
  // 2. Case-insensitive lookup
  const exactKey = Object.keys(normalizationConfig.rules).find(k => k.toLowerCase() === p);
  if (exactKey) return normalizationConfig.rules[exactKey];
  
  // 3. Alias registry
  const canonicalName = aliasRegistry[p];
  if (canonicalName) return normalizationConfig.rules[canonicalName];
  
  // 4. Fallback: partial match (careful with overlaps)
  const partialKey = Object.keys(normalizationConfig.rules).find(k => k.toLowerCase().includes(p));
  return normalizationConfig.rules[partialKey];
}

function normalizeValue(parameter, value, unit) {
  const p = parameter.toLowerCase().trim();
  
  // Find canonical name
  let canonicalName = Object.keys(normalizationConfig.rules).find(k => k.toLowerCase() === p);
  if (!canonicalName) {
    const aliasMatch = aliasRegistry[p];
    if (aliasMatch) canonicalName = aliasMatch;
  }
  // Fallback to partial if still not found
  if (!canonicalName) {
    canonicalName = Object.keys(normalizationConfig.rules).find(k => k.toLowerCase().includes(p));
  }

  const rule = normalizationConfig.rules[canonicalName];
  if (!rule) return { normalized_value: value, canonical_unit: unit };

  // Handle OCR specific unit mapping first
  const mappedUnit = normalizationConfig.unitMap[unit] || unit;

  if (mappedUnit === rule.canonical) {
    return { 
      normalized_value: applyMagnitudeHeuristics(canonicalName, value), 
      canonical_unit: rule.canonical,
      canonical_name: canonicalName
    };
  }

  const factor = rule.units[mappedUnit];
  if (factor === undefined) {
    return { 
      normalized_value: applyMagnitudeHeuristics(canonicalName, value), 
      canonical_unit: rule.canonical,
      canonical_name: canonicalName
    };
  }

  return {
    normalized_value: applyMagnitudeHeuristics(canonicalName, parseFloat((value * factor).toFixed(3))),
    canonical_unit: rule.canonical,
    canonical_name: canonicalName
  };
}

/**
 * Deterministic Clinical Guardrails
 * If a value is physiologically impossible for the canonical unit but correct for a raw count, auto-scale it.
 */
function applyMagnitudeHeuristics(parameter, value) {
  // WBC Count should be 4.0 - 11.0. 
  // If > 100, we assume it's cells/uL (e.g., 6600) and scale to 6.6
  // If Already < 100, we assume it's already normalized and leave it.
  if (parameter === "WBC Count" && value > 100) {
    return parseFloat((value * 0.001).toFixed(3)); 
  }
  
  // Platelets should be 150 - 450.
  // If > 1000, we assume it's cells/uL (e.g., 246000) and scale to 246.
  // If Already < 1000, we assume it's already normalized or in lakh/cumm.
  if (parameter === "Platelets" && value > 1000) {
    return parseFloat((value * 0.001).toFixed(3)); 
  }
  
  return value;
}

/**
 * Normalizes a qualitative string value (e.g. "++", "Trace").
 * @param {string} value 
 * @returns {number|null}
 */
function normalizeQualitative(value) {
  if (!value) return null;
  const v = value.toLowerCase().trim();
  return normalizationConfig.qualitativeMap[v] ?? null;
}

module.exports = { 
  normalizeValue, 
  normalizeQualitative, 
  normalizationConfig 
};
