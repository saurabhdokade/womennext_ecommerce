const { Schema, model } = require("mongoose");

const productSchema = new Schema(
    {
        productCode: {
            type: String,
            trim: true,
            unique: true,
        },
        brand: {
            type: String,
            required: [true, "Brand name is required"],
            trim: true,
            enum: [
                "Whisper", "Stayfree", "VWash", "Pee Safe", "Plush", "Sirona",
                "Himalaya", "Carmesi", "Paree", "PeeBuddy", "Azah", "FabPads",
                "Bella", "Nua", "The Woman’s Company", "Namyaa", "Plentiful", "Bey Bee",
            ],
        },
        productName: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
        },
        productSubType: {
            type: String,
            required: [true, "Product Sub Type is required"],
            trim: true,
        },
        productDescription: {
            type: String,
            required: [true, "Product Description is required"],
            trim: true,
        },
        size: {
            type: String,
            required: [true, "Size is required"],
            enum: [
                "S", "M", "L", "XL", "XXL", "Standard",
                "Regular", "100ml", "200ml", "75ml",
            ],
        },
        price: {
            type: String,
            required: [true, "Price is required"],
            min: [0, "Price cannot be negative"],
        },
        quantityInEachPack: {
            type: String,
            required: [true, "Quantity in each pack is required"],
        },
        image: {
            type: [String],
        },
        availableProductQuantity: {
            type: Number,
            required: [true, "Available Product Quantity is required"],
            min: [0, "Available Product Quantity cannot be negative"],
        },
    },
    { timestamps: true }
);

const ProductModel = model("Products", productSchema);
module.exports = ProductModel;
