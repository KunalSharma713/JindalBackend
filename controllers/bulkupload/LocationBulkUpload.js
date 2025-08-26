const bulkupload = require("../../models/bulkUpload");
const bulkuploadLog = require("../../models/bulkuploadLog");
const Warehouse = require("../../models/warehouse");
const Users = require("../../models/user");
const Location = require("../../models/location");

const BulkUploadLocation = async (req, res) => {
  const records = req.body.records;
  const warehouseId = req.body.warehouse;

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: "No records provided for upload." });
  }

  const session = await bulkupload.startSession();
  session.startTransaction();

  try {
    const bulkEntry = await bulkupload.create({
      type: "location_upload",
      status: "pending",
    });

    let successCount = 0;
    let failCount = 0;
    const warehouse = await Warehouse.findOne({
      _id: warehouseId,
    });

    if (!warehouse) {
      return res
        .status(404)
        .json({ message: "Plant not found during bulk upload." });
    }
    const users = await Users?.find({ warehouse: warehouseId }).populate({
      path: "roleid",
    });
    if (!users) {
      return res
        .status(404)
        .json({ message: "User not found during bulk upload." });
    }

    for (const entry of records) {
      try {
        const { location_name, lat, long } = entry;
        const newLocation = await Location.create({
          location_name,
          warehouseId,
          lat,
          long,
        });
        if (newLocation) successCount++;
      } catch (err) {
        await bulkuploadLog.create({
          bulkuploadid: bulkEntry._id,
          massage: `Error saving record: ${err.message}`,
          records: entry,
        });
        failCount++;
      }
    }

    let finalStatus = "pending";
    if (successCount === 0) finalStatus = "failed";
    else if (failCount === 0) finalStatus = "success";

    await bulkupload.findByIdAndUpdate(bulkEntry._id, {
      status: finalStatus,
      total_error: failCount,
      total_success: successCount,
      total_records: records.length,
    });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Location bulk upload completed.",
      success: successCount,
      failed: failCount,
      status: finalStatus,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Location Bulk Upload Error:", error);
    return res
      .status(500)
      .json({ message: "Server error during bulk upload." });
  }
};

const getLocationBulkuploads = async (req, res, next) => {
  const { page_size, page_no } = req.body;

  const pageSize = parseInt(page_size) || 10;
  const pageNo = parseInt(page_no) || 1;
  const skip = (pageNo - 1) * pageSize;

  try {
    const uploads = await bulkupload
      .find({ type: "location_upload" })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(pageSize);

    const totalCount = await bulkupload.countDocuments({
      type: "location_upload",
    });

    res.status(200).json({
      totalCount,
      currentPage: pageNo,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      records: uploads,
    });
  } catch (error) {
    next(error);
  }
};

const getSuccessLocationRecordsByBulkId = async (req, res, next) => {
  const { page_size, page_no, bulkuploadid } = req.body;

  if (!bulkuploadid) {
    return res
      .status(400)
      .json({ message: "Missing bulkuploadid", success: false });
  }

  const pageSize = parseInt(page_size) || 10;
  const pageNo = parseInt(page_no) || 1;
  const skip = (pageNo - 1) * pageSize;

  try {
    const successRecords = await Location.find({ bulkuploadid })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(pageSize);

    const totalCount = await Location.countDocuments({ bulkuploadid });

    res.status(200).json({
      success: true,
      totalCount,
      currentPage: pageNo,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      records: successRecords,
    });
  } catch (error) {
    next(error);
  }
};

const getErrorLocationRecordsByBulkId = async (req, res, next) => {
  const { page_size, page_no, bulkuploadid } = req.body;

  if (!bulkuploadid) {
    return res
      .status(400)
      .json({ message: "Missing bulkuploadid", success: false });
  }

  const pageSize = parseInt(page_size) || 10;
  const pageNo = parseInt(page_no) || 1;
  const skip = (pageNo - 1) * pageSize;

  try {
    const errorLogs = await bulkuploadLog
      .find({ bulkuploadid })
      .skip(skip)
      .limit(pageSize)
      .sort({ created_at: -1 });

    const totalCount = await bulkuploadLog.countDocuments({ bulkuploadid });

    res.status(200).json({
      success: true,
      totalCount,
      currentPage: pageNo,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      errors: errorLogs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  BulkUploadLocation,
  getLocationBulkuploads,
  getSuccessLocationRecordsByBulkId,
  getErrorLocationRecordsByBulkId,
};
