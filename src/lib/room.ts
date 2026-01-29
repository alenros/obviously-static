import type { GameStatus } from './game-status';
import type { Player } from './player';
import type { Word } from './word';

export interface Room {
    code: string;
    name: string;
    status: GameStatus;
    players: { [key: string]: Player };
    createdAt: any;
    hostId: string;
    prompt?: string;
    playerWords?: { [playerId: string]: Word[] }; // Each player gets 2 words
    publicWords?: Word[]; // n+1 public words
    publicWordChoices?: { [playerId: string]: Word }; // Each player's chosen public word (private)
    startTime?: any;
    duration?: number;
    submissions?: { [key: string]: any };
};

export function generateRoomCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}