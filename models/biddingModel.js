const mongoose = require('mongoose');

const biddingProductSchema =  mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },

    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product',
    },
    price: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true
});

const biddingProduct = mongoose.model("BiddingProduct", biddingProductSchema);
module.exports = biddingProduct;