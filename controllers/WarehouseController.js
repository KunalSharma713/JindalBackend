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
    if (req.query.warehouse_name) {
      filter.warehouse_name = {
        $regex: req.query.warehouse_name,
        $options: "i",
      };
    }

    if (req.query.code) {
      filter.code = {
        $regex: req.query.code,
        $options: "i",
      };
    }

    if (req.query.lat) {
      const lat = parseFloat(req.query.lat);
      if (!isNaN(lat)) {
        filter.lat = lat;
      }
    }

    if (req.query.long) {
      const long = parseFloat(req.query.long);
      if (!isNaN(long)) {
        filter.long = long;
      }
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

// Web-specific controllers
const createWarehouseWeb = async (req, res) => {
  try {
    // Add web-specific logic here if needed
    return await createWarehouse(req, res);
  } catch (error) {
    console.error('Web warehouse creation error:', error);
    return res.status(500).json({ message: 'Web warehouse creation failed' });
  }
};

const getAllWarehousesWeb = async (req, res) => {
  try {
    // Add web-specific logic here if needed
    return await getAllWarehouses(req, res);
  } catch (error) {
    console.error('Web get all warehouses error:', error);
    return res.status(500).json({ message: 'Failed to fetch warehouses for web' });
  }
};

const getWarehouseByIdWeb = async (req, res) => {
  try {
    // Extract the ID from the web route and add it to params
    req.params.id = req.params.id;
    return await getWarehouseById(req, res);
  } catch (error) {
    console.error('Web get warehouse by ID error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid warehouse ID format' });
    }
    return res.status(500).json({ message: 'Failed to fetch warehouse for web' });
  }
};

const updateWarehouseWeb = async (req, res) => {
  try {
    // Ensure the ID is properly passed from the web route
    req.params.id = req.params.id;
    return await updateWarehouse(req, res);
  } catch (error) {
    console.error('Web update warehouse error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid warehouse ID format' });
    }
    return res.status(500).json({ message: 'Web warehouse update failed' });
  }
};

const deleteWarehouseWeb = async (req, res) => {
  try {
    // Ensure the ID is properly passed from the web route
    req.params.id = req.params.id;
    return await deleteWarehouse(req, res);
  } catch (error) {
    console.error('Web delete warehouse error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid warehouse ID format' });
    }
    return res.status(500).json({ message: 'Web warehouse deletion failed' });
  }
};

module.exports = {
  // Mobile exports
  createWarehouse,
  getAllWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
  
  // Web exports
  createWarehouseWeb,
  getAllWarehousesWeb,
  getWarehouseByIdWeb,
  updateWarehouseWeb,
  deleteWarehouseWeb
};
