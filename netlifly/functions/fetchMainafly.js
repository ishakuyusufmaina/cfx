const https = require('https');

exports.handler = async function (event, context) {
  return new Promise((resolve, reject) => {
    https.get('https://www.google.com', (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: 200,
          headers: { 'Content-Type': 'text/html' },
          body: data
        });
      });
    }).on('error', (err) => {
      resolve({
        statusCode: 500,
        body: `Error: ${err.message}`
      });
    });
  });
};
