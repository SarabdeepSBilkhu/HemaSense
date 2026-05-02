const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/security');

const ReportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  results: { type: mongoose.Schema.Types.Mixed }, // Stores encrypted string, but can hold array in memory
  conclusions: [{
    system: String,
    status: String,
    message: String
  }],
  patterns: [{
    pattern: String,
    confidence: String,
    action: String,
    isAnomaly: Boolean
  }],
  aiSummary: { type: String }
}, { timestamps: true });

ReportSchema.pre('save', function() {
  if (this.isModified('results')) {
    this.results = encrypt(this.results);
  }
  if (this.isModified('aiSummary')) {
    this.aiSummary = encrypt(this.aiSummary);
  }
});

// Decrypt on retrieval
ReportSchema.post('init', function(doc) {
  if (doc.results) doc.results = decrypt(doc.results);
  if (doc.aiSummary) doc.aiSummary = decrypt(doc.aiSummary);
});

module.exports = mongoose.model('Report', ReportSchema);
