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


app.use(express.json());
app.use(express.urlencoded({ extended: true }));



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

    res.render('index', { movies: paginatedMovies, totalMovies, page, totalPages, query: null,});

  } catch (error) {
    console.error('Error fetching popular movies:', error);
    res.render('index', { movies: [], totalMovies: 0, page: 1, totalPages: 0, query: null, });
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
app.get('/Register', (req, res) => {
  const { message, messageType } = req.query;
  res.render('Register', { message: message || '', messageType: messageType || 'success' });
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


// app.post('/Register', async (req, res) => {
//   const { firstname, lastname, email, password, country, phone, role, active } = req.body;
//   // console.log(req.body);

//   try {
//     const hashedPassword = await bcrypt.hash(password, 6);
//     const userRole = role || 'user'
//     const user = new usermodel({
//       firstname,
//       lastname,
//       email,
//       password: hashedPassword,
//       country,
//       phone,
//       role: userRole,

//       active: { type: Boolean, default: true }
//     });

//     await user.save();
//     console.log('Saving user to the database...');

//     // Redirect with success message
//     res.redirect('/Register?message=User%20registered%20successfully&messageType=success');
//   } catch (error) {
//     console.error('Error registering user:', error);
//     res.redirect('/Register?message=Error%20registering%20user&messageType=error');
//   }
// });

// Login route
app.get("/Login", async (req, res) => {
  const { error } = req.query;
  res.render('Login', { error });

});
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(express.json());



app.get('/admin', async (req, res) => {
  try {
    const users = await usermodel.find(); // Fetch all users from the database
    res.render('admin', { users: users }); // Pass users to the template

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});
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


// // Route for the index page
// app.get('/', (req, res) => {
//   res.render('index', {
//     isAdmin: req.user && req.user.role === 'admin' // Pass the admin status to the view
//   });
// });





// function authenticateToken(req, res, next) {
//   const token = req.header('Authorization');

//   if (!token) {
//     return res.status(401).json({ message: 'Access denied. No token provided.' });
//   }

//   try {
//     const verified = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = verified;
//     next();
//   } catch (err) {
//     res.status(400).json({ message: 'Invalid token.' });
//   }
// }
// restrictTo = (...roles) => {
//   return (req, res, next) => {
//     // roles is an array ['admin', 'user', etc.]
//     if (!roles.includes(req.usermodel.role)) {
//       return res.status(403).json({
//         status: 'fail',
//         message: 'You do not have permission to perform this action'
//       });
//     }
//     next();
//   };
// };
// module.exports = authenticateToken;
// app.get('/', authenticateToken, (req, res) => {
//   // Pass the user object to the template
//   res.render('index', { user: req.user });
// });

// app.get('/admin', authenticateToken, restrictTo('admin'), async (req, res) => {
//   try {
//     const users = awai t usermodel.find();
//     res.render('admin', { users });
//   } catch (error) {
//     console.error('Error fetching users:', error);
//     res.status(500).send('Server Error');
//   }
// });



// app.patch('/updateUser/:id', restrictTo('admin'), (req, res) => {
//   // Logic to update user
//   res.status(200).json({
//     status: 'success',
//     message: 'User updated successfully'
//   });
// });

// // Assuming you have a route to delete a user
// app.delete('/deleteUser/:id', restrictTo('admin'), (req, res) => {
//   // Logic to delete user
//   res.status(204).json({
//     status: 'success',
//     message: 'User deleted successfully'
//   });
// });


app.post('/reset-password', async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  try {
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return res.redirect('/?error=Passwords%20do%20not%20match');
    }

    // Find the user by email
    const user = await usermodel.findOne({ email: email });
    if (!user) {
      return res.redirect('/?error=No%20user%20found%20with%20this%20email');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the user's password in the database
    user.password = hashedPassword;
    await user.save();

    // Redirect to home with a success message
    return res.redirect('/?message=Password%20reset%20successfully');

  } catch (err) {
    console.error('Error during password reset:', err);
    res.status(500).send('Server error');
  }
});
// Countries API route
app.get('/countries', (req, res) => {
  const countrylist = Object.values(getCountries()).map(country => country.name);
  res.json(countrylist);
});

// Fallback route for undefined paths
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Starting server using port 3001
app.listen(3001, () => {
  console.log('Server is running on http://localhost:3001');
});
