const mongoose = require("mongoose");
const Pallet = require("../models/pallet");
const PalletBarcode = require("../models/palletBarcode");
const Location = require("../models/location");

// Perform a bulk putaway of pallets
const putaway = async (req, res) => {
  console.log(
    "🚀 Putaway API called with body:",
    JSON.stringify(req.body, null, 2)
  );

  const { location_id, pallets } = req.body;
  // Basic validation
  if (
    !location_id ||
    !pallets ||
    !Array.isArray(pallets) ||
    pallets.length === 0
  ) {
    return res.status(400).json({
      message:
        "Invalid request body. Please provide a location_id and a non-empty array of pallets.",
    });
  }

  const session = await mongoose.startSession();
  let responseBody = { message: "OK", status: 200 };
  console.log("📝 Started transaction for putaway");

  try {
    await session.withTransaction(async () => {
      const location = await Location.findById(location_id).session(session);
      console.log(
        "📍 Location found:",
        location ? location.location_name : "Not found"
      );

      if (!location) {
        responseBody = {
          message: `Location with ID '${location_id}' not found.`,
          status: 404,
        };
        throw new Error("Location not found");
      }

      const createdPallets = [];
      const errors = [];

      // 2. Process each pallet in the array
      for (const p of pallets) {
        const { barcodekey, size = "1x1", quantity = 1 } = p;
        console.log("📦 Processing pallet:", p);

        // Find the barcode
        const barcode = await PalletBarcode.findOne({
          barcode_key: barcodekey,
        }).session(session);
        console.log(
          "🏷️ Barcode found:",
          barcode ? barcode.barcode_key : "Not found"
        );

        if (!barcode) {
          errors.push({
            barcodekey,
            message: `Barcode '${barcodekey}' not found.`,
          });
          continue; // Move to the next pallet
        }

        if (barcode.status !== "new") {
          errors.push({
            barcodekey,
            message: `Barcode '${barcodekey}' is already '${barcode.status}' and cannot be used.`,
          });
          continue; // Move to the next pallet
        }

        // Create the new pallet
        const newPallet = new Pallet({
          size: size.toLowerCase(),
          quantity,
          location: location_id,
          pallet_barcode: barcode._id,
        });
        const savedPallet = await newPallet.save({ session });
        console.log("✅ Pallet created:", savedPallet._id);

        // Update the barcode's status
        barcode.status = "assigned";
        await barcode.save({ session });

        createdPallets.push(savedPallet);
      }

      // 3. Check for errors and conditionally abort the transaction
      if (errors.length > 0) {
        responseBody = {
          message: "Putaway failed. Some barcodes could not be processed.",
          errors,
          status: 400,
        };
        throw new Error("Internal server error");
      }

      console.log("💾 Transaction completed successfully");

      res.status(200).json({
        message:
          "Putaway successful. All pallets have been created and assigned.",
        data: createdPallets,
      });
    });
  } catch (error) {
    console.error("❌ Putaway error:", error);
    if (responseBody.status !== 200 && !res.headersSent) {
      res.status(responseBody.status).json(responseBody);
    } else if (!res.headersSent) {
      res.status(500).json({
        message: "An unexpected server error occurred during the transaction.",
        error: error.message,
      });
    }
  } finally {
    session.endSession();
  }
};


const movePallets = async (req, res) => {
  console.log(
    "🚚 Move Pallets API called with body:",
    JSON.stringify(req.body, null, 2)
  );

  const { old_location, new_location, pallets } = req.body;

  // Validation checks (These are good, so we'll keep them)
  if (
    !old_location ||
    !new_location ||
    !pallets ||
    !Array.isArray(pallets) ||
    pallets.length === 0
  ) {
    return res.status(400).json({
      message:
        "Invalid request body. Please provide old_location, new_location, and a non-empty array of pallet barcode IDs.",
    });
  }

  if (old_location === new_location) {
    return res
      .status(400)
      .json({ message: "Old location and new location cannot be the same." });
  }

  // Start a Mongoose session
  const session = await mongoose.startSession();
  console.log("📝 Starting pallet move transaction");
  let responseBody = { message: "OK", status: 200 };

  try {
    await session.withTransaction(async () => {
      // Verify locations exist within the transaction
      const [oldLocation, newLocation] = await Promise.all([
        Location.findById(old_location).session(session),
        Location.findById(new_location).session(session),
      ]);

      if (!oldLocation || !newLocation) {
        responseBody = {
          message: "One or both locations not found.",
          status: 404,
        };
        throw new Error("Internal server error");
      }

      console.log(
        "📍 Locations verified - Old:",
        oldLocation?.location_name,
        "New:",
        newLocation?.location_name
      );

      const uniquePallets = [...new Set(pallets)];

      for (const barcodeId of uniquePallets) {
        console.log("🏷️ Processing barcode:", barcodeId);

        const palletBarcode = await PalletBarcode.findOne({
          barcode_key: barcodeId,
        }).session(session);

        if (!palletBarcode) {
          responseBody = {
            message: `Pallet barcode with ID '${barcodeId}' not found.`,
            status: 404,
          };
          throw new Error("Internal server error");
        }

        const pallet = await Pallet.findOne({
          pallet_barcode: palletBarcode._id,
          location: old_location,
        }).session(session);

        if (!pallet) {
          responseBody = {
            message: `Pallet with barcode '${barcodeId}' not found in the old location.`,
            status: 404,
          };
          throw new Error("Internal server error");
        }

        pallet.location = new_location;
        pallet.last_moved_date = new Date();
        await pallet.save({ session });

        console.log("✅ Pallet moved successfully:", pallet._id);
      }

      console.log("💾 Move transaction completed successfully");

      res.status(200).json({ message: "Pallets moved successfully." });
    });
  } catch (error) {
    console.error("❌ Move pallets error:", error);

    if (responseBody.status !== 200 && !res.headersSent) {
      res.status(responseBody.status).json(responseBody);
    } else if (!res.headersSent) {
      res.status(500).json({
        message: "Server error during pallet move.",
        error: error.message,
      });
    }
  } finally {
    session.endSession();
  }
};


const getAllPallets = async (req, res) => {
  console.log("📋 Get All Pallets API called with query:", req.query);

  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const barcodeStatus = req.query.status || "all";
    const filter = {};
    if (req.query.location) {
      filter.location = req.query.location;
    }
    if (req.query.size) {
      filter.size = { $regex: req.query.size.toLowerCase(), $options: "i" };
    }
    if (req.query.sequence) {
      filter.sequence = { $regex: req.query.sequence, $options: "i" };
    }

    if (
      barcodeStatus &&
      barcodeStatus.toLowerCase() !== "all" &&
      !req?.query?.location
    ) {
      if (barcodeStatus.toLowerCase() === "assigned") {
        filter.location = { $ne: null }; // only pallets with a location
      } else if (barcodeStatus.toLowerCase() === "used") {
        filter.location = null;
      }
    }
    // Filter by barcode key
    if (req.query.barcode) {
      let barCodeQuery = { barcode_key: req.query.barcode.toUpperCase() };

      const palletBarcodeDoc = await PalletBarcode.findOne(barCodeQuery);
      if (palletBarcodeDoc) {
        filter.pallet_barcode = palletBarcodeDoc._id;
      } else {
        return res.json({
          message: "Pallets retrieved successfully.",
          data: [],
          pagination: { total: 0, page, limit, totalPages: 0 },
        });
      }
    }

    const sort = {};
    if (req.query.sortBy && req.query.sortOrder) {
      sort[req.query.sortBy] = req.query.sortOrder === "desc" ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    console.log("🔍 Applied filters:", JSON.stringify(filter, null, 2));
    const pallets = await Pallet.find(filter)
      .populate("pallet_barcode", "barcode_key _id status")
      .populate("location", "location_name barcode_key _id")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Pallet.countDocuments(filter);
    console.log(`📊 Found ${pallets.length} pallets out of ${total} total`);

    res.json({
      message: "Pallets retrieved successfully.",
      data: pallets,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("❌ Get all pallets error:", error);
    res.status(500).json({
      message: "Server error while fetching pallets.",
      error: error.message,
    });
  }
};

const getPickUpPallets = async (req, res) => {
  console.log("🔍 Get Pickup Pallets API called with query:", req.query);

  try {
    const { size } = req.query;
    if (!size) {
      return res.status(500).json({
        message: "Size parameter is required to fetch pallets.",
      });
    }
    console.log("📏 Filtering by size:", size);

    const palletsByLocation = await Pallet.aggregate([
      {
        // Join with the palletbarcodes collection to get barcode details
        $lookup: {
          from: "palletbarcodes",
          localField: "pallet_barcode",
          foreignField: "_id",
          as: "palletBarcodeDetails",
        },
      },
      {
        // Unwind the array created by $lookup
        $unwind: "$palletBarcodeDetails",
      },
      // Filter pallets by size before grouping
      {
        $match: {
          size: size.toLowerCase(),
        },
      },
      {
        // Group pallets by location
        $group: {
          _id: "$location",
          totalQuantity: { $sum: "$quantity" },
          pallets: {
            $push: {
              _id: "$_id",
              sequence: "$sequence",
              size: "$size",
              pallet_barcode: "$palletBarcodeDetails.barcode_key", // Get the barcode key
              quantity: "$quantity",
            },
          },
        },
      },
      {
        // Join with the locations collection to get location details
        $lookup: {
          from: "locations",
          localField: "_id",
          foreignField: "_id",
          as: "locationDetails",
        },
      },
      {
        // Unwind the location details array
        $unwind: "$locationDetails",
      },
      // Sort by total quantity in descending order
      {
        $sort: {
          totalQuantity: -1,
        },
      },
      {
        // Shape the final output
        $project: {
          _id: "$locationDetails._id",
          location_name: "$locationDetails.location_name",
          totalQuantity: 1,
          pallets: 1,
        },
      },
    ]);

    console.log(`📊 Found pallets in ${palletsByLocation.length} locations`);
    res.json({
      message: "All pallets retrieved successfully.",
      data: palletsByLocation,
    });
  } catch (error) {
    console.error("❌ Get pickup pallets error:", error);
    res.status(500).json({
      message: "Server error while fetching pallets.",
      error: error.message,
    });
  }
};

const pickupPallets = async (req, res) => {
  console.log(
    "📤 Pickup Pallets API called with body:",
    JSON.stringify(req.body, null, 2)
  );

  const { pallets } = req.body;

  // Validate the request body
  if (!pallets || !Array.isArray(pallets) || pallets.length === 0) {
    return res.status(400).json({
      message:
        "Invalid request. Please provide a non-empty array of pallets with quantity and barcode.",
    });
  }

  const session = await mongoose.startSession();
  console.log("📝 Starting pickup transaction");

  try {
    await session.withTransaction(async () => {
      const updatePromises = pallets.map(async ({ quantity, barcode }) => {
        console.log(
          `🏷️ Processing pickup - Barcode: ${barcode}, Quantity: ${quantity}`
        );

        if (!quantity || !barcode) {
          throw new Error(`Missing quantity or barcode for a pallet.`);
        }

        const palletBarcodeDoc = await PalletBarcode.findOne({
          barcode_key: barcode,
        }).session(session);

        if (!palletBarcodeDoc) {
          throw new Error(`Pallet barcode '${barcode}' not found.`);
        }

        const update = {
          $inc: { quantity: -quantity },
          $set: { last_moved_date: new Date() },
        };

        const pallet = await Pallet.findOneAndUpdate(
          {
            pallet_barcode: palletBarcodeDoc._id,
            quantity: { $gte: quantity },
          },
          update,
          { new: true, session }
        );

        if (!pallet) {
          throw new Error(
            `Pallet with barcode '${barcode}' not found or has insufficient quantity.`
          );
        }

        console.log("✅ Pallet picked successfully:", pallet._id);

        if (pallet.quantity <= 0) {
          await Pallet.updateOne(
            { _id: pallet._id },
            { $set: { location: null } },
            { session }
          );

          await PalletBarcode.updateOne(
            { _id: palletBarcodeDoc._id },
            { $set: { status: "used" } },
            { session }
          );
        }
      });

      await Promise.all(updatePromises);

      console.log("💾 Pickup transaction completed successfully");

      res.status(200).json({
        message: "Pallets picked up and quantities updated successfully.",
      });
    });
  } catch (error) {
    console.error("❌ Pickup pallets error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error during pallet pickup.",
        error: error.message,
      });
    }
  } finally {
    session.endSession();
  }
};


const findPallet = async (req, res) => {
  console.log("🔍 Find Pallet API called with query:", req.query);

  try {
    const { barcode, sequence, id } = req.query;

    let filter = null;

    if (id) {
      filter = { _id: id };
    } else if (barcode) {
      // Find the barcode document first
      const palletBarcodeDoc = await PalletBarcode.findOne({
        barcode_key: barcode,
      });
      if (!palletBarcodeDoc) {
        return res
          .status(404)
          .json({ message: "No pallet found with the given barcode." });
      }
      filter = { pallet_barcode: palletBarcodeDoc._id };
    } else if (sequence) {
      filter = { sequence: sequence };
    } else {
      return res.status(400).json({
        message: "Please provide barcode, sequence, or id as query parameter.",
      });
    }
    console.log("🔍 Searching with filter:", filter);

    const pallet = await Pallet.findOne(filter)
      .populate("pallet_barcode", "barcode_key _id status")
      .populate("location", "location_name barcode_key _id");

    if (!pallet) {
      return res.status(404).json({ message: "Pallet not found." });
    }
    console.log("📦 Pallet found:", pallet ? pallet._id : "Not found");

    res.json({
      message: "Pallet retrieved successfully.",
      data: pallet,
    });
  } catch (error) {
    console.error("❌ Find pallet error:", error);
    res.status(500).json({
      message: "Server error while fetching pallet.",
      error: error.message,
    });
  }
};

module.exports = {
  putaway,
  getAllPallets,
  movePallets,
  getPickUpPallets,
  findPallet,
  pickupPallets,
};
