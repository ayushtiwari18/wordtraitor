// Word pairs database for the game
// Each pair has a keeper word and traitor word

export const WORD_PACKS = {
  GENERAL: [
    { keeper: 'Ocean', traitor: 'Sea', difficulty: 'easy' },
    { keeper: 'Moon', traitor: 'Sun', difficulty: 'easy' },
    { keeper: 'Cat', traitor: 'Dog', difficulty: 'easy' },
    { keeper: 'Coffee', traitor: 'Tea', difficulty: 'easy' },
    { keeper: 'Winter', traitor: 'Summer', difficulty: 'easy' },
    { keeper: 'Mountain', traitor: 'Hill', difficulty: 'medium' },
    { keeper: 'River', traitor: 'Stream', difficulty: 'medium' },
    { keeper: 'Book', traitor: 'Novel', difficulty: 'medium' },
    { keeper: 'Car', traitor: 'Truck', difficulty: 'medium' },
    { keeper: 'City', traitor: 'Town', difficulty: 'medium' },
    { keeper: 'Thunder', traitor: 'Lightning', difficulty: 'hard' },
    { keeper: 'Dawn', traitor: 'Dusk', difficulty: 'hard' },
    { keeper: 'Forest', traitor: 'Jungle', difficulty: 'hard' },
    { keeper: 'Lake', traitor: 'Pond', difficulty: 'hard' },
    { keeper: 'Desert', traitor: 'Beach', difficulty: 'hard' }
  ],
  MOVIES: [
    { keeper: 'Actor', traitor: 'Actress', difficulty: 'easy' },
    { keeper: 'Cinema', traitor: 'Theater', difficulty: 'easy' },
    { keeper: 'Hero', traitor: 'Villain', difficulty: 'easy' },
    { keeper: 'Comedy', traitor: 'Tragedy', difficulty: 'medium' },
    { keeper: 'Director', traitor: 'Producer', difficulty: 'medium' },
    { keeper: 'Sequel', traitor: 'Prequel', difficulty: 'medium' },
    { keeper: 'Blockbuster', traitor: 'Indie', difficulty: 'hard' },
    { keeper: 'Premiere', traitor: 'Screening', difficulty: 'hard' },
    { keeper: 'Script', traitor: 'Screenplay', difficulty: 'hard' }
  ],
  TECH: [
    { keeper: 'Laptop', traitor: 'Desktop', difficulty: 'easy' },
    { keeper: 'Website', traitor: 'App', difficulty: 'easy' },
    { keeper: 'Mouse', traitor: 'Keyboard', difficulty: 'easy' },
    { keeper: 'Software', traitor: 'Hardware', difficulty: 'medium' },
    { keeper: 'Cloud', traitor: 'Server', difficulty: 'medium' },
    { keeper: 'Frontend', traitor: 'Backend', difficulty: 'medium' },
    { keeper: 'Algorithm', traitor: 'Function', difficulty: 'hard' },
    { keeper: 'Database', traitor: 'Repository', difficulty: 'hard' },
    { keeper: 'Compiler', traitor: 'Interpreter', difficulty: 'hard' }
  ],
  TRAVEL: [
    { keeper: 'Airport', traitor: 'Station', difficulty: 'easy' },
    { keeper: 'Hotel', traitor: 'Motel', difficulty: 'easy' },
    { keeper: 'Passport', traitor: 'Visa', difficulty: 'easy' },
    { keeper: 'Beach', traitor: 'Coast', difficulty: 'medium' },
    { keeper: 'Tourist', traitor: 'Traveler', difficulty: 'medium' },
    { keeper: 'Journey', traitor: 'Trip', difficulty: 'medium' },
    { keeper: 'Expedition', traitor: 'Adventure', difficulty: 'hard' },
    { keeper: 'Destination', traitor: 'Location', difficulty: 'hard' },
    { keeper: 'Itinerary', traitor: 'Schedule', difficulty: 'hard' }
  ]
}

// Get word pairs by pack and difficulty
export const getWordPairs = (pack = 'GENERAL', difficulty = 'MEDIUM') => {
  const packWords = WORD_PACKS[pack] || WORD_PACKS.GENERAL
  
  if (difficulty === 'EASY') {
    return packWords.filter(w => w.difficulty === 'easy')
  } else if (difficulty === 'HARD') {
    return packWords.filter(w => w.difficulty === 'hard')
  } else {
    // Medium includes easy and medium
    return packWords.filter(w => w.difficulty === 'easy' || w.difficulty === 'medium')
  }
}

// Get random word pair
export const getRandomWordPair = (pack = 'GENERAL', difficulty = 'MEDIUM') => {
  const pairs = getWordPairs(pack, difficulty)
  return pairs[Math.floor(Math.random() * pairs.length)]
}