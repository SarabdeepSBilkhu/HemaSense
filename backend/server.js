require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { extractText } = require('./services/ocrService');
const { Groq } = require('groq-sdk');
const Biomarker = require('./models/Biomarker');
const User = require('./models/User');
const Report = require('./models/Report');
const AuditLog = require('./models/AuditLog');
const auth = require('./middleware/auth');
const { normalizeValue, normalizeQualitative } = require('./services/normalizationService');

const app = express();
const PORT = process.env.PORT || 5000;

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

app.use(helmet()); 
app.use(cors());
app.use(express.json());

require('dotenv').config();

// Add this quick check to verify it loaded!
if (process.env.GROQ_API_KEY) {
  console.log('GROQ API Key successfully loaded!');
} else {
  console.log('GROQ API Key is missing or empty.');
}

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy_key_for_dev'
});

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/HemaSense')
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// --- API Endpoints ---

// Auth / login (Simplified for demo)
app.post('/api/auth/login', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const payload = { user: { id: user._id } };
    jwt.sign(payload, process.env.JWT_SECRET || 'hemasense_super_secret_682nf93m0', { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user });
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get or create default user for demo (returns token now)
app.get('/api/user', async (req, res) => {
  try {
    let user = await User.findOne({ email: 'guest@hemasense.ai' });
    if (!user) {
      user = new User({
        name: 'Guest Patient',
        email: 'guest@hemasense.ai',
        profile: { age: 35, gender: 'Male' }
      });
      await user.save();
    }
    const payload = { user: { id: user._id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'hemasense_super_secret_682nf93m0', { expiresIn: '24h' });
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching user' });
  }
});

// Get all biomarkers
app.get('/api/biomarkers', async (req, res) => {
  try {
    const biomarkers = await Biomarker.find({});
    res.json(biomarkers);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching biomarkers' });
  }
});

// --- Logical Engine Rules ---
const evaluatePatterns = (data) => {
  const matches = [];
  const get = (name) => data.find(d => d.name.toLowerCase().includes(name.toLowerCase()));

  const hb = get("Hemoglobin");
  const mcv = get("Mean Corpuscular Volume") || get("MCV");
  const wbc = get("WBC") || get("Leucocyte");
  const glucose = get("Glucose");
  const ldl = get("LDL");

  // Pattern 1: Iron Deficiency
  if (hb && hb.status === 'Low' && mcv && mcv.status === 'Low') {
    matches.push({
      pattern: "Microcytic Anemia (Likely Iron Deficiency)",
      confidence: "High (85%)",
      contributing: [hb.name, mcv.name],
      action: "Evaluate Serum Ferritin and Iron profile. Dietary iron increase.",
      isAnomaly: false
    });
  }
  
  // Contradiction: Normal Hb but Low MCV
  if (hb && hb.status === 'Normal' && mcv && mcv.status === 'Low') {
    matches.push({
      pattern: "Contradiction: Normal Hb with Low MCV",
      confidence: "Anomaly Flagged",
      contributing: [hb.name, mcv.name],
      action: "Rule out Thalassemia trait. Verify lab precision.",
      isAnomaly: true
    });
  }

  // Pattern 2: Infection
  if (wbc && wbc.status === 'High') {
     matches.push({
      pattern: "Leukocytosis (Potential Infection/Inflammation)",
      confidence: wbc.severity === 2 ? "High (80%)" : "Moderate (60%)",
      contributing: [wbc.name],
      action: "Monitor for systemic infection symptoms. Check WBC differential.",
      isAnomaly: false
     });
  }

  // Pattern 3: Diabetes Risk
  if (glucose && glucose.status === 'High') {
     matches.push({
      pattern: "Hyperglycemia (Diabetes Risk)",
      confidence: glucose.severity === 2 ? "High (90%)" : "Moderate (70%)",
      contributing: [glucose.name],
      action: "Consider HbA1c test. Reduce refined carbohydrate intake.",
      isAnomaly: false
     });
  }

  // Pattern 4: Atherosclerosis Risk
  if (ldl && ldl.status === 'High') {
     matches.push({
      pattern: "Elevated Atherosclerotic Risk",
      confidence: "Strong Signal",
      contributing: [ldl.name],
      action: "Reduce saturated fats. Increase cardiovascular exercise.",
      isAnomaly: false
     });
  }

  return matches;
};

// --- Judgment Engine ---
const getWeight = (name) => {
  const n = name.toLowerCase();
  if (['creatinine', 'hemoglobin', 'glucose', 'wbc', 'alt', 'ast', 'ldl'].some(w => n.includes(w))) return 'High';
  if (['ratio', 'vldl', 'basophils', 'eosinophils'].some(w => n.includes(w))) return 'Low';
  return 'Medium';
};

const applyJudgment = (results, patterns) => {
  const conclusions = [];
  const get = (name) => results.find(d => d.name.toLowerCase().includes(name.toLowerCase()));
  
  // Track which biomarkers are "supported" by pattern matches
  const supportedBiomarkers = new Set();
  patterns.forEach(p => {
    p.contributing.forEach(c => supportedBiomarkers.add(c.toLowerCase()));
  });

  // Renal Logic
  const creat = get("creatinine");
  const bun = get("urea") || get("blood urea nitrogen");
  const bunRatio = results.find(d => d.name.toLowerCase().includes("ratio") && d.category.includes("Renal"));

  if (creat && creat.status === 'Normal' && (!bun || bun.status === 'Normal')) {
    conclusions.push({
      system: "Renal Function",
      status: "Stable",
      message: "Kidney function appears stable. Primary markers (Creatinine) are normal."
    });
    if (bunRatio && bunRatio.status !== 'Normal') {
      bunRatio.isSuppressed = true;
      bunRatio.suppressionReason = "Minor deviation, not clinically significant in isolation since primary renal markers are stable.";
      bunRatio.causes = ["No strong clinical cause indicated."];
    }
  }

  // General Suppression Pass
  results.forEach(r => {
    r.weight = getWeight(r.name);
    const isSupported = supportedBiomarkers.has(r.name.toLowerCase());
    
    if (r.status !== 'Normal' && r.status !== 'Qualitative' && !r.isSuppressed) {
      // Rule: Mild + Low Weight + Not Supported -> Suppress
      if (r.severityGrade === 'Mild' && r.weight === 'Low' && !isSupported) {
        r.isSuppressed = true;
        r.suppressionReason = "Minor deviation, not clinically significant in isolation.";
        r.causes = ["No strong clinical cause indicated."];
      } 
      // Rule: Only show causes if Moderate/Severe OR Supported
      else if (r.severityGrade === 'Mild' && !isSupported) {
        r.causes = ["No strong clinical cause indicated."];
      }
    }
  });

  return conclusions;
};

// Analyze blood report (No persistence)
app.post('/api/analyze', async (req, res) => {
  try {
    const { reportData } = req.body;
    const analysis = await runAnalysisEngine(reportData);
    res.json(analysis);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error analyzing report' });
  }
});

// Save analyzed report (Persistence)
app.post('/api/reports', auth, async (req, res) => {
  try {
    const { reportData, date } = req.body;
    const userId = req.user.id; // Get from JWT directly

    if (!reportData || !Array.isArray(reportData)) {
       return res.status(400).json({ error: 'Invalid report data layout' });
    }

    const analysis = await runAnalysisEngine(reportData);
    
    const newReport = new Report({
      user: userId,
      date: date || new Date(),
      results: analysis.results,
      conclusions: analysis.conclusions,
      patterns: analysis.patterns,
      aiSummary: analysis.aiSummary
    });
    
    await newReport.save();
    
    // Audit Logging (non-blocking)
    new AuditLog({
      user: userId,
      action: 'SAVE_REPORT',
      resource: `ReportID: ${newReport._id}`,
      status: 'SUCCESS'
    }).save().catch(err => console.error('[Audit Error]', err.message));

    res.json({ message: 'Report saved to history', reportId: newReport._id });
  } catch (error) {
    console.error('[CRITICAL SAVE ERROR]', error.message);
    res.status(500).json({ error: 'Failed to save report', details: error.message });
  }
});

// Get report history
app.get('/api/reports/:userId', auth, async (req, res) => {
  try {
    const reports = await Report.find({ user: req.params.userId }).sort({ date: -1 });
    
    // Audit Logging
    await new AuditLog({
      user: req.user.id,
      action: 'FETCH_HISTORY',
      status: 'SUCCESS'
    }).save();

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get trend data for a specific biomarker
app.get('/api/trends/:userId/:parameter', auth, async (req, res) => {
  try {
    const { userId, parameter } = req.params;
    const reports = await Report.find({ user: userId }).sort({ date: 1 });
    
    // Extract time-series for the specific parameter
    const series = reports.map(r => {
      const match = r.results.find(res => res.name.toLowerCase().includes(parameter.toLowerCase()));
      if (match) {
        return {
          date: r.date,
          value: parseFloat(match.value),
          unit: match.unit,
          status: match.status,
          severity: match.severity,
          deviation: match.deviationPercentage
        };
      }
      return null;
    }).filter(s => s !== null);

    // Calculate Trend Direction (Slope)
    let trendDirection = 'Stable';
    if (series.length >= 2) {
      const first = series[0].value;
      const last = series[series.length - 1].value;
      const diff = last - first;
      if (Math.abs(diff) > (first * 0.05)) { // 5% change threshold
        trendDirection = diff > 0 ? 'Increasing' : 'Decreasing';
      }
    }

    res.json({ parameter, trendDirection, series });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// Core logic refactored into a reusable function
async function runAnalysisEngine(reportData) {
    const results = [];
    const biomarkers = await Biomarker.find({});
    const biomarkerMap = {};
    biomarkers.forEach(b => { biomarkerMap[b.name.toLowerCase()] = b; });

    let interpretedDataForAI = '';

    for (const item of reportData) {
      const userInputName = item.name.toLowerCase();
      // Try exact match first, then fuzzy
      let b = biomarkerMap[userInputName];
      if (!b) {
        // Advanced fuzzy: try parts of name if separated by / or -
        const parts = userInputName.split(/[\/\-]/).map(p => p.trim()).filter(p => p.length > 2);
        b = biomarkers.find(db_b => {
          const dbName = db_b.name.toLowerCase();
          return dbName.includes(userInputName) || 
                 userInputName.includes(dbName) ||
                 parts.some(p => dbName.includes(p));
        });
      }

      if (b) {
        let status = 'Normal';
        let severity = 0; 
        let deviationPercentage = 0;
        let severityGrade = 'None';
        let causes = [];

        if (b.min !== null && b.min !== undefined && b.max !== null && b.max !== undefined) {
          // Normalization Logic
          const normalized = normalizeValue(b.name, Number(item.value), item.unit || b.unit);
          const numVal = normalized.normalized_value;
          const displayUnit = normalized.canonical_unit;

          if (numVal < b.min) {
            status = 'Low';
            deviationPercentage = Number((((b.min - numVal) / b.min) * 100).toFixed(1));
            severity = deviationPercentage > 25 ? 2 : (deviationPercentage > 10 ? 1 : 0);
            severityGrade = severity === 2 ? "Severe" : (severity === 1 ? "Moderate" : "Mild");
            causes = b.low_causes;
          } else if (numVal > b.max) {
            status = 'High';
            deviationPercentage = Number((((numVal - b.max) / b.max) * 100).toFixed(1));
            severity = deviationPercentage > 25 ? 2 : (deviationPercentage > 10 ? 1 : 0);
            severityGrade = severity === 2 ? "Severe" : (severity === 1 ? "Moderate" : "Mild");
            causes = b.high_causes;
          }

          results.push({
            name: b.name,
            category: b.category,
            value: numVal,
            unit: displayUnit,
            status,
            severity,
            severityGrade,
            deviationPercentage,
            range: `${b.min} - ${b.max}`,
            causes: causes || [],
            explanation: b.explanation || 'Detailed clinical background for this marker is currently being updated.'
          });
        } else {
          const qualVal = normalizeQualitative(String(item.value));
          results.push({
            name: b.name,
            category: b.category,
            value: item.value, // Keep raw for display
            unit: b.unit || '',
            status: 'Qualitative',
            severity: 0,
            normalized_qualitative: qualVal,
            range: 'Qualitative',
            explanation: b.explanation || 'Detailed clinical background for this marker.'
          });
        }

        if (status !== 'Normal' && status !== 'Qualitative') {
          interpretedDataForAI += `${b.name}: ${item.value} ${b.unit} (${status}, ${deviationPercentage}% ${severityGrade} deviation). `;
        }
      } else {
        results.push({ 
          name: item.name, 
          value: item.value, 
          status: 'Unknown/Unlisted', 
          severity: 0,
          category: 'Miscellaneous',
          range: 'N/A',
          explanation: 'This biomarker was not found in our verified clinical reference database.'
        });
        interpretedDataForAI += `${item.name}: ${item.value} (Unlisted). `;
      }
    }

    const detectedPatterns = evaluatePatterns(results);
    const systemConclusions = applyJudgment(results, detectedPatterns);
    
    const significantFindings = results.filter(r => (r.status !== 'Normal' && r.status !== 'Qualitative') && !r.isSuppressed);
    const minorFindings = results.filter(r => (r.status !== 'Normal' && r.status !== 'Qualitative') && r.isSuppressed);
    const normalFindings = results.filter(r => r.status === 'Normal');

    if (detectedPatterns.length > 0) {
      interpretedDataForAI += `\nEngine detected patterns: ` + detectedPatterns.map(p => `[${p.pattern} - Confidence: ${p.confidence} - Action: ${p.action}]`).join(" ");
    } else if (significantFindings.length === 0) {
      interpretedDataForAI = "All tested primary biomarkers are within perfectly normal limits. Minor deviations have been filtered by the clinical significance engine as noise.";
    }

    let aiSummary = "Summary not available.";
    try {
      if (process.env.GROQ_API_KEY) {
        const chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are HemaSense, a deterministic clinical AI assistant. You must NOT hallucinate diagnoses. You are given a string of PRE-CALCULATED facts, exact % deviations, and pre-matched patterns. Your ONLY job is to wrap these exact facts into a supportive, readable, empathetic 3-paragraph summary for the patient. Acknowledge that minor noise was filtered out by the judgment engine."
            },
            {
              role: "user",
              content: `Here are the deterministic engine results: ${interpretedDataForAI} Please synthesize nicely.`
            }
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.2,
          max_tokens: 350,
        });
        aiSummary = chatCompletion.choices[0]?.message?.content || aiSummary;
      } else {
         aiSummary = "Provide a GROQ_API_KEY in .env to enable the AI Summary.";
      }
    } catch (apiError) {
      aiSummary = "AI Summary unavailable due to an API error.";
    }

    return {
      results,
      significantFindings,
      minorFindings,
      normalFindings,
      conclusions: systemConclusions,
      patterns: detectedPatterns,
      aiSummary
    };
}

// Removing redundant /api/seed endpoint. Use node seedData.js instead.


// OCR & AI Mapping Endpoint
app.post('/api/ocr/upload', auth, upload.single('report'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    // 1. Extract raw text via Tesseract
    const rawText = await extractText(req.file.path);
    
    // 2. Fetch available biomarkers for mapping context
    const biomarkers = await Biomarker.find({}, 'name');
    const validNames = biomarkers.map(b => b.name);

    // 3. Use LLM to map raw OCR text to structured biomarker data
    const prompt = `
      You are a specialized medical lab report parser. 
      From the raw OCR text below, extract biomarker names and their corresponding numerical results.

      STRATEGIC RULES FOR ACCURACY:
      1. COLUMN DETECTION: Lab reports often list "Parameter -> Reference Range -> Result". 
         - The "Reference Range" is usually a range (e.g., 13.0-17.0). IGNORE these.
         - The "Result" is usually the standalone number associated with units (e.g., 10.9 gms%).
      2. DECIMAL SENSITIVITY: Do not shift decimals. "10.9" is 10.9, not 109.
      3. UNIT SCALING: 
         - "lakh/Cumm" means 100,000. E.g., "2.46 lakh" = 2.46.
         - "gms%" or "gm%" = "g/dL".
      4. MAPPING: Map names EXACTLY to this whitelist: [${validNames.join(', ')}].
         - "Platelet Count" or "Platelet" MUST map to "Platelets".
         - "Erythrocyte Count" MUST map to "RBC Count".
         - "Total Leucocyte Count" or "WBC" MUST map to "WBC Count".
         - "Erythrocyte Sedimentation Rate" or "E.S.R" MUST map to "ESR".
         - "Packed Cell Volume" or "PCV" MUST map to "Hematocrit".
      5. UNIQUENESS: MUST NOT reuse the same canonical name for different extracted values. Each name in the JSON must appear at most once.
      6. DISTINCTION: Differentiate "Hemoglobin" from "MCHC" (Concentration).
      8. CLINICAL SANITY CHECK: 
         - RBC Count is typically 4.0-5.5. If you see "10.1" but the text says "4.1 mil/cumm", use 4.1.
         - Hemoglobin is typically 11-17. If you see "1.09" but the text says "10.9 gms%", use 10.9.
      9. MAGNITUDE HEURISTIC: 
         - WBC Count should be 4.0-11.0. If you see "6600", it is in "cells/uL". 
         - Platelet Count should be 150-450. If you see "246000", it is in "cells/uL".
      
      Return a JSON object: { "Canonical Name": { "value": NumericalValue, "unit": "UnitFound" } }.
      Example: { "Hemoglobin": { "value": 10.9, "unit": "gms%" }, "Platelets": { "value": 246000, "unit": "cells/uL" } }
      Exclude parameters where the result is ambiguous or missing.

      RAW TEXT:
      ${rawText}
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a precise clinical data extractor. No conversational filler. JSON only." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    const rawMappedData = JSON.parse(chatCompletion.choices[0].message.content);
    const mappedData = {};

    // 4. Server-Side Normalization
    for (const [name, data] of Object.entries(rawMappedData)) {
      try {
        if (typeof data === 'object' && data.value !== undefined) {
          const normalized = normalizeValue(name, Number(data.value), data.unit || '');
          const finalName = normalized.canonical_name || name;
          mappedData[finalName] = normalized.normalized_value;
        } else {
          // Fallback for flat structure
          mappedData[name] = Number(data);
        }
      } catch (e) {
        console.warn(`[OCR Norm Warning] Failed for ${name}:`, e.message);
        mappedData[name] = typeof data === 'object' ? data.value : data;
      }
    }

    // Audit Logging
    await new AuditLog({
      user: req.user.id,
      action: 'OCR_UPLOAD',
      resource: `File: ${req.file.filename}`,
      status: 'SUCCESS'
    }).save();

    // 5. Cleanup: Delete the file after processing
    const fs = require('fs');
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('[OCR Cleanup Error]', err);
    });

    res.json({ 
      message: 'OCR processing complete', 
      mappedData 
    });
  } catch (error) {
    console.error('[OCR Endpoint Error]', error);
    res.status(500).json({ error: 'Failed to process report' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
