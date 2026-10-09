import mongoose from 'mongoose';

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['login', 'register'],
    default: 'login'
  },
  userData: {
    name: String,
    phone: String,
    password: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // 10 minutes TTL
  }
});

export default mongoose.models.OTP || mongoose.model('OTP', OTPSchema);
