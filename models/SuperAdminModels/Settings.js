const mongoose = require("mongoose");

// Emergency Fee Schema
const EmergencyFeeSchema = new mongoose.Schema(
  {
    feeAmount: { type: Number, required: true },
  },
  { timestamps: true }
);

// Terms and Conditions Schema
const TermsAndConditionsSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
  },
  { timestamps: true }
);

// Privacy Policy Schema
const PrivacyPolicySchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
  },
  { timestamps: true }
);

// About Us Schema
const AboutUsSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    images: [{ type: String }],
  },
  { timestamps: true }
);

const EmergencyFeeModel = mongoose.model("EmergencyFee", EmergencyFeeSchema);
const TermsAndConditionsModel = mongoose.model(
  "TermsAndConditions",
  TermsAndConditionsSchema
);
const PrivacyPolicyModel = mongoose.model("PrivacyPolicy", PrivacyPolicySchema);
const AboutUsModel = mongoose.model("AboutUs", AboutUsSchema);

module.exports = {
  EmergencyFeeModel,
  TermsAndConditionsModel,
  PrivacyPolicyModel,
  AboutUsModel,
};