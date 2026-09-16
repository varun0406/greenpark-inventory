const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001, // Express port
  path: '/api/dashboard/stats',
  method: 'GET',
  headers: { 'Authorization': 'Bearer ' } // wait, I don't have a token.
};
