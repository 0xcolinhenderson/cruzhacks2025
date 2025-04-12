// server.js
const WebSocket = require('ws');

// Create a new WebSocket server listening on port 8080.
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', ws => {
  console.log('Client connected');

  // Listen for messages from the client.
  ws.on('message', message => {
    console.log('Received raw message:', message);

    try {
      // Attempt to parse the incoming message as JSON.
      const data = JSON.parse(message);
      console.log('Received JSON:', data);
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }

    // Optionally, send a response back to the client.
    // ws.send(message);  // Uncomment this line if you'd like to echo the message back.
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WebSocket server is running on ws://localhost:8080');
