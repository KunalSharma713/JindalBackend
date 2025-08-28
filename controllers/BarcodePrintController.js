const bwipjs = require("bwip-js");
const PDFDocument = require("pdfkit");
const Location = require("../models/location");
const PalletBarcode = require("../models/palletBarcode");

const ITEMS_PER_PAGE = 12; // 3 rows x 4 columns

const generateBarcode = async (text) => {
  console.log("Generating barcode for:", text);
  return await bwipjs.toBuffer({
    bcid: "code128",
    text: text,
    scale: 2, // Reduced scale for better fit
    height: 15, // Increased height
    includetext: true,
    textxalign: "center",
    paddingwidth: 0, // Removed padding
    paddingheight: 0,
    backgroundcolor: "FFFFFF", // Ensure white background
  });
};

const getLocationBarcodes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const plant = req.query.plant || null; // use as ObjectId string
    const filter = {};

    // If plant (warehouse) is provided, add to query filter
    if (plant) {
      filter.warehouse = plant;
    }
    const totalItems = await Location.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    const locations = await Location.find(filter)
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    console.log("Found locations:", locations.length);
    console.log("Sample location:", locations[0]);

    const doc = new PDFDocument({
      size: "A4",
      margin: 30,
      autoFirstPage: true,
    });

    // Handle PDF stream errors
    doc.on("error", (err) => {
      console.error("PDF generation error:", err);
      // Only send error if headers haven't been sent
      if (!res.headersSent) {
        res.status(500).json({ error: "PDF generation failed" });
      }
    });

    // Debug event for document
    doc.on("pageAdded", () => {
      console.log("New page added to PDF");
    });

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=location_barcodes_page${page}.pdf`
    );

    // Handle response stream errors
    res.on("error", (err) => {
      console.error("Response stream error:", err);
      doc.end();
    });

    // Pipe PDF to response with error handling
    doc.pipe(res);

    // Layout settings for 2 items per row
    let xPos = 50; // Increased margin from left
    let yPos = 50; // Increased margin from top
    const pageWidth = 595; // A4 width in points
    const pageMargin = 50; // Margin from edges
    const barcodeWidth = 230; // Wider barcodes
    const barcodeHeight = 120; // Taller barcodes
    const margin = 35; // Space between barcodes
    const itemsPerRow = 2;
    const maxX = pageWidth - pageMargin - barcodeWidth;

    for (const location of locations) {
      try {
        console.log("Processing location:", location.barcode_key);

        if (!location.barcode_key) {
          console.error("No barcode key found for location:", location);
          continue;
        }

        const barcodeBuffer = await generateBarcode(location.barcode_key);

        if (!barcodeBuffer || barcodeBuffer.length === 0) {
          console.error("Empty barcode buffer for:", location.barcode_key);
          continue;
        }

        console.log("Barcode buffer size:", barcodeBuffer.length);
        console.log("Current position:", { xPos, yPos });

        // Draw rounded rectangle border with padding
        doc.roundedRect(xPos, yPos, barcodeWidth, barcodeHeight, 15).stroke();

        // Add location name at the top with more space
        doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .text(location.location_name, xPos + 15, yPos + 15, {
            width: barcodeWidth - 30,
            align: "center",
          });

        // Add barcode image with better spacing
        doc.image(barcodeBuffer, xPos + 15, yPos + 35, {
          width: barcodeWidth - 30,
          height: barcodeHeight - 50,
        });

        // Calculate next position for 2 items per row
        xPos += barcodeWidth + margin;

        // New row after 2 items
        if (xPos > maxX) {
          xPos = 50;
          yPos += barcodeHeight + margin;
        }

        // New page when reaching bottom
        if (yPos > 750) {
          doc.addPage();
          xPos = 50;
          yPos = 50;
        }
      } catch (barcodeError) {
        console.error(
          "Barcode generation error for location:",
          location,
          barcodeError
        );
        continue;
      }
    }

    console.log("Finalizing PDF document");
    doc.end();
  } catch (error) {
    console.error("Controller error:", error);
    // Only send error if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
};

const getPalletBarcodes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const plant = req.query.plant || null; // expecting ObjectId as string

    const filter = {};
    if (plant) {
      filter.warehouse = plant;
    }

    const totalItems = await PalletBarcode.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    const pallets = await PalletBarcode.find(filter)
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    console.log("First pallet data:", JSON.stringify(pallets[0], null, 2));
    console.log("Available fields:", Object.keys(pallets[0]?._doc || {}));

    if (!pallets.length) {
      return res.status(404).json({ message: "No barcodes found" });
    }

    const doc = new PDFDocument({
      size: "A4",
      margin: 30,
      autoFirstPage: true,
    });

    // Handle PDF stream errors
    doc.on("error", (err) => {
      console.error("PDF generation error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "PDF generation failed" });
      }
    });

    doc.on("pageAdded", () => {
      console.log("New page added to PDF");
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=pallet_barcodes_page${page}.pdf`
    );

    res.on("error", (err) => {
      console.error("Response stream error:", err);
      doc.end();
    });

    doc.pipe(res);

    // Layout settings for 2 items per row
    let xPos = 50;
    let yPos = 50;
    const pageWidth = 595;
    const pageMargin = 50;
    const barcodeWidth = 230;
    const barcodeHeight = 120;
    const margin = 35;
    const maxX = pageWidth - pageMargin - barcodeWidth;

    for (const pallet of pallets) {
      try {
        console.log("Processing pallet:", JSON.stringify(pallet._doc, null, 2));

        // Try different possible field names
        const barcodeText =
          pallet.barcode_key || pallet.barcode || pallet.barcodeKey;

        if (!barcodeText) {
          console.error(
            "No barcode found for pallet. Available fields:",
            Object.keys(pallet._doc)
          );
          continue;
        }

        console.log("Using barcode text:", barcodeText);
        const barcodeBuffer = await generateBarcode(barcodeText);

        if (!barcodeBuffer || barcodeBuffer.length === 0) {
          console.error("Empty barcode buffer for:", barcodeText);
          continue;
        }

        // Draw rounded rectangle border with padding
        doc.roundedRect(xPos, yPos, barcodeWidth, barcodeHeight, 15).stroke();

        // Add barcode image - centered in the box without any text
        doc.image(barcodeBuffer, xPos + 15, yPos + 10, {
          width: barcodeWidth - 30,
          height: barcodeHeight - 20,
        });

        // Calculate next position
        xPos += barcodeWidth + margin;

        // New row after 2 items
        if (xPos > maxX) {
          xPos = 50;
          yPos += barcodeHeight + margin;
        }

        // New page when reaching bottom
        if (yPos > 750) {
          doc.addPage();
          xPos = 50;
          yPos = 50;
        }
      } catch (barcodeError) {
        console.error("Barcode generation error:", barcodeError);
        continue;
      }
    }

    console.log("Finalizing PDF document");
    doc.end();
  } catch (error) {
    console.error("Controller error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
};

const getLocationBarcodesWeb = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const plant = req.query.plant || null; // use as ObjectId string
    const filter = {};

    // If plant (warehouse) is provided, add to query filter
    if (plant) {
      filter.warehouse = plant;
    }
    const totalItems = await Location.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    const locations = await Location.find(filter)
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    console.log("Found locations:", locations.length);
    console.log("Sample location:", locations[0]);

    const doc = new PDFDocument({
      size: "A4",
      margin: 30,
      autoFirstPage: true,
    });

    // Handle PDF stream errors
    doc.on("error", (err) => {
      console.error("PDF generation error:", err);
      // Only send error if headers haven't been sent
      if (!res.headersSent) {
        res.status(500).json({ error: "PDF generation failed" });
      }
    });

    // Debug event for document
    doc.on("pageAdded", () => {
      console.log("New page added to PDF");
    });

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=location_barcodes_page${page}.pdf`
    );

    // Handle response stream errors
    res.on("error", (err) => {
      console.error("Response stream error:", err);
      doc.end();
    });

    // Pipe PDF to response with error handling
    doc.pipe(res);

    // Layout settings for 2 items per row
    let xPos = 50; // Increased margin from left
    let yPos = 50; // Increased margin from top
    const pageWidth = 595; // A4 width in points
    const pageMargin = 50; // Margin from edges
    const barcodeWidth = 230; // Wider barcodes
    const barcodeHeight = 120; // Taller barcodes
    const margin = 35; // Space between barcodes
    const itemsPerRow = 2;
    const maxX = pageWidth - pageMargin - barcodeWidth;

    for (const location of locations) {
      try {
        console.log("Processing location:", location.barcode_key);

        if (!location.barcode_key) {
          console.error("No barcode key found for location:", location);
          continue;
        }

        const barcodeBuffer = await generateBarcode(location.barcode_key);

        if (!barcodeBuffer || barcodeBuffer.length === 0) {
          console.error("Empty barcode buffer for:", location.barcode_key);
          continue;
        }

        console.log("Barcode buffer size:", barcodeBuffer.length);
        console.log("Current position:", { xPos, yPos });

        // Draw rounded rectangle border with padding
        doc.roundedRect(xPos, yPos, barcodeWidth, barcodeHeight, 15).stroke();

        // Add location name at the top with more space
        doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .text(location.location_name, xPos + 15, yPos + 15, {
            width: barcodeWidth - 30,
            align: "center",
          });

        // Add barcode image with better spacing
        doc.image(barcodeBuffer, xPos + 15, yPos + 35, {
          width: barcodeWidth - 30,
          height: barcodeHeight - 50,
        });

        // Calculate next position for 2 items per row
        xPos += barcodeWidth + margin;

        // New row after 2 items
        if (xPos > maxX) {
          xPos = 50;
          yPos += barcodeHeight + margin;
        }

        // New page when reaching bottom
        if (yPos > 750) {
          doc.addPage();
          xPos = 50;
          yPos = 50;
        }
      } catch (barcodeError) {
        console.error(
          "Barcode generation error for location:",
          location,
          barcodeError
        );
        continue;
      }
    }

    console.log("Finalizing PDF document");
    doc.end();
  } catch (error) {
    console.error("Controller error:", error);
    // Only send error if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
};

const getPalletBarcodesWeb = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const plant = req.query.plant || null; // expecting ObjectId as string

    const filter = {};
    if (plant) {
      filter.warehouse = plant;
    }

    const totalItems = await PalletBarcode.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    const pallets = await PalletBarcode.find(filter)
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    console.log("First pallet data:", JSON.stringify(pallets[0], null, 2));
    console.log("Available fields:", Object.keys(pallets[0]?._doc || {}));

    if (!pallets.length) {
      return res.status(404).json({ message: "No barcodes found" });
    }

    const doc = new PDFDocument({
      size: "A4",
      margin: 30,
      autoFirstPage: true,
    });

    // Handle PDF stream errors
    doc.on("error", (err) => {
      console.error("PDF generation error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "PDF generation failed" });
      }
    });

    doc.on("pageAdded", () => {
      console.log("New page added to PDF");
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=pallet_barcodes_page${page}.pdf`
    );

    res.on("error", (err) => {
      console.error("Response stream error:", err);
      doc.end();
    });

    doc.pipe(res);

    // Layout settings for 2 items per row
    let xPos = 50;
    let yPos = 50;
    const pageWidth = 595;
    const pageMargin = 50;
    const barcodeWidth = 230;
    const barcodeHeight = 120;
    const margin = 35;
    const maxX = pageWidth - pageMargin - barcodeWidth;

    for (const pallet of pallets) {
      try {
        console.log("Processing pallet:", JSON.stringify(pallet._doc, null, 2));

        // Try different possible field names
        const barcodeText =
          pallet.barcode_key || pallet.barcode || pallet.barcodeKey;

        if (!barcodeText) {
          console.error(
            "No barcode found for pallet. Available fields:",
            Object.keys(pallet._doc)
          );
          continue;
        }

        console.log("Using barcode text:", barcodeText);
        const barcodeBuffer = await generateBarcode(barcodeText);

        if (!barcodeBuffer || barcodeBuffer.length === 0) {
          console.error("Empty barcode buffer for:", barcodeText);
          continue;
        }

        // Draw rounded rectangle border with padding
        doc.roundedRect(xPos, yPos, barcodeWidth, barcodeHeight, 15).stroke();

        // Add barcode image - centered in the box without any text
        doc.image(barcodeBuffer, xPos + 15, yPos + 10, {
          width: barcodeWidth - 30,
          height: barcodeHeight - 20,
        });

        // Calculate next position
        xPos += barcodeWidth + margin;

        // New row after 2 items
        if (xPos > maxX) {
          xPos = 50;
          yPos += barcodeHeight + margin;
        }

        // New page when reaching bottom
        if (yPos > 750) {
          doc.addPage();
          xPos = 50;
          yPos = 50;
        }
      } catch (barcodeError) {
        console.error("Barcode generation error:", barcodeError);
        continue;
      }
    }

    console.log("Finalizing PDF document");
    doc.end();
  } catch (error) {
    console.error("Controller error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = {
  getLocationBarcodes,
  getPalletBarcodes,
  getLocationBarcodesWeb,
  getPalletBarcodesWeb,
};  