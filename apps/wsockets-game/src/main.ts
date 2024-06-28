import express from 'express';
import * as path from 'path';
import { format } from 'url';
import { setupWebSocketServer } from './setupWebSocketServer';
import { createGame, joinGame, retrieveGame } from './game/game.operations';
import { handleGameConnection } from './handleGameConnection';

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

app.post('/game/join', (req, res) => {
    const gameId = joinGame(req.body.gameKey, req.body.joinPlayerName);

    if (!gameId) {
        return res.redirect('/not-found');
    }

    res.redirect(
        format({
            pathname: `/game/${gameId}`,
            query: {
                player: req.body.joinPlayerName,
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
const wsServer = setupWebSocketServer(server, handleGameConnection, [url]);

server.on('error', (error) => {
    wsServer.shutDown();
    console.log(error);
});
