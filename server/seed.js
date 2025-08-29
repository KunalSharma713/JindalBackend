// seed.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Role = require("../models/role");
const User = require("../models/user");
const Warehouse = require("../models/warehouse");
const Location = require("../models/location");
const PalletBarcode = require("../models/palletBarcode");

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

    const adminRole = await new Role({
      name: "Super Admin",
      is_active: true,
      slug: "super_admin",
    }).save();

    const hashedPassword = await bcrypt.hash("Root@123", 10);
    const superAdminUser = new User({
      email: "rohit@gmail.com",
      password: hashedPassword,
      roleid: adminRole._id,
      first_name: "Rohit",
      last_name: "Todwal",
      username: "rohittodwal123",
    });

    superAdminUser._roleSlug = adminRole.slug;
    await superAdminUser.save();

    const plant_one = await new Warehouse({
      warehouse_name: "Angel Tech Plant",
      lat: "18.5204",
      long: "73.8567",
    }).save();

    const plant_two = await new Warehouse({
      warehouse_name: "Viva Power Plant",
      lat: "19.0760",
      long: "72.8777",
    }).save();

    console.log("Plants created:", plant_one._id, plant_two._id);

    console.log("Super Admin User", superAdminUser);
    console.log("Seeding complete!");
  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
