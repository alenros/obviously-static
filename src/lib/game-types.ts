import type { Room } from './room';

export interface GameSubmission {
  playerId: string;
  playerName: string;
  word: string;
  timestamp: number;
}

export interface GameState {
  roomData: Room;
  currentPlayer: any;
  gameTimer: NodeJS.Timeout | null;
  roomCode: string;
}

export interface TimerConfig {
  startTime: number;
  duration: number;
}

export interface PlayerGameStatus {
  id: string;
  name: string;
  isSelected: boolean;
}