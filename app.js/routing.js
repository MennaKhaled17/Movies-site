const http = require('http');
const url = require('url');

function routing(req, res) {
    let pathname = url.parse(req.url).pathname;
    if (pathname === '/' || pathname === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('This is the home page');
        console.log("this is the home page");
    } else if (pathname === '/details.ejs') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('This is the details page');
        console.log("this is the details page");
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Page not found');
        console.log("page not found");
    }
}

const server = http.createServer((req, res) => {
    routing(req, res);
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
