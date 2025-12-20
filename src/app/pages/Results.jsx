import PageContainer from '@/components/PageContainer'
import AppHeader from '@/components/AppHeader'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { Trophy, Target, Users } from 'lucide-react'

const Results = () => {
  return (
    <PageContainer>
      <AppHeader />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card glow className="text-center mb-8">
            <Trophy size={64} className="text-neon-cyan mx-auto mb-4" />
            <h1 className="text-5xl font-heading font-bold text-white mb-2">
              Game Results
            </h1>
            <p className="text-2xl text-neon-cyan mb-4">Word Keepers Win!</p>
            <p className="text-gray-400">The traitor was caught!</p>
          </Card>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <Target className="text-neon-purple" size={24} />
                <h2 className="text-2xl font-heading font-bold text-white">Round Stats</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Rounds:</span>
                  <span className="text-white font-bold">3</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Game Duration:</span>
                  <span className="text-white font-bold">12:34</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Players Eliminated:</span>
                  <span className="text-white font-bold">2</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Traitor Identity:</span>
                  <span className="text-neon-cyan font-bold">Player 3</span>
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-neon-cyan" size={24} />
                <h2 className="text-2xl font-heading font-bold text-white">Player Awards</h2>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-dark-bg rounded-lg">
                  <p className="text-sm text-gray-400">Best Hint</p>
                  <p className="text-white font-bold">Player 1</p>
                </div>
                <div className="p-3 bg-dark-bg rounded-lg">
                  <p className="text-sm text-gray-400">Sharpest Eye</p>
                  <p className="text-white font-bold">Player 2</p>
                </div>
                <div className="p-3 bg-dark-bg rounded-lg">
                  <p className="text-sm text-gray-400">Most Suspicious</p>
                  <p className="text-white font-bold">Player 4</p>
                </div>
              </div>
            </Card>
          </div>
          
          <Card className="text-center">
            <div className="flex gap-4 justify-center">
              <Button variant="primary" size="lg">Play Again</Button>
              <Button variant="outline" size="lg">Back to Home</Button>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}

export default Results