const http = require('http');
const options = { hostname: 'localhost', port: 4000, path: '/api/items', method: 'GET', headers: { 'Authorization': 'Bearer ' } };
const req = http.request(options, res => { let data = ''; res.on('data', chunk => data += chunk); res.on('end', () => { console.log(data); }); });
req.on('error', e => { console.error('err', e.message); });
req.end();
