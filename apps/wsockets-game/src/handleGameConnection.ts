import { connection } from 'websocket';
import { GameState, playPosition, retrieveGame } from './game/game.operations';
import {
    createGameNotFoundMessage,
    createGameStartedMessage,
    createJoinGameMessage,
    createOnlinePlayersMessage,
    createPlayerLeftMessage,
    createPlayerNotFoundMessage,
    createGameUpdateMessage,
    Messages,
    MessageType,
} from './messages';

const gameIntervals = new Map<string, NodeJS.Timer>();

const gameConnections = new Map<string, Map<string, connection[]>>();

function crateOnlinePlayersInterval(gameId: string) {
    if (gameIntervals.has(gameId)) {
        return;
    }

    const intervalId = setInterval(() => {
        const gameConns = gameConnections.get(gameId);
        if (!gameConns) {
            return;
        }

        const players = [...gameConns.keys()];
        const onlinePlayersMessage = createOnlinePlayersMessage(players);
        [...gameConns.values()]
            .flat()
            .forEach((conn) => conn.send(onlinePlayersMessage));
    }, 3_000);

    gameIntervals.set(gameId, intervalId);
}

function handleMessage(message: Messages, conn: connection) {
    console.log(message);
    const game = retrieveGame(message.gameId);
    if (!game) {
        return conn.send(createGameNotFoundMessage(message.gameId));
    }

    if (message.type === MessageType.Join) {
        const alreadyJoined = game.players.some(
            (p) => p.name === message.player
        );

        if (!alreadyJoined && game.state !== GameState.Waiting) {
            return conn.send(createGameNotFoundMessage(message.gameId));
        }

        if (!alreadyJoined) {
            return conn.send(createPlayerNotFoundMessage(message.player));
        }

        let gameConns = gameConnections.get(message.gameId);
        if (!gameConns) {
            gameConns = new Map<string, connection[]>();
            gameConnections.set(message.gameId, gameConns);
        }

        let playerConns = gameConns.get(message.player);
        if (!playerConns) {
            playerConns = [];
            gameConns.set(message.player, playerConns);
        }

        playerConns.push(conn);

        const joinGameRespMessage = createJoinGameMessage(game);
        [...gameConns.values()]
            .flat()
            .forEach((conn) => conn.send(joinGameRespMessage));
        crateOnlinePlayersInterval(game.id);
    } else if (message.type === MessageType.StartGame) {
        if (game.state !== GameState.Waiting) {
            return conn.send(createGameNotFoundMessage(message.gameId));
        }

        const player = game.players.find((p) => p.name === message.player);
        if (!player) {
            return;
        }

        game.state = GameState.Started;

        const gameStartedRespMessage = createGameStartedMessage(game);
        const gameConns =
            gameConnections.get(message.gameId) ??
            new Map<string, connection[]>();
        [...gameConns.values()]
            .flat()
            .forEach((conn) => conn.send(gameStartedRespMessage));
    } else if (message.type === MessageType.PlayPosition) {
        const game = playPosition(
            message.gameId,
            message.player,
            message.x,
            message.y
        );

        if (!game) {
            return;
        }

        const gameUpdateMessage = createGameUpdateMessage(game);
        const gameConns =
            gameConnections.get(message.gameId) ??
            new Map<string, connection[]>();
        [...gameConns.values()]
            .flat()
            .forEach((conn) => conn.send(gameUpdateMessage));
    }
}

function handleCloseConnection(conn: connection) {
    gameConnections.forEach((playerConns) =>
        playerConns.forEach((connections, player) => {
            const remConnections = connections.filter(
                (curConnection) => curConnection !== conn
            );
            if (remConnections.length === connections.length) {
                return;
            }

            if (remConnections.length !== 0) {
                playerConns.set(player, remConnections);
                return;
            }

            playerConns.delete(player);
            [...playerConns.entries()]
                .filter(([curPlayer]) => curPlayer !== player)
                .flatMap(([, connections]) => connections)
                .forEach((conn) => conn.send(createPlayerLeftMessage(player)));
        })
    );
}

export function handleGameConnection(conn: connection) {
    conn.on('message', (message) => {
        if (message.type !== 'binary') {
            return;
        }

        const socketMessage = JSON.parse(
            message.binaryData.toString()
        ) as Messages;

        handleMessage(socketMessage, conn);
    });

    conn.on('close', (reasonCode, description) => {
        console.log(`Connection was closed: ${reasonCode} - ${description}`);
        handleCloseConnection(conn);
    });
}
