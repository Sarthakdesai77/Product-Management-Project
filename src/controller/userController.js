const userModel = require('../model/userModel')
const validator = require("../validation/validator")
const uploadFile = require('../aws/uploadFile')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')


//=======================[User Register API]=======================


const userRegister = async function (req, res) {
    try {
        let data = req.body
        let files = req.files
        let { fname, lname, email, phone, password, address } = data

        //-----------------[Require field validation]

        if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "Please Enter data" })

        //---------[first Name validation]
        if (!fname) return res.status(400).send({ status: false, message: 'Please enter first name' })
        if (!validator.isValid(fname)) return res.status(400).send({ status: false, message: 'Please enter first name in right formate' })
        if (!validator.isValidName(fname)) return res.status(400).send({ status: false, message: "Please enter first name in right formate" })

        //----------[Last Name validation]
        if (!lname) return res.status(400).send({ status: false, message: 'Please enter lname' })
        if (!validator.isValid(lname)) return res.status(400).send({ status: false, message: 'Please enter last name in right formate' })
        if (!validator.isValidName(lname)) return res.status(400).send({ status: false, message: "Please enter last name in right formate" })

        //----------[Email validation]
        if (!email) return res.status(400).send({ status: false, message: 'Please enter email' })
        if (!validator.isValidEmail(email)) return res.status(400).send({ status: false, message: 'Please enter valid email' })

        //----------[File validation]
        if (files.length == 0) return res.status(400).send({ status: false, message: "Please give profile photo" })
        if (!validator.isValidFile(files[0].originalname)) return res.status(400).send({ status: false, message: 'File type should be png|gif|webp|jpeg|jpg' })

        //----------[Phone Number validation]
        if (!phone) return res.status(400).send({ status: false, message: 'Please enter phone' })
        if (!validator.isValidPhone(phone)) return res.status(400).send({ status: false, message: 'Please enter a valid phone number' })

        //----------[Password Validation]
        if (!password) return res.status(400).send({ status: false, message: 'Please enter password' })
        if (!validator.isValidPassword(password)) return res.status(400).send({ status: false, message: 'Password should be between 8 to 15 character[At least One Upper letter, one small letter, one number and one special charater]' })

        //----------[Address Validation]
        if (!address) return res.status(400).send({ status: false, message: 'Please enter address' })

        let Fulladdress;

        try {
            Fulladdress = JSON.parse(address)
        } catch (err) {
            if (err) {
                return res.status(400).send({ status: false, message: "please enter the address in right format or the pincode should not start with 0" })
            }
        }

        let { shipping, billing } = Fulladdress

        if (!shipping) return res.status(400).send({ status: false, message: 'Please enter shipping address' })
        if (!Fulladdress.shipping.street) return res.status(400).send({ status: false, message: "Please enter shipping street" })
        if (!validator.isValid(shipping.street)) return res.status(400).send({ status: false, message: 'Please enter shipping street in right formate' })

        if (!Fulladdress.shipping.city) return res.status(400).send({ status: false, message: "Please enter shipping city" })
        if (!validator.isValidName(Fulladdress.shipping.city)) return res.status(400).send({ status: false, message: "Enter a valid city name in shipping" })

        if (!Fulladdress.shipping.pincode) return res.status(400).send({ status: false, message: "Please enter shipping pincode" })
        if (!(/^[1-9]{1}[0-9]{5}$/).test(Fulladdress.shipping.pincode)) return res.status(400).send({ status: false, message: "invalid Pincode in shipping" })

        if (!billing) return res.status(400).send({ status: false, message: 'Please enter billing address' })
        if (!Fulladdress.billing.street) return res.status(400).send({ status: false, message: "Please enter billing street" })
        if (!validator.isValid(billing.street)) return res.status(400).send({ status: false, message: 'Please enter billing street in right formate' })

        if (!Fulladdress.billing.city) return res.status(400).send({ status: false, message: "Please enter billing city" })
        if (!validator.isValidName(Fulladdress.billing.city)) return res.status(400).send({ status: false, message: "Enter a valid city name in shipping" })

        if (!Fulladdress.billing.pincode) return res.status(400).send({ status: false, message: "Please enter billing pincode" })
        if (!(/^[1-9]{1}[0-9]{5}$/).test(Fulladdress.billing.pincode)) return res.status(400).send({ status: false, message: "invalid Pincode in billing" })

        data.address = Fulladdress

        //-----------[Password encryption]
        const bcryptPassword = await bcrypt.hash(password, 10)
        data.password = bcryptPassword

        //-----------[File upload on AWS]
        data.profileImage = await uploadFile.uploadFile(files[0])

        //------------------[Unique field check DB calls]

        const emailUnique = await userModel.findOne({ email })
        if (emailUnique) return res.status(400).send({ status: false, message: 'Already register Email' })

        const phoneUnique = await userModel.findOne({ phone })
        if (phoneUnique) return res.status(400).send({ status: false, message: "Already register Phone Number" })

        //------------[Document create]
        const user = await userModel.create(data)
        return res.status(201).send({ status: true, message: 'User Created Successfully', data: user })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


//===========================[User Login API]==========================


const userLogin = async function (req, res) {
    let data = req.body
    let { email, password } = data

    if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "Please Enter data" })

    if (!email) return res.status(400).send({ status: false, message: 'Please enter email' })
    if (!validator.isValidEmail(email)) return res.status(400).send({ status: false, message: 'Please enter valid email' })

    if (!password) return res.status(400).send({ status: false, message: 'Please enter password' })

    const Login = await userModel.findOne({ email })
    if (!Login) return res.status(400).send({ status: false, message: 'Not a register email Id' })

    //----------[Password Verification]
    let PassDecode = await bcrypt.compare(password, Login.password)
    if (!PassDecode) return res.status(401).send({ status: false, message: 'Password not match' })

    //----------[JWT token generate]
    let token = jwt.sign({
        userId: Login._id.toString()
    }, "GroupNumber4", { expiresIn: '50d' })

    res.setHeader("x-api-key", token)

    return res.status(200).send({ status: true, message: 'User login successfull', data: { userId: Login._id, token: token } })
}


//===========================[User get profile API]==========================


const userProfile = async function (req, res) {
    try {
        const userId = req.params.userId

        if (!userId) return res.status(400).send({ status: false, message: "Please enter uesrId in params path" })
        if (!validator.isValidObjectId(userId)) return res.status(400).send({ status: false, message: 'Not a valid userId' })

        const checkUser = await userModel.findById(userId)
        if (!checkUser) return res.status(400).send({ status: false, message: "UserId invalid" })

        let tokenUserId = req.decodedToken.userId
        if (userId != tokenUserId) {
            return res.status(403).send({ status: false, message: "UnAuthorized Access!!" })
        }

        return res.status(200).send({ status: true, message: "User profile details", data: checkUser })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

//===========================[User update profile API]==========================

let updateProfile = async (req, res) => {
    try {
        let userId = req.params.userId;
        let data = req.body;
        let files = req.files;

        let { fname, lname, email, phone, password, address, ...rest } = data;

        if (Object.keys(rest).length > 0) return res.status(400).send({ status: false, message: `you can't update on ${Object.keys(rest)} key` })

        if (Object.keys(data).length == 0 && !files) return res.status(400).send({ status: false, message: 'enter data to update' });

        let finduser = await userModel.findOne({ _id: userId });
        if (!finduser) return res.status(404).send({ status: false, message: 'user id does not exist' });

        if (fname) {          //Update first name
            if (!validator.isValid(fname)) return res.status(400).send({ status: false, message: 'Please enter first name in right formate' })
            if (!validator.isValidName(fname)) return res.status(400).send({ status: false, message: "Please enter first name in right formate" })
            finduser.fname = fname;
        }

        if (lname) {        //Update last name
            if (!validator.isValid(lname)) return res.status(400).send({ status: false, message: 'Please enter last name in right formate' })
            if (!validator.isValidName(lname)) return res.status(400).send({ status: false, message: "Please enter last name in right formate" })
            finduser.lname = lname;
        }

        if (email) {        //Update email
            if (!validator.isValidEmail(email)) return res.status(400).send({ status: false, message: 'Please enter valid email' })
            const emailUnique = await userModel.findOne({ email })
            if (emailUnique) return res.status(400).send({ status: false, message: 'Already register Email' })
            finduser.email = email
        }

        if (phone) {      //Update phone 
            if (!validator.isValidPhone(phone)) return res.status(400).send({ status: false, message: 'Please enter a valid phone number' })
            const phoneUnique = await userModel.findOne({ phone })
            if (phoneUnique) return res.status(400).send({ status: false, message: "Already register Phone Number" })
            finduser.phone = phone
        }

        if (password) {     //Update password
            if (!validator.isValidPassword(password)) return res.status(400).send({ status: false, message: 'Password should be between 8 to 15 character' })
            const bcryptPassword = await bcrypt.hash(password, 10)
            finduser.password = bcryptPassword
        }

        if (files && files.length > 0) {
            if (!validator.isValidFile(files[0].originalname)) return res.status(400).send({ status: false, message: 'File type should be png|gif|webp|jpeg|jpg' })
            finduser.profileImage = await uploadFile.uploadFile(files[0])
        }

        if (address) {
            try {
                address = JSON.parse(address)
            } catch (err) {
                if (err) {
                    return res.status(400).send({ status: false, message: "please enter the address in right format or the pincode should not start with 0" })
                }
            }

            let { shipping, billing } = address;

            if ("shipping" in address) {                   //Update shipping address  

                if (Object.keys(shipping).length == 0) return res.status(400).send({ status: false, message: 'if shipping given please provide data to update' })

                let { street, city, pincode } = shipping;

                if ("street" in shipping) {
                    if (!validator.isValid(street)) return res.status(400).send({ status: false, message: 'Please enter street if street key is provided in shipping' })
                    finduser.address.shipping.street = street;
                }

                if ("city" in shipping) {
                    if (!validator.isValid(city)) return res.status(400).send({ status: false, message: 'Please enter city if city key is provided in shipping' })
                    if (!validator.isValidName(city)) return res.status(400).send({ status: false, message: 'Please enter a valid city name' })
                    finduser.address.shipping.city = city;
                }

                if ("pincode" in shipping) {
                    if (!(/^[1-9]{1}[0-9]{5}$/).test(pincode)) return res.status(400).send({ status: false, message: "invalid Pincode in shipping" })
                    finduser.address.shipping.pincode = pincode;
                }
            }

            if ("billing" in address) {                //Update billing address

                if (Object.keys(billing).length == 0) return res.status(400).send({ status: false, message: 'if billing given please provide data to update' })

                let { street, city, pincode } = billing;

                if ("street" in billing) {
                    if (!validator.isValid(street)) return res.status(400).send({ status: false, message: 'Please enter street if street key is provided in billing' })
                    finduser.address.billing.street = street;
                }

                if ("city" in billing) {
                    if (!validator.isValid(city)) return res.status(400).send({ status: false, message: 'Please enter city if key city is provided in billing' })
                    if (!validator.isValidName(city)) return res.status(400).send({ status: false, message: 'Please enter a valid city name in billing' })
                    finduser.address.billing.city = city;
                }

                if ("pincode" in billing) {
                    if (!(/^[1-9]{1}[0-9]{5}$/).test(pincode)) return res.status(400).send({ status: false, message: "invalid Pincode in billing" })
                    finduser.address.billing.pincode = pincode;
                }
            }
        }

        //Update Profile
        let updateProfile = await userModel.findByIdAndUpdate({ _id: userId }, finduser, { new: true });

        //Send Response
        res.status(200).send({ status: true, message: "User profile updated", data: updateProfile });

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = { userRegister, userLogin, updateProfile, userProfile }