import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send } from 'lucide-react'
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
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

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

  const getPlayerColor = (userId) => {
    // Generate consistent color based on userId
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

  return (
    <div className="flex flex-col h-full bg-gray-800 border-2 border-gray-700 rounded-xl overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-700">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <span className="text-xl">💬</span>
          <span>Team Chat</span>
        </h3>
        <p className="text-xs text-gray-400 mt-1">Discuss the hints and find the traitor</p>
      </div>

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
        style={{ maxHeight: '400px' }}
      >
        <AnimatePresence initial={false}>
          {chatMessages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-500 py-8"
            >
              <p className="text-4xl mb-2">👋</p>
              <p>No messages yet. Start the discussion!</p>
            </motion.div>
          ) : (
            chatMessages.map((msg, index) => {
              const isMyMessage = msg.user_id === myUserId
              const player = participants.find(p => p.user_id === msg.user_id)
              const playerColor = getPlayerColor(msg.user_id)

              return (
                <motion.div
                  key={msg.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      isMyMessage
                        ? 'bg-purple-600/20 border border-purple-500'
                        : 'bg-gray-900 border border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${playerColor}`}>
                        {msg.username || player?.username || 'Unknown'}
                      </span>
                      {isMyMessage && (
                        <span className="text-xs text-purple-400">(You)</span>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-white text-sm break-words">{msg.message}</p>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 bg-gray-900 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            maxLength={200}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!message.trim() || isSending}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {message.length}/200 characters
        </p>
      </form>
    </div>
  )
}

export default ChatBox