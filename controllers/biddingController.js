const asyncHandler = require("express-async-handler");
const BiddingProduct = require("../models/biddingModel");
const Product = require("../models/productModel");
const User = require("../models/UserModel");
const sendMail = require("../utils/sendMail");

const getBiddingHistory = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const biddingHistory = await BiddingProduct.find({ product: productId}).sort("-createdAt").populate("user").populate("product");
    res.status(200).json(biddingHistory);
});

const placeBid = asyncHandler(async (req, res) => {
    const { productId, price } = req.body;
    const userId = req.user._id;

    const product = await Product.findById(productId);
    if (!product) {
        res.status(400);
        throw new Error("Invalid product or bidding is closed");
    }
    if (!product.isVerify) {
        res.status(400);
        throw new Error("Bidding is not verified for this product");
    }
    if (product.isSoldout === true) {
        res.status(400);
        throw new Error("Bidding is closed for this product");
    }

    const existingBid = await BiddingProduct.findOne({ user: userId, product: productId });
    if (existingBid) {
        if (price <= existingBid.price) {
            res.status(400);
            throw new Error("Your bid must be higher than your previous bid");
        }
        existingBid.price = price;
        await existingBid.save();
        return res.status(200).json({ biddingProduct: existingBid });
    } else {
        const highestBid = await BiddingProduct.findOne({ product: productId }).sort({ price: -1 });
        if (highestBid && price <= highestBid.price) {
            res.status(400);
            throw new Error("Your bid must be higher than the current highest bid");
        }
    }

    const newBiddingProduct = await BiddingProduct.create({
        user: userId,
        product: productId,
        price,
    });

    res.status(200).json(newBiddingProduct);

});

const sellProduct = asyncHandler(async (req, res) => {
    const { productId } = req.body;
    const userId = req.user._id;

    const product = await Product.findById(productId);
    if (!product) {
        res.status(400);
        throw new Error("Product not found");
    }

    if (!product.user) {
        return res.status(400).json({ error: "Product has no associated seller" });
    }

    if (product.user.toString() !== userId.toString()) {
       return res.status(403).json({ error: "You are not authorized to sell this product" });
    }

    const highestBid = await BiddingProduct.findOne({ product: productId }).sort({ price: -1 }).populate("user");
    if (!highestBid) {
       return res.status(400).json({ error: "No winning bid found for the product" });
    }

    const commissionRate = product.commission;
    const commissionAmount = (commissionRate / 100) * highestBid.price;
    const finalPrice = highestBid.price; // Seller gets full price

    product.isSoldout = true;
    product.soldTo = highestBid.user;
    product.soldPrice = finalPrice;

    const admin = await User.findOne({ role: "admin" });
    if (admin) {
        admin.commissionBalance = (admin.commissionBalance || 0) + commissionAmount;
        await admin.save();
    }

    const seller = await User.findById(product.user);
    if (seller) {
        // Ensure seller.balance is initialized
        seller.balance = (seller.balance || 0) + finalPrice;
        await seller.save();
    } else {
        return res.status(404).json({ error: "Seller not found" });
    }

    await product.save();

 
    try {
        if (highestBid.user && highestBid.user.email) {
            await sendMail({
                email: highestBid.user.email, // Send to the winning bidder
                from: `${process.env.SMTP_FROM_NAME || 'Bidding'} <${process.env.SMTP_FROM_EMAIL || 'non_reply@gmail.com'}>`,
                subject: "Congratulations! You won the auction!",
                html: `Congratulations! You won the auction for the product \"${product.title}\" with a bid of $${finalPrice}.`,
            });
        }
        
        if (seller && seller.email) {
            await sendMail({
                email: seller.email, // Send to the seller
                from: `${process.env.SMTP_FROM_NAME || 'Bidding'} <${process.env.SMTP_FROM_EMAIL || 'non_reply@gmail.com'}>`,
                subject: "Your product has been sold!",
                html: `Your product \"${product.title}\" has been sold for $${finalPrice}.`,
            });
        }
    } catch (err) {
        console.error("Failed to send email:", err.message);
    }

    res.status(200).json({ message: "Product has been sold successfully" });
});


module.exports = {
    getBiddingHistory,
    placeBid,
    sellProduct
};
