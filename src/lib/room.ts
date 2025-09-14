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
    secretWord?: Word;
    selectedPlayerId?: string;
    startTime?: any;
    duration?: number;
    submissions?: { [key: string]: any };
};

export function generateRoomCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}