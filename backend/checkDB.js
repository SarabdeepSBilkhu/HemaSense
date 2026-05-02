const mongoose = require('mongoose');
const Biomarker = require('./models/Biomarker');

async function checkDB() {
  await mongoose.connect('mongodb://127.0.0.1:27017/HemaSense');
  const biomarkers = await Biomarker.find({});
  console.log('Biomarkers in DB:');
  biomarkers.forEach(b => console.log(`- ${b.name}: ${JSON.stringify(b.altUnits || [])}`));
  process.exit(0);
}

checkDB();
