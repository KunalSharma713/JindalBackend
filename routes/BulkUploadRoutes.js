const {
  BulkUploadLocation,
  getLocationBulkuploads,
  getSuccessLocationRecordsByBulkId,
  getErrorLocationRecordsByBulkId,
} = require("../controllers/bulkupload/LocationBulkUpload");
const express = require("express");
const router = express.Router();

router.post("/location", BulkUploadLocation);
router.post("/location/upload", getLocationBulkuploads);
router.post("/location/succes", getSuccessLocationRecordsByBulkId);
router.post("/location/error", getErrorLocationRecordsByBulkId);

module.exports = router;
