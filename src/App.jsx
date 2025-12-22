import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './app/pages/Home'
import Lobby from './app/pages/Lobby'
import Game from './app/pages/Game'
import Results from './app/pages/Results'
import useGameStore from './store/gameStore'

function App() {
  const initializeGuest = useGameStore(state => state.initializeGuest)
  const myUserId = useGameStore(state => state.myUserId)

  useEffect(() => {
    // Initialize guest ID ONCE on app start
    console.log('🚀 App mounted, initializing guest...')
    initializeGuest()
  }, [initializeGuest])

  return (
    <div data-testid="app-root" data-guest-initialized={!!myUserId}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby/:roomId" element={<Lobby />} />
          <Route path="/game/:roomId" element={<Game />} />
          <Route path="/results/:roomId" element={<Results />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App