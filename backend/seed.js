require('dotenv').config();
const mongoose = require('mongoose');
const Report = require('./models/Report');

const MONGO_URI = 'mongodb://127.0.0.1:27017/HemaSense';
const USER_ID = '69f0c4683d2d8d0c111d1bc0';

const seedData = [
  {
    user: USER_ID,
    date: new Date('2026-04-01'),
    results: [
      {
        name: "Hemoglobin",
        category: "Hematology",
        value: 130,
        unit: "g/L",
        status: "Normal",
        severity: 0,
        severityGrade: "None",
        deviationPercentage: 0,
        range: "120 - 160",
        causes: [],
        explanation: "Oxygen-carrying protein"
      },
      {
        name: "WBC Count",
        category: "Hematology",
        value: 6.5,
        unit: "×10⁹/L",
        status: "Normal",
        severity: 0,
        severityGrade: "None",
        deviationPercentage: 0,
        range: "4.5 - 11",
        causes: []
      }
    ],
    conclusions: [],
    patterns: [],
    aiSummary: "Baseline report"
  },

  {
    user: USER_ID,
    date: new Date('2026-04-05'),
    results: [
      {
        name: "Hemoglobin",
        category: "Hematology",
        value: 134,
        unit: "g/L",
        status: "Normal",
        severity: 0,
        severityGrade: "None",
        deviationPercentage: 0,
        range: "120 - 160",
        causes: []
      },
      {
        name: "WBC Count",
        category: "Hematology",
        value: 7.8,
        unit: "×10⁹/L",
        status: "High",
        severity: 1,
        severityGrade: "Moderate",
        deviationPercentage: 10,
        range: "4.5 - 11",
        causes: ["Mild infection"]
      }
    ],
    conclusions: [],
    patterns: [],
    aiSummary: "Mild WBC rise"
  },

  {
    user: USER_ID,
    date: new Date('2026-04-10'),
    results: [
      {
        name: "Hemoglobin",
        value: 138,
        unit: "g/L",
        status: "Normal"
      },
      {
        name: "WBC Count",
        value: 6.9,
        unit: "×10⁹/L",
        status: "Normal"
      }
    ]
  },

  {
    user: USER_ID,
    date: new Date('2026-04-15'),
    results: [
      {
        name: "Hemoglobin",
        value: 136,
        unit: "g/L",
        status: "Normal"
      },
      {
        name: "WBC Count",
        value: 6.2,
        unit: "×10⁹/L",
        status: "Normal"
      }
    ]
  }
];

async function seed() {
  await mongoose.connect(MONGO_URI);

  await Report.deleteMany({});

  for (const data of seedData) {
    const report = new Report(data);

    // IMPORTANT: stringify for encryption middleware
    report.results = JSON.stringify(report.results);

    await report.save();
  }

  console.log('Seeded correctly');
  process.exit();
}

seed();