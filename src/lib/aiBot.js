// AI Bot System for Testing
// Simulates computer players to test game flow

export class AIBot {
  constructor(name, personality = 'normal') {
    this.id = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.name = name
    this.personality = personality // 'normal', 'suspicious', 'clever'
    this.isBot = true
    this.role = null
    this.secretWord = null
  }

  // Generate hint based on word and role
  generateHint(word, isTraitor, allWords = []) {
    const hints = {
      // Common word associations
      'Ocean': ['Water', 'Blue', 'Deep', 'Waves', 'Salt'],
      'Sea': ['Water', 'Beach', 'Fish', 'Sailing', 'Coast'],
      'Piano': ['Keys', 'Music', 'Classical', 'Ivory', 'Grand'],
      'Guitar': ['Strings', 'Rock', 'Acoustic', 'Chord', 'Pluck'],
      'Cat': ['Meow', 'Furry', 'Pet', 'Whiskers', 'Paws'],
      'Kitten': ['Baby', 'Small', 'Cute', 'Young', 'Playful'],
      'Sun': ['Hot', 'Yellow', 'Day', 'Star', 'Bright'],
      'Moon': ['Night', 'Silver', 'Crater', 'Orbit', 'Lunar'],
      'Coffee': ['Bean', 'Hot', 'Morning', 'Caffeine', 'Brew'],
      'Tea': ['Leaves', 'Hot', 'Earl', 'Steep', 'Cup'],
      'Apple': ['Red', 'Fruit', 'Crisp', 'Tree', 'Bite'],
      'Orange': ['Citrus', 'Juice', 'Peel', 'Vitamin', 'Round'],
      'Mountain': ['Peak', 'High', 'Climb', 'Snow', 'Summit'],
      'Hill': ['Small', 'Slope', 'Green', 'Rolling', 'Valley'],
      'Winter': ['Cold', 'Snow', 'Ice', 'Season', 'Frost'],
      'Summer': ['Hot', 'Beach', 'Vacation', 'Season', 'Sunny'],
      'Pizza': ['Italian', 'Cheese', 'Slice', 'Pepperoni', 'Dough'],
      'Burger': ['Beef', 'Bun', 'Fast', 'Patty', 'Grill'],
    }

    let wordHints = hints[word] || ['Thing', 'Object', 'Item', 'Stuff', 'Something']

    if (isTraitor) {
      // Traitor tries to blend in but might be vague
      if (this.personality === 'clever') {
        // Use hints that could apply to both words
        const genericHints = ['Common', 'Popular', 'Known', 'Typical', 'Regular']
        return genericHints[Math.floor(Math.random() * genericHints.length)]
      } else if (this.personality === 'suspicious') {
        // Be obviously wrong (for testing)
        return 'Unusual'
      }
    }

    // Avoid already used hints
    const availableHints = wordHints.filter(h => 
      !allWords.some(existing => existing.toLowerCase() === h.toLowerCase())
    )

    if (availableHints.length === 0) {
      return wordHints[Math.floor(Math.random() * wordHints.length)]
    }

    return availableHints[Math.floor(Math.random() * availableHints.length)]
  }

  // Vote for a player (simple logic)
  chooseVoteTarget(players, hints, myId) {
    // Filter out self
    const others = players.filter(p => p.user_id !== myId && p.is_alive)
    
    if (others.length === 0) return null

    // If traitor, vote randomly
    if (this.role === 'TRAITOR') {
      return others[Math.floor(Math.random() * others.length)].user_id
    }

    // If citizen, look for suspicious hints
    const suspiciousPlayers = others.filter(p => {
      const playerHint = hints.find(h => h.user_id === p.user_id)
      if (!playerHint) return false
      
      // Check if hint seems off
      const hint = playerHint.hint_text.toLowerCase()
      return hint.length < 3 || hint === 'unusual' || hint === 'thing'
    })

    if (suspiciousPlayers.length > 0) {
      return suspiciousPlayers[Math.floor(Math.random() * suspiciousPlayers.length)].user_id
    }

    // Vote randomly
    return others[Math.floor(Math.random() * others.length)].user_id
  }
}

// Create bot squad for testing
export function createBotSquad() {
  return [
    new AIBot('Bot Alice', 'normal'),
    new AIBot('Bot Bob', 'normal'),
    new AIBot('Bot Charlie', 'suspicious'),
    new AIBot('Bot Diana', 'clever')
  ]
}

// Bot manager to handle bot actions
export class BotManager {
  constructor(bots) {
    this.bots = bots
    this.actionDelays = {
      hint: { min: 2000, max: 5000 },    // 2-5 seconds
      vote: { min: 3000, max: 7000 }     // 3-7 seconds
    }
  }

  // Get random delay for natural feeling
  getRandomDelay(action) {
    const { min, max } = this.actionDelays[action]
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  // Schedule bot to submit hint
  scheduleHintSubmission(bot, gameState, submitHintFn) {
    const delay = this.getRandomDelay('hint')
    
    setTimeout(async () => {
      try {
        // Check if bot already submitted
        const alreadySubmitted = gameState.hints.some(h => h.user_id === bot.id)
        if (alreadySubmitted) return

        // Get bot's secret from gameState
        const botSecret = gameState.botSecrets?.[bot.id]
        if (!botSecret) return

        const hint = bot.generateHint(
          botSecret.secret_word,
          botSecret.role === 'TRAITOR',
          gameState.hints.map(h => h.hint_text)
        )

        await submitHintFn(gameState.roomId, bot.id, hint)
        console.log(`🤖 ${bot.name} submitted hint: "${hint}"`)
      } catch (error) {
        console.error(`Error bot ${bot.name} submitting hint:`, error)
      }
    }, delay)
  }

  // Schedule bot to vote
  scheduleVote(bot, gameState, submitVoteFn) {
    const delay = this.getRandomDelay('vote')
    
    setTimeout(async () => {
      try {
        // Check if bot already voted
        const alreadyVoted = gameState.votes.some(v => v.voter_id === bot.id)
        if (alreadyVoted) return

        // Check if bot is alive
        const botParticipant = gameState.participants.find(p => p.user_id === bot.id)
        if (!botParticipant?.is_alive) return

        const target = bot.chooseVoteTarget(
          gameState.participants,
          gameState.hints,
          bot.id
        )

        if (target) {
          await submitVoteFn(gameState.roomId, bot.id, target)
          const targetName = gameState.participants.find(p => p.user_id === target)?.username
          console.log(`🤖 ${bot.name} voted for ${targetName}`)
        }
      } catch (error) {
        console.error(`Error bot ${bot.name} voting:`, error)
      }
    }, delay)
  }

  // Handle all bots for current phase
  handlePhase(phase, gameState, actions) {
    switch (phase) {
      case 'HINT_DROP':
        this.bots.forEach(bot => {
          this.scheduleHintSubmission(bot, gameState, actions.submitHint)
        })
        break
        
      case 'VERDICT':
        this.bots.forEach(bot => {
          this.scheduleVote(bot, gameState, actions.submitVote)
        })
        break
    }
  }
}

export default { AIBot, createBotSquad, BotManager }