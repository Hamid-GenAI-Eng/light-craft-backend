const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

// @desc    Create a new product
// @route   POST /api/products
// @access  Private (Admin)
const createProduct = async (req, res) => {
  try {
    const { name, sku, description, costPrice, sellingPrice, stock } = req.body;

    // 1. Check if SKU already exists
    const productExists = await Product.findOne({ sku });
    if (productExists) {
      return res.status(400).json({ message: 'Product with this SKU already exists' });
    }

    // 2. Handle Image Upload (if file exists)
    let imageData = {};
    if (req.file) {
      imageData = {
        url: req.file.path,
        public_id: req.file.filename,
      };
    }

    // 3. Create Product
    const product = await Product.create({
      name,
      sku,
      description,
      costPrice,
      sellingPrice,
      stock,
      image: imageData,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all products (with Search & Pagination)
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    const { keyword, pageNumber } = req.query;

    // Search Logic (Name or SKU)
    const keywordFilter = keyword
      ? {
          $or: [
            { name: { $regex: keyword, $options: 'i' } }, // Case insensitive
            { sku: { $regex: keyword, $options: 'i' } },
          ],
        }
      : {};

    // Pagination Logic
    const pageSize = 20;
    const page = Number(pageNumber) || 1;

    const count = await Product.countDocuments({ ...keywordFilter });
    const products = await Product.find({ ...keywordFilter })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 }); // Newest first

    res.json({ products, page, pages: Math.ceil(count / pageSize) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Admin)
const updateProduct = async (req, res) => {
  try {
    const { name, description, costPrice, sellingPrice, stock } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Handle Image Replacement
    if (req.file) {
      // 1. Delete old image from Cloudinary if it exists
      if (product.image && product.image.public_id) {
        await cloudinary.uploader.destroy(product.image.public_id);
      }
      // 2. Set new image data
      product.image = {
        url: req.file.path,
        public_id: req.file.filename,
      };
    }

    // Update fields if provided
    product.name = name || product.name;
    product.description = description || product.description;
    product.costPrice = costPrice || product.costPrice;
    product.sellingPrice = sellingPrice || product.sellingPrice;
    product.stock = stock || product.stock;
    // Note: We usually don't allow updating SKU easily to prevent data integrity issues, 
    // but you can add it here if needed.

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Admin)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // 1. Delete image from Cloudinary
    if (product.image && product.image.public_id) {
      await cloudinary.uploader.destroy(product.image.public_id);
    }

    // 2. Delete from DB
    await product.deleteOne();

    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};