const mongoose = require('mongoose');

const BarcodeSchema = new mongoose.Schema({
  format: { type: String, required: true },
  text: { type: String, required: true },
  options: { type: Object, default: {} },
  mimeType: { type: String, default: 'image/png' },
  filePath: { type: String }, // stored URL or local path
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  usageCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('Barcode', BarcodeSchema);