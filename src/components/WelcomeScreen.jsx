import { motion } from 'framer-motion'

export default function WelcomeScreen({ onStart }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-8 overflow-hidden bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Background blobs */}
      <div className="bg-blob w-96 h-96 bg-green-200 opacity-40 -top-32 -left-32 top-0 left-0" style={{position:'absolute',top:'-8rem',left:'-8rem'}} />
      <div className="bg-blob w-80 h-80 bg-blue-200 opacity-30" style={{position:'absolute',bottom:'-6rem',right:'-6rem'}} />
      <div className="bg-blob w-64 h-64 bg-yellow-200 opacity-25" style={{position:'absolute',top:'40%',left:'50%',transform:'translate(-50%,-50%)'}} />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative text-center max-w-lg w-full"
      >
        {/* Bouncing bolt */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          className="text-7xl mb-4 select-none"
        >
          ⚡
        </motion.div>

        <h1 className="text-6xl sm:text-7xl font-black tracking-tight text-slate-900 mb-2 leading-none">
          POWER
          <br />
          <span className="text-gradient-green">DOWN</span>
        </h1>

        <p className="text-lg sm:text-xl font-semibold text-slate-600 mt-4 mb-2">
          Real energy decisions. Real math. Real impact.
        </p>

        <p className="text-slate-500 text-base mb-8 leading-relaxed max-w-sm mx-auto">
          Play as a homeowner, renter, or business owner and discover which choices actually move the needle — using live U.S. government data.
        </p>

        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          onClick={onStart}
          className="px-10 py-5 bg-green-500 hover:bg-green-400 text-white font-black text-xl rounded-2xl transition-colors shadow-lg shadow-green-200"
        >
          Let's Play! ⚡
        </motion.button>

        {/* Stats row */}
        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-slate-400">
          <span>🎮 5 decisions</span>
          <span>⏱ ~8 minutes</span>
          <span>📊 Live EIA data</span>
        </div>

        <p className="mt-10 text-xs text-slate-400">
          Data: U.S. Energy Information Administration · DataHacks 2026
        </p>
        <p className="mt-1 text-xs text-slate-400 font-semibold">
          Team Meghabyte
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          Vaidehi Karve · Arya Verma · Meghana Chittineni · Snigdha Podugu
        </p>
      </motion.div>
    </div>
  )
}
