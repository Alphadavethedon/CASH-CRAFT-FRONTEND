const jwt = require('jsonwebtoken');
const User = require('../models/User');
// const { auth } = require('../middleware/auth'); // This line seems to be an attempt to import itself or is mixed up. The auth middleware is defined below.
// const { router } = require('../node'); // This is incorrect and router is defined below.
// Malformed line was here, it's now split and corrected.
// const authHeader = "Basic " + Buffer.from(`${process.env.SAFARICOM_CONSUMER_KEY}:${process.env.SAFARICOM_CONSUMER_SECRET}`).toString("base64"); // Removed as unused in this file.
const { validateRequest, registerSchema, loginSchema } = require('../middleware/validation');
// Removed duplicate: const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// module.exports = auth; // Exporting router at the end, which includes all routes and uses this auth middleware.

// const jwt = require('jsonwebtoken'); // This was a duplicate
const router = (require('express')).Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRequest(registerSchema), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, referralCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    // Handle referral
    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        referredBy = referrer._id;
        referrer.referralCount += 1;
        referrer.creditScore += 10; // Bonus for referral
        await referrer.save();
      }
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      password,
      referredBy
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        creditScore: user.creditScore,
        kycStatus: user.kycStatus,
        referralCode: user.referralCode
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateRequest(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check account status
    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended or closed'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        creditScore: user.creditScore,
        kycStatus: user.kycStatus,
        role: user.role,
        referralCode: user.referralCode
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', auth, async (req, res) => { // The 'auth' middleware (defined above) is used here
  try {
    const user = await User.findById(req.user._id) // Assuming req.user._id is populated by auth middleware
      .select('-password')
      .populate('referredBy', 'firstName lastName');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/refresh-token
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh-token', auth, async (req, res) => { // The 'auth' middleware is used here
  try {
    const token = generateToken(req.user._id); // Assuming req.user._id is populated by auth middleware

    res.json({
      success: true,
      token
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate token)
// This route is defined in comments but not implemented. If needed, it should be implemented.
// router.post('/logout', auth, (req, res) => {
//   // For JWT, logout is typically handled client-side by deleting the token.
//   // If using a token blacklist or server-side sessions, invalidate here.
//   res.json({ success: true, message: 'Logged out successfully' });
// });

module.exports = router;
