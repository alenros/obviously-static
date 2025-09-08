import { Player } from './player';

export interface Room {
    code: string;
    players: Player[];
    status: 'waiting' | 'playing' | 'finished';
};

export function generateRoomCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}