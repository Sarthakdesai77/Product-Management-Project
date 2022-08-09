const orderModel = require('../model/orderModel')
const cartModel = require('../model/cartModel')
const validator = require('../validation/validator')

const orderCreate = async function (req, res) {
    try {
        const data = req.body
        const userId = req.params.userId
        let { cartId } = data

        if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "Please enter data to create order" })

        if (!cartId) return res.status(400).send({ status: false, message: 'Please enter cartId' })
        if (typeof cartId != 'string') return res.status(400).send({ status: false, message: 'cartId should be string' })
        if (!validator.isValid(cartId)) return res.status(400).send({ status: false, message: 'cartId should not be blank' })
        if (!validator.isValidObjectId(cartId)) return res.status(400).send({ status: false, message: 'Invalid cartId' })

        let checkCartId = await cartModel.findById(cartId).select({ _id: 0, createdAt: 0, updatedAt: 0 })
        if (!checkCartId) return res.status(404).send({ status: false, message: 'cartId not found' })

        if (checkCartId.userId != userId) return res.status(403).send({ status: false, message: "cartId does not match with user" })

        let { items } = checkCartId
        if (!items || items.length == 0) return res.status(400).send({ status: false, message: "Cart is empty" })

        let enterData = checkCartId.toObject()
        enterData.totalQuantity = 0
        items.map(x => enterData.totalQuantity += x.quantity)

        const orderData = await orderModel.create(enterData)

        await cartModel.findOneAndUpdate({ _id: cartId }, { items: [], totalPrice: 0, totalItems: 0 })

        return res.status(201).send({ status: true, message: "Success", data: orderData })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

const updatedOrders = async (req, res) => {
    try {
        let data = req.body
        let userId = req.params.userId
        let { orderId, status } = data

        if (!orderId) return res.status(400).send({ status: false, message: "order Id must be present" })
        if (typeof orderId != "string") return res.status(400).send({ status: false, message: 'orderId should be string' })
        if (!validator.isValid(orderId)) return res.status(400).send({ status: false, message: 'orderId should not be empty' })
        if (!(validator.isValidObjectId(orderId))) return res.status(400).send({ status: false, message: 'please enter valid orderId' })

        let findOrder = await orderModel.findOne({ _id: orderId, isDeleted: false })
        if (!findOrder) return res.status(404).send({ status: false, message: "order Id does not exist" })

        if (findOrder.userId != userId) return res.status(403).send({ status: false, message: "oredrId does not match with user" })

        if (!status) return res.status(400).send({ status: false, message: "enter the status of the order" })

        if (findOrder.status == "completed") return res.status(400).send({ status: false, message: "order already completed" })
        if (findOrder.status == "cancelled") return res.status(400).send({ status: false, message: "order already cancelled" })

        if (status == "completed") {

            let updatedata = await orderModel.findOneAndUpdate({ _id: orderId }, { status: "completed" }, { new: true },)

            await cartModel.findOneAndUpdate({ userId }, { items: [], totalPrice: 0, totalItems: 0 }, { new: true })

            return res.status(200).send({ status: true, message: "Success", data: updatedata })
        }

        else if (status == "cancelled") {

            if (findOrder.cancellable == false) return res.status(400).send({ status: false, message: "you can not cancel this order" })

            let updatedata = await orderModel.findOneAndUpdate({ _id: orderId }, { isDeleted: true, deletedAt: Date.now(), status: "cancelled" }, { new: true })

            await cartModel.findOneAndUpdate({ userId }, { items: [], totalPrice: 0, totalItems: 0 }, { new: true })

            return res.status(200).send({ status: true, message: "Success", data: updatedata })
        }

        else {

            return res.status(400).send({ status: false, message: "please enter status either cancelled or completed " })
        }

    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = { orderCreate, updatedOrders }