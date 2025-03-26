const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
 
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});
 
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const allowedFormats = ["png", "jpg", "jpeg", "webp"];
 
        // Get file extension
        const fileExtension = file.mimetype.split("/")[1];
 
        if (!allowedFormats.includes(fileExtension)) {
            throw new Error("Invalid file type. Only PNG, JPG, JPEG, and WEBP are allowed.");
        }
 
        return {
            folder: "Women_Care/Delivery_Boys",
            format: fileExtension,
            resource_type: "image",
            public_id: Date.now() + "-" + file.originalname,
        };
    },
});
 
const upload = multer({ storage });
 
module.exports = { upload, cloudinary };
 