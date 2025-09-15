import { FirebaseTestManager, createTestPlayer, createTestRoom } from '../setup/firebase-test-setup';

describe('Simple Integration Test', () => {
  let firebaseManager: FirebaseTestManager;

  beforeAll(() => {
    firebaseManager = new FirebaseTestManager();
  });

  it('should create test utilities without Firebase connection', () => {
    const roomCode = firebaseManager.generateTestRoomCode();
    expect(roomCode).toMatch(/^test_room_[A-Z0-9]{6}$/);
  });

  it('should create test player data', () => {
    const player = createTestPlayer('test-123', 'Alice');
    expect(player).toEqual({
      id: 'test-123',
      name: 'Alice',
      isHost: false
    });
  });

  it('should create test room data', () => {
    const room = createTestRoom('ROOM01');
    expect(room.code).toBe('ROOM01');
    expect(room.name).toBe('Test Room');
    expect(room.players).toBeDefined();
  });

  it('should create mock database', () => {
    const mockDb = firebaseManager.createMockDatabase();
    expect(mockDb.ref).toBeDefined();
    expect(typeof mockDb.ref).toBe('function');
  });
});