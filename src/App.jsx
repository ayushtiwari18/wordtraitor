import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './app/pages/Home'
import Lobby from './app/pages/Lobby'
import Game from './app/pages/Game'
import Results from './app/pages/Results'
import useGameStore from './store/gameStore'

function App() {
  const initializeGuest = useGameStore(state => state.initializeGuest)

  useEffect(() => {
    // Initialize guest ID ONCE on app start
    initializeGuest()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby/:roomId" element={<Lobby />} />
        <Route path="/game/:roomId" element={<Game />} />
        <Route path="/results/:roomId" element={<Results />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App