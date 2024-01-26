const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema({
    title: {
        type: String,
        required:true,
    },
    description: {
        type:String,
    },
    price: {
        type:Number,
    },
    image: {
        type:String,
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref:"Review",
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref:"User",
    }
})

const Product = mongoose.model("Product", productSchema);
module.exports = Product;