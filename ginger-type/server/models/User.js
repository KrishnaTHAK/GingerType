const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username:          { type: String, unique: true, trim: true },
    email:             { type: String, required: true, unique: true, trim: true },
    password:          { type: String },
    googleId:          { type: String },
    bestWPM:           { type: Number, default: 0 },
    avatarUrl:         { type: String, default: '' },
    isVerified:        { type: Boolean, default: false },
    verificationToken: { type: String },
    resetToken:        { type: String },
    resetTokenExpiry:  { type: Date }
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)