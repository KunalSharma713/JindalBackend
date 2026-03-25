// seed.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Role = require("../models/role");
const User = require("../models/user");
const Warehouse = require("../models/warehouse");
const Location = require("../models/location");
const PalletBarcode = require("../models/palletBarcode");
const Pallet = require("../models/pallet");

// Make sure we have a MongoDB URI
if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not defined in environment variables");
  process.exit(1);
}

// async function seed() {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI);
//     console.log("Connected to MongoDB successfully");

//     // 1. Roles
//     const adminRole = await new Role({ name: "Admin" }).save();

//     // 2. User
//     const hashedPassword = await bcrypt.hash("Root@123", 10);
//     const user = await new User({
//       email: "rohit@gmail.com",
//       password: hashedPassword,
//       roleid: adminRole._id,
//       first_name: "Rohit",
//       last_name: "Todwal",
//       username: "rohit",
//     }).save();

//     // 3. Warehouse
//     const warehouse = await new Warehouse({
//       warehouse_name: "Angel Tech Warehouse",
//       lat: "18.5204", // Pune coordinates (example)
//       long: "73.8567",
//     }).save();

//     // 4. Locations (SEC1 to SEC8)
//     const locations = [];
//     for (let i = 1; i <= 8; i++) {
//       const loc = await new Location({
//         location_name: `SEC${i}`,
//         warehouse: warehouse._id,
//         lat: (18.5204 + i * 0.0001).toString(), // Slightly offset from warehouse
//         long: (73.8567 + i * 0.0001).toString(),
//       }).save();
//       locations.push(loc);
//     }

//     // 5. Pallet Barcodes (8 records)
//     for (let i = 1; i <= 8; i++) {
//       await new PalletBarcode().save();
//     }

//     console.log("Seeding complete!");
//   } catch (error) {
//     console.error("Error during seeding:", error);
//   } finally {
//     await mongoose.disconnect();
//   }
// }

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB successfully");

    // Clear existing data
    console.log("Clearing existing data...");
    await User.deleteMany({});
    await Pallet.deleteMany({});
    await PalletBarcode.deleteMany({});
    await Location.deleteMany({});
    await Warehouse.deleteMany({});
    await Role.deleteMany({});
    console.log("Existing data cleared");

    // 1. Create Roles
    const superAdminRole = await new Role({
      name: "Super Admin",
      is_active: true,
      slug: "super_admin",
    }).save();

    const managerRole = await new Role({
      name: "Plant Manager",
      is_active: true,
      slug: "plant_manager",
    }).save();

    const operatorRole = await new Role({
      name: "Operator",
      is_active: true,
      slug: "operator",
    }).save();

    // 2. Create Super Admin (no warehouse required)
    const hashedPassword = await bcrypt.hash("Admin@123", 10);
    const superAdminUser = new User({
      email: "superadmin@jindalsteel.com",
      password: hashedPassword,
      roleid: superAdminRole._id,
      first_name: "Super",
      last_name: "Admin",
      username: "superadmin",
      warehouse: null, // Explicitly set to null for super admin
    });
    superAdminUser._roleSlug = superAdminRole.slug;
    
    // Save with validateBeforeSave: false to bypass conditional validation
    await superAdminUser.save({ validateBeforeSave: false });

    // 3. Create 4 Plants
    const plants = [];
    const plantData = [
      { name: "Angel Tech Plant", lat: "18.5204", long: "73.8567" },
      { name: "Viva Power Plant", lat: "19.0760", long: "72.8777" },
      { name: "Steel Plant Unit 1", lat: "28.6139", long: "77.2090" },
      { name: "Steel Plant Unit 2", lat: "26.9124", long: "75.7873" }
    ];

    for (const plantInfo of plantData) {
      const plant = await new Warehouse({
        warehouse_name: plantInfo.name,
        lat: plantInfo.lat,
        long: plantInfo.long,
      }).save();
      plants.push(plant);
    }

    console.log("Created 4 plants");

    // 4. For each plant: create locations, users, and pallets
    for (let plantIndex = 0; plantIndex < plants.length; plantIndex++) {
      const plant = plants[plantIndex];
      
      // Create 10 locations per plant
      const locations = [];
      for (let i = 1; i <= 10; i++) {
        const loc = await new Location({
          location_name: `${plant.warehouse_name.replace(/\s+/g, '_')}_SEC${i}`,
          warehouse: plant._id,
          lat: (parseFloat(plant.lat) + i * 0.0001).toString(),
          long: (parseFloat(plant.long) + i * 0.0001).toString(),
        }).save();
        locations.push(loc);
      }

      // Create users for this plant
      const plantManager = await new User({
        email: `manager${plantIndex + 1}@jindalsteel.com`,
        password: await bcrypt.hash("Manager@123", 10),
        roleid: managerRole._id,
        first_name: "Plant",
        last_name: `Manager ${plantIndex + 1}`,
        username: `manager${plantIndex + 1}`,
        warehouse: plant._id,
      }).save();

      // Create 2 operators per plant
      for (let opIndex = 1; opIndex <= 2; opIndex++) {
        const operator = await new User({
          email: `operator${plantIndex}${opIndex}@jindalsteel.com`,
          password: await bcrypt.hash("Operator@123", 10),
          roleid: operatorRole._id,
          first_name: "Operator",
          last_name: `${plantIndex + 1}-${opIndex}`,
          username: `operator${plantIndex}${opIndex}`,
          warehouse: plant._id,
        }).save();
      }

      // Create pallet barcodes for this plant
      const palletBarcodes = [];
      for (let i = 1; i <= 15; i++) {
        const barcode = await new PalletBarcode({
          warehouse: plant._id, // Add warehouse reference
        }).save();
        palletBarcodes.push(barcode);
      }

      // Create pallets for this plant
      const sizes = ['Small', 'Medium', 'Large', 'Extra Large'];
      for (let i = 0; i < 12; i++) {
        await new Pallet({
          size: sizes[i % sizes.length],
          quantity: Math.floor(Math.random() * 200) + 50,
          location: locations[i % locations.length]._id,
          pallet_barcode: palletBarcodes[i]._id,
        }).save();
      }

      console.log(`Created ${locations.length} locations, 3 users, 15 barcodes, 12 pallets for ${plant.warehouse_name}`);
    }

    console.log("\n=== SEEDING SUMMARY ===");
    console.log("1 Super Admin user");
    console.log("4 Plants created");
    console.log("40 Locations (10 per plant)");
    console.log("13 Users (1 Super Admin + 4 Managers + 8 Operators)");
    console.log("60 Pallet Barcodes");
    console.log("48 Pallets (12 per plant)");
    console.log("3 Roles (Super Admin, Plant Manager, Operator)");
    console.log("\nSeeding complete!");
    
  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
