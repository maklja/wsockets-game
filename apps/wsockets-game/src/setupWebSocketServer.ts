import * as http from 'http';
import { server as WebSocketServer, connection } from 'websocket';

export function setupWebSocketServer(
    server: http.Server,
    onConnection: (conn: connection) => void,
    allowedOrigins: string[] = []
) {
    const wsServer = new WebSocketServer({
        httpServer: server,
        autoAcceptConnections: false,

    });

    wsServer.on('request', function (request) {
        if (!allowedOrigins.includes(request.origin)) {
            request.reject();
            return;
        }

        const connection = request.accept('echo-protocol', request.origin);
        onConnection(connection);
    });

    return wsServer;
}
