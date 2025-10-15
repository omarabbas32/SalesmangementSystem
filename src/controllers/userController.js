// src/controllers/userController.js
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel'); // We still need this for the JWT structure

// Path to your local JSON database
const usersFilePath = path.join(__dirname, '..', '..', 'data', 'users.json');

// Helper function to read users from JSON file
const readUsers = () => {
    const data = fs.readFileSync(usersFilePath);
    return JSON.parse(data);
};

// Helper function to write users to JSON file
const writeUsers = (users) => {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

// Helper function to generate JWT
const generateToken = (id, role) => {
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    console.log('SECRET USED FOR SIGNING present?:', !!process.env.JWT_SECRET);
    return jwt.sign({ id, role }, secret, {
        expiresIn,
    });
};

// @desc   Register a new user to the JSON file
const registerUser = async (req, res) => {
    const { username, password, role } = req.body;

    try {
        const users = readUsers();

        // Check if user already exists in the JSON file
        const userExists = users.find(u => u.username === username);
        if (userExists) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user object
        const newUser = {
            _id: `local_${Date.now()}`, // Create a temporary local ID
            username,
            password: hashedPassword,
            role: role || 'User',
            createdAt: new Date().toISOString(),
        };

        // Add to users array and write back to file
        users.push(newUser);
        writeUsers(users);
        
        res.status(201).json({ message: 'User registered to local file successfully. Awaiting sync to database.' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc   Login a user by checking the JSON file
const loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        const users = readUsers();
        const user = users.find(u => u.username === username);

        // NOTE: This only checks the JSON file. If a user exists in the main DB
        // but not this file, login will fail.
        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials from local file' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc   Delete a user from the JSON file
const deleteUser = async (req, res) => {
    try {
        let users = readUsers();
        const userIndex = users.findIndex(u => u._id === req.params.id);

        if (userIndex > -1) {
            users.splice(userIndex, 1); // Remove user from array
            writeUsers(users);
            res.json({ message: 'User removed from local file. Awaiting sync.' });
        } else {
            res.status(404).json({ message: 'User not found in local file' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    deleteUser,
};