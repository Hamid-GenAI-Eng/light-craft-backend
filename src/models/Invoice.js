const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true, // E.g., INV-1001
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'], // Can be "Walk-in Customer"
    trim: true,
  },
  customerPhone: {
    type: String,
    trim: true,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      name: { type: String, required: true }, // Snapshot of name
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true }, // Snapshot of sellingPrice
      subtotal: { type: Number, required: true },
    }
  ],
  subTotal: {
    type: Number,
    required: true,
  },
  taxRate: {
    type: Number,
    default: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  grandTotal: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Cancelled'],
    default: 'Paid',
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Online', 'Other'],
    default: 'Cash',
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Track which staff member made the sale
  }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);