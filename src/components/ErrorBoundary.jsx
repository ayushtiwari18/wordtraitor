import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 ErrorBoundary caught an error:')
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Component Stack:', errorInfo.componentStack)
    
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }))

    // Optional: Send to error tracking service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    })
    
    // Try to recover by reloading the page
    window.location.reload()
  }

  handleGoHome = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Too many errors in quick succession - prevent infinite loop
      if (this.state.errorCount > 3) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-red-900 to-gray-900">
            <div className="max-w-md mx-auto px-6 py-8 bg-gray-800 border-2 border-red-500 rounded-2xl text-center">
              <div className="text-6xl mb-4">💥</div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Critical Error
              </h1>
              <p className="text-gray-400 mb-6">
                The app encountered multiple errors. Please refresh the page or go home.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold text-white transition-colors"
                >
                  🏠 Go Home
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-white transition-colors"
                >
                  🔄 Refresh Page
                </button>
              </div>
            </div>
          </div>
        )
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-red-900 to-gray-900">
          <div className="max-w-md mx-auto px-6 py-8 bg-gray-800 border-2 border-red-500 rounded-2xl text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-400 mb-4">
              The game encountered an unexpected error. Your progress may have been saved.
            </p>
            
            {/* Show error details in development */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 p-4 bg-gray-900 rounded-lg text-left">
                <summary className="text-red-400 font-semibold cursor-pointer mb-2">
                  Error Details (Dev Mode)
                </summary>
                <pre className="text-xs text-gray-400 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-4 justify-center mt-6">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold text-white transition-colors"
              >
                🔄 Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-white transition-colors"
              >
                🏠 Go Home
              </button>
            </div>

            <p className="text-gray-500 text-sm mt-6">
              If this keeps happening, please refresh the page or contact support.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary