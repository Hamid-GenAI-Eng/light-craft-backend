const Invoice = require('../models/Invoice');
const Product = require('../models/Product');

// Helper to generate Invoice ID (Simple auto-increment logic)
const generateInvoiceNumber = async () => {
  const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
  if (!lastInvoice) return 'INV-1001';
  
  const lastNum = parseInt(lastInvoice.invoiceNumber.split('-')[1]);
  return `INV-${lastNum + 1}`;
};

// @desc    Create new Invoice & Update Stock
// @route   POST /api/invoices
// @access  Private
const createInvoice = async (req, res) => {
  try {
    const { customerName, customerPhone, items, taxRate, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in invoice' });
    }

    // 1. Validate Stock & Calculate Totals
    let calculatedSubTotal = 0;
    const bulkOption = [];

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.name}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        });
      }

      // Calculate Item Subtotal (Security check: don't trust frontend math)
      const itemSubtotal = item.price * item.quantity;
      calculatedSubTotal += itemSubtotal;

      // Prepare Stock Update Operation
      bulkOption.push({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { stock: -item.quantity } }, // Decrease stock
        },
      });
    }

    // 2. Final Calculations
    const taxAmount = (calculatedSubTotal * taxRate) / 100;
    const grandTotal = calculatedSubTotal + taxAmount;

    // 3. Create Invoice Record
    const invoiceNumber = await generateInvoiceNumber();

    const invoice = new Invoice({
      invoiceNumber,
      customerName,
      customerPhone,
      items,
      subTotal: calculatedSubTotal,
      taxRate,
      taxAmount,
      grandTotal,
      paymentMethod,
      creator: req.user._id,
    });

    const savedInvoice = await invoice.save();

    // 4. Execute Stock Updates
    await Product.bulkWrite(bulkOption);

    res.status(201).json(savedInvoice);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get All Invoices (History with Filters)
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res) => {
  try {
    const { startDate, endDate, customerName } = req.query;
    let query = {};

    // Date Filter
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Customer Name Filter
    if (customerName) {
      query.customerName = { $regex: customerName, $options: 'i' };
    }

    const invoices = await Invoice.find(query)
      .populate('creator', 'name') // Show who sold it
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Invoice Details (For Print Preview)
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('items.product', 'sku description') // Get SKU for the print view
      .populate('creator', 'name');

    if (invoice) {
      res.json(invoice);
    } else {
      res.status(404).json({ message: 'Invoice not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createInvoice, getInvoices, getInvoiceById };