const mongoose = require('mongoose');
require('dotenv').config();

const mongooseOptions = {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000,
    maxPoolSize: 10
};

// Initialize all models
const initModels = () => {
    require('../models/user');
    require('../models/role');
    require('../models/warehouse');
    require('../models/location');
    require('../models/pallet');
    require('../models/palletBarcode');
    // Add any other models here
};

const connectDB = () => {
    return new Promise((resolve, reject) => {
        mongoose.connect(process.env.MONGODB_URI, mongooseOptions)
            .then(() => {
                console.log('✅ MongoDB connected');
                // Initialize all models after connection
                initModels();
                resolve();
            })
            .catch((err) => {
                console.error('❌ MongoDB connection failed:', err);
                reject(err);
            });

        // Handle connection events
        mongoose.connection.on('disconnected', () => {
            console.log('🔴 MongoDB disconnected');
        });

        mongoose.connection.on('error', (err) => {
            console.error('🔴 MongoDB error:', err);
        });

        // Handle application termination
        process.on('SIGINT', () => {
            mongoose.connection.close(() => {
                console.log('MongoDB disconnected through app termination');
                process.exit(0);
            });
        });
    });
};

module.exports = {
    connectDB,
    getConnection: () => mongoose.connection
};
