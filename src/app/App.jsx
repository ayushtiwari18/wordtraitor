import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ErrorBoundary from '../components/ErrorBoundary'
import Home from './pages/Home'
import Lobby from './pages/Lobby'
import Game from './pages/Game'
import Settings from './pages/Settings'
import Developers from './pages/Developers'
import About from './pages/About'
import Privacy from './pages/Privacy'
import FeedbackButton from '../components/FeedbackButton'
import MusicToggle from '../components/MusicToggle'
import useGameStore from '../store/gameStore'

function App() {
  const initializeGuest = useGameStore(state => state.initializeGuest)
  const myUserId = useGameStore(state => state.myUserId)

  useEffect(() => {
    // Initialize guest ID ONCE on app start
    console.log('🚀 App mounted, initializing guest...')
    initializeGuest()
  }, [initializeGuest])

  return (
    <ErrorBoundary>
      <div data-testid="app-root" data-guest-initialized={!!myUserId}>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lobby/:roomCode" element={<Lobby />} />
            <Route path="/game/:roomId" element={<Game />} />
            {/* ❌ REMOVED: <Route path="/results/:roomId" element={<Results />} /> */}
            {/* Game results now shown in POST_ROUND phase inside Game.jsx */}
            <Route path="/settings" element={<Settings />} />
            <Route path="/developers" element={<Developers />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
          </Routes>
          
          {/* Floating Feedback Button - Available on all pages */}
          <FeedbackButton />
          
          {/* Floating Music Toggle - Available on all pages */}
          <MusicToggle />
        </Router>
      </div>
    </ErrorBoundary>
  )
}

export default App