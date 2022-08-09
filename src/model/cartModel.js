let mongoose = require('mongoose')
let ObjectId = mongoose.Schema.Types.ObjectId

let cartSchema = new mongoose.Schema({

    userId: { type: ObjectId, ref: "user", required: true, unique: true },

    items: [{

        _id: false,

        productId: { type: ObjectId, ref: "product", required: true },

        quantity: { type: Number, required: true, min: 1 }
    }],

    totalPrice: { type: Number, required: true },//"Holds total price of all the items in the cart"

    totalItems: { type: Number, required: true },//"Holds total number of items in the cart"

}, { versionKey: false, timestamps: true })

module.exports = mongoose.model('cart', cartSchema)