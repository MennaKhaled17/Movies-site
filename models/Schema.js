const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    firstname: {
      type: String,
      required: true
    },
    lastname: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    role:{
      type:String,
      enum:["user","admin"],
      default:"user",

    },
    resetToken: { type: String }, // Field to store the OTP hash
    
    resetTokenExpiry: { type: Date }, // Field to store OTP expiry time
    profileImage:{ type: String },

    });
  const User = mongoose.model('User', userSchema); //hsmy al usersachema user dah asm al model

  module.exports = User;