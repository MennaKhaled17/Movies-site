const express=require('express');
const router=express.Router();
const adminController=require('../controllers/adminController');

router.get('/search', adminController.admin_get);
router.get('/', adminController.admin_get);
router.patch('/deactivated/:_id', adminController.deactivate_user);
router.patch('/update/:_id', adminController.update_user);
module.exports = router;

