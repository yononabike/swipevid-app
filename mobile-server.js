const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 9000; // Using port 9000 to avoid conflicts

// Get local IP address
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            if (interface.family === 'IPv4' && !interface.internal) {
                return interface.address;
            }
        }
    }
    return 'localhost';
}

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json'
};

const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? './demo.html' : '.' + req.url;
    const extname = path.extname(filePath);
    const contentType = MIME_TYPES[extname] || 'text/plain';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404);
            res.end('File not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

const localIP = getLocalIP();

server.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 SwipeVid Mobile Server Started!');
    console.log('');
    console.log('📱 On your mobile phone, open:');
    console.log(`   http://${localIP}:${PORT}`);
    console.log('');
    console.log('💻 On this computer:');
    console.log(`   http://localhost:${PORT}`);
    console.log('');
    console.log('Make sure your phone is on the same WiFi network!');
});
