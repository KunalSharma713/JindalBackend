const Warehouse = require("../models/warehouse");
const Location = require("../models/location");
// Create a new warehouse
const createWarehouse = async (req, res) => {
  const { warehouse_name, code, lat, long } = req.body;

  try {
    const newWarehouse = await Warehouse.create({
      warehouse_name,
      code,
      lat,
      long,
    });
    res.status(201).json({
      message: "Warehouse created successfully.",
      warehouse: newWarehouse,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while creating warehouse.",
      error: error.message,
    });
  }
};

// Get all warehouses with filtering and pagination
const getAllWarehouses = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Filtering
    const filter = {};
    if (req.query.name) {
      filter.warehouse_name = { $regex: req.query.name, $options: "i" };
    }

    // Query data
    const warehouses = await Warehouse.find(filter)
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit);

    const total = await Warehouse.countDocuments(filter);

    const message =
      (warehouses?.length ?? 0) > 0
        ? "Warehouses retrieved successfully."
        : "No warehouses found matching the criteria.";

    res.json({
      message,
      data: warehouses ?? [],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching warehouses.",
      error: error.message,
    });
  }
};

// Get a single warehouse by ID
const getWarehouseById = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found." });
    }
    res.json(warehouse);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching warehouse.",
      error: error.message,
    });
  }
};

// Update a warehouse
const updateWarehouse = async (req, res) => {
  const { warehouse_name, code, lat, long } = req.body;
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      { warehouse_name, code, lat, long },
      { new: true, runValidators: true }
    );
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found." });
    }
    res.json({ message: "Warehouse updated successfully.", warehouse });
  } catch (error) {
    res.status(500).json({
      message: "Server error while updating warehouse.",
      error: error.message,
    });
  }
};

// Delete a warehouse
const deleteWarehouse = async (req, res) => {
  try {
    // Optional: Add a check to prevent deletion if locations are associated with it

    const locationCount = await Location.countDocuments({
      warehouse: req.params.id,
    });
    if (locationCount > 0) {
      return res.status(400).json({
        message:
          "Cannot delete warehouse with associated locations. Please reassign or delete them first.",
      });
    }

    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found." });
    }
    res.json({ message: "Warehouse deleted successfully." });
  } catch (error) {
    res.status(500).json({
      message: "Server error while deleting warehouse.",
      error: error.message,
    });
  }
};

module.exports = {
  createWarehouse,
  getAllWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
};
