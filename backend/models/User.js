const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    default: null
  },
  googleId: {
    type: String,
    default: null
  },
  profilePicture: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: ''
  },
  streak: {
    type: Number,
    default: 0
  },
  lastPostDate: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
