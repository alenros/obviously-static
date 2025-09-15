import { GameController } from '../../src/lib/game-controller';
import { FirebaseTestManager, createTestPlayer, createTestRoom } from '../setup/firebase-test-setup';
import type { Room } from '../../src/lib/room';
import type { Player } from '../../src/lib/player';

describe('GameController Firebase Integration Tests', () => {
  let firebaseManager: FirebaseTestManager;
  let mockDatabase: any;
  let gameController: GameController;
  let testRoom: Room;
  let testPlayer: Player;
  let roomCode: string;

  beforeAll(() => {
    firebaseManager = new FirebaseTestManager();
  });

  beforeEach(() => {
    // Setup test data
    roomCode = firebaseManager.generateTestRoomCode();
    testPlayer = createTestPlayer('player-1', 'Alice');
    testRoom = createTestRoom(roomCode);
    
    // Create mock database with realistic Firebase behavior
    mockDatabase = firebaseManager.createMockDatabase();
    
    // Initialize GameController with mock database
    gameController = new GameController(roomCode, testPlayer, mockDatabase);
  });

  afterEach(async () => {
    // Cleanup - handle errors gracefully for tests that mock failures
    try {
      gameController.cleanup();
    } catch (error) {
      // Expected for some tests that mock cleanup failures
    }
    await firebaseManager.cleanupTestRoom(roomCode);
  });

  describe('Word Submission Integration', () => {
    it('should successfully submit a word to Firebase', async () => {
      const testWord = 'elephant';
      const mockSubmissionRef = firebaseManager.createMockDatabaseRef(`rooms/${roomCode}/submissions/${testPlayer.id}`);
      mockDatabase.ref.mockReturnValue(mockSubmissionRef);

      const result = await gameController.submitWord(testWord);

      expect(result).toBe(true);
      expect(mockDatabase.ref).toHaveBeenCalledWith(`rooms/${roomCode}/submissions/${testPlayer.id}`);
      expect(mockSubmissionRef.set).toHaveBeenCalledWith({
        playerId: testPlayer.id,
        playerName: testPlayer.name,
        word: 'elephant',
        timestamp: expect.any(Object) // Firebase ServerValue.TIMESTAMP
      });
    });

    it('should reject empty word submissions', async () => {
      await expect(gameController.submitWord('')).rejects.toThrow('Please enter a word');
      await expect(gameController.submitWord('   ')).rejects.toThrow('Please enter a word');
    });

    it('should handle Firebase errors during word submission', async () => {
      const mockSubmissionRef = firebaseManager.createMockDatabaseRef(`rooms/${roomCode}/submissions/${testPlayer.id}`);
      mockSubmissionRef.set.mockRejectedValue(new Error('Firebase connection failed'));
      mockDatabase.ref.mockReturnValue(mockSubmissionRef);

      await expect(gameController.submitWord('test')).rejects.toThrow('Failed to submit word');
    });

    it('should normalize word submissions to lowercase', async () => {
      const testWord = 'ELEPHANT';
      const mockSubmissionRef = firebaseManager.createMockDatabaseRef(`rooms/${roomCode}/submissions/${testPlayer.id}`);
      mockDatabase.ref.mockReturnValue(mockSubmissionRef);

      await gameController.submitWord(testWord);

      expect(mockSubmissionRef.set).toHaveBeenCalledWith(
        expect.objectContaining({
          word: 'elephant'
        })
      );
    });

    it('should handle concurrent word submissions from same player', async () => {
      const mockSubmissionRef = firebaseManager.createMockDatabaseRef(`rooms/${roomCode}/submissions/${testPlayer.id}`);
      mockDatabase.ref.mockReturnValue(mockSubmissionRef);

      // Submit two words simultaneously
      const promises = [
        gameController.submitWord('word1'),
        gameController.submitWord('word2')
      ];

      const results = await Promise.all(promises);
      
      expect(results).toEqual([true, true]);
      expect(mockSubmissionRef.set).toHaveBeenCalledTimes(2);
    });
  });

  describe('Leave Game Integration', () => {
    it('should successfully remove player from Firebase and cleanup resources', async () => {
      const mockPlayerRef = firebaseManager.createMockDatabaseRef(`rooms/${roomCode}/players/${testPlayer.id}`);
      const mockRoomRef = firebaseManager.createMockDatabaseRef(`rooms/${roomCode}`);
      const mockSubmissionsRef = firebaseManager.createMockDatabaseRef(`rooms/${roomCode}/submissions`);
      
      mockDatabase.ref.mockImplementation((path: string) => {
        if (path === `rooms/${roomCode}/players/${testPlayer.id}`) return mockPlayerRef;
        if (path === `rooms/${roomCode}`) return mockRoomRef;
        if (path === `rooms/${roomCode}/submissions`) return mockSubmissionsRef;
        return firebaseManager.createMockDatabaseRef(path);
      });

      // Mock localStorage
      const mockLocalStorage = {
        removeItem: jest.fn()
      };
      Object.defineProperty(global, 'localStorage', { value: mockLocalStorage });

      await gameController.leaveGame();

      // Verify Firebase operations
      expect(mockPlayerRef.remove).toHaveBeenCalled();
      expect(mockRoomRef.off).toHaveBeenCalled();
      expect(mockSubmissionsRef.off).toHaveBeenCalled();
      
      // Verify localStorage cleanup
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('currentRoom');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('currentPlayer');
    });

    it('should handle Firebase errors during leave game operation', async () => {
      const mockPlayerRef = firebaseManager.createMockDatabaseRef(`rooms/${roomCode}/players/${testPlayer.id}`);
      mockPlayerRef.remove.mockRejectedValue(new Error('Firebase error'));
      mockDatabase.ref.mockReturnValue(mockPlayerRef);

      await expect(gameController.leaveGame()).rejects.toThrow('Failed to leave room');
    });

    it('should cleanup all listeners when leaving game', async () => {
      const mockRoomRef = firebaseManager.createMockDatabaseRef(`rooms/${roomCode}`);
      const mockSubmissionsRef = firebaseManager.createMockDatabaseRef(`rooms/${roomCode}/submissions`);
      
      mockDatabase.ref.mockImplementation((path: string) => {
        if (path === `rooms/${roomCode}`) return mockRoomRef;
        if (path === `rooms/${roomCode}/submissions`) return mockSubmissionsRef;
        return firebaseManager.createMockDatabaseRef(path);
      });

      await gameController.leaveGame();

      // Verify all listeners are properly cleaned up
      expect(mockRoomRef.off).toHaveBeenCalled();
      expect(mockSubmissionsRef.off).toHaveBeenCalled();
    });
  });

  describe('Game State Management Integration', () => {
    it('should properly initialize game screen with Firebase data', () => {
      // Mock DOM elements
      document.getElementById = jest.fn().mockImplementation((id: string) => {
        const mockElement: any = {
          textContent: '',
          innerHTML: '',
          appendChild: jest.fn(),
          style: { display: '' },
          disabled: false
        };
        return mockElement;
      });

      const roomData = {
        ...testRoom,
        selectedPlayerId: 'other-player',
        prompt: 'Animals',
        secretWord: { text: 'elephant', category: 'Animals' },
        startTime: Date.now(),
        duration: 180
      };

      // Should not throw errors
      expect(() => gameController.startGameScreen(roomData)).not.toThrow();
      
      // Verify DOM updates were called
      expect(document.getElementById).toHaveBeenCalledWith('current-prompt');
      expect(document.getElementById).toHaveBeenCalledWith('secret-word');
      expect(document.getElementById).toHaveBeenCalledWith('game-players-container');
    });

    it('should setup Firebase listeners for real-time updates', () => {
      const mockSubmissionsRef = firebaseManager.createMockDatabaseRef(`rooms/${roomCode}/submissions`);
      mockDatabase.ref.mockReturnValue(mockSubmissionsRef);

      gameController.setupGameListeners();

      expect(mockDatabase.ref).toHaveBeenCalledWith(`rooms/${roomCode}/submissions`);
      expect(mockSubmissionsRef.on).toHaveBeenCalledWith('value', expect.any(Function));
    });

    it('should handle Firebase listener errors gracefully', () => {
      const mockSubmissionsRef = firebaseManager.createMockDatabaseRef(`rooms/${roomCode}/submissions`);
      mockSubmissionsRef.on.mockImplementation(() => {
        throw new Error('Listener setup failed');
      });
      mockDatabase.ref.mockReturnValue(mockSubmissionsRef);

      // Should throw the error as expected, but the app should handle it
      expect(() => gameController.setupGameListeners()).toThrow('Listener setup failed');
    });
  });

  describe('Resource Cleanup Integration', () => {
    it('should cleanup all resources when controller is destroyed', () => {
      const mockRoomRef = firebaseManager.createMockDatabaseRef(`rooms/${roomCode}`);
      const mockSubmissionsRef = firebaseManager.createMockDatabaseRef(`rooms/${roomCode}/submissions`);
      
      mockDatabase.ref.mockImplementation((path: string) => {
        if (path === `rooms/${roomCode}`) return mockRoomRef;
        if (path === `rooms/${roomCode}/submissions`) return mockSubmissionsRef;
        return firebaseManager.createMockDatabaseRef(path);
      });

      // Setup some listeners first
      gameController.setupGameListeners();

      // Now cleanup
      gameController.cleanup();

      // Verify all Firebase listeners are removed
      expect(mockRoomRef.off).toHaveBeenCalled();
      expect(mockSubmissionsRef.off).toHaveBeenCalled();
    });

    it('should handle cleanup even when database is unavailable', () => {
      // Set database to null to simulate disconnection
      gameController = new GameController(roomCode, testPlayer, null);

      // Should not throw errors
      expect(() => gameController.cleanup()).not.toThrow();
    });
  });

  describe('Error Recovery Integration', () => {
    it('should handle network reconnection scenarios', async () => {
      const mockSubmissionRef = firebaseManager.createMockDatabaseRef(`rooms/${roomCode}/submissions/${testPlayer.id}`);
      
      // First call fails, second succeeds
      mockSubmissionRef.set
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);
      
      mockDatabase.ref.mockReturnValue(mockSubmissionRef);

      // First submission should fail
      await expect(gameController.submitWord('test1')).rejects.toThrow('Failed to submit word');
      
      // Second submission should succeed after "reconnection"
      const result = await gameController.submitWord('test2');
      expect(result).toBe(true);
    });

    it('should handle partial Firebase operations gracefully', async () => {
      // Create a new controller instance for this test to avoid interfering with cleanup
      const testController = new GameController(roomCode, testPlayer, mockDatabase);
      
      const mockPlayerRef = firebaseManager.createMockDatabaseRef(`rooms/${roomCode}/players/${testPlayer.id}`);
      const mockRoomRef = firebaseManager.createMockDatabaseRef(`rooms/${roomCode}`);
      
      // Player removal succeeds, but listener cleanup fails
      mockPlayerRef.remove.mockResolvedValue(undefined);
      mockRoomRef.off.mockImplementation(() => {
        throw new Error('Cleanup failed');
      });
      
      mockDatabase.ref.mockImplementation((path: string) => {
        if (path === `rooms/${roomCode}/players/${testPlayer.id}`) return mockPlayerRef;
        if (path === `rooms/${roomCode}`) return mockRoomRef;
        return firebaseManager.createMockDatabaseRef(path);
      });

      // Current implementation throws on any cleanup failure
      await expect(testController.leaveGame()).rejects.toThrow('Failed to leave room');
      expect(mockPlayerRef.remove).toHaveBeenCalled();
      
      // Clean up the test controller immediately (this may throw, but that's expected)
      try {
        testController.cleanup();
      } catch (error) {
        // Expected to throw due to our mock
      }
    });
  });
});