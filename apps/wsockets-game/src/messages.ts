import { Field, Game } from './game/game.operations';

export enum MessageType {
    Join = 'join',
    StartGame = 'startGame',
    PlayPosition = 'playPosition',
}

export enum ResponseMessageType {
    GameNotFound = 'gameNotFound',
    PlayerNotFound = 'playerNotFound',
    JoinGame = 'joinGame',
    GameStarted = 'gameStarted',
    PlayerLeft = 'playerLeft',
    OnlinePlayers = 'onlinePlayers',
    UpdateGamePosition = 'updateGamePosition',
}

export interface StartGameMessage {
    type: MessageType.StartGame;
    player: string;
    gameId: string;
}

export interface JoinMessage {
    type: MessageType.Join;
    player: string;
    gameId: string;
}

export interface PlayPositionMessage {
    type: MessageType.PlayPosition;
    player: string;
    gameId: string;
    x: number;
    y: number;
}

export type Messages = JoinMessage | StartGameMessage | PlayPositionMessage;

function toBuffer(message: unknown) {
    return Buffer.from(JSON.stringify(message), 'utf8');
}

export function createGameNotFoundMessage(gameId: string) {
    return toBuffer({
        type: ResponseMessageType.GameNotFound,
        gameId,
    });
}

export function createPlayerNotFoundMessage(player: string) {
    return toBuffer({
        type: ResponseMessageType.PlayerNotFound,
        player,
    });
}

export function createJoinGameMessage(game: Game) {
    const message = {
        type: ResponseMessageType.JoinGame,
        game,
    };
    return Buffer.from(JSON.stringify(message), 'utf8');
}

export function createGameStartedMessage(game: Game) {
    return toBuffer({
        type: ResponseMessageType.GameStarted,
        game,
    });
}

export function createPlayerLeftMessage(player: string) {
    return toBuffer({
        type: ResponseMessageType.PlayerLeft,
        player,
    });
}

export function createOnlinePlayersMessage(players: string[]) {
    return toBuffer({
        type: ResponseMessageType.OnlinePlayers,
        players,
    });
}

export function createGameUpdateMessage(field: Field) {
    return toBuffer({
        type: ResponseMessageType.UpdateGamePosition,
        field,
    });
}
