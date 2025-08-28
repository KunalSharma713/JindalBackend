const express = require("express");
const router = express.Router();
const {
  // Web bulk upload controllers
  BulkUploadLocationWeb,
  getLocationBulkuploadsWeb,
  getSuccessLocationRecordsByBulkIdWeb,
  getErrorLocationRecordsByBulkIdWeb,
} = require("../controllers/bulkupload/LocationBulkUpload");

const verifyToken = require("../utils/VerifyToken");

router.use(verifyToken);

// Web bulk upload routes (new)
router.post("/web/location", BulkUploadLocationWeb);
router.post("/web/location/upload", getLocationBulkuploadsWeb);
router.post("/web/location/success", getSuccessLocationRecordsByBulkIdWeb);
router.post("/web/location/error", getErrorLocationRecordsByBulkIdWeb);

module.exports = router;
