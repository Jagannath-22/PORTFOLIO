import http from 'node:http';

const server = http.createServer((req, res) => {
  res.writeHead(302, { Location: `http://localhost:5173${req.url}` });
  res.end();
});

server.listen(5174, 'localhost', () => {
  console.log('Redirecting :5174 -> :5173');
});
