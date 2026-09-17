const jwt = require('jsonwebtoken');
const { User, EmailTemplate } = require('../models');

const signToken = (id) => {
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_leadflow_production_2026_change_me';
  return jwt.sign({ id }, secret, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    // Seed helpful default email templates for the new user
    await EmailTemplate.create([
      {
        userId: user._id,
        name: 'Website Pitch for Local Business',
        subject: 'Website for {{business_name}}',
        body: `Hi {{contact_name}},

I noticed that {{business_name}} in {{city}} currently doesn't have an active website.

I build modern, high-converting websites for local businesses and would be happy to design a preview site tailored to {{business_name}}.

Would you be open to a quick 5-minute chat this week?

Best regards,
{{sender_name}}`,
        variables: ['business_name', 'contact_name', 'category', 'city', 'sender_name'],
        isDefault: true,
      },
      {
        userId: user._id,
        name: 'Follow-up Check-in',
        subject: 'Quick follow-up regarding website for {{business_name}}',
        body: `Hi {{contact_name}},

Just following up on my previous note regarding a modern web presence for {{business_name}}.

Many potential customers in {{city}} search online before visiting local businesses. Having a fast mobile-friendly site can significantly boost your customer inquiries.

Let me know if you'd like to see a free design mockup.

Regards,
{{sender_name}}`,
        variables: ['business_name', 'contact_name', 'category', 'city', 'sender_name'],
        isDefault: false,
      },
    ]);

    const token = signToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dailyEmailLimit: user.dailyEmailLimit,
        emailsSentToday: user.emailsSentToday,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error registering user',
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = signToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dailyEmailLimit: user.dailyEmailLimit,
        emailsSentToday: user.emailsSentToday,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error logging in',
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        dailyEmailLimit: req.user.dailyEmailLimit,
        emailsSentToday: req.user.emailsSentToday,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving user',
    });
  }
};

// @desc    Forgot password simulation/token endpoint
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your account email.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Return 200 to prevent user enumeration
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, reset instructions have been dispatched.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset link simulated. In production, an email with a secure reset token is dispatched.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error processing password reset',
    });
  }
};

// @desc    Update user profile & daily limit
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, dailyEmailLimit } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (dailyEmailLimit !== undefined) {
      const limit = Number(dailyEmailLimit);
      if (limit < 1 || limit > 500) {
        return res.status(400).json({
          success: false,
          message: 'Daily email limit must be between 1 and 500.',
        });
      }
      updates.dailyEmailLimit = limit;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dailyEmailLimit: user.dailyEmailLimit,
        emailsSentToday: user.emailsSentToday,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating profile',
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  updateProfile,
};

