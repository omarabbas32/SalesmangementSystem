// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('../models/userModel');

// Path to your local JSON database for users
const usersFilePath = path.join(__dirname, '..', '..', 'data', 'users.json');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            let user;
            // Check if the ID from the token is a valid MongoDB ObjectId
            if (mongoose.Types.ObjectId.isValid(decoded.id)) {
                // --- ONLINE PATH ---
                // It's a real ObjectId, so search the main database
                user = await User.findById(decoded.id).select('-password');
            } else {
                // --- OFFLINE PATH ---
                // It's a temporary local ID, so search the JSON file
                const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
                user = users.find(u => u._id === decoded.id);
                if (user) {
                    // Remove password for security
                    delete user.password;
                }
            }

            if (!user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            req.user = user;
            next();

        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: `User role '${req.user.role}' is not authorized` });
        }
        next();
    };
};

module.exports = { protect, authorize };