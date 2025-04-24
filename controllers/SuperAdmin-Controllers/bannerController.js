const Banner = require("../../models/SuperAdminModels/banner");
const { cloudinary } = require("../../config/cloudinary");

//✅ Add Banner
const addBanner = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required.",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required.",
      });
    }

    if (req.files.length > 5) {
      return res.status(400).json({
        success: false,
        message: "You can upload a maximum of 5 images.",
      });
    }

    const images = req.files.map((file) => file.path);

    // 🔢 Generate next Banner No.
    const lastBanner = await Banner.findOne().sort({ createdAt: -1 });
    let nextBannerNo = "Banner No.1";

    if (lastBanner && lastBanner.bannerNo) {
      const lastNumber =
        parseInt(lastBanner.bannerNo.replace("Banner No.", "")) || 0;
      const newNumber = lastNumber + 1;
      nextBannerNo = `Banner No.${newNumber}`;
    }

    const newBanner = new Banner({
      title,
      description,
      images,
      bannerNo: nextBannerNo,
    });

    await newBanner.save();

    res.status(201).json({
      success: true,
      message: "Banner added successfully.",
      data: newBanner,
    });
  } catch (error) {
    console.error("Error adding banner:", error);
    res.status(500).json({
      success: false,
      message: "Server error.",
      error: error.message,
    });
  }
};

//✅ Get all banners
const getAllBanners = async (req, res) => {
  try {
    let query = req.query.query || ""; // optional search term
    let limit = parseInt(req.query.limit) || 4;
    let page = parseInt(req.query.page) || 1;

    // Default sorting: ascending
    let sortOrder = req.query.sort === "asc" ? -1 : 1;
    console.log("Sort Order:", sortOrder);  // Debugging: log sort order value
    let filter = {};
    if (query) {
      filter = {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } }
        ]
      };
    }

    const totalBanners = await Banner.countDocuments(filter);
    const totalPages = Math.ceil(totalBanners / limit);

    const banners = await Banner.find({}, {
        bannerNo: 1,
        images: 1,
        title: 1,
        description: 1
      })
      .sort({ createdAt: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      totalBanners,
      totalPages,
      currentPage: page,
      banners,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


//✅ Update Banner with Cloudinary Image Upload
const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    let updateData = {};

    if (title) updateData.title = title;
    if (description) updateData.description = description;
  

    const existingBanner = await Banner.findById(id);
    if (!existingBanner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    let uploadedImages = existingBanner.images || [];

    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "Women_Care_Banners",
        });
        uploadedImages.push(result.secure_url);
      }
    }

    updateData.images = uploadedImages;

    const updatedBanner = await Banner.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.status(200).json({ success: true, banner: updatedBanner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


//✅ Delete Banner
const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedBanner = await Banner.findByIdAndDelete(id);

    if (!deletedBanner)
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });

    res
      .status(200)
      .json({ success: true, message: "Banner deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



module.exports = {
  addBanner,
  getAllBanners,
  updateBanner,
  deleteBanner,
};
