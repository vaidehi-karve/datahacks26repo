import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import confetti from 'canvas-confetti'
import { getCACO2Trend } from '../utils/eiaApi'
import { fmt$, fmtCO2, co2Equivalents, neighborhoodImpact } from '../utils/calculations'
import { calcScore } from '../utils/calculations'
import { RotateCcw } from 'lucide-react'
import InfoTooltip from './InfoTooltip'

function getGrade(score) {
  if (score >= 500) return { grade: 'A+', label: 'Climate Champion! 🏆', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-300', celebrate: true }
  if (score >= 300) return { grade: 'A', label: 'Eco Leader! 🌱', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-300', celebrate: true }
  if (score >= 150) return { grade: 'B', label: 'Going Green! 💪', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-300', celebrate: false }
  if (score >= 50) return { grade: 'C', label: 'Getting Started! 🌿', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-300', celebrate: false }
  return { grade: 'D', label: 'Room to Grow 🌱', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-300', celebrate: false }
}

// Count-up hook
function useCountUp(target, duration = 1400, delay = 200) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = Date.now()
      const frame = () => {
        const elapsed = Date.now() - start
        const p = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        setValue(Math.round(target * eased))
        if (p < 1) requestAnimationFrame(frame)
      }
      requestAnimationFrame(frame)
    }, delay)
    return () => clearTimeout(timeout)
  }, [target, duration, delay])
  return value
}

export default function FinalScreen({ state, onRestart }) {
  const { totalBillSavings, totalCO2Avoided, totalUpfrontCost, stateName } = state
  const [co2Trend, setCo2Trend] = useState(null)
  const score = calcScore(totalCO2Avoided, totalBillSavings)
  const gradeInfo = getGrade(score)

  const scoreDisplay = useCountUp(score, 1600, 300)
  const savingsDisplay = useCountUp(Math.max(0, totalBillSavings), 1400, 500)
  const co2Display = useCountUp(Math.max(0, Math.round(totalCO2Avoided * 10)) / 10 * 10, 1400, 600)

  const equiv = co2Equivalents(Math.max(0, totalCO2Avoided))
  const neighborCO2 = neighborhoodImpact(totalCO2Avoided)
  const gridPct = ((totalCO2Avoided / 39.4) * 100).toFixed(4)

  useEffect(() => {
    getCACO2Trend().then(setCo2Trend)
  }, [])

  // Fire confetti on A/A+ grades
  useEffect(() => {
    if (!gradeInfo.celebrate) return
    const fire = (opts) => confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, ...opts })
    const t1 = setTimeout(() => fire({ colors: ['#22c55e', '#3b82f6', '#f59e0b', '#a855f7'] }), 400)
    const t2 = setTimeout(() => fire({ angle: 60, origin: { x: 0 } }), 800)
    const t3 = setTimeout(() => fire({ angle: 120, origin: { x: 1 } }), 1000)
    return () => [t1, t2, t3].forEach(clearTimeout)
  }, [gradeInfo.celebrate])

  const PANELS = [
    {
      key: 'you',
      emoji: '👤',
      label: 'YOUR IMPACT',
      color: 'border-green-300 bg-green-50',
      headerColor: 'text-green-700',
      items: [
        { label: 'CO₂ avoided/yr', value: fmtCO2(totalCO2Avoided), pos: totalCO2Avoided > 0 },
        { label: '5-year savings', value: fmt$(totalBillSavings), pos: totalBillSavings > 0 },
        { label: '🌳 Trees equivalent', value: `${equiv.trees}`, pos: true },
        { label: '✈️ Flights avoided', value: `${equiv.flightsNYLA}`, pos: true },
      ],
    },
    {
      key: 'hood',
      emoji: '🏘️',
      label: 'YOUR NEIGHBORHOOD',
      color: 'border-blue-300 bg-blue-50',
      headerColor: 'text-blue-700',
      items: [
        { label: 'If 20% of 500 households act', value: '', pos: true },
        { label: 'Community CO₂ cut', value: `${neighborCO2} tons/yr`, pos: true },
        { label: 'Grid impact', value: 'Peak demand ↓', pos: true },
        { label: 'Solar cost effect', value: 'Prices −3%', pos: true },
      ],
    },
    {
      key: 'state',
      emoji: '🌎',
      label: 'YOUR STATE',
      color: 'border-purple-300 bg-purple-50',
      headerColor: 'text-purple-700',
      items: [
        { label: 'Grid today', value: 'Transitioning to clean', pos: true },
        { label: 'Your contribution', value: `${gridPct}% cleaner`, pos: true },
        { label: 'Biggest lever', value: 'Permit reform = 3× solar', pos: true },
        { label: '2045 national goal', value: '100% clean electricity', pos: true },
      ],
    },
  ]

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-white to-blue-50 overflow-hidden px-4 py-10">
      <div className="bg-blob w-80 h-80 bg-green-200 opacity-30" style={{ position: 'absolute', top: '-5rem', right: '-5rem' }} />
      <div className="bg-blob w-72 h-72 bg-blue-200 opacity-25" style={{ position: 'absolute', bottom: '-4rem', left: '-4rem' }} />

      <div className="relative max-w-3xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 250, delay: 0.1 }}
            className="text-6xl mb-3"
          >
            🏆
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-2">Final Results!</h1>
          <p className="text-slate-500 text-lg">Here's what your 5 decisions actually mean.</p>
        </motion.div>

        {/* Grade card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className={`rounded-3xl border-2 ${gradeInfo.border} ${gradeInfo.bg} p-6 mb-6 text-center card-shadow-lg`}
        >
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Sustainability Grade</p>
          <motion.p
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
            className={`text-8xl font-black ${gradeInfo.color} leading-none mb-2`}
          >
            {gradeInfo.grade}
          </motion.p>
          <p className={`text-xl font-bold ${gradeInfo.color}`}>{gradeInfo.label}</p>

          <div className="flex justify-center gap-8 mt-5 pt-4 border-t border-slate-200">
            <ScoreStat
              label="⭐ Score"
              value={scoreDisplay.toLocaleString()}
              tooltip="Formula: (CO₂ tons avoided × 50) + (5-yr savings ÷ 10). Every ton of CO₂ you cut = 50 pts; every $10 saved = 1 pt. Hit 500+ for an A+ grade!"
            />
            <ScoreStat
              label="💰 5yr Savings"
              value={`$${savingsDisplay.toLocaleString()}`}
              tooltip="Total money saved on energy costs over 5 years compared to making no changes at all."
            />
            <ScoreStat
              label="🌍 CO₂/yr"
              value={`${(co2Display / 10).toFixed(1)}t`}
              tooltip="Total carbon dioxide you're keeping out of the atmosphere every year from all your decisions combined."
            />
          </div>
        </motion.div>

        {/* Three panels */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {PANELS.map((panel, i) => (
            <motion.div
              key={panel.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className={`rounded-3xl border-2 ${panel.color} p-5`}
            >
              <p className="text-2xl mb-1">{panel.emoji}</p>
              <p className={`text-xs font-black uppercase tracking-widest mb-4 ${panel.headerColor}`}>
                {panel.label}
              </p>
              <div className="space-y-3">
                {panel.items.map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-slate-500">{item.label}</p>
                    {item.value && (
                      <p className={`text-sm font-bold ${item.pos ? 'text-slate-800' : 'text-rose-600'}`}>
                        {item.value}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* The honest answer */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="rounded-3xl p-6 mb-5"
          style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        >
          <p className="font-black mb-3" style={{ color: '#1a1a1a', fontSize: '1.1rem' }}>Key Takeaways:</p>
          <p className="text-sm leading-relaxed mb-3" style={{ color: '#374151' }}>
            Your choices save real money and real CO₂. But the single highest-impact action isn't on this list:
            it's <span className="font-bold" style={{ color: '#B45309' }}>voting for local energy policy</span> and showing up to your city council's permitting reform hearing.
          </p>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            {stateName || 'Your state'}'s solar permitting process adds $2,000–4,000 per installation — reform could 3× statewide solar adoption overnight.
          </p>
          <p className="text-xs mt-3" style={{ color: '#9CA3AF' }}>Source: SEIA Permitting Reform Study 2024 / EIA Annual Energy Outlook</p>
        </motion.div>

        {/* CA CO2 trend */}
        {co2Trend && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white rounded-3xl p-5 card-shadow border border-slate-100 mb-7"
          >
            <p className="text-sm font-bold text-slate-800 mb-1">CA Grid CO₂ — The Bigger Picture</p>
            <p className="text-xs text-slate-500 mb-4">
              CA emissions fell 37% since 2015. Individual adoption helped drive this curve.
            </p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={co2Trend} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => [`${v} MMT`, 'CO₂']}
                />
                <Bar dataKey="mmt" fill="#22c55e" radius={[4, 4, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-right text-xs text-slate-400 mt-1">Source: EIA CO₂ Emissions Aggregates</p>
          </motion.div>
        )}

        {/* Restart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center"
        >
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRestart}
            className="inline-flex items-center gap-2 px-7 py-4 bg-white border-2 border-slate-200 hover:border-green-400 text-slate-700 hover:text-green-700 font-bold rounded-2xl text-base transition-all card-shadow"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again as Someone Else
          </motion.button>
          <p className="text-xs text-slate-400 mt-6">
            Data: U.S. Energy Information Administration (EIA) · DataHacks 2026
          </p>
        </motion.div>
      </div>
    </div>
  )
}

function ScoreStat({ label, value, tooltip }) {
  return (
    <div className="text-center">
      <p className="text-xs text-slate-500 mb-0.5 flex items-center justify-center">
        {label}
        {tooltip && <InfoTooltip content={tooltip} />}
      </p>
      <p className="text-xl font-black text-slate-900">{value}</p>
    </div>
  )
}
