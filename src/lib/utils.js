// Utility functions

/**
 * Format time in MM:SS format
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Generate random room code
 */
export const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy:', err)
    return false
  }
}

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate username (3-20 chars, alphanumeric + underscore)
 */
export const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

/**
 * Validate room code (6 chars, alphanumeric)
 */
export const isValidRoomCode = (code) => {
  const codeRegex = /^[A-Z0-9]{6}$/
  return codeRegex.test(code)
}

/**
 * Get player count text
 */
export const getPlayerCountText = (count, max) => {
  return `${count}/${max} players`
}

/**
 * Get game mode display name
 */
export const getGameModeDisplay = (mode) => {
  const displays = {
    SILENT: 'Silent Circle',
    REAL: 'Real Circle',
    FLASH: 'Flash Round',
    AFTER_DARK: 'After Dark'
  }
  return displays[mode] || mode
}

/**
 * Get difficulty display
 */
export const getDifficultyDisplay = (difficulty) => {
  return difficulty.charAt(0) + difficulty.slice(1).toLowerCase()
}

/**
 * Get word pack display name
 */
export const getWordPackDisplay = (pack) => {
  const displays = {
    GENERAL: 'General',
    MOVIES: 'Movies',
    TECH: 'Tech',
    TRAVEL: 'Travel',
    OCEAN: 'Ocean',
    AFTER_DARK: 'After Dark 18+'
  }
  return displays[pack] || pack
}

/**
 * Calculate winner based on votes
 */
export const calculateWinner = (votes) => {
  const voteCounts = {}
  
  votes.forEach(vote => {
    voteCounts[vote.target_id] = (voteCounts[vote.target_id] || 0) + 1
  })
  
  let maxVotes = 0
  let winnerId = null
  
  Object.entries(voteCounts).forEach(([id, count]) => {
    if (count > maxVotes) {
      maxVotes = count
      winnerId = id
    }
  })
  
  return { winnerId, voteCount: maxVotes, voteCounts }
}

/**
 * Shuffle array
 */
export const shuffleArray = (array) => {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export const formatRelativeTime = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  }
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit)
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`
    }
  }
  
  return 'just now'
}