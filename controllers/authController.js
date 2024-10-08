const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userModel = require('../models/Schema');
const nodemailer = require('nodemailer');


require('dotenv').config()

const maxAge = 3 * 24 * 60 * 60;
const secret = process.env.JWT_SECRET;
const createToken = (id) => {
  return jwt.sign({ id }, secret, { expiresIn: maxAge });
}
const MAX_LOGIN_ATTEMPTS = 3;
const LOCK_TIME = 15 * 60 * 1000; // Lock for 15 minutes

module.exports = {
  login_post: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await userModel.findOne({ email });

      if (!user) {
        // Email not found, redirect with error message
        return res.redirect('/login?error=Email not registered');
      }

      // Check if user is locked out
      if (user.lockUntil && user.lockUntil > Date.now()) {
        return res.redirect('/login?error=Account locked. Try again later.');
      }

      // Check password
      const isPasswordCorrect = bcrypt.compareSync(password, user.password);

      if (isPasswordCorrect) {
        // Reset login attempts and lockUntil fields on successful login
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        return res.redirect('/?message=Login successful!');
      } else {
        // Increment login attempts
        user.loginAttempts = (user.loginAttempts || 0) + 1;

        // Lock the account if max attempts are reached
        if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
          user.lockUntil = Date.now() + LOCK_TIME;
        }

        await user.save();

        const remainingAttempts = MAX_LOGIN_ATTEMPTS - user.loginAttempts;
        const errorMessage = remainingAttempts > 0
          ? `Incorrect password. You have ${remainingAttempts} attempts left.`
          : 'Maximum attempts exceeded. Please try again later.';

        return res.redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
      }
    } catch (error) {
      console.error('Error during login:', error);
      res.redirect('/login?error=Server error, please try again.');
    }
  },

  logout_get: (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.redirect('/');
  },

  // admin get
  admin_get: async (req, res) => {
    try {
      // Assuming `req.user` contains the current user object from your authentication middleware
      const user = res.locals.user;

      if (user && user.role === 'admin') {
        // Retrieve all users directly within this function
        const users = await userModel.find().exec(); // Retrieve all users from the database
        // Render the admin page with the users data
        return res.render('admin', { users }); // Ensure 'admin' view is correctly configured in your view engine
      } else {
        console.log('User role:', user ? user.role : 'No user found');
        // Render the unauthorized page
        return res.render('unauthorized'); // Ensure 'unauthorized' view is correctly configured in your view engine
      }
    } catch (error) {
      x
      // Handle any errors that occur
      console.error('Error handling unauthorized access:', error);
      return res.status(500).send('Internal Server Error');
    }
  },

  // checking email for otp
  check_email: async (req, res) => {
    const email = req.body.email;

    try {
      const user = await userModel.findOne({ email });

      if (user) {
        const otp = crypto.randomBytes(3).toString('hex');
        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

        user.resetToken = otpHash;
        user.resetTokenExpiry = Date.now() + 86400000; // 1 day validity
        await user.save();

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          },
        });

        const mailOptions = {
          to: email,
          from: process.env.EMAIL_USER,
          subject: 'Password Reset OTP',
          text: `Your OTP for password reset is: ${otp}`
        };

        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email}: ${otp}`);

        res.json({ success: true, message: 'OTP sent to your email.' });
      } else {
        res.json({ success: false, message: 'No user found with this email.' });
      }
    } catch (error) {
      console.error('Error in check_email:', error);
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  },

  verify_otp: async (req, res) => {
    const { email, otp } = req.body;

    try {
      const user = await userModel.findOne({ email });

      if (!user || !user.resetToken || Date.now() > user.resetTokenExpiry) {
        return res.json({ success: false, message: 'Invalid or expired OTP.' });
      }

      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
      if (otpHash === user.resetToken) {
        // OTP verified successfully
        res.json({ success: true, message: 'OTP verified.' });
      } else {
        // OTP verification failed
        res.json({ success: false, message: 'Invalid OTP.' });
      }
    } catch (error) {
      console.error('Error in verify_otp:', error);
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  },

  reset_pass: async (req, res) => {
    const { email, newPassword } = req.body;
    try {
      const user = await userModel.findOne({ email });

      if (!user || !user.resetToken) {
        return res.json({ success: false, message: 'Password reset failed. Please try again.' });
      }

      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      user.password = hashedPassword;
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      await user.save();

      res.json({ success: true, message: 'Password reset successfully.' });
    } catch (error) {
      console.error('Error in reset_pass:', error);
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  },


}