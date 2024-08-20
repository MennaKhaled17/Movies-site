const jwt= require('jsonwebtoken');
const bcrypt=require('bcryptjs');
const userModel=require('../models/Schema');
require('dotenv').config()

const maxAge=3*24*60*60;
const secret=process.env.JWT_SECRET;
const createToken=(id)=>{
    return jwt.sign({id},secret,{expiresIn: maxAge});
}
//sign up
module.exports={
//     signup_get: (req, res) => {
//         res.render('signup', { title: 'Sign up' ,error:'.'});
//     },
//     signup_post: async(req, res) => {
// 	    try {
//             const password =req.body.password;
//             if(password.length<6||password.length>16){
//                 res.render('signup', { title: 'Sign up',error: 'Password should be at least 6 characters long and no more than 16 characters.' });
//             }
//             //Create a new user using the User model
//             const newUser = new userModel({
//                 name:req.body.name,
//                 email:req.body.email,
//                 password:bcrypt.hashSync(password,10)
//             });
//             // Save the new user to the database
//             await newUser.save();
//             console.log('User saved');
//             //token
//             const token=createToken(newUser._id);
//             res.cookie('jwt',token,{httpOnly:true,maxAge:maxAge*1000});
//             console.log(newUser._id);
//             // Redirect to a success page or login page
//             res.redirect('/');
//         } catch (err) {
//             console.error('Error during sign-up:', err.message);
//             if (err.code === 11000) {
//                 // Handle duplicate email error
//                 res.render('signup', { title: 'Sign up',error: 'This email is already registered.' });
//             } else {
//                 // Handle other errors
//                 const errorMessage=err.message;
//                 emailError=errorMessage.split(" ");
//                 res.render('signup', {title: 'Sign up', error: emailError.slice(4).join(" ")});
//             }
//         }
//     },
// //login
//     login_get: (req, res) => {
//         res.render('login', { title: 'Log in' ,error:'.'});
//     },
    login_post: async(req, res) => {
        const user = await userModel.findOne({ email: req.body.email });
        
        if (user && bcrypt.compareSync(req.body.password, user.password)) {
            const token=createToken(user._id);
            res.cookie('jwt',token,{httpOnly:true,maxAge:maxAge*1000});
            console.log("User authenticated", token);
            res.redirect('/');
        }else if (!user) {	
            //res.render('login', { title: 'Log in',error:'Email not registered'});
            console.log("User not found");
        } else {
            console.log("Invalid credentials");
            //res.render('login', { title: 'Log in',error:'Incorrect password'});
        }
    },
//logout
    logout_get:(req,res)=>{
        res.cookie('jwt','',{maxAge:1});
        res.redirect('/')
    }
}
