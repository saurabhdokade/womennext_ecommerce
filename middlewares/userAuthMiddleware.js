const jwt = require("jsonwebtoken");
const userModel = require("../models/UserModels/User");
 
const userValidateToken = async (req, res, next) => {
    try {
        let authHeader = req.header("Authorization") || req.header("authorization");
 
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized: No token provided" });
        }
 
        const token = authHeader.split(" ")[1];
 
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
 
        // Check if user exists
        const user = await userModel.findById(decoded.id);
 
        if (!user) {
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized: User not found" });
        }
 
        // Attach user to request
        req.user = user;
 
        next();
    } catch (error) {
        console.error(error);
 
        if (error.name === "TokenExpiredError") {
            return res
                .status(401)
                .json({ success: false, message: "Token has expired" });
        } else if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }
 
        return res
            .status(500)
            .json({ success: false, message: "Internal Server Error" });
    }
};
 
module.exports = { userValidateToken };
 