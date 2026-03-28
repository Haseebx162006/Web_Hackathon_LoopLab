const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide a name'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Please provide an email'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Please provide a password'],
            minlength: 6,
        },
        role: {
            type: String,
            enum: ['buyer', 'seller', 'admin'],
            default: 'buyer',
        },
    },
    { 
        timestamps: true // Automatically adds createdAt and updatedAt fields
    }
);

module.exports = mongoose.model('User', userSchema);
