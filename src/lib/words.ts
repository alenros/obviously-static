import type { Word } from './word';

/**
 * Partial Fisher-Yates shuffle - randomly pick n unique words from the word list
 * 
 * OPTIMIZATION: Instead of shuffling the entire array (O(N) where N = total words),
 * we only perform 'count' swaps from the end (O(n) where n = words needed).
 * 
 * Example: For 2 players needing 7 words from a 54-word list:
 *   - Full shuffle: 54 swaps
 *   - Partial shuffle: 7 swaps (7.7x faster)
 * 
 * The last 'count' elements are guaranteed to be uniformly random and unique.
 */
export function pickRandomWords(count: number): Word[] {
    if (count > words.length) {
        throw new Error(`Cannot pick ${count} words from a list of ${words.length}`);
    }

    const shuffled = [...words];
    
    // Perform 'count' swaps from the end of the array
    // Loop: i = last index down to (last - count + 1)
    for (let i = shuffled.length - 1; i >= shuffled.length - count; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Return the last 'count' elements (the shuffled portion)
    return shuffled.slice(-count);
}

export const words: Word[] = [
    { text: 'Apple', category: 'Fruit' },
    { text: 'Banana', category: 'Fruit' },
    { text: 'Carrot', category: 'Vegetable' },
    { text: 'Dragonfruit', category: 'Fruit' },
    { text: 'Eggplant', category: 'Vegetable' },
    { text: 'Fig', category: 'Fruit' },
    { text: 'Grape', category: 'Fruit' },
    { text: 'Honeydew', category: 'Fruit' },
    { text: 'Iceberg Lettuce', category: 'Vegetable' },
    { text: 'Jackfruit', category: 'Fruit' },
    { text: 'Kale', category: 'Vegetable' },
    { text: 'Lemon', category: 'Fruit' },
    { text: 'Mango', category: 'Fruit' },
    { text: 'Nectarine', category: 'Fruit' },
    { text: 'Olive', category: 'Fruit' },
    { text: 'Pepper', category: 'Vegetable' },
    { text: 'Quince', category: 'Fruit' },
    { text: 'Radish', category: 'Vegetable' },
    { text: 'Spinach', category: 'Vegetable' },
    { text: 'Tomato', category: 'Fruit' },
    { text: 'Ugli Fruit', category: 'Fruit' },
    { text: 'Zucchini', category: 'Vegetable' },
    // Animals
    { text: 'Cat', category: 'Animal' },
    { text: 'Dog', category: 'Animal' },
    { text: 'Elephant', category: 'Animal' },
    { text: 'Tiger', category: 'Animal' },
    { text: 'Bird', category: 'Animal' },
    { text: 'Fish', category: 'Animal' },
    { text: 'Horse', category: 'Animal' },
    { text: 'Cow', category: 'Animal' },
    // Movies
    { text: 'Avatar', category: 'Movie' },
    { text: 'Titanic', category: 'Movie' },
    { text: 'Batman', category: 'Movie' },
    { text: 'Superman', category: 'Movie' },
    { text: 'Star Wars', category: 'Movie' },
    // sports
    { text: 'Football', category: 'Sport' },
    { text: 'Basketball', category: 'Sport' },
    { text: 'Tennis', category: 'Sport' },
    { text: 'Soccer', category: 'Sport' },
    { text: 'Baseball', category: 'Sport' },
    { text: 'Hockey', category: 'Sport' },
    { text: 'Golf', category: 'Sport' },
    { text: 'Cricket', category: 'Sport' },
    { text: 'Rugby', category: 'Sport' },
    { text: 'Swimming', category: 'Sport' },
    // Professions
    { text: 'Doctor', category: 'Profession' },
    { text: 'Teacher', category: 'Profession' },
    { text: 'Engineer', category: 'Profession' },
    { text: 'Artist', category: 'Profession' },
    { text: 'Chef', category: 'Profession' },
    { text: 'Pilot', category: 'Profession' },
    { text: 'Nurse', category: 'Profession' },
    
];
