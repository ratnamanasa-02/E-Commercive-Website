if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const mongoose = require("mongoose");
const initData = require("./data.js");
const Product = require("../models/products.js");

async function main() {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/swiftcart");
        console.log("Connected to the database");

        // Clear existing data and insert new data
        await initDB();
    } catch (error) {
        console.error("Error connecting to the database:", error);
    }
}

async function initDB() {
    try {
        await Product.deleteMany({});
        await Product.insertMany(initData.data);
        console.log("Data was initialized");
    } catch (error) {
        console.error("Error initializing data:", error);
    }
}

main();
