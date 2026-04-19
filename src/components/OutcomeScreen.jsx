import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { ArrowRight } from 'lucide-react'
import { getCASolarGeneration, getCACO2Trend, getEnergyMix } from '../utils/eiaApi'
import { co2Equivalents, fmt$, fmtCO2, paybackLabel } from '../utils/calculations'
import { generateNarration } from '../utils/claudeApi'
import { DECISIONS } from '../data/decisions'
import ScoreHUD from './ScoreHUD'
import { calcScore } from './ScoreHUD'

const CHART_MAP = {
  bill: 'co2',
  solar: 'solar',
  solar_community: 'solar',
  car: 'co2',
  appliance: 'energymix',
  community: 'solar',
}

// Eased count-up hook
function useCountUp(target, duration = 1200, delay = 300) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = Date.now()
      const frame = () => {
        const elapsed = Date.now() - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(Math.round(target * eased))
        if (progress < 1) requestAnimationFrame(frame)
      }
      requestAnimationFrame(frame)
    }, delay)
    return () => clearTimeout(timeout)
  }, [target, duration, delay])
  return value
}

export default function OutcomeScreen({ lastOutcome, persona, state, onContinue, round, total }) {
  const { decisionId, optionId, outcome } = lastOutcome
  const [chartData, setChartData] = useState(null)
  const [narration, setNarration] = useState(null)
  const [loadingNarration, setLoadingNarration] = useState(false)

  const decision = DECISIONS.find((d) => d.id === decisionId)
  const option = decision?.options.find((o) => o.id === optionId)
  const chartType = CHART_MAP[decisionId] || 'co2'

  const savingsCount = useCountUp(Math.abs(outcome.fiveYearSavings || 0), 1200, 400)
  const co2Count = useCountUp(Math.abs(outcome.co2TonsPerYear || 0) * 10, 1200, 600)
  const scoreCount = useCountUp(calcScore(state.totalCO2Avoided, state.totalBillSavings), 1000, 200)

  const equiv = co2Equivalents(Math.abs(outcome.co2TonsPerYear || 0))
  const isSavingCO2 = outcome.co2TonsPerYear > 0
  const isSavingMoney = outcome.fiveYearSavings > 0

  useEffect(() => {
    async function loadChart() {
      if (chartType === 'solar') setChartData(await getCASolarGeneration())
      else if (chartType === 'co2') setChartData(await getCACO2Trend())
      else if (chartType === 'energymix') setChartData(getEnergyMix())
    }
    loadChart()
  }, [chartType])

  useEffect(() => {
    if (!decision || !option) return
    setLoadingNarration(true)
    generateNarration(persona, decision, option, outcome)
      .then(setNarration)
      .finally(() => setLoadingNarration(false))
  }, [decisionId, optionId])

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-white to-blue-50 overflow-hidden">
      <div className="bg-blob w-72 h-72 bg-yellow-100 opacity-50" style={{ position: 'absolute', top: '-4rem', right: '-4rem' }} />
      <div className="bg-blob w-60 h-60 bg-green-100 opacity-50" style={{ position: 'absolute', bottom: '-3rem', left: '-3rem' }} />

      {/* HUD */}
      <div className="relative pt-4">
        <ScoreHUD state={state} round={round} total={total} />
      </div>

      <div className="relative flex-1 flex flex-col items-center px-4 pb-10 pt-2">
        <div className="max-w-2xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                className="text-5xl mb-2"
              >
                🎯
              </motion.div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-1">Your Impact!</h2>
              <p className="text-slate-500 text-base">You chose: <span className="font-bold text-slate-700">{option?.label}</span></p>
            </div>

            {/* Big impact numbers */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className={`rounded-3xl p-5 text-center card-shadow border ${
                  isSavingMoney
                    ? 'bg-green-500 border-green-400 text-white'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                <p className="text-3xl sm:text-4xl font-black mb-1">
                  {isSavingMoney ? '+' : '-'}${savingsCount.toLocaleString()}
                </p>
                <p className={`text-sm font-semibold ${isSavingMoney ? 'text-green-100' : 'text-rose-500'}`}>
                  💰 5-year savings
                </p>
                {outcome.upfrontCost > 0 && (
                  <p className={`text-xs mt-1 ${isSavingMoney ? 'text-green-200' : 'text-rose-400'}`}>
                    ${outcome.upfrontCost.toLocaleString()} upfront
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 }}
                className={`rounded-3xl p-5 text-center card-shadow border ${
                  isSavingCO2
                    ? 'bg-emerald-500 border-emerald-400 text-white'
                    : 'bg-orange-50 border-orange-200 text-orange-700'
                }`}
              >
                <p className="text-3xl sm:text-4xl font-black mb-1">
                  {isSavingCO2 ? '-' : '+'}{(co2Count / 10).toFixed(1)}t
                </p>
                <p className={`text-sm font-semibold ${isSavingCO2 ? 'text-emerald-100' : 'text-orange-500'}`}>
                  🌍 CO₂ per year
                </p>
                {paybackLabel(outcome.paybackMonths) && (
                  <p className={`text-xs mt-1 ${isSavingCO2 ? 'text-emerald-200' : 'text-orange-400'}`}>
                    Payback: {paybackLabel(outcome.paybackMonths)}
                  </p>
                )}
              </motion.div>
            </div>

            {/* Fuel cost breakdown — shown for all car decisions */}
            {outcome.fuelBreakdown && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="bg-slate-50 border border-slate-200 rounded-3xl p-4 mb-4"
              >
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                  ⛽ Fuel Cost Breakdown
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <FuelStat
                    label={`⛽ Gas price (${outcome.fuelBreakdown.gasPriceSource === 'state'
                      ? (state.stateName || state.stateCode || 'state')
                      : 'US national'} avg)`}
                    value={`$${outcome.fuelBreakdown.gasPricePerGallon.toFixed(2)}/gal`}
                  />
                  <FuelStat
                    label="🚗 Gas car fuel/year"
                    value={`$${Math.round(outcome.fuelBreakdown.annualGasCost).toLocaleString()}`}
                  />
                  <FuelStat
                    label="⚡ EV electricity/year"
                    value={`$${Math.round(outcome.fuelBreakdown.annualEVCost).toLocaleString()}`}
                  />
                  <FuelStat
                    label="💰 EV annual savings"
                    value={`$${Math.round(outcome.fuelBreakdown.evAnnualSavings).toLocaleString()}`}
                    positive={outcome.fuelBreakdown.evAnnualSavings > 0}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Source: EIA Weekly Petroleum & Retail Electricity Data
                  {outcome.fuelBreakdown.gasPriceSource === 'fallback' && ' · Gas price: national fallback'}
                </p>
              </motion.div>
            )}

            {/* CO2 equivalents */}
            {isSavingCO2 && outcome.co2TonsPerYear > 0.1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-3xl p-4 card-shadow border border-slate-100 mb-4"
              >
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">
                  That CO₂ saving equals…
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <EquivChip emoji="🌳" value={`${equiv.trees} trees`} label="planted" />
                  <EquivChip emoji="✈️" value={`${equiv.flightsNYLA} flights`} label="NY→LA avoided" />
                  <EquivChip emoji="⛽" value={`${equiv.gasGallons} gal`} label="gas not burned" />
                </div>
              </motion.div>
            )}

            {/* AI narration */}
            <AnimatePresence>
              {(narration || loadingNarration) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 border border-blue-200 rounded-3xl p-5 mb-4"
                >
                  <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">
                    🤖 AI Analysis
                  </p>
                  {loadingNarration ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-3 bg-blue-200 rounded w-full" />
                      <div className="h-3 bg-blue-200 rounded w-4/5" />
                    </div>
                  ) : (
                    <p className="text-slate-700 text-sm leading-relaxed">{narration}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Real-world insight */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-amber-50 border border-amber-200 rounded-3xl p-5 mb-4"
            >
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">
                📊 Did you know?
              </p>
              <p className="text-slate-700 text-sm leading-relaxed">{outcome.insight}</p>
              <p className="text-xs text-slate-400 mt-2">Source: {outcome.source}</p>
            </motion.div>

            {/* EIA Trend Chart */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 }}
              className="bg-white rounded-3xl p-5 card-shadow border border-slate-100 mb-6"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-slate-800">
                  {chartType === 'solar' && '☀️ CA Solar Generation (GWh)'}
                  {chartType === 'co2' && '📉 CA Grid CO₂ Emissions (MMT)'}
                  {chartType === 'energymix' && '⚡ CA Energy Mix 2023'}
                </p>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Source: EIA</span>
              </div>

              {!chartData ? (
                <div className="h-40 flex items-center justify-center text-slate-400 text-sm animate-pulse">
                  Loading EIA data…
                </div>
              ) : chartType === 'energymix' ? (
                <EnergyMixChart data={chartData} />
              ) : (
                <TrendChart data={chartData} type={chartType} />
              )}
            </motion.div>

            {/* Next button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onContinue}
              className="w-full py-5 bg-green-500 hover:bg-green-400 text-white font-black text-xl rounded-2xl shadow-lg shadow-green-200 transition-colors flex items-center justify-center gap-2"
            >
              {round < total ? 'Next Decision! 🎮' : 'See Final Results! 🏆'}
              <ArrowRight className="w-6 h-6" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function FuelStat({ label, value, positive }) {
  return (
    <div className="bg-white rounded-xl px-3 py-2 border border-slate-100">
      <p className="text-xs text-slate-500 leading-tight mb-0.5">{label}</p>
      <p className={`text-sm font-black ${positive === true ? 'text-green-600' : positive === false ? 'text-rose-600' : 'text-slate-800'}`}>
        {value}
      </p>
    </div>
  )
}

function EquivChip({ emoji, value, label }) {
  return (
    <div className="flex flex-col items-center bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2 min-w-[90px]">
      <span className="text-2xl mb-0.5">{emoji}</span>
      <p className="text-sm font-black text-emerald-700">{value}</p>
      <p className="text-xs text-emerald-600">{label}</p>
    </div>
  )
}

function TrendChart({ data, type }) {
  const key = type === 'solar' ? 'gwh' : 'mmt'
  const color = type === 'solar' ? '#22c55e' : '#3b82f6'
  const label = type === 'solar' ? 'GWh' : 'MMT'

  return (
    <ResponsiveContainer width="100%" height={150}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }}
          formatter={(v) => [`${v.toLocaleString()} ${label}`, '']}
        />
        <Area type="monotone" dataKey={key} stroke={color} strokeWidth={2.5} fill="url(#grad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function EnergyMixChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
          dataKey="pct" nameKey="fuel" paddingAngle={3}>
          {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }}
          formatter={(v, name) => [`${v}%`, name]}
        />
        <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
