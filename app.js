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

const uri="mongodb+srv://menakhaled:menakhaled@cluster0.klteank.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
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

    const user = await usermodel.findOne({ email: email });

    if (!user) {

    // Check if the user with the provided email exists
    const user = await usermodel.findOne({ email: email, password:password });

    if (user) {
      // Check if the password matches
      if (password == user.password && email == user.email ) {
        console.log('Password matches');
        // Redirect to home with a Toastr message
        res.redirect(`/index?message=Welcome%20back,%20${encodeURIComponent(user.firstname)}!`);
      } else {
        console.log('Password does not match');
        // Password doesn't match, return an error
        res.redirect('/login?error=Invalid%20credentials');
      }
    } else {

      console.log('User not found');
      return res.redirect('/Login?error=Invalid%20credentials');
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      console.log('Password does not match');
      return res.redirect('/Login?error=Invalid%20credentials');
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      'mena12',
      { expiresIn: '1h' }
    );

    console.log('Password matches');
     
    res.redirect(`/index?message=Welcome%20back,%20${encodeURIComponent(user.firstname)}&token=${token}`);
  }} catch (err) {
    console.error('Error during login:', err);
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
