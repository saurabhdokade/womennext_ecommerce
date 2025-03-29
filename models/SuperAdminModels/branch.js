const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
    branchName: {
        type: String,
        required: true,
        trim: true
    },
    branchPersonName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true,
        match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number']
    },
    fullAddress: {
        type: String,
        required: true
    },
    servicePinCode: {
        type: String,
        required: true,
        match: [/^\d{6}$/, 'Please enter a valid 6-digit PIN code']
    },

}, { timestamps: true });

module.exports = mongoose.model('Branch', branchSchema);
