import { create } from 'zustand'
import { getRandomWordPair } from '@/lib/wordPacks'

export const GAME_PHASES = {
  WHISPER: 'whisper',
  HINT_DROP: 'hint_drop',
  DEBATE: 'debate',
  VERDICT: 'verdict',
  REVEAL: 'reveal'
}

export const PHASE_DURATIONS = {
  [GAME_PHASES.WHISPER]: 15,
  [GAME_PHASES.HINT_DROP]: 30,
  [GAME_PHASES.DEBATE]: 120,
  [GAME_PHASES.VERDICT]: 20,
  [GAME_PHASES.REVEAL]: 10
}

export const useGameStore = create((set, get) => ({
  // Room state
  roomCode: null,
  gameSettings: null,
  
  // Round state
  currentPhase: null,
  phaseTimeLeft: 0,
  roundNumber: 1,
  
  // Player state
  players: [],
  myRole: null, // 'keeper' or 'traitor'
  myWord: null,
  traitorId: null,
  
  // Game data
  hints: [],
  votes: [],
  eliminatedPlayers: [],
  
  // Results
  winner: null,
  gameOver: false,
  
  // Actions
  initializeGame: (roomCode, settings, players, guestId) => {
    // Pick random traitor
    const traitorIndex = Math.floor(Math.random() * players.length)
    const traitorId = players[traitorIndex].id
    
    // Get word pair
    const wordPair = getRandomWordPair(settings.wordPack, settings.difficulty)
    
    // Determine my role and word
    const myRole = guestId === traitorId ? 'traitor' : 'keeper'
    const myWord = myRole === 'traitor' ? wordPair.traitor : wordPair.keeper
    
    set({
      roomCode,
      gameSettings: settings,
      players: players.map(p => ({
        ...p,
        isTraitor: p.id === traitorId,
        word: p.id === traitorId ? wordPair.traitor : wordPair.keeper,
        isEliminated: false
      })),
      myRole,
      myWord,
      traitorId,
      currentPhase: GAME_PHASES.WHISPER,
      phaseTimeLeft: PHASE_DURATIONS[GAME_PHASES.WHISPER],
      roundNumber: 1,
      hints: [],
      votes: [],
      eliminatedPlayers: [],
      winner: null,
      gameOver: false
    })
  },
  
  startPhase: (phase) => {
    set({
      currentPhase: phase,
      phaseTimeLeft: PHASE_DURATIONS[phase]
    })
  },
  
  decrementTimer: () => {
    const { phaseTimeLeft, currentPhase } = get()
    if (phaseTimeLeft > 0) {
      set({ phaseTimeLeft: phaseTimeLeft - 1 })
    } else {
      get().advancePhase()
    }
  },
  
  advancePhase: () => {
    const { currentPhase, votes, players, eliminatedPlayers } = get()
    
    switch (currentPhase) {
      case GAME_PHASES.WHISPER:
        get().startPhase(GAME_PHASES.HINT_DROP)
        break
      
      case GAME_PHASES.HINT_DROP:
        get().startPhase(GAME_PHASES.DEBATE)
        break
      
      case GAME_PHASES.DEBATE:
        get().startPhase(GAME_PHASES.VERDICT)
        break
      
      case GAME_PHASES.VERDICT:
        // Calculate votes
        const voteCounts = {}
        votes.forEach(vote => {
          voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + 1
        })
        
        // Find most voted player
        let mostVoted = null
        let maxVotes = 0
        Object.entries(voteCounts).forEach(([playerId, count]) => {
          if (count > maxVotes) {
            maxVotes = count
            mostVoted = playerId
          }
        })
        
        // Eliminate player
        if (mostVoted) {
          const eliminated = players.find(p => p.id === mostVoted)
          set({
            eliminatedPlayers: [...eliminatedPlayers, eliminated],
            players: players.map(p => 
              p.id === mostVoted ? { ...p, isEliminated: true } : p
            )
          })
          
          // Check win conditions
          const traitorEliminated = eliminated?.isTraitor
          const alivePlayers = players.filter(p => p.id !== mostVoted && !p.isEliminated)
          
          if (traitorEliminated) {
            set({ winner: 'keepers', gameOver: true })
          } else if (alivePlayers.length <= 2) {
            set({ winner: 'traitor', gameOver: true })
          }
        }
        
        get().startPhase(GAME_PHASES.REVEAL)
        break
      
      case GAME_PHASES.REVEAL:
        const { gameOver } = get()
        if (!gameOver) {
          // Start new round
          set({
            roundNumber: get().roundNumber + 1,
            hints: [],
            votes: []
          })
          get().startPhase(GAME_PHASES.HINT_DROP)
        }
        break
    }
  },
  
  submitHint: (playerId, hint) => {
    const { hints } = get()
    set({
      hints: [...hints, { playerId, hint, round: get().roundNumber }]
    })
  },
  
  submitVote: (voterId, targetId) => {
    const { votes } = get()
    // Remove previous vote from this voter
    const newVotes = votes.filter(v => v.voterId !== voterId)
    set({
      votes: [...newVotes, { voterId, targetId }]
    })
  },
  
  resetGame: () => {
    set({
      roomCode: null,
      gameSettings: null,
      currentPhase: null,
      phaseTimeLeft: 0,
      roundNumber: 1,
      players: [],
      myRole: null,
      myWord: null,
      traitorId: null,
      hints: [],
      votes: [],
      eliminatedPlayers: [],
      winner: null,
      gameOver: false
    })
  }
}))