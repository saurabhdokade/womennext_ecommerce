const ProductModel = require("../../models/SuperAdminModels/Product");
const reviewModel = require("../../models/UserModels/Review");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");

dayjs.extend(relativeTime);

//✅ Add Review
const addReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;
        const { ratings, review, title, name } = req.body;

        // Validate required fields
        if (!ratings || !review || !name) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: ratings, review, name",
            });
        }

        // Check if the product exists
        const product = await ProductModel.exists({ _id: productId });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Invalid Product ID, product not found",
            });
        }

        // Process uploaded files (Cloudinary URLs)
        const files = req.files.map((file) => file.path);

        // Create and save the review
        const newReview = new reviewModel({
            productId,
            userId,
            ratings,
            review,
            title,
            name,
            files,
        });

        await newReview.save();

        return res.status(201).json({
            success: true,
            message: "Review added successfully!",
            review: newReview,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

//✅ Get All Reviews
const getAllReviews = async (req, res) => {
    try {

        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            reviewModel
                .find()
                .select("name ratings review files createdAt productId -_id")
                .skip(skip)
                .limit(limit),
            reviewModel.countDocuments(),
        ]);
        const formattedReviews = reviews.map(
            ({ _doc: { createdAt, ...rest } }) => ({
                ...rest,
                timeAgo: dayjs(createdAt).fromNow(),
            })
        );
        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
            success: true,
            currentPage: page,
            totalPages,
            totalReviews: total,
            previous: page > 1,
            next: page < totalPages,
            reviews: formattedReviews,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

//✅ Get All Reviews by Product ID
const getAllReviewsById = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const currentPage = parseInt(page);
        const perPage = parseInt(limit);
        const skip = (currentPage - 1) * perPage;

        // Check if the product exists
        const productExists = await ProductModel.exists({ _id: productId });
        if (!productExists) {
            return res.status(404).json({
                success: false,
                message: "Invalid Product ID, product not found",
            });
        }

        const [reviews, total] = await Promise.all([
            reviewModel
                .find({ productId })
                .select("name ratings review files createdAt -_id")
                .skip(skip)
                .limit(perPage),
            reviewModel.countDocuments({ productId }),
        ]);

        const formattedReviews = reviews.map(
            ({ _doc: { createdAt, ...rest } }) => ({
                ...rest,
                timeAgo: dayjs(createdAt).fromNow(),
            })
        );
        const totalPages = Math.ceil(total / perPage);

        return res.status(200).json({
            success: true,
            currentPage,
            totalPages,
            totalReviews: total,
            previous: currentPage > 1,
            next: currentPage < totalPages,
            reviews: formattedReviews,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

//✅ Get Average Ratings
const getAverageRatings = async (req, res) => {
    try {
        const { productId } = req.params;

        // Check if the product exists
        const product = await ProductModel.exists({ _id: productId });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Invalid Product ID, product not found",
            });
        }

        // Fetch all ratings
        const reviews = await reviewModel.find({ productId }).select("ratings");

        if (reviews.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No reviews yet",
                averageRating: 0,
                ratingBreakdown: {
                    "5": "0%",
                    "4": "0%",
                    "3": "0%",
                    "2": "0%",
                    "1": "0%",
                },
            });
        }

        const ratingCounts = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };

        let total = 0;

        for (const review of reviews) {
            const roundedRating = Math.round(review.ratings); // ⬅️ Round to nearest integer
            total += review.ratings;

            // Count only 1 to 5
            if (roundedRating >= 1 && roundedRating <= 5) {
                ratingCounts[roundedRating]++;
            }
        }

        const totalReviews = reviews.length;
        const averageRating = total / totalReviews;

        // Convert counts to percentages
        const ratingBreakdown = {};
        for (let i = 1; i <= 5; i++) {
            const percentage = (ratingCounts[i] / totalReviews) * 100;
            ratingBreakdown[i] = `${percentage.toFixed(1)}%`;
        }

        return res.status(200).json({
            success: true,
            averageRating: averageRating.toFixed(1),
            totalReviews,
            ratingBreakdown,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    addReview,
    getAllReviews,
    getAllReviewsById,
    getAverageRatings,
};
