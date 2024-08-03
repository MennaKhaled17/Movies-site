// Requiring Modules
const http = require('http');
const url = require('url');
const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

// API Stuff
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
    const page = parseInt(req.query.page, 10) || 1; // Current page number
    const limit = 10; // Number of items per page

    const response = await axios.get(`${BASE_URL}/search/movie`, {
      params: {
        api_key: API_KEY,
        query: query,
        page: page,
      },
    });

    const validMovies = response.data.results.filter(movie => movie.poster_path); // Filter out movies without a poster
    const totalMovies = response.data.total_results; // Calculate totalMovies
    const totalPages = Math.ceil(totalMovies / limit); // Calculate totalPages

    // Slice the array to get the movies for the current page
    const paginatedMovies = validMovies.slice((page - 1) * limit, page * limit);

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
    const movie = response; // I specified that i want the movies only
    // const movie = movies.find(m => m.id === id); // Finding movie that has same id
    res.render('details', { movie });
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    res.render('details', { movies: [] }); //if there is an error open the index and give it an empty array
  }
});

// Callback function when route is incorrect
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Starting server using port 3000
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
