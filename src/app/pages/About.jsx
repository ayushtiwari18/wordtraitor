import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Users, Shield, Zap, Brain, Heart, ArrowLeft } from 'lucide-react'

const About = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-purple-500/20 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              x: [null, Math.random() * window.innerWidth],
            }}
            transition={{
              duration: Math.random() * 10 + 20,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/')}
          className="mb-8 flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="text-6xl mb-4">🎭</div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            About Word<span className="text-red-500">Traitor</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            A thrilling social deduction word game where trust is everything and deception is the key
          </p>
        </motion.div>

        {/* What is WordTraitor */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-400" />
            What is WordTraitor?
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            WordTraitor is a real-time multiplayer social deduction game where players must work together to identify the traitor among them. Each round, all citizens receive the same secret word, but the traitor gets a different one. Through hints, discussion, and careful observation, players must deduce who's lying.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed">
            Built with modern web technologies, WordTraitor offers seamless anonymous gameplay - no accounts needed! Just create a room, share the code with friends, and start playing instantly.
          </p>
        </motion.section>

        {/* Key Features */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <Zap className="w-8 h-8 text-cyan-400" />
            Key Features
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="text-3xl">🎮</div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">No Login Required</h3>
                <p className="text-gray-400">Jump straight into the action with anonymous gameplay</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">⚡</div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Real-Time Multiplayer</h3>
                <p className="text-gray-400">Instant updates powered by Supabase Realtime</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">🎨</div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Beautiful UI</h3>
                <p className="text-gray-400">Smooth animations and modern dark design</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">🎯</div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Multiple Game Modes</h3>
                <p className="text-gray-400">Silent mode, voice chat, and customizable settings</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">📚</div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Word Packs</h3>
                <p className="text-gray-400">General, Movies, Tech, Food, Travel, and more</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">⚙️</div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Customizable</h3>
                <p className="text-gray-400">Adjust timers, traitor count, and difficulty</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* How It Works */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-400" />
            How It Works
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                1
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Create or Join a Room</h3>
                <p className="text-gray-400">Host creates a room with a 6-character code. Share it with 4-12 friends to join.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                2
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Receive Your Word</h3>
                <p className="text-gray-400">Citizens get the same word. The traitor gets a different but related word.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                3
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Drop Hints</h3>
                <p className="text-gray-400">Each player submits a hint about their word without revealing it directly.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                4
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Debate & Vote</h3>
                <p className="text-gray-400">Discuss who seems suspicious, then vote to eliminate the traitor.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                5
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Win or Lose</h3>
                <p className="text-gray-400">Citizens win if they eliminate all traitors. Traitors win if they outnumber citizens.</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Tech Stack */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <Users className="w-8 h-8 text-pink-400" />
            Built With
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900/50 p-4 rounded-lg text-center border border-gray-700">
              <div className="text-3xl mb-2">⚛️</div>
              <p className="text-white font-semibold">React</p>
              <p className="text-gray-400 text-sm">Frontend</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg text-center border border-gray-700">
              <div className="text-3xl mb-2">🗄️</div>
              <p className="text-white font-semibold">Supabase</p>
              <p className="text-gray-400 text-sm">Database</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg text-center border border-gray-700">
              <div className="text-3xl mb-2">🎨</div>
              <p className="text-white font-semibold">Tailwind</p>
              <p className="text-gray-400 text-sm">Styling</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg text-center border border-gray-700">
              <div className="text-3xl mb-2">✨</div>
              <p className="text-white font-semibold">Framer Motion</p>
              <p className="text-gray-400 text-sm">Animations</p>
            </div>
          </div>
        </motion.section>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center"
        >
          <Heart className="w-16 h-16 text-white mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Play?</h2>
          <p className="text-purple-100 text-lg mb-6">Gather your friends and start a game of deception!</p>
          <button
            onClick={() => navigate('/')}
            className="bg-white text-purple-600 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go to Home
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default About