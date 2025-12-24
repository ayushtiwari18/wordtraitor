import React from 'react'
import { motion } from 'framer-motion'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 ErrorBoundary caught error:', error)
    console.error('Component stack:', errorInfo.componentStack)
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
    
    // TODO: Send to error tracking service (Sentry, etc.)
    // logErrorToService(error, errorInfo)
  }

  handleReload = () => {
    // Try to preserve username
    const username = localStorage.getItem('username')
    
    // Clear potentially corrupted state
    sessionStorage.clear()
    
    // Restore username
    if (username) {
      localStorage.setItem('username', username)
    }
    
    // Reload page
    window.location.href = '/'
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border-2 border-red-500 rounded-2xl p-8 max-w-2xl w-full"
          >
            {/* Error Icon */}
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">💥</div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-400">
                Don't worry - your game progress might still be saved
              </p>
            </div>

            {/* Error Details (Development Mode) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-700 overflow-auto max-h-64">
                <p className="text-red-400 font-mono text-sm mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="text-gray-400 text-xs font-mono mt-2">
                    <summary className="cursor-pointer hover:text-white">
                      Component Stack
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={this.handleRetry}
                className="flex-1 py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
              >
                🔄 Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
              >
                🏠 Reload Game
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg">
              <p className="text-yellow-400 text-sm text-center">
                💡 If the error persists, try refreshing the page or rejoining the room
              </p>
            </div>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary