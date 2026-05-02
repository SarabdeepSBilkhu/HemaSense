const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  resource: { type: String },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String },
  status: { type: String }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
