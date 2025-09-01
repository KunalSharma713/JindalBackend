const express = require("express");
const router = express.Router();
const {
  // Mobile pallet controllers
  putaway,
  getAllPallets,
  movePallets,
  getPickUpPallets,
  findPallet,
  pickupPallets,

  // Web pallet controllers
  getAllPalletsBarcodeWeb,
  assignPalletWeb,
  updatePalletWeb,
  pickupPalletsWeb,
} = require("../controllers/PalletController");

const verifyToken = require("../utils/VerifyToken");

router.use(verifyToken);
// Mobile pallet routes (existing)
router.post("/putaway", putaway);
router.get("/", getAllPallets);
router.post("/move", movePallets);
router.get("/pickup", getPickUpPallets);
router.post("/pickup", pickupPallets);
router.get("/find", findPallet);

// Web pallet routes (new)

router.get("/web/all", getAllPalletsBarcodeWeb);
router.post("/web/assign", assignPalletWeb);
router.put("/web/:id", updatePalletWeb);
router.post("/web/pickup", pickupPalletsWeb);

module.exports = router;
