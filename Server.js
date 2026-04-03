const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const clients = new Map();
let nextId = 1;

wss.on('connection', (ws) => {
    const clientId = nextId++;
    clients.set(clientId, { ws, role: null });
    console.log(`Client ${clientId} connected`);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'register') {
                clients.set(clientId, { ws, role: data.role });
                console.log(`Client ${clientId} registered as ${data.role}`);
                ws.send(JSON.stringify({ type: 'registered', clientId }));
            }
            
            if (data.type === 'get_parent_status') {
                let parentExists = false;
                for (const [id, client] of clients) {
                    if (client.role === 'parent' && client.ws.readyState === WebSocket.OPEN) {
                        parentExists = true;
                        break;
                    }
                }
                ws.send(JSON.stringify({ type: 'parent_status', online: parentExists }));
            }
            
        } catch(e) {
            console.error('Error:', e);
        }
    });

    ws.on('close', () => {
        console.log(`Client ${clientId} disconnected`);
        clients.delete(clientId);
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
