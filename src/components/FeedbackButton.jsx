import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Loader2 } from 'lucide-react'
import { feedbackHelpers } from '../lib/supabase'

const FeedbackButton = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (feedback.trim().length < 10) {
      setError('Feedback must be at least 10 characters')
      return
    }

    setIsSubmitting(true)
    setError('')
    
    try {
      await feedbackHelpers.submitFeedback(
        feedback,
        email || null
      )
      
      console.log('✅ Feedback submitted successfully!')
      setSubmitted(true)
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setIsOpen(false)
        setSubmitted(false)
        setFeedback('')
        setEmail('')
        setIsSubmitting(false)
      }, 2000)
      
    } catch (err) {
      console.error('❌ Feedback submission error:', err)
      setError(err.message || 'Failed to submit feedback. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Floating Feedback Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-2xl transition-shadow"
        aria-label="Feedback"
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        </motion.div>
        
        {/* Pulsing ring animation */}
        {!isOpen && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-purple-400"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Feedback Form Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 100, y: 100 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 100, y: 100 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-3rem)]"
          >
            <div className="bg-gray-900 border-2 border-purple-500 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <MessageSquare size={20} />
                  Share Your Feedback
                </h3>
                <p className="text-purple-100 text-sm">Help us improve WordTraitor!</p>
              </div>

              {/* Form */}
              <div className="p-6">
                {submitted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="text-6xl mb-4">✅</div>
                    <p className="text-white font-bold text-xl mb-2">Thank you!</p>
                    <p className="text-gray-400">Your feedback has been saved</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">
                        Your Feedback *
                      </label>
                      <textarea
                        value={feedback}
                        onChange={(e) => {
                          setFeedback(e.target.value)
                          setError('')
                        }}
                        placeholder="Tell us what you think...\n\n• Bug reports\n• Feature requests\n• General feedback"
                        required
                        minLength={10}
                        maxLength={5000}
                        rows={5}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
                        disabled={isSubmitting}
                      />
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-gray-500 text-xs">Min 10 characters</p>
                        <p className={`text-xs ${
                          feedback.length < 10 ? 'text-red-400' :
                          feedback.length > 4500 ? 'text-yellow-400' : 'text-gray-500'
                        }`}>
                          {feedback.length}/5000
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm mb-2">
                        Email (optional)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                        disabled={isSubmitting}
                      />
                      <p className="text-gray-500 text-xs mt-1">We'll only use this to follow up if needed</p>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!feedback.trim() || feedback.length < 10 || isSubmitting}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Send Feedback
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-800 px-6 py-3 border-t border-gray-700">
                <p className="text-gray-400 text-xs text-center">
                  💡 Your feedback is saved to our database{email ? '' : ' anonymously'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default FeedbackButton