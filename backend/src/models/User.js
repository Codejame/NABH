import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      minlength: 6
    },
    googleId: {
      type: String,
      default: null
    },
    avatar: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer'
    },
    addresses: [
      {
        tag: { type: String, default: 'Home' }, // 'Home', 'Work', 'Other'
        name: { type: String, default: '' },
        phone: { type: String, default: '' },
        streetAddress: String,
        city: String,
        state: String,
        pincode: String,
        country: { type: String, default: 'India' },
        isDefault: { type: Boolean, default: false }
      }
    ]
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to verify password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
