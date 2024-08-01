const http = require('http');
const url = require('url');
const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();

const API_KEY = '2306111c328b44f1be3d16ba83e418a6';
const BASE_URL = 'https://api.themoviedb.org/3';

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', 'views');


app.get('/', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/movie/popular`, {
      params: {
        api_key: API_KEY, //check that you have the api key
      },
    });
    const movies = response.data.results; //i specified that i want the movies only
    const totalMovies = 0;
    res.render('index', { movies, totalMovies });
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    res.render('index', { movies: [] }); //if there is an error open the index and give it an empty array
  }
});

// Route to search movies
app.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.redirect('/');
  }

  try {
    const response = await axios.get(`${BASE_URL}/search/movie`, {
      params: {
        api_key: API_KEY,
        query: query,
      },
    });
    // Filter out movies without a valid poster_path
    const validMovies = response.data.results.filter(movie => movie.poster_path);
    // Limit the movies to the first 10 results
    const totalMovies = response.data.total_results; // Get the total number of movies
    const movies = validMovies.slice(0, 10);
    res.render('index', { movies, totalMovies });
  } catch (error) {
    console.error('Error searching for movies:', error);
    res.render('index', { movies: [], totalMovies: 0 });
  }
});

app.get('/autocomplete', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.json([]);
  }

  try {
    const response = await axios.get(`${BASE_URL}/search/movie`, {
      params: {
        api_key: API_KEY,
        query: query, //akl haga al fe al search hya al btruh fe al query
      },
    });
    // Filter out movies without a valid poster_path and limit results
    const movies = response.data.results
      .filter(movie => movie.poster_path)
      .slice(0, 10)
      .map(movie => ({ title: movie.title }));

    res.json(movies); //lesa
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
        api_key: API_KEY, //check that you have the api key
      },
    });
    const movies = response.data.results; // i specified that i want the movies only
    const movie = movies.find(m => m.id === id);
    res.render('details', { movie });
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    res.render('details', { movies: [] }); //if there is an error open the index and give it an empty array
  }
});

app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
