import React from 'react'
import { motion } from 'framer-motion'
import { Github, Linkedin, Mail, Code, Palette, Database, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const developers = [
  {
    id: 1,
    name: 'Ayush Tiwari',
    role: 'Full Stack Developer',
    roleIcon: Code,
    description: 'Architect of deception. Builds the systems that make betrayal possible.',
    avatar: 'https://avatars.githubusercontent.com/u/90121562?v=4',
    skills: ['React', 'Node.js', 'Supabase', 'Real-time Systems'],
    github: 'https://github.com/ayushtiwari18',
    linkedin: 'https://www.linkedin.com/in/ayush-tiwari',
    email: 'ayush@wordtraitor.com',
    gradient: 'from-purple-600 to-pink-600'
  },
  {
    id: 2,
    name: 'Sarah Chen',
    role: 'UI/UX Designer',
    roleIcon: Palette,
    description: 'Crafts the visual language of lies. Makes mistrust beautiful.',
    avatar: 'https://i.pravatar.cc/300?img=32',
    skills: ['Figma', 'Design Systems', 'Animation', 'User Research'],
    github: 'https://github.com/sarahchen',
    linkedin: 'https://www.linkedin.com/in/sarah-chen',
    email: 'sarah@wordtraitor.com',
    gradient: 'from-cyan-600 to-blue-600'
  },
  {
    id: 3,
    name: 'Marcus Rodriguez',
    role: 'Backend Engineer',
    roleIcon: Database,
    description: 'Guardian of secrets. Ensures every betrayal is recorded perfectly.',
    avatar: 'https://i.pravatar.cc/300?img=12',
    skills: ['PostgreSQL', 'APIs', 'Security', 'Performance'],
    github: 'https://github.com/marcusrodriguez',
    linkedin: 'https://www.linkedin.com/in/marcus-rodriguez',
    email: 'marcus@wordtraitor.com',
    gradient: 'from-green-600 to-teal-600'
  }
]

const Developers = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-500/30 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              x: [null, Math.random() * window.innerWidth],
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.8, 0.3]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/')}
          className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
          Back to Home
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-6xl mb-6"
          >
            👥
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Masterminds</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            The team behind the deception. The architects of betrayal. The ones who made trust... optional.
          </p>
        </motion.div>

        {/* Developers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {developers.map((dev, index) => {
            const RoleIcon = dev.roleIcon
            return (
              <motion.div
                key={dev.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -10 }}
                className="relative"
              >
                <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 rounded-2xl overflow-hidden hover:border-purple-500 transition-all duration-300 group">
                  {/* Gradient Header */}
                  <div className={`h-32 bg-gradient-to-r ${dev.gradient} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/20" />
                    <motion.div
                      className="absolute inset-0 bg-white/10"
                      animate={{ 
                        x: ['-100%', '100%'],
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 2
                      }}
                    />
                  </div>

                  {/* Avatar */}
                  <div className="relative px-6 pb-6">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="-mt-16 mb-4"
                    >
                      <img
                        src={dev.avatar}
                        alt={dev.name}
                        className="w-32 h-32 rounded-full border-4 border-gray-900 mx-auto object-cover shadow-xl"
                      />
                    </motion.div>

                    {/* Info */}
                    <div className="text-center mb-4">
                      <h3 className="text-2xl font-bold text-white mb-1">{dev.name}</h3>
                      <div className="flex items-center justify-center gap-2 text-purple-400 mb-3">
                        <RoleIcon size={16} />
                        <p className="font-semibold">{dev.role}</p>
                      </div>
                      <p className="text-gray-400 text-sm italic">{dev.description}</p>
                    </div>

                    {/* Skills */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {dev.skills.map((skill, i) => (
                          <motion.span
                            key={i}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.2 + i * 0.1 }}
                            className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs text-purple-300"
                          >
                            {skill}
                          </motion.span>
                        ))}
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="flex justify-center gap-3 pt-4 border-t border-gray-700">
                      <motion.a
                        whileHover={{ scale: 1.2, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        href={dev.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-gray-700 hover:bg-purple-600 rounded-full flex items-center justify-center text-white transition-colors"
                        aria-label="GitHub"
                      >
                        <Github size={18} />
                      </motion.a>
                      <motion.a
                        whileHover={{ scale: 1.2, rotate: -5 }}
                        whileTap={{ scale: 0.9 }}
                        href={dev.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-gray-700 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-colors"
                        aria-label="LinkedIn"
                      >
                        <Linkedin size={18} />
                      </motion.a>
                      <motion.a
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        href={`mailto:${dev.email}`}
                        className="w-10 h-10 bg-gray-700 hover:bg-pink-600 rounded-full flex items-center justify-center text-white transition-colors"
                        aria-label="Email"
                      >
                        <Mail size={18} />
                      </motion.a>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-2 border-purple-500/30 rounded-2xl p-8 text-center backdrop-blur-sm"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Want to Join the Team? 🚀
          </h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            We're always looking for talented individuals who aren't afraid to build something... suspicious.
          </p>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="mailto:careers@wordtraitor.com"
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg"
          >
            Get in Touch 📧
          </motion.a>
        </motion.div>

        {/* Footer Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Commits', value: '1,337', icon: '💻' },
            { label: 'Coffee Cups', value: '∞', icon: '☕' },
            { label: 'Bugs Fixed', value: '404', icon: '🐛' },
            { label: 'Trust Issues', value: '100%', icon: '😈' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1 + i * 0.1 }}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

export default Developers