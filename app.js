// Requiring Modules
const http = require('http');
const url = require('url');
const express = require('express');
const path = require('path');
const axios = require('axios');
const { render } = require('ejs');
const { getCountries } = require('country-state-picker');
const app = express();
const mongoose = require("mongoose");
const usermodel = require('./models/Schema');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
require('dotenv').config();
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

// Connecting to MongoDB
const uri = "mongodb+srv://menakhaled:menakhaled@cluster0.klteank.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const connectDB = async () => {
  console.log('Attempting to connect to MongoDB...');
  
    await mongoose.connect(uri);

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

connectDB();
  }

// Authentication Middleware
function authenticateToken(req, res, next) {
  const token = req.query.token || req.headers['authorization'];

  if (!token) {
    return res.redirect('/login?error=Access%20denied.%20Please%20login%20first.');
  }

  jwt.verify(token, 'mena1234', (err, user) => {
    if (err) {
      console.error('Token verification failed:', err);
      return res.redirect('/login?error=Invalid%20token.%20Please%20login%20again.');
    }
    req.user = user; // Attach the decoded user to the request
    next(); // Proceed to the next middleware or route handler
  });
}

module.exports = connectDB();


app.use(express.json());
app.use(express.urlencoded({extended:true}));



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

    res.render('index', { movies: paginatedMovies, totalMovies, page, totalPages, query: null, user: req.user });

  } catch (error) {
    console.error('Error fetching popular movies:', error);
    res.render('index', { movies: [], totalMovies: 0, page: 1, totalPages: 0, query: null, user: req.user });
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


app.get('/countries',(req,res)=>{
  const countrylist=Object.values(countries).map(country=>{
country.name});
res.json(countrylist);
  
})
app.get("/login",async(req,res)=>{
  res.render('login');
})


app.post('/Register', async (req, res) => {
  const { firstname, lastname, email, password, country, phone } = req.body;
  // console.log(req.body);

  try {
    const hashedPassword = await bcrypt.hash(password, 6);

    const user = new usermodel({
      firstname,
      lastname,
      email,
      password: hashedPassword,
      country,
      phone
    });

    await user.save();
    console.log('Saving user to the database...');
    
    // Redirect with success message
    res.redirect('/Register?message=User%20registered%20successfully&messageType=success');
  } catch (error) {
    console.error('Error registering user:', error);
    res.redirect('/Register?message=Error%20registering%20user&messageType=error');
  }
});

// Login route
app.get("/Login", async (req, res) => {
  const { error } = req.query;
  res.render('Login', { error });

});
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(express.json());
app.post('/Login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await usermodel.findOne({ email: email });

    if (!user) {
      // User not found
      console.log('User not found');
      return res.redirect('/Login?error=Invalid%20credentials');
    }

    // Compare the provided password with the stored hashed password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      // Password does not match
      console.log('Password does not match');
      return res.redirect('/Login?error=Invalid%20credentials');
    }

    // Password matches
    console.log('Password matches');
   
    
    // Generate a token (assuming you want to use JWT)
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET, // Your secret key (consider storing this in an environment variable)
      { expiresIn: '1h' } 
    );
    console.log('JWT_SECRET:', process.env.JWT_SECRET);

    // Redirect to home with a success message and token
    return res.redirect('/?message=Logged%20In%20Successfully!&token=${token}');

  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).send('Server error');
  }
});




function authenticateToken(req, res, next) {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token.' });
  }
}

module.exports = authenticateToken;
app.get('/admin', authenticateToken, restrictTo('admin'), async (req, res) => {
  try {
    const users = await usermodel.find();
    res.render('admin', { users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Server Error');
  }
});


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
