import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ChevronDown, Smile } from 'lucide-react'
import useGameStore from '../../store/gameStore'

const ChatBox = () => {
  const { 
    chatMessages, 
    myUserId, 
    sendChatMessage,
    participants 
  } = useGameStore()
  
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = chatContainerRef.current
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        setShowScrollButton(false)
      } else {
        setShowScrollButton(true)
      }
    }
  }, [chatMessages])

  // Handle scroll to detect if user is at bottom
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = chatContainerRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
      setShowScrollButton(!isAtBottom && chatMessages.length > 0)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowScrollButton(false)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!message.trim() || isSending) return

    setIsSending(true)
    try {
      await sendChatMessage(message.trim())
      setMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleInputChange = (e) => {
    setMessage(e.target.value)
    
    // Simulate typing indicator
    setIsTyping(true)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 1000)
  }

  const getPlayerColor = (userId) => {
    const colors = [
      'text-purple-400',
      'text-blue-400',
      'text-green-400',
      'text-yellow-400',
      'text-pink-400',
      'text-cyan-400',
      'text-orange-400',
      'text-red-400'
    ]
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const getPlayerBgColor = (userId) => {
    const colors = [
      'bg-purple-500/10 border-purple-500/30',
      'bg-blue-500/10 border-blue-500/30',
      'bg-green-500/10 border-green-500/30',
      'bg-yellow-500/10 border-yellow-500/30',
      'bg-pink-500/10 border-pink-500/30',
      'bg-cyan-500/10 border-cyan-500/30',
      'bg-orange-500/10 border-orange-500/30',
      'bg-red-500/10 border-red-500/30'
    ]
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800 border-2 border-gray-700 rounded-xl overflow-hidden shadow-lg">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-3 border-b border-gray-700">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <motion.span 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
            className="text-xl"
          >
            💬
          </motion.span>
          <span>Team Chat</span>
          <span className="ml-auto text-xs bg-neon-cyan/20 text-neon-cyan px-2 py-1 rounded-full">
            {chatMessages.length} messages
          </span>
        </h3>
        <p className="text-xs text-gray-400 mt-1">Discuss the hints and find the traitor</p>
      </div>

      {/* Messages Container */}
      <div className="relative flex-1">
        <div 
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto p-4 space-y-3 scroll-smooth"
          style={{ maxHeight: '400px' }}
        >
          <AnimatePresence initial={false}>
            {chatMessages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center text-gray-500 py-8"
              >
                <motion.p 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-4xl mb-2"
                >
                  👋
                </motion.p>
                <p>No messages yet. Start the discussion!</p>
              </motion.div>
            ) : (
              chatMessages.map((msg, index) => {
                const isMyMessage = msg.user_id === myUserId
                const player = participants.find(p => p.user_id === msg.user_id)
                const playerColor = getPlayerColor(msg.user_id)
                const playerBg = getPlayerBgColor(msg.user_id)

                return (
                  <motion.div
                    key={msg.id || index}
                    initial={{ opacity: 0, x: isMyMessage ? 20 : -20, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', duration: 0.3 }}
                    className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      className={`max-w-[80%] rounded-lg px-4 py-2 border transition-all ${
                        isMyMessage
                          ? 'bg-gradient-to-br from-purple-600/30 to-purple-600/10 border-purple-500/50 shadow-lg shadow-purple-500/20'
                          : `${playerBg} shadow-md`
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${playerColor}`}>
                          {msg.username || player?.username || 'Unknown'}
                        </span>
                        {isMyMessage && (
                          <span className="text-xs text-purple-400 font-medium">(You)</span>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-white text-sm break-words leading-relaxed">{msg.message}</p>
                    </motion.div>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to Bottom Button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={scrollToBottom}
              className="absolute bottom-4 right-4 bg-neon-cyan/90 hover:bg-neon-cyan text-dark-bg p-2 rounded-full shadow-lg hover:shadow-neon-cyan/50 transition-all"
            >
              <ChevronDown size={20} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 bg-gray-900 border-t border-gray-700">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={handleInputChange}
              placeholder="Type your message..."
              maxLength={200}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 transition-all"
              disabled={isSending}
            />
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-neon-cyan transition-colors"
            >
              <Smile size={18} />
            </motion.button>
          </div>
          <motion.button
            type="submit"
            disabled={!message.trim() || isSending}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg text-white transition-all flex items-center gap-2 shadow-lg disabled:shadow-none hover:shadow-purple-500/50"
          >
            {isSending ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Send className="w-4 h-4" />
              </motion.div>
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{isSending ? 'Sending' : 'Send'}</span>
          </motion.button>
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">
            {message.length}/200 characters
          </p>
          {isTyping && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-neon-cyan flex items-center gap-1"
            >
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ✍️
              </motion.span>
              Typing...
            </motion.p>
          )}
        </div>
      </form>
    </div>
  )
}

export default ChatBox