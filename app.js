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
    res.render('index', { movies });
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
    const totalMovies = validMovies.length;
    // Limit the movies to the first 10 results
    const movies = validMovies.slice(0, 10);
    res.render('index', { movies ,totalMovies:10});
  } catch (error) {
    console.error('Error searching for movies:', error);
    res.render('index', { movies: [] });
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
  const { id } = req.params; // Extract the id from the URL parameters

  try {
    const response = await axios.get(`${BASE_URL}/movies`, {
      params: {
        api_key: API_KEY,
      },
    });

    const movies = response.data.results;
    const totalResults = movies.length;
    if (!movies || movies.length === 0) {
      return res.status(404).send("Movie Not Found");
    }

    // Find the movie with the specific ID
    const movie = movies.find((movie) => movie.id === id);

    if (!movie) {
      console.log("a7a");
    }

    res.render('details', { movie }); // Render the 'details' page with the specific movie data

  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.status(500).render('details', { movie: null, error: "An error occurred while fetching movie details." });
  }
});



app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
