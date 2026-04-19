import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCountUp } from '../hooks/useCountUp'
import { calcScore } from '../utils/calculations'
import InfoTooltip from './InfoTooltip'
import MethodologyPage from './MethodologyPage'

export default function LeftPanel({ state, round, total }) {
  const [showMethodology, setShowMethodology] = useState(false)
  const { totalBillSavings, totalCO2Avoided, totalUpfrontCost, currentMonthlyBill, persona } = state
  const score = calcScore(totalCO2Avoided, totalBillSavings)

  const scoreDisplay = useCountUp(score)
  const billDisplay = useCountUp(Math.abs(currentMonthlyBill))
  const savingsDisplay = useCountUp(Math.max(0, totalBillSavings))
  const co2Display = useCountUp(Math.max(0, Math.round(totalCO2Avoided * 10)))
  const costDisplay = useCountUp(totalUpfrontCost)

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{persona?.avatar}</span>
          <div>
            <p className="text-xs text-slate-400 font-medium leading-none">Playing as</p>
            <p className="text-sm font-bold text-white leading-tight">{persona?.name}</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {state.zipCode && state.stateName
            ? `${state.zipCode}, ${state.stateName}`
            : (persona?.location ?? '')}
          {state.isFallback && <span className="ml-1 text-yellow-500">~ est.</span>}
        </p>
      </div>

      {/* Score */}
      <div className="px-5 py-4 border-b border-slate-700">
        <p className="text-xs text-slate-400 uppercase tracking-widest mb-1 flex items-center">
          ⭐ <span className="ml-1">Score</span>
          <InfoTooltip content="Formula: (CO₂ tons avoided × 50) + (5-yr savings ÷ 10). Every ton of CO₂ you cut = 50 pts; every $10 saved = 1 pt. Hit 500+ for an A+ grade!" />
        </p>
        <AnimatePresence mode="wait">
          <motion.p
            key={scoreDisplay}
            initial={{ y: -6, opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl font-black text-yellow-400 leading-none"
          >
            {scoreDisplay.toLocaleString()}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress */}
      <div className="px-5 py-4 border-b border-slate-700">
        <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Progress</p>
        <p className="text-sm font-semibold text-white mb-2">
          Decision {Math.min(round + 1, total)} of {total}
        </p>
        <div className="flex gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                backgroundColor: i < round ? '#22c55e' : i === round ? '#86efac' : '#334155',
                width: i === round ? 22 : 14,
              }}
              transition={{ duration: 0.3 }}
              className="h-2 rounded-full"
            />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex-1 px-5 py-4 space-y-5">
        <StatBlock
          emoji="💡"
          label="Monthly Bill"
          tooltip="Your current electricity bill per month. Energy upgrades like solar or a smart thermostat can shrink this number over time."
          value={`$${billDisplay}`}
          sub="per month"
          valueClass={currentMonthlyBill < (persona?.monthlyBill ?? 999) ? 'text-green-400' : 'text-white'}
          estimated={state.isFallback}
        />

        <StatBlock
          emoji="🌍"
          label="CO₂ Avoided"
          tooltip="Carbon dioxide you're keeping out of the atmosphere each year. Burning less fossil fuel = fewer greenhouse gases heating up the planet."
          value={`${(co2Display / 10).toFixed(1)}t`}
          sub="per year"
          valueClass={totalCO2Avoided > 0 ? 'text-emerald-400' : 'text-slate-300'}
          estimated={state.isFallback}
        />

        <StatBlock
          emoji="💰"
          label="5-Year Savings"
          tooltip="Total money saved on energy bills over 5 years compared to doing nothing. Some upgrades cost money upfront but pay off big long-term."
          value={`$${savingsDisplay.toLocaleString()}`}
          sub="projected"
          valueClass={totalBillSavings > 0 ? 'text-green-400' : 'text-slate-300'}
          estimated={state.isFallback}
        />

        <StatBlock
          emoji="💳"
          label="Upfront Spent"
          tooltip="Total installation or purchase costs paid today. Higher upfront cost usually means bigger long-term savings — think of it as an investment."
          value={`$${costDisplay.toLocaleString()}`}
          sub="total so far"
          valueClass="text-rose-400"
          estimated={state.isFallback}
        />
      </div>

      {/* EIA source footer */}
      <div className="px-5 pb-4 pt-3 border-t border-slate-700">
        <button
          onClick={() => setShowMethodology(true)}
          className="w-full text-left transition-all duration-200 rounded-lg"
          style={{
            background: 'transparent',
            border: '1px solid #4B5563',
            color: '#9CA3AF',
            fontSize: '0.75rem',
            padding: '8px 12px',
            cursor: 'pointer',
            marginBottom: '8px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#6EE7B7'
            e.currentTarget.style.color = '#ffffff'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#4B5563'
            e.currentTarget.style.color = '#9CA3AF'
          }}
        >
          🔢 How did we calculate this?
        </button>
        <p className="text-xs text-slate-600 leading-relaxed">
          All numbers calculated from EIA data · Source: EIA 2024
        </p>
      </div>

      {/* Methodology modal */}
      <AnimatePresence>
        {showMethodology && (
          <MethodologyPage
          onClose={() => setShowMethodology(false)}
          eiaData={state.eiaData}
          stateCode={state.stateCode}
        />
        )}
      </AnimatePresence>
    </div>
  )
}

function StatBlock({ emoji, label, tooltip, value, sub, valueClass, estimated }) {
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 flex items-center">
        {emoji} <span className="ml-1">{label}</span>
        {estimated && <span className="ml-1 text-yellow-500 normal-case tracking-normal text-xs">~ est.</span>}
        {tooltip && <InfoTooltip content={tooltip} />}
      </p>
      <motion.p
        key={value}
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`text-2xl font-black leading-none ${valueClass}`}
      >
        {value}
      </motion.p>
      <p className="text-xs text-slate-600 mt-0.5">{sub}</p>
    </div>
  )
}
