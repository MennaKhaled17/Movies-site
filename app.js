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

const mongoose = require("mongoose");
const usermodel = require('./models/Schema');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const session = require('express-session');
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
app.use(cookieParser());

// Connecting to MongoDB
const uri = "mongodb+srv://menakhaled:menakhaled@cluster0.klteank.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Auth Middleware
const maxAge=3*24*60*60;
const secret=process.env.JWT_SECRET;
const createToken=(id)=>{
    return jwt.sign({id},secret,{expiresIn: maxAge});
}

const requireAuth = (req, res, next) => {
  const secret = process.env.secret;
  const token = req.cookies.jwt;
  //check jwt if exist and verified
  if (token) {
    jwt.verify(token, secret, (err, decodedToken) => {
      if (err) {
        console.log(err.message)
        res.redirect('/login');
      } else {
        console.log(decodedToken);
        next();
      }
    })
  } else {
    res.redirect('/login');
  }
}
// check current user
const checkUser = (req, res, next) => {
  const token = req.cookies.jwt;
  const secret = process.env.JWT_SECRET;
  if (token) {
    jwt.verify(token, secret, async (err, decodedToken) => {
      if (err) {
        res.locals.user = null;
        next();
      } else {
        let user = await usermodel.findById(decodedToken.id);
        res.locals.user = user;
        next();
      }
    });
  } else {
    res.locals.user = null;
    next();
  }
};
module.exports = { requireAuth, checkUser };

//DB connection
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Update existing documents
usermodel.updateMany({}, {
  $set: {
    flagg: true, // Set default value for the new field
   // Initialize the new date field to null
  }
}).then((res) => {
  // console.log(`Updated ${res.test.users} documents`);
  // mongoose.connection.close();
}).catch((err) => {
  console.error('Error updating documents:', err);
});

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

//  


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
  // console.log(req.body);

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

app.use(session({
  secret: 'kkkkk', // Secret key to sign the session ID cookie
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set `secure: true` for HTTPS
}));

app.post('/Login', async (req, res) => {
  try {
    const user = await usermodel.findOne({ email: req.body.email });

    if (user && bcrypt.compareSync(req.body.password, user.password)) {
      const token = createToken(user._id);
      res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
      console.log("User authenticated", token);
      res.redirect('/');
    } else if (!user) {
      //res.render('login', { title: 'Log in',error:'Email not registered'});
      console.log("User not found");
    } else {
      console.log("Invalid credentials");
      //res.render('login', { title: 'Log in',error:'Incorrect password'});
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      console.log('Password does not match');
      return res.redirect('/Login?error=Invalid%20credentials');
    }
   
    // Password matches
    console.log('Password matches');
   
    
    // Generate a token (assuming you want to use JWT)


    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );


    // Redirect to home with a success message and token
    // return res.redirect('/?message=Logged%20In%20Successfully!&token=${token}');
   
    

    // Log the token to confirm it was created
    console.log('Generated JWT Token:', token);

    // Set the cookie
    // res.cookie('jwt', token, { httpOnly: true, maxAge: 3600000 });
    // console.log('JWT set in cookie');

    return res.redirect('/?message=Logged%20In%20Successfully');

  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).send('Server error');
  }
});



app.get('/admin', async (req, res) => {
  try {
    const users = await usermodel.find(); // Fetch only active users
    console.log(users);
    res.render('admin', { users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Internal server error.');
  }
});
app.patch('/admin/deactivated/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const result = await usermodel.findByIdAndUpdate(userId, { flagg: false });

    if (!result) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    
    res.json({ success: true, message: 'User deactivated successfully.' });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});
app.patch('/admin/update/:_id', async (req, res) => {
  const { _id } = req.params;

  try {
    // Find the user by ID
    const user = await usermodel.findById(_id);

    // Check if the user exists
    if (!user) {
      console.log(`User with ID ${_id} not found.`);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`User found: ${user}`);

    // Toggle the flagg value
    const originalFlag = user.flagg;
    user.flagg = !originalFlag;

    // Save the updated user in the database
    const updatedUser = await user.save();

    console.log(`User flag updated from ${originalFlag} to ${updatedUser.flagg}`);

    // Respond with the updated user data
    res.status(200).json({ message: 'Flag updated successfully', user: updatedUser });
  } catch (error) {
    // Log the error and send a response
    console.error('Error updating flag:', error);
    res.status(500).json({ error: 'Failed to update the flag' });
  }
});


// Route for the index page
app.get('/', (req, res) => {
  res.render('index', {
    isAdmin: req.user && req.user.role === 'admin' // Pass the admin status to the view
  });
});





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
