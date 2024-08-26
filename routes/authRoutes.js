const express=require('express');
const router=express.Router();
const authController=require('../controllers/authController')

// router.get('/signup', authController.signup_get);
// router.post('/signup', authController.signup_post);
// router.get('/login',authController.login_get);
router.post('/login', authController.login_post);
router.get('/logout',authController.logout_get);
router.post('/check-email', authController.check_email);
router.post('/verify-otp', authController.verify_otp);
router.post('/reset-password', authController.reset_pass);
router.get('/admin', authController.admin_get)

module.exports = router;
