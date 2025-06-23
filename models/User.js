const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Make sure bcryptjs is in package.json dependencies

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  phone: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  referralCode: { type: String, unique: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  referralCount: { type: Number, default: 0 },
  creditScore: { type: Number, default: 0 }, // Initial credit score
  kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  accountStatus: { type: String, enum: ['active', 'suspended', 'closed'], default: 'active' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook to hash password and generate referral code
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  if (!this.referralCode) {
    this.referralCode = User.generateReferralCode(); // Ensure static method is available
  }
  this.updatedAt = Date.now();
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method to generate a unique referral code (example)
userSchema.statics.generateReferralCode = function() {
  // Simple example: could be more robust to ensure uniqueness if necessary
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
