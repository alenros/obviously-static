import type { Player } from './player';

export interface Room {
    code: string;
    name: string;
    status: 'waiting' | 'playing' | 'finished';
    players: { [key: string]: Player };
    createdAt: any;
    hostId: string;
    prompt?: string;
    secretWord?: string;
    selectedPlayerId?: string;
    startTime?: any;
    duration?: number;
    submissions?: { [key: string]: any };
};

export function generateRoomCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}