const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, unique: true, trim: true },

        description: { type: String, required: true, trim: true },

        price: { type: Number, required: true },

        currencyId: { type: String, required: true, trim: true },

        currencyFormat: { type: String, required: true, trim: true },

        isFreeShipping: { type: Boolean, default: false },

        productImage: { type: String, required: true, trim: true }, // s3 link

        style: { type: String, trim: true },

        availableSizes: { type: [String], required: true, toUpperCase: true, trim: true },

        installments: { type: Number, trim: true },

        deletedAt: { type: Date },

        isDeleted: { type: Boolean, default: false },

    }, { versionKey: false, timestamps: true });

module.exports = mongoose.model('product', productSchema);
