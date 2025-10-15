// src/models/userModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please add a username'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
    },
    role: {
        type: String,
        required: true,
        enum: ['User', 'Admin'], // The role must be one of these values
        default: 'User',
    },
}, {
    timestamps: true, // Automatically adds 'createdAt' and 'updatedAt' fields
});

// This code runs *before* a user document is saved
userSchema.pre('save', async function (next) {
    // We only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }
    
    // Generate a "salt" and hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Add a method to the user schema to compare entered password with the stored hash
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);