require('dotenv').config();
const mongoose = require('mongoose');
const Biomarker = require('./models/Biomarker');
const { normalizationConfig } = require('./services/normalizationService');

const metadata = {
  "Calcium, Serum": { category: "Biochemistry", min: 2.15, max: 2.55, explanation: "Measures calcium in blood. Essential for bones and nerves." },
  "Creatinine, Serum": { category: "Renal Profile", min: 60, max: 110, explanation: "Waste product from muscle. Primary indicator of kidney function." },
  "Urea, Serum": { category: "Renal Profile", min: 2.5, max: 7.1, explanation: "Waste product of protein metabolism." },
  "Blood Urea Nitrogen": { category: "Renal Profile", min: 2.5, max: 7.1, explanation: "Nitrogen in the blood that comes from urea." },
  "Sodium, Serum": { category: "Electrolytes", min: 135, max: 145, explanation: "Regulates water balance and nerve function." },
  "Potassium, Serum": { category: "Electrolytes", min: 3.5, max: 5.1, explanation: "Vital for heart and muscle function." },
  "Chloride, Serum": { category: "Electrolytes", min: 98, max: 107, explanation: "Assists in maintaining acid-base balance." },
  "Uric Acid, Serum": { category: "Biochemistry", min: 200, max: 430, explanation: "Breakdown product of purines." },
  "Total Cholesterol": { category: "Lipids", min: 3.0, max: 5.0, explanation: "Total amount of cholesterol in blood." },
  "High-Density Lipoprotein (HDL)": { category: "Lipids", min: 1.0, max: 2.0, explanation: "Good cholesterol - removes other forms of cholesterol." },
  "Triglycerides": { category: "Lipids", min: 0.5, max: 1.7, explanation: "Type of fat stored in the body." },
  "Low-Density Lipoprotein (LDL)": { category: "Lipids", min: 1.0, max: 3.0, explanation: "Bad cholesterol - can build up in artery walls." },
  "Very Low-Density Lipoprotein (VLDL)": { category: "Lipids", min: 0.1, max: 1.0, explanation: "Lipoprotein carrying triglycerides." },
  "Total Bilirubin": { category: "Liver Function", min: 5, max: 21, explanation: "Yellow pigment from broken down RBCs." },
  "Direct (Conjugated) Bilirubin": { category: "Liver Function", min: 0, max: 5, explanation: "Bilirubin processed by the liver." },
  "Indirect (Unconjugated) Bilirubin": { category: "Liver Function", min: 1, max: 17, explanation: "Bilirubin not yet processed by the liver." },
  "Total Protein": { category: "Liver Function", min: 60, max: 83, explanation: "Total amount of albumin and globulin." },
  "Albumin, Serum": { category: "Liver Function", min: 35, max: 50, explanation: "Main protein made by liver." },
  "Globulin": { category: "Liver Function", min: 20, max: 35, explanation: "Proteins involved in immune function." },
  "Fasting Plasma Glucose": { category: "Diabetes", min: 3.9, max: 5.5, explanation: "Blood sugar after fasting." },
  "Estimated Average Glucose": { category: "Diabetes", min: 3.9, max: 5.5, explanation: "Mathematical estimate of glucose from HbA1c." },
  "HbA1c": { category: "Diabetes", min: 4.0, max: 5.6, explanation: "Average blood sugar over 3 months." },
  "Hemoglobin": { category: "Hematology", min: 120, max: 160, explanation: "Oxygen-carrying protein in RBCs." },
  "RBC Count": { category: "Hematology", min: 4.0, max: 5.5, explanation: "Total number of red blood cells." },
  "WBC Count": { category: "Hematology", min: 4.5, max: 11.0, explanation: "Total white blood cell count." },
  "Platelets": { category: "Hematology", min: 150, max: 450, explanation: "Cells involved in blood clotting." },
  "Hematocrit": { category: "Hematology", min: 36, max: 48, explanation: "Volume percentage of RBCs in blood." },
  "MCHC": { category: "Hematology", min: 32, max: 36, explanation: "Concentration of hemoglobin in a volume of RBCs." },
  "Urine Protein": { category: "Urine Analysis", min: 0, max: 0.15, explanation: "Protein in urine." },
  "Urine Glucose": { category: "Urine Analysis", min: 0, max: 0.8, explanation: "Sugar in urine." },
  "Urine Urobilinogen": { category: "Urine Analysis", min: 0.2, max: 1.0, explanation: "Breakdown product of bilirubin." },
  "Urine Bilirubin": { category: "Urine Analysis", min: 0, max: 0.02, explanation: "Bilirubin in urine." }
};

async function seed() {
  await mongoose.connect('mongodb://127.0.0.1:27017/HemaSense');
  console.log('Connected to MongoDB');
  
  await Biomarker.deleteMany({});
  
  const finalBiomarkers = Object.keys(normalizationConfig.rules).map(name => {
    const rule = normalizationConfig.rules[name];
    const meta = metadata[name] || {};
    
    return {
      name,
      category: meta.category || "General",
      unit: rule.canonical,
      min: meta.min,
      max: meta.max,
      altUnits: Object.keys(rule.units)
        .filter(u => u !== rule.canonical)
        .map(u => ({ unit: u, factor: rule.units[u] })),
      explanation: meta.explanation || "No explanation available.",
      high_causes: ["Consult physician"],
      low_causes: ["Consult physician"]
    };
  });
  
  await Biomarker.insertMany(finalBiomarkers);
  console.log(`Seeded ${finalBiomarkers.length} corrected biomarkers!`);
  process.exit(0);
}

seed();
