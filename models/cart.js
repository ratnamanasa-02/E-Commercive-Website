const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartSchema = new Schema({
    number: {
        type: String,
        require:true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref:"User",
    },
    product: {
        type: Schema.Types.ObjectId,
        ref:"Product",
    }
})

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;