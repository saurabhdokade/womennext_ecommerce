const mongoose = require("mongoose");
 
const BannerSchema = new mongoose.Schema({
  
  bannerNo: {
    type: String,
    unique: true
  },
  images:{
    type:[String],
    required:true
  },
  title:{
    type:String,
    required:true
  },
  description:{
    type:String,
    required:true
  }
},
  { timestamps: true }
);
 
module.exports = mongoose.model("Banner", BannerSchema);