const {
  EmergencyFeeModel,
  TermsAndConditionsModel,
  PrivacyPolicyModel,
  AboutUsModel,
} = require("../../models/SuperAdminModels/Settings");
 
//✅ isEmpty Function
const isEmpty = (value) =>
  !value || (Array.isArray(value) && value.length === 0);
 
//✅ Create Emergency Fee
const createEmergencyFee = async (req, res) => {
  const { feeAmount } = req.body;
  if (!feeAmount || isNaN(feeAmount)) {
    return res.status(400).json({ error: "feeAmount must be a number" });
  }
 
  try {
    const existing = await EmergencyFeeModel.findOne();
    if (existing)
      return res.status(400).json({ error: "Emergency Fee already exists" });
 
    const fee = await EmergencyFeeModel.create({ feeAmount });
    res.status(201).json(fee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
 
//✅ Get Emergency Fee
const getEmergencyFee = async (req, res) => {
  try {
    const data = await EmergencyFeeModel.findOne();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
 
//✅ Update Emergency Fee
const updateEmergencyFee = async (req, res) => {
  const { feeAmount } = req.body;
  if (!feeAmount || isNaN(feeAmount)) {
    return res.status(400).json({ error: "feeAmount must be a number" });
  }
 
  try {
    const updated = await EmergencyFeeModel.findOneAndUpdate(
      {},
      { feeAmount },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
 
//✅ Create Terms and Conditions
const createTerms = async (req, res) => {
  const { description } = req.body;
  if (isEmpty(description)) {
    return res.status(400).json({ error: "Description is required" });
  }
 
  try {
    const exists = await TermsAndConditionsModel.findOne();
    if (exists) return res.status(400).json({ error: "Terms already exist" });
 
    const data = await TermsAndConditionsModel.create({ description });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
 
//✅ Get Terms and Conditions
const getTerms = async (req, res) => {
  try {
    const data = await TermsAndConditionsModel.findOne();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
 

//✅ Update Terms and Conditions
const updateTerms = async (req, res) => {
  const { description } = req.body;
  if (isEmpty(description)) {
    return res.status(400).json({ error: "Description is required" });
  }
 
  try {
    const updated = await TermsAndConditionsModel.findOneAndUpdate(
      {},
      { description },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
 

//✅ Create Privacy Policy
const createPrivacy = async (req, res) => {
  const { description } = req.body;
  if (isEmpty(description)) {
    return res.status(400).json({ error: "Description is required" });
  }
 
  try {
    const exists = await PrivacyPolicyModel.findOne();
    if (exists)
      return res.status(400).json({ error: "Privacy policy already exists" });
 
    const data = await PrivacyPolicyModel.create({ description });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
 

//✅ Get Privacy Policy
const getPrivacy = async (req, res) => {
  try {
    const data = await PrivacyPolicyModel.findOne();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
 
//✅ Update Privacy Policy
const updatePrivacy = async (req, res) => {
  const { description } = req.body;
  if (isEmpty(description)) {
    return res.status(400).json({ error: "Description is required" });
  }
 
  try {
    const updated = await PrivacyPolicyModel.findOneAndUpdate(
      {},
      { description },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


//✅ Create About Us
const createAboutUs = async (req, res) => {
  const { description } = req.body;
  let images = [];
  if (req.files && req.files.length > 0) {
    images = req.files.map((file) => file.path);
  }
  if (isEmpty(description)) {
    return res.status(400).json({ error: "Description is required" });
  }
 
  try {
    const exists = await AboutUsModel.findOne();
    if (exists)
      return res.status(400).json({ error: "About Us already exists" });
 
    const data = await AboutUsModel.create({ description, images });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
 
//✅ Get About Us
const getAboutUs = async (req, res) => {
  try {
    const data = await AboutUsModel.findOne();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
 
//✅ Update About Us
const updateAboutUs = async (req, res) => {
  const { description } = req.body;
 
  let images = [];
  if (req.files && req.files.length > 0) {
    images = req.files.map((file) => file.path);
  }
  if (isEmpty(description)) {
    return res.status(400).json({ error: "Description is required" });
  }
 
  try {
    const updated = await AboutUsModel.findOneAndUpdate(
      {},
      { description, images },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

 
 
module.exports = {
  createEmergencyFee,
  getEmergencyFee,
  updateEmergencyFee,
  createTerms,
  getTerms,
  updateTerms,
  createPrivacy,
  getPrivacy,
  updatePrivacy,
  createAboutUs,
  getAboutUs,
  updateAboutUs,
};