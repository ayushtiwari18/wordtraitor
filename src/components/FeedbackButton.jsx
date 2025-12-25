import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send } from 'lucide-react'

const FeedbackButton = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Create Google Form submission
    // Replace with your actual Google Form URL and field IDs
    const formUrl = 'https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse'
    const feedbackFieldId = 'entry.YOUR_FEEDBACK_FIELD_ID'
    const emailFieldId = 'entry.YOUR_EMAIL_FIELD_ID'
    
    // For now, just show success (you'll need to configure Google Form)
    console.log('Feedback submitted:', { feedback, email })
    
    // Open form in new tab (temporary solution)
    // window.open('https://forms.gle/YOUR_FORM_LINK', '_blank')
    
    setSubmitted(true)
    setTimeout(() => {
      setIsOpen(false)
      setSubmitted(false)
      setFeedback('')
      setEmail('')
    }, 2000)
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
                    <p className="text-gray-400">Your feedback helps us improve</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">
                        Your Feedback *
                      </label>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Tell us what you think...\n\n• Bug reports\n• Feature requests\n• General feedback"
                        required
                        rows={5}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
                      />
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
                      />
                      <p className="text-gray-500 text-xs mt-1">We'll only use this to follow up if needed</p>
                    </div>

                    <button
                      type="submit"
                      disabled={!feedback.trim()}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Send size={18} />
                      Send Feedback
                    </button>
                  </form>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-800 px-6 py-3 border-t border-gray-700">
                <p className="text-gray-400 text-xs text-center">
                  💡 Your feedback is anonymous unless you provide your email
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