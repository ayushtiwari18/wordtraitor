import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, AlertTriangle, Database, Eye, Lock, ArrowLeft, FileText } from 'lucide-react'

const Privacy = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
      {/* Animated background */}
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
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
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
          className="text-center mb-12"
        >
          <Shield className="w-20 h-20 text-purple-400 mx-auto mb-4" />
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Privacy & Terms
          </h1>
          <p className="text-lg text-gray-400">Last updated: December 25, 2025</p>
        </motion.div>

        {/* Disclaimer Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-red-500/10 border-2 border-red-500 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-red-400 mb-3">Important Disclaimer</h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-2">
                <strong>WordTraitor is provided "AS IS" for entertainment purposes only.</strong> We are NOT responsible for:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                <li>Any inappropriate content, behavior, or language used by players</li>
                <li>Disputes, arguments, or conflicts arising from gameplay</li>
                <li>Misuse of the platform or violation of our terms by users</li>
                <li>Any technical issues, data loss, or service interruptions</li>
                <li>Players' actions or communications during games</li>
              </ul>
              <p className="text-gray-300 text-lg mt-3">
                By using WordTraitor, you agree to use the platform responsibly and at your own risk.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Data Collection */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
            <Database className="w-8 h-8 text-cyan-400" />
            Data We Collect
          </h2>
          <div className="space-y-4 text-gray-300">
            <div>
              <h3 className="text-white font-semibold text-lg mb-2">Anonymous Gameplay Data</h3>
              <p>We store minimal data required for gameplay:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Username (chosen by you, not linked to any account)</li>
                <li>Guest ID (randomly generated, temporary)</li>
                <li>Game actions (hints, votes, chat messages)</li>
                <li>Room participation and timestamps</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-2">Feedback Data (Optional)</h3>
              <p>If you submit feedback, we collect:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Your feedback message</li>
                <li>Email address (only if you provide it)</li>
                <li>Browser information (for debugging)</li>
                <li>Submission timestamp</li>
              </ul>
            </div>
            <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 mt-4">
              <p className="text-green-400 font-semibold flex items-center gap-2">
                <Lock className="w-5 h-5" />
                No accounts, no passwords, no personal information required!
              </p>
            </div>
          </div>
        </motion.section>

        {/* How We Use Data */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
            <Eye className="w-8 h-8 text-purple-400" />
            How We Use Your Data
          </h2>
          <div className="space-y-3 text-gray-300">
            <p>✅ To enable real-time multiplayer gameplay</p>
            <p>✅ To improve the game based on your feedback</p>
            <p>✅ To fix bugs and technical issues</p>
            <p>✅ To maintain game rooms and player sessions</p>
            <p className="mt-4 font-semibold text-white">We DO NOT:</p>
            <p>❌ Sell your data to third parties</p>
            <p>❌ Use your data for advertising</p>
            <p>❌ Track you across other websites</p>
            <p>❌ Require authentication or personal information</p>
          </div>
        </motion.section>

        {/* User Responsibilities */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
            <FileText className="w-8 h-8 text-yellow-400" />
            Your Responsibilities
          </h2>
          <div className="space-y-3 text-gray-300">
            <p className="font-semibold text-white">By using WordTraitor, you agree to:</p>
            <p>✓ Use appropriate language and behavior</p>
            <p>✓ Respect other players</p>
            <p>✓ Not spam, harass, or abuse the platform</p>
            <p>✓ Not use the game for illegal activities</p>
            <p>✓ Accept that gameplay is at your own risk</p>
            <p className="mt-4 bg-yellow-500/10 border border-yellow-500 rounded-lg p-4">
              <span className="text-yellow-400 font-semibold">⚠️ Warning:</span> We reserve the right to terminate access for users who violate these terms or misuse the platform.
            </p>
          </div>
        </motion.section>

        {/* Data Retention */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-400" />
            Data Retention
          </h2>
          <div className="space-y-3 text-gray-300">
            <p><strong className="text-white">Game Data:</strong> Stored temporarily for active games. Rooms and associated data may be automatically deleted after periods of inactivity.</p>
            <p><strong className="text-white">Feedback:</strong> Stored indefinitely to help improve the game.</p>
            <p><strong className="text-white">Guest IDs:</strong> Temporary identifiers that expire when you close your browser or clear cookies.</p>
          </div>
        </motion.section>

        {/* Third-Party Services */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Third-Party Services</h2>
          <div className="space-y-3 text-gray-300">
            <p>WordTraitor uses <strong className="text-white">Supabase</strong> for database and real-time features. Your data is subject to Supabase's privacy policy and security measures.</p>
            <p>We do not integrate with any social media platforms, analytics services, or advertising networks.</p>
          </div>
        </motion.section>

        {/* Contact */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Questions?</h2>
          <p className="text-purple-100 text-lg mb-6">
            If you have any questions about our privacy practices or terms, use the feedback button to reach out.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-white text-purple-600 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
          >
            Back to Home
          </button>
        </motion.section>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-gray-500 text-sm mt-8"
        >
          <p>WordTraitor • A social deduction game • Built for fun, not profit</p>
          <p className="mt-2">We reserve the right to update these terms at any time.</p>
        </motion.div>
      </div>
    </div>
  )
}

export default Privacy