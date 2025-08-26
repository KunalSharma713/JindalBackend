const PalletBarcode = require("../models/palletBarcode");

// Generate one or more new pallet barcodes
// Get all barcodes with filtering, searching, sorting, and pagination
const getAllBarcodes = async (req, res) => {
  try {
    // Parse and validate pagination parameters
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;
    
    // Ensure page is at least 1 and limit is reasonable
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), 100); // Max 100 items per page
    
    const {
      search,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build the query object
    const query = {};
    if (search) {
      query.barcode_key = { $regex: search, $options: "i" }; // Case-insensitive search
    }
    if (status) {
      query.status = status;
    }

    // Build sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const barcodes = await PalletBarcode.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await PalletBarcode.countDocuments(query);

    res.json({
      message: "Barcodes retrieved successfully.",
      data: barcodes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching barcodes.",
      error: error.message,
    });
  }
};

const generateBarcodes = async (req, res) => {
  const count = parseInt(req.query.count) || 1; // Default to creating 1 barcode
  const { warehouseId } = req.body;

  if (count < 1 || count > 100) {
    // Safety limit
    return res
      .status(400)
      .json({ message: "Count must be between 1 and 100." });
  }

  if (!warehouseId) {
    return res.status(400).json({ message: "Warehouse ID is required." });
  }

  try {
    const newBarcodes = [];
    // The pre-save hook in the model will handle the key generation.
    for (let i = 0; i < count; i++) {
      const newBarcode = new PalletBarcode({
        warehouse: warehouseId,
      });
      await newBarcode.save();
      newBarcodes.push(newBarcode);
    }

    res.status(201).json({
      message: `${count} new barcode(s) generated successfully.`,
      barcodes: newBarcodes,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while generating barcodes.",
      error: error.message,
    });
  }
};

module.exports = {
  generateBarcodes,
  getAllBarcodes,
};
