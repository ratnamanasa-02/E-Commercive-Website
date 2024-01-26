const mongoose = require("mongoose");
const initData = require("./data.js");
const Product=require("../models/products.js")


main()
    .then(() => {
        console.log("connected to db");
    })
    .catch((err) => {
        console.log(err);
    })

async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/swiftcart");
}

const initDB = async () => {
    await Product.deleteMany({});
    await Product.insertMany(initData.data);
    console.log("data was initialized");
}

initDB();