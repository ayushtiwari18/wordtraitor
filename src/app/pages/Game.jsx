import PageContainer from '@/components/PageContainer'
import AppHeader from '@/components/AppHeader'
import Card from '@/components/Card'

const Game = () => {
  return (
    <PageContainer>
      <AppHeader />
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-heading font-bold text-white mb-4">
            Game Screen - Coming Soon
          </h1>
          <p className="text-gray-400 mb-8">
            Active gameplay with 5 phases will be implemented here:
          </p>
          <div className="space-y-4 text-left max-w-2xl mx-auto">
            <div className="p-4 bg-dark-bg rounded-lg">
              <h3 className="text-neon-cyan font-bold mb-2">Phase 1: The Whisper (15s)</h3>
              <p className="text-gray-400 text-sm">Display your secret word</p>
            </div>
            <div className="p-4 bg-dark-bg rounded-lg">
              <h3 className="text-neon-cyan font-bold mb-2">Phase 2: The Hint Drop (30s)</h3>
              <p className="text-gray-400 text-sm">Submit one-line hint about your word</p>
            </div>
            <div className="p-4 bg-dark-bg rounded-lg">
              <h3 className="text-neon-cyan font-bold mb-2">Phase 3: The Debate (120s)</h3>
              <p className="text-gray-400 text-sm">Discuss hints and identify suspicious players</p>
            </div>
            <div className="p-4 bg-dark-bg rounded-lg">
              <h3 className="text-neon-cyan font-bold mb-2">Phase 4: The Verdict (20s)</h3>
              <p className="text-gray-400 text-sm">Vote for who you think is the traitor</p>
            </div>
            <div className="p-4 bg-dark-bg rounded-lg">
              <h3 className="text-neon-cyan font-bold mb-2">Phase 5: The Reveal (10s)</h3>
              <p className="text-gray-400 text-sm">See vote results and eliminated player's word</p>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}

export default Game