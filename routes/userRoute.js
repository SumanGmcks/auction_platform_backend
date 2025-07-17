const express = require("express");
const { registerUser, loginUser, loginStatus, logoutuser, loginAsSeller, getUser, getuserBalance, getAlluser, estimateIncome } = require("../controllers/userCtr");
const multer = require("multer");
const { protect, isAdmin } = require("../middleware/authMiddleware");
const upload = multer();
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/loggedIn", loginStatus);
router.get("/logout", logoutuser);
router.post("/seller", loginAsSeller);
router.get("/getuser", protect, getUser);
router.get("/sell-amount", protect, getuserBalance);

router.get("/estimate-income", protect, isAdmin, estimateIncome);
router.get("/users", protect, isAdmin, getAlluser);

module.exports = router;