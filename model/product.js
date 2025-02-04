const mongoose = require("mongoose")
const productSchema = new mongoose.Schema({
    name:{
        type:String,
        index:true
    },
    price:Number,
    description:String,
    url:String,
    rating:Number
})

const Product = mongoose.model('products',productSchema)

module.exports = Product