import { GameStatus } from '../../src/lib/game-status';

export class FirebaseTestManager {
  private testRoomPrefix = 'test_room_';

  constructor() {
    // No Firebase initialization - using mocks only
  }

  generateTestRoomCode(): string {
    return `${this.testRoomPrefix}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  async createTestRoom(roomCode: string, roomData: any): Promise<void> {
    // Mock implementation - no actual Firebase operations
    console.log(`Mock: Created test room ${roomCode}`);
  }

  async cleanupTestRoom(roomCode: string): Promise<void> {
    // Mock implementation - no actual Firebase operations
    console.log(`Mock: Cleaned up test room ${roomCode}`);
  }

  async cleanupAllTestRooms(): Promise<void> {
    console.log('Mock: Cleaning up all test rooms...');
  }

  createMockDatabaseRef(path: string) {
    const mockRef = {
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn().mockResolvedValue({ val: () => null }),
      push: jest.fn().mockResolvedValue({ key: 'mock-key' }),
      child: jest.fn().mockReturnThis(),
      update: jest.fn().mockResolvedValue(undefined)
    };
    return mockRef;
  }

  createMockDatabase() {
    return {
      ref: jest.fn((path: string) => this.createMockDatabaseRef(path)),
      goOffline: jest.fn(),
      goOnline: jest.fn()
    };
  }
}

export const createTestPlayer = (id: string = 'test-player-1', name: string = 'Test Player') => ({
  id,
  name,
  isHost: false
});

export const createTestRoom = (code: string = 'TEST01') => ({
  code,
  name: 'Test Room',
  status: GameStatus.WAITING,
  players: {
    'test-player-1': createTestPlayer()
  },
  createdAt: Date.now(),
  hostId: 'test-player-1',
  prompt: 'Animals',
  secretWord: { text: 'elephant', category: 'Animals' },
  selectedPlayerId: 'test-player-1',
  duration: 180
});

export const createTestSubmission = (playerId: string = 'test-player-1', word: string = 'tiger') => ({
  playerId,
  playerName: 'Test Player',
  word,
  timestamp: Date.now()
});