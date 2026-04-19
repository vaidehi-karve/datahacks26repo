import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameState } from './hooks/useGameState'
import { getDecisionsForPersona } from './data/decisions'
import WelcomeScreen from './components/WelcomeScreen'
import PersonaSelect from './components/PersonaSelect'
import GameLayout from './components/GameLayout'
import FinalScreen from './components/FinalScreen'

const pageVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
}

export default function App() {
  const {
    state,
    selectPersona,
    makeDecision,
    continueToNext,
    goToPersonaSelect,
    restart,
    currentDecision,
    totalDecisions,
  } = useGameState()

  const [toast, setToast] = useState(null)

  const { screen, persona, lastOutcome, round } = state

  function handleStart(persona, locationData) {
    selectPersona(persona, locationData)
    const isFallback = locationData?.isFallback ?? false
    const msg = isFallback
      ? '⚠️ Using US average data (EIA API unavailable)'
      : `✅ Using real EIA data for ${locationData?.stateName || locationData?.stateCode || 'your state'}`
    setToast({ message: msg, type: isFallback ? 'warning' : 'success' })
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const allDecisions = persona ? getDecisionsForPersona(persona.id) : []
  const isGameScreen = screen === 'decision' || screen === 'outcome'

  if (isGameScreen) {
    const decision = screen === 'decision' ? currentDecision() : null

    if (screen === 'decision' && !decision) {
      continueToNext()
      return null
    }

    return (
      <>
        <GameLayout
          screen={screen}
          persona={persona}
          state={state}
          decision={decision}
          lastOutcome={lastOutcome}
          onDecide={makeDecision}
          onContinue={continueToNext}
          round={round}
          total={totalDecisions}
          allDecisions={allDecisions}
        />
        <Toast toast={toast} />
      </>
    )
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          {screen === 'welcome' && <WelcomeScreen onStart={goToPersonaSelect} />}
          {screen === 'persona' && <PersonaSelect onStart={handleStart} />}
          {screen === 'final' && <FinalScreen state={state} onRestart={restart} />}
        </motion.div>
      </AnimatePresence>
      <Toast toast={toast} />
    </>
  )
}

function Toast({ toast }) {
  if (!toast) return null
  const isSuccess = toast.type === 'success'
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-bold shadow-lg pointer-events-none whitespace-nowrap
        ${isSuccess
          ? 'bg-green-100 text-green-800 border border-green-300'
          : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
        }`}
    >
      {toast.message}
    </motion.div>
  )
}
