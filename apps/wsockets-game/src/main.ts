import express from 'express';
import * as path from 'path';
import { format } from 'url';
import { connection } from 'websocket';
import { setupWebSocketServer } from './setupWebSocketServer';
import { createGame, retrieveGame } from './game/game.operations';

function handleConnection(conn: connection) {
    console.log(conn);
    conn.on('message', (message) => {
        console.log(message);
        // if (message.type === 'utf8') {
        //     console.log('Received Message: ' + message.utf8Data);
        //     connection.sendUTF(message.utf8Data);
        // } else if (message.type === 'binary') {
        //     console.log(
        //         'Received Binary Message of ' +
        //             message.binaryData.length +
        //             ' bytes'
        //     );
        //     connection.sendBytes(message.binaryData);
        // }
    });
    conn.on('close', (reasonCode, description) => {
        // console.log(
        //     new Date() + ' Peer ' + connection.remoteAddress + ' disconnected.'
        // );
    });
}

const app = express();

app.set('views', path.join(__dirname, './views'));

app.set('view engine', 'ejs');

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use(express.json());
app.use(express.urlencoded());

app.get('/game/:gameId', (req, res) => {
    const game = retrieveGame(req.params.gameId);
    if (!game) {
        return res.redirect('/not-found');
    }

    const player = game.players.find((p) => p.name === req.query.player);
    if (!player) {
        return res.redirect('/not-found');
    }

    res.render('game', { game, player });
});

app.post('/game', (req, res) => {
    const gameId = createGame(req.body.gameName, req.body.playerName);

    res.redirect(
        format({
            pathname: `/game/${gameId}`,
            query: {
                player: req.body.playerName,
            },
        })
    );
});

app.get('/', (_req, res) => {
    res.render('index');
});

app.use((req, res) => {
    res.status(404);

    if (req.accepts('html')) {
        res.render('not-found');
        return;
    }

    if (req.accepts('json')) {
        res.json({ error: 'Not found' });
        return;
    }

    res.type('txt').send('Not found');
});

const port = process.env.PORT || 3333;
const url = `http://localhost:${port}`;
const server = app.listen(port, () => {
    console.log(`Listening at ${url}`);
});
const wsServer = setupWebSocketServer(server, handleConnection, [url]);

server.on('error', (error) => {
    wsServer.shutDown();
    console.log(error);
});
