const express = require("express");
const { createProduct, getAllProducts, deleteProduct, updateProduct, getAllProductsOfUser, verifyAndAddCommissionInProductByAdmin, getAllProductsByAdmin, deleteProductByAdmin, getProduct, getAllSoldProducts, getWonProductsOfUser } = require("../controllers/productController");
const { protect, isSeller, isAdmin } = require("../middleware/authMiddleware");
const { upload } = require("../utils/fileUpload");
const router = express.Router();

// Specific routes first to avoid conflicts
router.get("/sold", protect, getAllSoldProducts);
router.get("/won-products", protect, getWonProductsOfUser);
router.get("/user", protect, getAllProductsOfUser);
router.get("/admin/products", protect, isAdmin, getAllProductsByAdmin);
router.patch("/admin/product-verified/:id", protect, isAdmin, upload.none(), verifyAndAddCommissionInProductByAdmin);
router.delete("/admin/products/:id", protect, isAdmin, deleteProductByAdmin); // Changed to accept :id

// Product CRUD
router.post("/", protect, isSeller, upload.single("image"), createProduct);
router.get("/", getAllProducts);
router.get("/:id", getProduct);
router.put("/:id", protect, isSeller, upload.single("image"), updateProduct);
router.delete("/:id", protect, deleteProduct);

module.exports = router;