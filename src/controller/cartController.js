let cartModel = require('../model/cartModel')
let productModel = require('../model/productModel')
let mongoose = require('mongoose')
let validator = require('../validation/validator')

//-----------------------------------------------------------------------------------------------------//

let createCart = async (req, res) => {
    try {
        let userId = req.params.userId
        let { cartId, productId } = req.body

        if (Object.keys(req.body).length == 0) return res.status(400).send({ status: false, message: 'Please enter data to create' })

        if (!productId) return res.status(400).send({ status: false, message: 'product id is mandatory' })
        if (typeof productId != "string") return res.status(400).send({ status: false, message: 'product id should be string' })
        if (!validator.isValid(productId)) return res.status(400).send({ status: false, message: 'please enter product id ' })
        if (!validator.isValidObjectId(productId)) return res.status(400).send({ status: false, message: 'invalid productId' })
        
        let findProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!findProduct) return res.status(404).send({ status: false, message: 'no such product found or maybe deleted' })

        let productPrice = findProduct.price

        let productDetails = {
            productId,
            quantity: 1
        }

        let findCart

        if ("cartId" in req.body) {
            if (typeof cartId != "string") return res.status(400).send({ status: false, message: 'cartId should be string' })
            if (!validator.isValid(cartId)) return res.status(400).send({ status: false, message: 'please enter cartId ' })
            if (!mongoose.isValidObjectId(cartId)) return res.status(400).send({ status: false, message: 'invalid cartId' })
            findCart = await cartModel.findOne({ _id: cartId, userId })
            if (!findCart) return res.status(404).send({ status: false, message: 'cart id does not exists' })

        } else {
            findCart = await cartModel.findOne({ userId: userId })
        }

        if (findCart) {
            let alreadyProductsId = findCart.items.map(x => x.productId.toString())

            if (alreadyProductsId.includes(productId)) {
                let updatedCart = await cartModel.findOneAndUpdate({ "items.productId": productId, userId: userId }, { $inc: { "items.$.quantity": 1, totalPrice: productPrice } }, { new: true })
                //positional operator($) is used to increase in array

                return res.status(201).send({ status: true, message: "Success", data: updatedCart })
                //status code 200

            } else {
                let updatedCart = await cartModel.findOneAndUpdate({ userId: userId }, { $push: { items: productDetails }, $inc: { totalItems: 1, totalPrice: productPrice } }, { new: true })

                return res.status(201).send({ status: true, message: "Success", data: updatedCart })
                //status code 200
            }
        }

        const cartCreate = {
            userId: userId,
            items: [productDetails],
            totalItems: 1,
            totalPrice: productPrice
        }

        const cartCreated = await cartModel.create(cartCreate)

        res.status(201).send({ status: true, message: "Success", data: cartCreated })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

//-----------------------------------------------------------------------------------------------------//


const getCart = async (req, res) => {
    try {
        let userId = req.params.userId

        let findCart = await cartModel.findOne({ userId }).select({ createdAt: 0, updatedAt: 0 }).populate('items.productId', { __v: 0, _id: 0, isDeleted: 0, createdAt: 0, deletedAt: 0, currencyId: 0, currencyFormat: 0, updatedAt: 0, availableSizes: 0 })
        if (!findCart) return res.status(404).send({ status: false, message: 'no such cart found for this user' })

        if (findCart.items.length == 0) return res.status(200).send({ status: true, message: 'Cart empty', data: findCart })

        res.status(200).send({ status: true, message: 'Success', data: findCart })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

//-----------------------------------------------------------------------------------------------------//

const deleteCart = async (req, res) => {
    try {
        let userId = req.params.userId

        let findCart = await cartModel.findOne({ userId })
        if (!findCart) return res.status(404).send({ status: false, message: 'no such cart found for this user' })

        if (findCart.totalItems == 0) return res.status(404).send({ status: false, message: 'Item already daleted' })
        const deleteCart = await cartModel.findOneAndUpdate({ _id: findCart._id }, { items: [], totalPrice: 0, totalItems: 0 }, { new: true })

        res.status(204).send({ status: true, message: 'successfully deleted', data: deleteCart })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}
//-----------------------------------------------------------------------------------------------------//

const updatedCart = async (req, res) => {
    try {
        let userId = req.params.userId;
        let data = req.body;
        let { productId, cartId, removeProduct } = data;

        removeProduct = parseInt(removeProduct)

        if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: 'please enter data to update' })

        if (!cartId) return res.status(400).send({ status: false, message: 'please enter cartId ' })
        if (typeof cartId != "string") return res.status(400).send({ status: false, message: 'cartId should be string' })

        if (!validator.isValid(cartId)) return res.status(400).send({ status: false, message: 'cart Id should not be empty' })
        if (!(mongoose.isValidObjectId(cartId))) return res.status(400).send({ status: false, message: 'please enter valid cart Id' })
        let findCart = await cartModel.findOne({ _id: cartId, userId })
        if (!findCart) return res.status(404).send({ status: false, message: 'cart not found' })

        let itemsOfCart = findCart.items
        if (itemsOfCart.length == 0) return res.status(400).send({ status: false, message: "cart is already empty" })

        if (!productId) return res.status(400).send({ status: false, message: 'product id is mandatory' })
        if (typeof productId != "string") return res.status(400).send({ status: false, message: 'product id should be string' })
        if (!validator.isValid(productId)) return res.status(400).send({ status: false, message: 'product id should not be empty' })
        if (!(validator.isValidObjectId(productId))) return res.status(400).send({ status: false, message: 'please enter valid product id' })
        let checkProduct = itemsOfCart.map(x => x.productId.toString())
        if (!checkProduct.includes(productId)) return res.status(404).send({ status: false, message: 'product not found in cart' })
        let findProduct = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!('removeProduct' in req.body)) return res.status(400).send({ status: false, message: 'removeProduct is mandatory' })
        if (!validator.isValid(removeProduct)) return res.status(400).send({ status: false, message: 'removeProduct should not be empty' })

        if (!(removeProduct == 0 || removeProduct == 1)) return res.status(400).send({ status: false, message: 'removeProduct value should be either 1 or 0 in the number Format' })

        for (let i = 0; i < itemsOfCart.length; i++) {
            if (itemsOfCart[i].productId == productId) {
                let priceChange = itemsOfCart[i].quantity * findProduct.price;

                if (removeProduct == 0) {
                    const update = await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } }, totalPrice: findCart.totalPrice - priceChange, totalItems: findCart.totalItems - 1 }, { new: true })
                    return res.status(200).send({ status: true, message: 'Success', data: update })
                }

                if (removeProduct == 1) {
                    if (itemsOfCart[i].quantity == 1) {
                        const update = await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } }, totalPrice: findCart.totalPrice - priceChange, totalItems: findCart.totalItems - 1 }, { new: true })
                        return res.status(200).send({ status: true, message: 'Success', data: update })
                    }

                    itemsOfCart[i].quantity = itemsOfCart[i].quantity - 1;
                    const update = await cartModel.findOneAndUpdate({ _id: cartId }, { items: itemsOfCart, totalPrice: findCart.totalPrice - findProduct.price }, { new: true })
                    return res.status(200).send({ status: true, message: 'Success', data: update })
                }
            }
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = { createCart, getCart, deleteCart, updatedCart }