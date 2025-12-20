// Game constants and configuration

export const GAME_PHASES = {
  WHISPER: 'WHISPER',
  HINT_DROP: 'HINT_DROP',
  DEBATE: 'DEBATE',
  VERDICT: 'VERDICT',
  REVEAL: 'REVEAL'
}

export const GAME_STATUS = {
  LOBBY: 'LOBBY',
  PLAYING: 'PLAYING',
  FINISHED: 'FINISHED'
}

export const GAME_MODES = {
  SILENT: 'SILENT',
  REAL: 'REAL',
  FLASH: 'FLASH',
  AFTER_DARK: 'AFTER_DARK'
}

export const DIFFICULTY_LEVELS = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD'
}

export const WORD_PACKS = {
  GENERAL: 'GENERAL',
  MOVIES: 'MOVIES',
  TECH: 'TECH',
  TRAVEL: 'TRAVEL',
  OCEAN: 'OCEAN',
  AFTER_DARK: 'AFTER_DARK'
}

export const ROLES = {
  CITIZEN: 'CITIZEN',
  TRAITOR: 'TRAITOR'
}

export const WINNERS = {
  WORD_KEEPERS: 'WORD_KEEPERS',
  TRAITOR: 'TRAITOR'
}

// Timer durations (in seconds)
export const TIMERS = {
  WHISPER: 15,
  HINT_DROP: 30,
  DEBATE: 120,
  VERDICT: 20,
  REVEAL: 10
}

// Player constraints
export const PLAYER_LIMITS = {
  MIN: 4,
  MAX: 12,
  DEFAULT: 8
}

// UI constants
export const COLORS = {
  DARK_BG: '#0D0D0D',
  DARK_CARD: '#1A1A1A',
  NEON_CYAN: '#00FFFF',
  NEON_PURPLE: '#8A2BE2',
  SUCCESS: '#10B981',
  ERROR: '#EF4444',
  WARNING: '#F59E0B'
}

// Animation durations
export const ANIMATIONS = {
  FAST: 0.2,
  NORMAL: 0.3,
  SLOW: 0.5
}

// Error messages
export const ERROR_MESSAGES = {
  AUTH_FAILED: 'Authentication failed. Please try again.',
  ROOM_NOT_FOUND: 'Room not found. Please check the code.',
  ROOM_FULL: 'This room is full.',
  GAME_STARTED: 'Game has already started.',
  NOT_ENOUGH_PLAYERS: 'Need at least 4 players to start.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  GENERIC: 'Something went wrong. Please try again.'
}

// Success messages
export const SUCCESS_MESSAGES = {
  ROOM_CREATED: 'Room created successfully!',
  JOINED_ROOM: 'Joined room successfully!',
  HINT_SUBMITTED: 'Hint submitted!',
  VOTE_SUBMITTED: 'Vote submitted!'
}