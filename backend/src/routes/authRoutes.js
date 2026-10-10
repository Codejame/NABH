import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import User from '../models/User.js';
import Order from '../models/Order.js';
import OTP from '../models/OTP.js';
import { sendOTPEmail } from '../services/emailService.js';
import { generateToken, verifyToken } from '../lib/authMiddleware.js';

const router = express.Router();

// Helper to ensure admin exists with environment credentials
export const ensureAdminAccount = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.toLowerCase().trim() : 'admin@nabhwear.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
    
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        name: 'NABH Store Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        phone: '9999999999'
      });
      console.log(`[Auth] Admin account created for: ${adminEmail}`);
    } else {
      let changed = false;
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        changed = true;
      }
      const isMatch = await existingAdmin.comparePassword(adminPassword);
      if (!isMatch) {
        existingAdmin.password = adminPassword;
        changed = true;
      }
      if (changed) {
        await existingAdmin.save();
        console.log(`[Auth] Synced admin account credentials for: ${adminEmail}`);
      }
    }
  } catch (err) {
    console.error('[Auth] Error ensuring admin account:', err.message);
  }
};

// Run check on startup
ensureAdminAccount();

/**
 * @route POST /api/auth/register
 * @desc Register a new customer
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone ? phone.trim() : '',
      role: 'customer'
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[Auth Register Error]:', error);
    res.status(500).json({ message: 'Registration failed. Please try again.', error: error.message });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login user (customer or admin)
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, requiredRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // If login was initiated from admin portal specifically
    if (requiredRole === 'admin' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. This account does not have admin permissions.' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[Auth Login Error]:', error);
    res.status(500).json({ message: 'Login failed. Please try again.', error: error.message });
  }
});

/**
 * @route POST /api/auth/google
 * @desc Authenticate or register customer via Google OAuth
 */
router.post('/google', async (req, res) => {
  try {
    const { credential, email: bodyEmail, name: bodyName, googleId: bodyGoogleId, avatar: bodyAvatar } = req.body;

    let email = bodyEmail;
    let name = bodyName;
    let googleId = bodyGoogleId;
    let avatar = bodyAvatar || '';

    // If Google ID token (credential) is provided, verify it with Google's tokeninfo API
    if (credential) {
      try {
        const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        const payload = googleRes.data;

        if (!payload || !payload.email) {
          return res.status(400).json({ message: 'Invalid Google credential.' });
        }

        email = payload.email;
        name = payload.name || payload.given_name || email.split('@')[0];
        googleId = payload.sub;
        avatar = payload.picture || '';
      } catch (tokenErr) {
        console.error('[Google Auth Verify Error]:', tokenErr.response?.data || tokenErr.message);
        if (!email) {
          return res.status(401).json({ message: 'Google authentication verification failed. Please try again.' });
        }
      }
    }

    if (!email) {
      return res.status(400).json({ message: 'Email could not be retrieved from Google.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      let modified = false;
      if (!user.googleId && googleId) {
        user.googleId = googleId;
        modified = true;
      }
      if (!user.avatar && avatar) {
        user.avatar = avatar;
        modified = true;
      }
      if (modified) {
        await user.save();
      }
    } else {
      // Create new customer account
      user = await User.create({
        name: name ? name.trim() : normalizedEmail.split('@')[0],
        email: normalizedEmail,
        googleId: googleId || `google_${Date.now()}`,
        avatar: avatar || '',
        role: 'customer'
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Logged in with Google successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[Auth Google Error]:', error);
    res.status(500).json({ message: 'Google authentication failed. Please try again.', error: error.message });
  }
});

/**
 * @route POST /api/auth/send-otp
 * @desc Generate and send 6-digit OTP to user's email
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { email, purpose = 'login', name, phone, password } = req.body;

    if (!email || !/\S+@\S+\.\S+/.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check user existence
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (purpose === 'register' && existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please sign in instead.'
      });
    }

    const isNewUser = !existingUser;

    // If new user, purpose is 'register'; if existing, purpose is 'login'
    const effectivePurpose = isNewUser ? 'register' : 'login';

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any previous pending OTP for this email
    await OTP.deleteMany({ email: normalizedEmail });

    // Save new OTP record
    await OTP.create({
      email: normalizedEmail,
      otp,
      purpose: effectivePurpose,
      userData: {
        name: name?.trim() || (isNewUser ? normalizedEmail.split('@')[0] : existingUser?.name || ''),
        phone: phone?.trim() || existingUser?.phone || '',
        password: password || ''
      }
    });

    // Send live email via nodemailer
    const emailResult = await sendOTPEmail(normalizedEmail, otp, effectivePurpose);

    if (!emailResult.success || emailResult.emailSent === false) {
      console.error('[Send OTP SMTP Failure]:', emailResult.error || emailResult.note);
      if (emailResult.error) {
        return res.status(500).json({
          success: false,
          message: `Email delivery error: ${emailResult.error}. Please check your Gmail SMTP App Password.`
        });
      }
    }

    const message = isNewUser
      ? `Welcome to NABH Wear! A 6-digit verification code has been sent to ${normalizedEmail}.`
      : `A 6-digit verification code has been sent to ${normalizedEmail}.`;

    res.json({
      success: true,
      message,
      email: normalizedEmail,
      purpose: effectivePurpose,
      isNewUser,
      emailSent: true
    });
  } catch (error) {
    console.error('[Send OTP Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to send verification code. Please try again.', error: error.message });
  }
});

/**
 * @route POST /api/auth/verify-otp
 * @desc Verify OTP and log in / register customer
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and 6-digit OTP are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    // Find valid OTP record
    const otpRecord = await OTP.findOne({
      email: normalizedEmail,
      otp: cleanOtp
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please check the code or request a new one.'
      });
    }

    let user = await User.findOne({ email: normalizedEmail });
    const wasNew = !user;

    if (!user) {
      // Auto-create account for new person with their chosen password!
      user = await User.create({
        name: otpRecord.userData?.name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        phone: otpRecord.userData?.phone || '',
        password: otpRecord.userData?.password || crypto.randomBytes(16).toString('hex'),
        role: 'customer'
      });
      console.log(`[Auth] New customer account created via OTP: ${normalizedEmail}`);
    } else {
      if (otpRecord.userData?.password) {
        user.password = otpRecord.userData.password;
      }
      if (otpRecord.userData?.name && user.name === normalizedEmail.split('@')[0]) {
        user.name = otpRecord.userData.name;
      }
      if (otpRecord.userData?.phone && !user.phone) {
        user.phone = otpRecord.userData.phone;
      }
      await user.save();
    }

    // Clean up used OTP
    await OTP.deleteMany({ email: normalizedEmail });

    const token = generateToken(user);

    res.json({
      success: true,
      message: wasNew ? 'Welcome to NABH Wear! Your account has been created.' : 'Signed in successfully.',
      token,
      isNewUser: wasNew,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[Verify OTP Error]:', error);
    res.status(500).json({ success: false, message: 'Verification failed. Please try again.', error: error.message });
  }
});

/**
 * @route GET /api/auth/me
 * @desc Get current authenticated user details and recent orders
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    // Fetch customer's orders
    const orders = await Order.find({
      $or: [
        { 'customer.email': req.user.email },
        { 'customer.phone': req.user.phone && req.user.phone.length > 5 ? req.user.phone : '__none__' }
      ]
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        addresses: req.user.addresses || []
      },
      orders
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve profile data.', error: error.message });
  }
});

/**
 * @route PUT /api/auth/profile
 * @desc Update customer profile details (name, phone)
 */
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (name) req.user.name = name.trim();
    if (phone !== undefined) req.user.phone = phone.trim();

    await req.user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        addresses: req.user.addresses || []
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile.', error: error.message });
  }
});

/**
 * @route POST /api/auth/address
 * @desc Add a new delivery address
 */
router.post('/address', verifyToken, async (req, res) => {
  try {
    const { tag = 'Home', name, phone, streetAddress, city, state, pincode, isDefault = false } = req.body;

    if (!streetAddress || !city || !state || !pincode) {
      return res.status(400).json({ message: 'Street address, city, state, and pincode are required.' });
    }

    if (isDefault) {
      req.user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    // If first address, make it default automatically
    const makeDefault = isDefault || req.user.addresses.length === 0;

    req.user.addresses.push({
      tag,
      name: name || req.user.name,
      phone: phone || req.user.phone,
      streetAddress,
      city,
      state,
      pincode,
      country: 'India',
      isDefault: makeDefault
    });

    await req.user.save();

    res.json({
      success: true,
      message: 'Address added successfully.',
      addresses: req.user.addresses
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add address.', error: error.message });
  }
});

/**
 * @route PUT /api/auth/address/:addressId
 * @desc Update an existing address
 */
router.put('/address/:addressId', verifyToken, async (req, res) => {
  try {
    const { addressId } = req.params;
    const { tag, name, phone, streetAddress, city, state, pincode, isDefault } = req.body;

    const address = req.user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: 'Address not found.' });
    }

    if (isDefault) {
      req.user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    if (tag) address.tag = tag;
    if (name !== undefined) address.name = name;
    if (phone !== undefined) address.phone = phone;
    if (streetAddress) address.streetAddress = streetAddress;
    if (city) address.city = city;
    if (state) address.state = state;
    if (pincode) address.pincode = pincode;
    if (isDefault !== undefined) address.isDefault = isDefault;

    await req.user.save();

    res.json({
      success: true,
      message: 'Address updated successfully.',
      addresses: req.user.addresses
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update address.', error: error.message });
  }
});

/**
 * @route DELETE /api/auth/address/:addressId
 * @desc Delete an address
 */
router.delete('/address/:addressId', verifyToken, async (req, res) => {
  try {
    const { addressId } = req.params;
    req.user.addresses.pull({ _id: addressId });

    // If deleted address was default and other addresses exist, set first as default
    if (req.user.addresses.length > 0 && !req.user.addresses.some((a) => a.isDefault)) {
      req.user.addresses[0].isDefault = true;
    }

    await req.user.save();

    res.json({
      success: true,
      message: 'Address removed.',
      addresses: req.user.addresses
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete address.', error: error.message });
  }
});

/**
 * @route PUT /api/auth/address/:addressId/default
 * @desc Set an address as default
 */
router.put('/address/:addressId/default', verifyToken, async (req, res) => {
  try {
    const { addressId } = req.params;
    let found = false;

    req.user.addresses.forEach((addr) => {
      if (addr._id.toString() === addressId) {
        addr.isDefault = true;
        found = true;
      } else {
        addr.isDefault = false;
      }
    });

    if (!found) {
      return res.status(404).json({ message: 'Address not found.' });
    }

    await req.user.save();

    res.json({
      success: true,
      message: 'Default address updated.',
      addresses: req.user.addresses
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to set default address.', error: error.message });
  }
});

/**
 * @route POST /api/auth/init-admin
 * @desc Explicitly trigger admin seed if needed
 */
router.post('/init-admin', async (req, res) => {
  try {
    await ensureAdminAccount();
    res.json({ success: true, message: 'Admin check completed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error initializing admin', error: error.message });
  }
});

export default router;
