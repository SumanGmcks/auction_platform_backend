const asyncHandler = require("express-async-handler");
const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "10d",
  });
};
const registerUser = asyncHandler(async (req, res) => {
  if (!req.body) {
    console.log("Request body is missing");
    res.status(400);
    throw new Error("Request body is missing");
  }
  console.log("Request Body:", req.body); 

  const { name, email, password, photo } = req.body;

  if (!name || !email || !password) {
    console.log("Missing required fields");
    res.status(400);
    throw new Error("Please fill in all required fields");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    console.log("User already exists");
    res.status(400);
    throw new Error("Email is already in use or exists");
  }

  try {
    const user = await User.create({
      name,
      email,
      password,
      photo: photo || "",
    });
    console.log("User created:", user);

    const token = generateToken(user._id);
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400),
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });

    if (user) {
      const { _id, name, email, photo, role } = user;
      res.status(201).json({
        _id,
        name,
        email,
        photo,
        role,
      });
    } else {
      res.status(400);
      throw new Error("Invalid user data");
    }
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500);
    res.json({
      message: "Server error",
      error: error.message,
      stack: error.stack,
    });
    return;
  }
});
const logiUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please add email and password");
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User not found, Please signup");
  }

  const passwordIsCorrect = await bcrypt.compare(password, user.password);

  const token = generateToken(user._id);
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400),
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  });

  if (user && passwordIsCorrect) {
    const { _id, name, email, photo, role } = user;
    res.status(201).json({
      _id,
      name,
      email,
      photo,
      role,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json(false);
  }

  const verified = jwt.verify(token, process.env.JWT_SECRET);
  if (verified) {
    return res.json(true);
  }
  return res.json(false);
});

const logoutuser = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: true,
  });
  return res.json({ message: "Successfully logged out" });
});

const loginAsSeller = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please add email and password");
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User not found, Please signup");
  }

  const passwordIsCorrect = await bcrypt.compare(password, user.password);
   if (!passwordIsCorrect) {
    res.status(404);
    throw new Error("invalid password");
  }

  user.role = "seller"; 
  await user.save(); 
  const token = generateToken(user._id);
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400),
    sameSite: "none",
    secure: true,
  });

  if (user && passwordIsCorrect) {
    const { _id, name, email, photo, role } = user;
    res.status(201).json({
      _id,
      name,
      email,
      photo,
      role,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.status(200).json(user);
});

const getuserBalance = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    balance: user.balance,
  });
});

const getAlluser = asyncHandler(async (req, res) => {
  const userList = await User.find({});
  if (!userList.length) {
    return res.status(404).json({ message: "No users found" });
  }
  res.status(200).json(userList); // Always send a response
});

const estimateIncome = asyncHandler(async (req, res) => {
  try {
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
    return res.status(404).json({ message: "No users found" });
  }
  const commissionBalance = admin.commissionBalance;
  res.status(200).json({ commissionBalance });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
module.exports = {
  registerUser,
  loginUser: logiUser,
  loginStatus,
  logoutuser,
  loginAsSeller,
  getUser,
  getuserBalance,
  getAlluser,
  estimateIncome,
};
