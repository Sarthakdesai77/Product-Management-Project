const mongoose = require('mongoose');
let ObjectId = mongoose.Schema.Types.ObjectId

const orderSchema = new mongoose.Schema({

    userId: { type: ObjectId, ref: 'user', require: true },

    items: [{
        productId: { type: ObjectId, ref: 'product', require: true },

        quantity: { type: Number, require: true, min: 1 },

        _id:false
    }],

    totalPrice: { type: Number, require: true },//Holds total price of all the items in the cart

    totalItems: { type: Number, require: true },//comment: Holds total number of items in the cart

    totalQuantity: { type: Number, require: true },//comment:Holds total number of quantity in the cart

    cancellable: { type: Boolean, default: true },

    status: { type: String, default: 'pending', enum: ["pending", "completed", "cancelled"] },

    deletedAt: { type: Date },//when the document is deleted

    isDeleted: { type: Boolean, default: false },

}, { versionKey: false, timestamps: true })

module.exports = mongoose.model("order", orderSchema)