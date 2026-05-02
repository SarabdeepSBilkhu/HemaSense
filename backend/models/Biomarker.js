const mongoose = require('mongoose');

const BiomarkerSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { type: String, required: true }, // e.g., 'CBC', 'Lipid', 'Liver'
  unit: { type: String },
  altUnits: [{
    unit: String,
    factor: Number // Multiply by this factor to get the base unit value
  }],
  min: { type: Number },
  max: { type: Number },
  explanation: { type: String },
  high_causes: [{ type: String }],
  low_causes: [{ type: String }],
});

module.exports = mongoose.model('Biomarker', BiomarkerSchema);
