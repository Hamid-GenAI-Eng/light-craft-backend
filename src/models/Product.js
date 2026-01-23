const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
  },
  sku: {
    type: String,
    required: [true, 'Please add a SKU/Barcode'],
    unique: true,
    trim: true,
    uppercase: true, // Forces SKU to be consistent
  },
  description: {
    type: String,
    required: false, // Optional
  },
  costPrice: {
    type: Number,
    required: false, // Optional
    default: 0,
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Please add a selling price'],
    min: 0,
  },
  stock: {
    type: Number,
    required: [true, 'Please add initial stock quantity'],
    default: 0,
  },
  image: {
    url: { type: String, default: '' },
    public_id: { type: String, default: '' }, // Needed to delete image from Cloudinary later
  },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);