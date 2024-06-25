import { createHash } from 'crypto';

export interface Field {
    row: number;
    column: number;
    owned: number | null;
}

export interface Player {
    name: string;
    color: string;
}

export interface Game {
    id: string;
    name: string;
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
