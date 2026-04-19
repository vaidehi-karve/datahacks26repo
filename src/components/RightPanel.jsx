import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { DECISIONS } from '../data/decisions'
import { co2Equivalents, fmt$, fmtCO2, paybackLabel } from '../utils/calculations'
import { useCountUp } from '../hooks/useCountUp'
import { generateNarration } from '../utils/claudeApi'
import { getApprovalTime } from '../utils/approvalTime'

const OPTION_STYLES = [
  { ring: 'ring-green-400', bg: 'bg-green-50', dot: 'bg-green-500', icon: '🌱' },
  { ring: 'ring-blue-400', bg: 'bg-blue-50', dot: 'bg-blue-500', icon: '💡' },
  { ring: 'ring-amber-400', bg: 'bg-amber-50', dot: 'bg-amber-500', icon: '⚡' },
  { ring: 'ring-purple-400', bg: 'bg-purple-50', dot: 'bg-purple-500', icon: '🔄' },
]

// ── Decision view ──────────────────────────────────────────
function DecisionView({ decision, persona, onDecide }) {
  const [selected, setSelected] = useState(null)
  const intro = typeof decision.intro === 'function' ? decision.intro(persona) : decision.intro

  return (
    <motion.div
      key="decision"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-slate-100">
        <span className="inline-block text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
          Decision
        </span>
        <h2 className="text-xl font-black text-slate-900 leading-tight">{decision.title}</h2>
      </div>

      {/* Scenario */}
      <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
        <p className="text-sm text-slate-700 leading-relaxed">{intro}</p>
      </div>

      {/* Options */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
        {decision.options.map((option, i) => {
          const style = OPTION_STYLES[i % OPTION_STYLES.length]
          const isSelected = selected === option.id
          return (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setSelected(option.id)}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-150
                ${isSelected
                  ? `ring-2 ${style.ring} ${style.bg} border-transparent shadow-md`
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
            >
              <div className="flex items-start gap-3">
                {/* Radio indicator */}
                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                  ${isSelected ? `${style.dot} border-transparent` : 'border-slate-300'}`}>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full bg-white"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm leading-snug ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                    <span className="mr-1">{style.icon}</span>{option.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{option.description}</p>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* CTA */}
      <div className="px-5 pb-5 pt-3 border-t border-slate-100">
        <AnimatePresence>
          {selected ? (
            <motion.button
              key="cta"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onDecide(decision.id, selected)}
              className="w-full py-4 bg-green-500 hover:bg-green-400 text-white font-black text-base rounded-2xl transition-colors shadow-md shadow-green-200 flex items-center justify-center gap-2"
            >
              See My Impact! <ChevronRight className="w-5 h-5" />
            </motion.button>
          ) : (
            <p className="text-center text-slate-400 text-sm font-medium py-2">
              Pick an option above
            </p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ── Outcome view ────────────────────────────────────────────
function OutcomeView({ lastOutcome, persona, state, onContinue, round, total }) {
  const { decisionId, optionId, outcome } = lastOutcome
  const [narration, setNarration] = useState(null)
  const [loadingNarration, setLoadingNarration] = useState(false)

  const decision = DECISIONS.find(d => d.id === decisionId)
  const option = decision?.options.find(o => o.id === optionId)

  const savingsAmt = Math.abs(outcome.fiveYearSavings || 0)
  const co2Amt = Math.abs(outcome.co2TonsPerYear || 0) * 10

  const savingsCount = useCountUp(savingsAmt, 1200)
  const co2Count = useCountUp(co2Amt, 1200)

  const isSavingMoney = outcome.fiveYearSavings > 0
  const isSavingCO2 = outcome.co2TonsPerYear > 0
  const equiv = co2Equivalents(Math.abs(outcome.co2TonsPerYear || 0))

  useEffect(() => {
    if (!decision || !option) return
    setLoadingNarration(true)
    generateNarration(persona, decision, option, outcome)
      .then(setNarration)
      .finally(() => setLoadingNarration(false))
  }, [decisionId, optionId])

  return (
    <motion.div
      key="outcome"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-slate-100">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="text-3xl mb-1"
        >
          🎯
        </motion.div>
        <h2 className="text-xl font-black text-slate-900">Your Impact!</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          You chose: <span className="font-bold text-slate-700">{option?.label}</span>
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {/* Big numbers */}
        <div className="grid grid-cols-2 gap-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className={`rounded-2xl p-4 text-center ${
              isSavingMoney ? 'bg-green-500 text-white' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            <p className="text-2xl font-black">
              {isSavingMoney ? '+' : '-'}${savingsCount.toLocaleString()}
            </p>
            <p className={`text-xs font-semibold mt-0.5 ${isSavingMoney ? 'text-green-100' : 'text-rose-500'}`}>
              💰 5-yr savings
            </p>
            {outcome.upfrontCost > 0 && (
              <p className={`text-xs mt-0.5 ${isSavingMoney ? 'text-green-200' : 'text-rose-400'}`}>
                ${outcome.upfrontCost.toLocaleString()} upfront
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className={`rounded-2xl p-4 text-center ${
              isSavingCO2 ? 'bg-emerald-500 text-white' : 'bg-orange-50 text-orange-700 border border-orange-200'
            }`}
          >
            <p className="text-2xl font-black">
              {isSavingCO2 ? '-' : '+'}{(co2Count / 10).toFixed(1)}t
            </p>
            <p className={`text-xs font-semibold mt-0.5 ${isSavingCO2 ? 'text-emerald-100' : 'text-orange-500'}`}>
              🌍 CO₂/year
            </p>
            {paybackLabel(outcome.paybackMonths) && (
              <p className={`text-xs mt-0.5 ${isSavingCO2 ? 'text-emerald-200' : 'text-orange-400'}`}>
                Payback: {paybackLabel(outcome.paybackMonths)}
              </p>
            )}
          </motion.div>
        </div>

        {/* CO2 equivalents */}
        {isSavingCO2 && outcome.co2TonsPerYear > 0.1 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3"
          >
            <p className="text-xs font-bold text-emerald-600 mb-2">That CO₂ saving equals…</p>
            <div className="flex gap-2 flex-wrap">
              <EquivChip emoji="🌳" value={`${equiv.trees}`} label="trees" />
              <EquivChip emoji="✈️" value={`${equiv.flightsNYLA}`} label="flights" />
              <EquivChip emoji="⛽" value={`${equiv.gasGallons}`} label="gallons" />
            </div>
          </motion.div>
        )}

        {/* Permit approval time — solar decision only */}
        {decisionId === 'solar' && (() => {
          const choseSolar = optionId === 'install_now' || optionId === 'install_later'
          const approval = getApprovalTime(state.stateCode)
          const locationLabel = approval.isStateSpecific
            ? (state.stateName || state.stateCode || 'your state')
            : 'your region'
          const bodyText = choseSolar
            ? `Your permit is estimated to take ${approval.days.toFixed(1)} days to approve based on ${approval.isStateSpecific ? (state.stateName || state.stateCode) + ' state' : 'national'} data. We've reflected this wait in your building animation.`
            : `If you had chosen solar, your permit would typically take ${approval.days.toFixed(1)} days to approve in your area. This wait time is one reason people delay going solar.`
          return (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38 }}
              style={{
                background: '#EFF6FF',
                border: '1.5px solid #BFDBFE',
                borderRadius: 12,
                padding: 14,
              }}
            >
              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                ⏱️ Permit Approval Time
              </p>
              <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1D4ED8', lineHeight: 1, marginBottom: 2 }}>
                {approval.days.toFixed(1)} days
              </p>
              <p style={{ fontSize: '0.72rem', color: '#6B7280', marginBottom: 8 }}>
                average in {locationLabel}
              </p>
              <p style={{ fontSize: '0.78rem', color: '#374151', lineHeight: 1.5, marginBottom: 8 }}>
                {bodyText}
              </p>
              <span style={{
                display: 'inline-block',
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 9999,
                background: approval.isStateSpecific ? '#DCFCE7' : '#FEF9C3',
                color: approval.isStateSpecific ? '#166534' : '#854D0E',
              }}>
                {approval.isStateSpecific ? `📍 ${state.stateCode} state data` : '🗺️ National average used'}
              </span>
              <p style={{ fontSize: '0.65rem', color: '#9CA3AF', fontStyle: 'italic', marginTop: 6 }}>
                Source: ZenPower Dataset
              </p>
            </motion.div>
          )
        })()}

        {/* AI narration */}
        {(narration || loadingNarration) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-blue-50 border border-blue-200 rounded-2xl p-3"
          >
            <p className="text-xs font-bold text-blue-500 mb-1">🤖 AI Analysis</p>
            {loadingNarration ? (
              <div className="space-y-1.5 animate-pulse">
                <div className="h-2.5 bg-blue-200 rounded w-full" />
                <div className="h-2.5 bg-blue-200 rounded w-4/5" />
              </div>
            ) : (
              <p className="text-xs text-slate-700 leading-relaxed">{narration}</p>
            )}
          </motion.div>
        )}


        {/* Data insight */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48 }}
          className="bg-slate-50 border border-slate-200 rounded-2xl p-3"
        >
          <p className="text-xs font-bold text-slate-500 mb-1">📊 Data Source</p>
          <p className="text-xs text-slate-700 leading-relaxed">{outcome.insight}</p>
          <p className="text-xs text-slate-400 mt-1">Source: {outcome.source}</p>
        </motion.div>
      </div>

      {/* Next button */}
      <div className="px-5 pb-5 pt-3 border-t border-slate-100">
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onContinue}
          className="w-full py-4 bg-green-500 hover:bg-green-400 text-white font-black text-base rounded-2xl transition-colors shadow-md shadow-green-200 flex items-center justify-center gap-2"
        >
          {round < total ? 'Next Decision! 🎮' : 'See Final Results! 🏆'}
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  )
}

function EquivChip({ emoji, value, label }) {
  return (
    <div className="flex items-center gap-1 bg-white border border-emerald-200 rounded-xl px-2 py-1">
      <span className="text-base">{emoji}</span>
      <div>
        <p className="text-xs font-black text-emerald-700 leading-none">{value}</p>
        <p className="text-xs text-emerald-600 leading-none">{label}</p>
      </div>
    </div>
  )
}

// ── Main RightPanel ─────────────────────────────────────────
export default function RightPanel({ screen, decision, persona, lastOutcome, state, onDecide, onContinue, round, total }) {
  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 overflow-hidden">
      <AnimatePresence mode="wait">
        {screen === 'decision' && decision ? (
          <DecisionView
            key={`decision-${decision.id}`}
            decision={decision}
            persona={persona}
            onDecide={onDecide}
          />
        ) : screen === 'outcome' && lastOutcome ? (
          <OutcomeView
            key={`outcome-${lastOutcome.decisionId}-${lastOutcome.optionId}`}
            lastOutcome={lastOutcome}
            persona={persona}
            state={state}
            onContinue={onContinue}
            round={round}
            total={total}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}
