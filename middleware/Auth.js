const jwt= require('jsonwebtoken');
const userModel=require('../models/Schema');

const requireAuth=(req,res,next)=>{
	const secret=process.env.secret;
	const token=req.cookies.jwt;
	//check jwt if exist and verified
	if(token){
		jwt.verify(token,secret,(err,decodedToken)=>{
			if(err){
				console.log(err.message)
				res.redirect('/login');
			}else{
				console.log(decodedToken);
				next();
			}
		})
	}else{
		res.redirect('/login');
	}
}
// check current user
const checkUser = (req, res, next) => {
	const token = req.cookies.jwt;
	const secret=process.env.JWT_SECRET;
	if (token) {
	  jwt.verify(token, secret, async (err, decodedToken) => {
		if (err) {
		  res.locals.user = null;
		  next();
		} else {		  
		  let user = await userModel.findById(decodedToken.id);
		  res.locals.user = user;
		  next();
		}
	  });
	} else {
	  res.locals.user = null;
	  next();
	}
  };
  module.exports = { requireAuth, checkUser };
