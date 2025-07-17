const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const cloudinary = require("cloudinary").v2;
const Product = require("../models/productModel");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createProduct = asyncHandler(async (req, res) => {
    // Defensive: check req.body
    if (!req.body || !req.body.title) {
        return res.status(400).json({ message: "Product data is missing or malformed." });
    }
    const { title, description, category, price, height, lengthPic, width, mediumUsed, weight } = req.body;
    const userId = req.user._id;

    const originalSlug = slugify(title, {
        lower: true,
        remove: /[*+~.()'"!:@]/g,
        strict: true,
    });
    let slug = originalSlug;
    let suffix = 1;

    while(await Product.findOne({slug})) {
        slug = `${originalSlug}-${suffix}`;
        suffix++;
    }
        
    if (!title || !description || !category || !price) {
        res.status(400);
        throw new Error("Please fill in all required fields");
    }

    let fileData = {};
    if (req.file) {
        let uploadedFile;
        try {
            uploadedFile = await cloudinary.uploader.upload(req.file.path, {
                folder: "Bidding/Product",
                resource_type: "image",
            });
        } catch (error) {
            res.status(500);
            return res.json({ message: "Image could not be uploaded", error: error.message });
        }
        fileData = {
            fileName: req.file.originalname,
            filePath: uploadedFile.secure_url,
            fileType: req.file.mimetype,
            publicId: uploadedFile.public_id,
        };
    }

    const product = await Product.create({
        user: userId,
        title,
        slug: slug,
        description,
        category,
        price,
        height,
        lengthPic: lengthPic,  // <-- fix here
        width,
        mediumUsed,
        weight,
        image: fileData,
    });
    // Populate user before sending response
    const populatedProduct = await Product.findById(product._id).populate('user');
    res.status(201).json(populatedProduct);

});



const getAllProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({}).sort("-createdAt").populate("user");
    
    
    res.json(products);
});

const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
     const product = await Product.findById(id);

    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    if (product.user?.toString() !== req.user.id) {
        res.status(401);
        throw new Error("User not authorized");
    }


    if (product.image && product.image.publicId) {
        try {
            await cloudinary.uploader.destroy(product.image.publicId);
        } catch (error) {
            console.log(error);  
            res.status(500);
            throw new Error("Error deleting image");
        }
    }

    await Product.findByIdAndDelete(id);
    res.status(200).json({ message: "Product deleted successfully" });
});
 
const updateProduct = asyncHandler(async (req, res) => {
    const { title, description, category, price, height, lengthPic, width, mediumUsed, weight } = req.body;
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }
    if (product.user?.toString() !== req.user.id) {
        res.status(401);
        throw new Error("User not authorized");
    }

    let fileData = {};
    if (req.file) {
        // Delete old image from Cloudinary if exists
        if (product.image && product.image.publicId) {
            try {
                await cloudinary.uploader.destroy(product.image.publicId);
            } catch (error) {
                res.status(500);
                return res.json({ message: "Error deleting old image", error: error.message });
            }
        }
        let uploadedFile;
        try {
            uploadedFile = await cloudinary.uploader.upload(req.file.path, {
                folder: "Bidding/Product",
                resource_type: "image",
            });
        } catch (error) {
            res.status(500);
            return res.json({ message: "Image could not be uploaded", error: error.message });
        }
        fileData = {
            fileName: req.file.originalname,
            filePath: uploadedFile.secure_url,
            fileType: req.file.mimetype,
            publicId: uploadedFile.public_id,
        };
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        id,
        {
            title,
            description,
            category,
            price,
            height,
            lengthPic: lengthPic,
            width,
            mediumUsed,
            weight,
            image: Object.keys(fileData).length === 0 ? product.image : fileData
        },
        {
            new: true,
            runValidators: true,
        }
    );
    res.status(200).json(updatedProduct);
});


const getAllProductsOfUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const products = await Product.find({ user: userId }).sort("-createdAt").populate("user");
    
    
    res.json(products);
});

const verifyAndAddCommissionInProductByAdmin = asyncHandler(async (req, res) => {
  // Accept both JSON and form-data, and handle numbers as well as strings
  let commission = req.body?.commission;
  if (typeof commission === 'undefined') {
    res.status(400);
    throw new Error("Missing 'comission' in request body");
  }
  // Convert to number if possible
  if (typeof commission === 'string' && !isNaN(commission)) {
    commission = Number(commission);
  }
  const { id } = req.params;

  const product = await Product.findById(id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  product.isVerify = true;
  product.commission = commission;
  await product.save();

  res.status(200).json({
    message: "Product verified successfully.",
    data: product
  });
});

const getAllProductsByAdmin = asyncHandler(async (req, res) => {
    const products = await Product.find({}).sort("-createdAt").populate("user");
    res.json(products);
});

const deleteProductByAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (product.image && product.image.publicId) {
    try {
      await cloudinary.uploader.destroy(product.image.publicId);
    } catch (error) {
      console.log(error);  
      res.status(500);
      throw new Error("Error deleting image");
    }
  }

  await Product.findByIdAndDelete(id);
  res.status(200).json({ message: "Product deleted successfully" });
});
const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id).populate("user");  

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.status(200).json(product);
  
});

const getAllSoldProducts = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const products = await Product.find({ isSoldout: true }).sort("-createdAt").populate("user");
    
    
    res.json(products);
});

const getWonProductsOfUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const products = await Product.find({ soldTo: userId, isSoldout: true }).sort("-createdAt").populate("user");
    
    res.json(products);
});

const test = asyncHandler(async (req, res) => {
  res.send("test");
});


module.exports = {
    createProduct,
    getAllProducts,
    getProduct,
    deleteProduct,
    updateProduct,
    getAllProductsOfUser,
    verifyAndAddCommissionInProductByAdmin,
    getAllProductsByAdmin,
    deleteProductByAdmin,
    getAllSoldProducts,
    getWonProductsOfUser,
};