// Requiring Modules
const http = require('http');
const url = require('url');
const express = require('express');
const path = require('path');
const axios = require('axios');
const { render } = require('ejs');
const { getCountries } = require('country-state-picker');
const app = express();
const cookieParser = require('cookie-parser');
const { requireAuth, checkUser } = require('./middleware/Auth.js');
const mongoose = require("mongoose");
const usermodel = require('./models/Schema');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
require('dotenv').config();
const authRoutes=require('./routes/authroutes');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// API Data
const API_KEY = '2306111c328b44f1be3d16ba83e418a6';
const BASE_URL = 'https://api.themoviedb.org/3';

// Setting public folder
app.use(express.static(path.join(__dirname, 'public')));

// Setting views folder
app.set('view engine', 'ejs');
app.set('views', 'views');


// Middleware to parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Connecting to MongoDB
const uri = "mongodb+srv://menakhaled:menakhaled@cluster0.klteank.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";



//DB connection
const connectDB = async () => {
  console.log('Attempting to connect to MongoDB...');
  try {
    await mongoose.connect(uri);
     await usermodel.updateMany(
      { role: { $exists: false } }, // Match documents without the 'role' field
      { $set: { role: 'user' } } // Set default role value
    );
    

    console.log('Migration complete.');
    console.log('MongoDB connected...');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  }
};

app.get('*', checkUser);
app.post('*', checkUser);
app.use('/',authRoutes);

// Authentication Middleware
// function authenticateToken(req, res, next) {
//   const token = req.query.token || req.headers['authorization'];

//   if (!token) {
//     return res.redirect('/login?error=Access%20denied.%20Please%20login%20first.');
//   }

//   jwt.verify(token, 'mena1234', (err, user) => {
//     if (err) {
//       console.error('Token verification failed:', err);
//       return res.redirect('/login?error=Invalid%20token.%20Please%20login%20again.');
//     }
//     req.user = user; // Attach the decoded user to the request
//     next(); // Proceed to the next middleware or route handler
//   });
// }

module.exports = connectDB();




// Routing
app.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1; // Current page number
    const limit = 10; // Number of items per page

    const response = await axios.get(`${BASE_URL}/movie/popular`, {
      params: {
        api_key: API_KEY,
        page: page, // Include page number in the API request
      },
    });

    const movies = response.data.results; // All movies from API
    const totalMovies = response.data.total_results; // Total movies from API
    const totalPages = Math.ceil(totalMovies / limit); // Calculate total pages

    // Slice the array to get the movies for the current page
    const paginatedMovies = movies.slice((page - 1) * limit, page * limit);

    res.render('index', {
      movies: paginatedMovies,
      totalMovies,
      page,
      totalPages,
      query: null,
      user: res.locals.user // Include user data here
    });
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    res.render('index', {
      movies: [],
      totalMovies: 0,
      page: 1,
      totalPages: 0,
      query: null,
      user: res.locals.user // Include user data here
    });
  }
});
// Route to search movies
app.get('/search', async (req, res) => {
  const query = req.query.q; // Query from the search bar
  if (!query) {
    return res.redirect('/'); // Redirect if no query is provided
  }

  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const response = await axios.get(`${BASE_URL}/search/movie`, {
      params: {
        api_key: API_KEY,
        query: query,
      },
    });

    const movies = response.data.results;
    const totalMovies = response.data.total_results;
    const totalPages = Math.ceil(totalMovies / pageSize);

    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalMovies);
    const paginatedMovies = movies.slice(startIndex, endIndex);

    res.render('index', { movies: paginatedMovies, totalMovies, page, totalPages, query: query, user: req.user });

  } catch (error) {
    console.error('Error searching for movies:', error);
    res.render('index', { movies: [], totalMovies: 0, page: 1, totalPages: 0, query: query, user: req.user });
  }
});

// Autocomplete route
app.get('/autocomplete', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.json([]);
  }

  try {
    const response = await axios.get(`${BASE_URL}/search/movie`, {
      params: {
        api_key: API_KEY,
        query: query,
      },
    });

    const movies = response.data.results
      .filter(movie => movie.poster_path)
      .slice(0, 10)
      .map(movie => ({ title: movie.title }));

    res.json(movies);
  } catch (error) {
    console.error('Error during autocomplete:', error);
    res.json([]);
  }
});

// Movie details route
app.get('/details/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const response = await axios.get(`${BASE_URL}/movie/${id}`, {
      params: {
        api_key: API_KEY, 
      },
    });
    const movie = response.data;
    res.render('details', { movie, user: req.user });
  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.render('details', { movie: null, user: req.user });
  }
});

// Registration route
app.get('/register', (req, res) => {
  const { message, messageType } = req.query;
  res.render('register', { message: message || '', messageType: messageType || 'success' });
});


app.get('/countries', (req, res) => {
  const countrylist = Object.values(countries).map(country => {
    country.name
  });
  res.json(countrylist);

})
app.get("/login", async (req, res) => {
  res.render('login');
})

app.post('/Register', async (req, res) => {
  const { firstname, lastname, email, password, country, phone, role, active } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 6);
    const userRole = role || 'user'
    const user = new usermodel({
      firstname,
      lastname,
      email,
      password: hashedPassword,
      country,
      phone,
      role: userRole,

      active: { type: Boolean, default: true }
    });



    await user.save();
    console.log('Saving user to the database...');

    // Redirect with success message
    res.redirect('/');
  } catch (error) {
    console.error('Error registering user:', error);
    res.redirect('/Register?message=Error%20registering%20user&messageType=error');
  }
});
app.get('/unauthorized',(req,res)=>{
  res.render('unauthorized');
})
// Login route
app.get("/Login", async (req, res) => {
  const { error } = req.query;
  res.render('Login', { error });

});


async function handleUnauthorizedAccess(req, res) {
  try {
    // Assuming `req.user` contains the current user object from your authentication middleware
    const user = res.locals.user; 

    if (user && user.role === 'admin') {
      // Render the admin page

      return res.render('admin', ); // Ensure 'admin' view is correctly configured in your view engine
    } else {
      console.log('User role:', user ? user.role : 'No user found');
      // Render the unauthorized page
      return res.render('unauthorized'); // Ensure 'unauthorized' view is correctly configured in your view engine
    }
  } catch (error) {
    // Handle any errors that occur
    console.error('Error handling unauthorized access:', error);
    return res.status(500).send('Internal Server Error');
  }
}

// Example protected route using the new middleware
// app.get('/admin', authenticateToken, handleUnauthorizedAccess, (req, res) => {
//   res.json({ message: 'This is a protected route.' }); // Only reaches here if the user is authorized
// });

// // Serve the unauthorized page
// app.get('/unauthorized', (req, res) => {
//   res.status(403).sendFile(__dirname + '/unauthorized.ejs'); // Render unauthorized page
// });




app.patch('/admin/deactivated/:_id', async (req, res) => {
  try {
    const idd = req.params._id;
    if (!mongoose.Types.ObjectId.isValid(idd)) {
      return res.status(400).json({ success: false, message: 'Invalid User ID' });
    }

    await usermodel.findByIdAndUpdate(idd, { active: false });
    res.json({ success: true, message: 'User deactivated successfully.' });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: 'Failed to deactivate user.' });
  }
});

app.patch('/admin/update/:_id', async (req, res) => {
  const { _id } = req.params;
  console.log("Received _id:", _id);  // Log the received _id

  const { firstname, lastname, country, phone, email, password } = req.body;

  try {
    const objectId = new mongoose.Types.ObjectId(_id);
    console.log("Querying with ObjectId:", objectId); // Log the ObjectId being queried

    // Fetch user by ObjectId
    const user = await usermodel.findById(objectId);
    if (!user) {
      console.log("User not found with ID:", _id);
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.firstname = firstname || user.firstname;
    user.lastname = lastname || user.lastname;
    user.country = country || user.country;
    user.phone = phone || user.phone;
    user.email = email || user.email;
    user.password = password || user.password;

    const updatedUser = await user.save();  // Save the updated user
    res.json({ success: true, message: 'User updated successfully.', updatedUser });
  } catch (error) {
    console.error("Update failed:", error.message);
    res.status(500).json({ success: false, message: 'Failed to update user. Error: ' + error.message });
  }
});

app.get('/admin', async (req, res) => {
  const searchQuery = req.query.email || '';
  try {
    const users = await usermodel.find({ email: { $regex: new RegExp(`^${searchQuery}$`, 'i') } });
    res.render('admin', { users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/changepassword', (req, res) => {
  res.render('changepassword'); // Render the change-password form
});

app.post('/changepassword', async (req, res) => {
  const { CurrentPassword, newPassword, confirmPassword } = req.body;
  const userId = usermodel.email; // Make sure you have user authentication in place

  if (newPassword !== confirmPassword) {
    return res.redirect('/changepassword?error=New%20passwords%20do%20not%20match.');
  }

  try {
    // Find the user
    const user = await usermodel.findOne(userId);
    if (!user) {
      return res.redirect('/changepassword?error=User%20not%20found.');
    }

    // Check if the old password is correct
    const isMatch = await bcrypt.compare(CurrentPassword, user.password);
    if (!isMatch) {
      return res.redirect('/changepassword?error=Old%20password%20is%20incorrect.');
    }

    // Hash the new password and update the user
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.redirect('/changepassword?message=Password%20updated%20successfully.');
  } catch (error) {
    console.error('Error:', error);
    res.redirect('/changepassword?error=An%20error%20occurred%20while%20changing%20the%20password.');
  }
});

module.exports = app;



app.get('/autocompletee', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.json([]);
  }

  try {
    const response = await usermodel.find({email});
     
  } catch (error) {
    console.error('Error during autocomplete:', error);
    res.json([]);
  }
 });
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/forgotpassword', (req, res) => {
  // const message = req.flash('error'); // or however you're setting the message
  res.render('forgotpassword');
});
// // Route for the index page
// app.get('/', (req, res) => {
//   res.render('index', {
//     isAdmin: req.user && req.user.role === 'admin' // Pass the admin status to the view
//   });
// });





// app.post('/forgotpassword', async (req, res) => {
//   try {
//       const { email, otp, newPassword, confirmPassword } = req.body;
//       const user = await usermodel.findOne({ email });

//       if (!user) {
//           return res.status(404).json({ error: 'No user found with this email' });
//       }

//       if (!otp) {
//           const generatedOtp = crypto.randomBytes(3).toString('hex');
//           user.resetToken = generatedOtp;
//           user.resetTokenExpiry = Date.now() + 3600000;
//           await user.save();

//           const transporter = nodemailer.createTransport({
//               service: 'gmail',
//               auth: {
//                   user: process.env.EMAIL_USER,
//                   pass: process.env.EMAIL_PASS
//               },
//               tls: {
//                 rejectUnauthorized: false // Only for testing, not recommended for production
//             }
//           });
//           console.log('EMAIL_USER:', process.env.EMAIL_USER);
// console.log('EMAIL_PASS:', process.env.EMAIL_PASS);


//           const mailOptions = {
//               to: email,
//               from: process.env.EMAIL_USER,
//               subject: 'Password Reset OTP',
//               text: `Your OTP for password reset is: ${generatedOtp}`
//           };

//           await transporter.sendMail(mailOptions);
//           return res.status(200).json({ message: 'OTP sent to your email' });
//       }

//       if (user.resetToken !== otp || Date.now() > user.resetTokenExpiry) {
//           return res.status(400).json({ error: 'Invalid or expired OTP' });
//       }

//       if (newPassword !== confirmPassword) {
//           return res.status(400).json({ error: 'Passwords do not match' });
//       }

//       user.password = bcrypt.hashSync(newPassword, 10);
//       user.resetToken = undefined;
//       user.resetTokenExpiry = undefined;
//       await user.save();

//       return res.status(200).json({ message: 'Password successfully reset' });
//   } catch (err) {
//       console.error('Error during password reset:', err);
//       if (!res.headersSent) {  // Check if headers have already been sent
//           return res.status(500).json({ error: 'Server error' });
//       }
//   }
// });




//module.exports = app;

// Countries API route
app.get('/countries', (req, res) => {
  const countrylist = Object.values(getCountries()).map(country => country.name);
  res.json(countrylist);
});



app.post('/forgotpassword', async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  try {
    const user = await usermodel.findOne({ email });

    if (!user) {
      console.log('No user found with this email:', email);
      return res.render('forgotpassword', { alert: 'No user found with this email.' });
    }

    if (!otp) {
      // Generate OTP
      const generatedOtp = crypto.randomBytes(3).toString('hex');
      user.resetToken = crypto.createHash('sha256').update(generatedOtp).digest('hex'); // Hash OTP
      user.resetTokenExpiry = Date.now() + 86400000; // 1 day validity (24 hours)
      await user.save();

      // Create a transporter for sending emails
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false // Not recommended for production, ensure certificate is valid instead
        }
      });

      const mailOptions = {
        to: email,
        from: process.env.EMAIL_USER,
        subject: 'Password Reset OTP',
        text: `Your OTP for password reset is: ${generatedOtp}`
      };

      // Send OTP email
      try {
        await transporter.sendMail(mailOptions);
        console.log('OTP email sent successfully to:', email);
        return res.render('forgotpassword', { alert: 'OTP sent to your email.' });
      } catch (err) {
        console.error('Error sending OTP email:', err);
        return res.render('forgotpassword', { alert: 'Failed to send OTP email. Please try again.' });
      }
    }

    // Verify OTP and password
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    if (user.resetToken !== hashedOtp || Date.now() > user.resetTokenExpiry) {
      console.log('Invalid or expired OTP for email:', email);
      return res.render('forgotpassword', { alert: 'Invalid or expired OTP.' });
    }

    if (newPassword !== confirmPassword) {
      console.log('Passwords do not match for email:', email);
      return res.render('forgotpassword', { alert: 'Passwords do not match.' });
    }

    // Update user password
    user.password = bcrypt.hashSync(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    console.log('Password successfully reset for email:', email);
    return res.redirect('/login?message=Password%20successfully%20reset.');
  } catch (err) {
    console.error('Error during password reset for email:', email, 'Error:', err);
    return res.render('forgotpassword', { alert: 'Server error. Please try again.' });
  }
});

module.exports = app;

// Starting server using port 3001
app.listen(3001, () => {
  console.log('Server is running on http://localhost:3001');
});
