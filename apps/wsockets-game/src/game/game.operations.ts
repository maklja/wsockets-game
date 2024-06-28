import { createHash } from 'crypto';

export interface Field {
    row: number;
    column: number;
    owned: string | null;
}

export interface Player {
    name: string;
    color: string;
}

export enum GameState {
    Waiting = 'waiting',
    Started = 'started',
    Ended = 'ended',
}

export interface Game {
    id: string;
    name: string;
    state: GameState;
    fields: Field[];
    players: Player[];
    rowN: number;
    columnN: number;
}

const MAX_ROW_NUM = 4;
const MAX_COL_NUM = 4;
const PLAYER_COLORS = [
    '#FAFAD2',
    '#228B22',
    '#CD853F',
    '#00FFFF',
    '#87CEFA',
    '#800080',
    '#66CDAA',
    '#2F4F4F',
];

const games = new Map<string, Game>();

export function retrieveGame(gameId: string) {
    return games.get(gameId) ?? null;
}

export function joinGame(gameId: string, playerName: string) {
    const game = games.get(gameId) ?? null;
    if (!game) {
        return null;
    }

    const players = game.players.map((p) => p.name);
    if (players.includes(playerName)) {
        return game.id;
    }

    const nextColor = PLAYER_COLORS[players.length + 1];
    game.players.push({
        name: playerName,
        color: nextColor,
    });

    return game.id;
}

export function playPosition(
    gameId: string,
    playerName: string,
    x: number,
    y: number
) {
    const game = games.get(gameId) ?? null;
    if (!game || game.state !== GameState.Started) {
        return null;
    }

    const players = game.players.map((p) => p.name);
    if (!players.includes(playerName)) {
        return null;
    }

    const field = game.fields.find(
        (field) => field.row === x && field.column === y
    );
    if (!field) {
        return null;
    }

    field.owned = playerName;

    return field;
}

export function createGame(gameName: string, playerName: string) {
    const fields: Field[] = [];
    for (let i = 0; i < MAX_ROW_NUM; ++i) {
        for (let j = 0; j < MAX_COL_NUM; ++j) {
            fields.push({
                row: i,
                column: j,
                owned: null,
            });
        }
    }

    const gameKey = createHash('md5')
        .update(`${playerName}${gameName}`)
        .digest('hex');
    const newGame: Game = {
        id: gameKey,
        state: GameState.Waiting,
        name: gameName,
        fields,
        players: [
            {
                name: playerName,
                color: PLAYER_COLORS[0],
            },
        ],
        rowN: MAX_ROW_NUM,
        columnN: MAX_COL_NUM,
    };

    games.set(newGame.id, newGame);

    return newGame.id;
}
