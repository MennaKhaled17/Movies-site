// Requiring Modules
const http = require('http');
const url = require('url');
const express = require('express');
const path = require('path');
const axios = require('axios');
const { render } = require('ejs');
const { getCountries } = require('country-state-picker');
const app = express();
const mongoose=require("mongoose");
const usermodel=require('./models/Schema')

// API Data
const API_KEY = '2306111c328b44f1be3d16ba83e418a6';
const BASE_URL = 'https://api.themoviedb.org/3';

// Setting public folder
app.use(express.static(path.join(__dirname, 'public')));

// Setting views folder
app.set('view engine', 'ejs');
app.set('views', 'views');

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

    res.render('index', { movies: paginatedMovies, totalMovies, page, totalPages, query: null });

  } catch (error) {
    console.error('Error fetching popular movies:', error);
    res.render('index', { movies: [], totalMovies: 0, page: 1, totalPages: 0, query: null });
  }
});


// Route to search movies
app.get('/search', async (req, res) => {
  const query = req.query.q; // Query from the search bar
  if (!query) {
    return res.redirect('/'); // Redirect if no query is provided
  }

  try {
    page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;


    // if (page === 3) {
    //   page = 2;
    // }

    const response = await axios.get(`${BASE_URL}/search/movie`, {
      params: {
        api_key: API_KEY,
        query: query,
        // page: page,
      },
    });

    const movies = response.data.results;
    // Use the total number of valid movies
    const totalMovies = response.data.total_results;
    const totalPages = Math.ceil(totalMovies / pageSize);

    // Calculate pagination indices
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalMovies);
    const paginatedMovies = movies.slice(startIndex, endIndex);

    res.render('index', { movies: paginatedMovies, totalMovies, page, totalPages, query: query });

  } catch (error) {
    console.error('Error searching for movies:', error);
    res.render('index', { movies: [], totalMovies: 0, page: 1, totalPages: 0, query: query });
  }
});





app.get('/autocomplete', async (req, res) => {
  const query = req.query.q; // What's written in the search bar (While typing in the search bar)
  if (!query) {
    return res.json([]);
  }

  try {
    const response = await axios.get(`${BASE_URL}/search/movie`, { // Searching in the API
      params: {
        api_key: API_KEY, // Check that you have the API key
        query: query, // Sending what is written in the search bar
      },
    });
    // Filter out movies without a valid poster_path and limit results
    const movies = response.data.results
      .filter(movie => movie.poster_path) // filtering movies that has only posters
      .slice(0, 10) // Specify number of movies
      .map(movie => ({ title: movie.title })); // Looping over movies with the movie title specified 

    res.json(movies);
  } catch (error) {
    console.error('Error during autocomplete:', error);
    res.json([]);
  }
});

app.get('/details/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10); // Convert id to a number
  try {
    const response = await axios.get(`${BASE_URL}/movie/${id}`, {
      params: {
        api_key: API_KEY, // Check that you have the api key
      },
    });
    // console.log(response);
    const movie = response.data; // I specified that i want the movies only
    // const movie = movies.find(m => m.id === id); // Finding movie that has same id
    res.render('details', { movie });
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    res.render('details', { movies: [] }); //if there is an error open the index and give it an empty array
  }
});

app.get("/Register",async(req,res)=>{
  res.render('Register');
  let countries=getCountries();
 
})
app.get('/countries',(req,res)=>{
  const countrylist=Object.values(countries).map(country=>{
country.name});
res.json(countrylist);
  
})
app.get("/login",async(req,res)=>{
  res.render('login');
})
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

module.exports = connectDB();


// app.use(express.json());
// app.use(express.urlencoded({extended:true}));

app.post('/Register', async (req, res) => {
  const { firstname, lastname, email, password, country, phone } = req.body;
// console.log(req.body.firstname);
// console.log(req.body);



  try {
    // Create a new user instance
    const user = new usermodel({
      firstname,
      lastname,
      email,
      password,
      country,
      phone
    });

    // Save the user to the database
    await user.save();
    
    // Send success response
    res.status(201).send('User registered successfully');
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('Error registering user');
  }
});

module.exports = app;
// Callback function when route is incorrect
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Starting server using port 3000
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
