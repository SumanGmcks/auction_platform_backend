const asyncHandler = require("express-async-handler");
const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");


const protect = asyncHandler(async (req, res,next) => {

    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
          token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies.token) {
          token = req.cookies.token;
        }

        if (!token) {
            res.status(401);
           throw new Error("Not authorized to access this page, Please login");
        } 
        
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(verified.id).select("-password");

        if (!user) {
            res.status(401);
            throw new Error("User not found");
        }

        req.user = user;
        next();

     } catch (error) {
          res.status(401);
            throw new Error("Not authorized to access this page, Please login");  
        }  
});

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        res.status(403);
        throw new Error("Access denied, You are not an administrator");
    }
};
const isSeller = (req, res, next) => {
    if ((req.user && req.user.role === "seller") || (req.user && req.user.role === "admin")) {
        next();
    } else {
        res.status(403);
        throw new Error("Access denied, You are not a seller");
    }
};
module.exports = {
    protect,isAdmin,isSeller,
};