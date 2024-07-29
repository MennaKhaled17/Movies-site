const http = require('http');
const url = require('url');
const express = require('express');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');


app.get('/', (req, res) => {
    res.render('index');
});

app.get('/details', (req, res) => {
    res.render('details');
});

app.use((req, res) => {
    res.status(404).send('Page not found');
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
