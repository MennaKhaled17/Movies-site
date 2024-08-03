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
app.get('/', async (req, res) => { // Rendering index page and sending it movies and total movies as parameters
  try {
    const response = await axios.get(`${BASE_URL}/movie/popular`, { // Getting popular movies from API
      params: {
        api_key: API_KEY, // Check that you have the API key
      },
    });
    const movies = response.data.results; // I specified that i want the movies only
    const totalMovies = 17;
    res.render('index', { movies, totalMovies });
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    res.render('index', { movies: [] }); // If there is an error open the index and give it an empty array
  }
});

// Route to search movies
app.get('/search', async (req, res) => { // Searching for a specific movie
  const query = req.query.q; // What's written in the search bar
  if (!query) { // If there is nothing in the search bar, redirect
    return res.redirect('/');
  }

  try {
    const response = await axios.get(`${BASE_URL}/search/movie`, { // Searching in the API
      params: {
        api_key: API_KEY, // Check that you have the API key
        query: query, // Sending what is written in the search bar
      },
    });

    // Filtering out movies without a valid poster
    const validMovies = response.data.results.filter(movie => movie.poster_path);
    // Limit the movies to the first 10 results
    const movies = validMovies.slice(0, 10);
    // Get the total number of movies
    const totalMovies = response.data.total_results;

    res.render('index', { movies, totalMovies }); // Display only the first 10 movies

  } catch (error) {
    console.error('Error searching for movies:', error);
    res.render('index', { movies: [], totalMovies: 0 });
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
    const response = await axios.get(`${BASE_URL}/movie/popular`, {
      params: {
        api_key: API_KEY, // Check that you have the api key
      },
    });
    const movies = response.data.results; // I specified that i want the movies only
    const movie = movies.find(m => m.id === id); // Finding movie that has same id
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
