import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { PERSONAS } from '../data/personas'
import { fetchStateEnergyData } from '../utils/eiaLocation'

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
]

const PERSONA_COLORS = {
  homeowner: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    hoverBorder: 'hover:border-amber-400',
    accent: 'bg-amber-400',
    text: 'text-amber-700',
    shadow: 'hover:shadow-amber-100',
    badge: 'bg-amber-100 text-amber-700',
    btn: 'bg-amber-400 hover:bg-amber-300 text-white',
  },
  renter: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    hoverBorder: 'hover:border-blue-400',
    accent: 'bg-blue-400',
    text: 'text-blue-700',
    shadow: 'hover:shadow-blue-100',
    badge: 'bg-blue-100 text-blue-700',
    btn: 'bg-blue-500 hover:bg-blue-400 text-white',
  },
  smallbiz: {
    bg: 'bg-green-50',
    border: 'border-green-300',
    hoverBorder: 'hover:border-green-400',
    accent: 'bg-green-400',
    text: 'text-green-700',
    shadow: 'hover:shadow-green-100',
    badge: 'bg-green-100 text-green-700',
    btn: 'bg-green-500 hover:bg-green-400 text-white',
  },
}

export default function PersonaSelect({ onStart }) {
  const [step, setStep] = useState(1)
  const [chosenPersona, setChosenPersona] = useState(null)

  function handlePickPersona(persona) {
    setChosenPersona(persona)
    setStep(2)
  }

  function handleBack() {
    setStep(1)
    setChosenPersona(null)
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10 overflow-hidden bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="bg-blob w-72 h-72 bg-yellow-200 opacity-30" style={{ position: 'absolute', top: '-4rem', right: '-4rem' }} />
      <div className="bg-blob w-80 h-80 bg-green-200 opacity-30" style={{ position: 'absolute', bottom: '-4rem', left: '-4rem' }} />

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="relative max-w-4xl w-full"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8"
            >
              <p className="text-green-600 font-bold text-sm uppercase tracking-widest mb-2">Step 1 of 2</p>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-3">
                Choose Your Character
              </h2>
              <p className="text-slate-500 text-lg max-w-md mx-auto">
                Your situation determines which decisions you face and which numbers apply to you.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {Object.values(PERSONAS).map((persona, i) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  colors={PERSONA_COLORS[persona.id]}
                  index={i}
                  onSelect={handlePickPersona}
                />
              ))}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center text-xs text-slate-400 mt-8"
            >
              Bills &amp; costs calculated from real EIA energy data for your state · Source: EIA 2024
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.25 }}
            className="relative max-w-lg w-full"
          >
            <LocationStep
              persona={chosenPersona}
              onBack={handleBack}
              onStart={onStart}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function LocationStep({ persona, onBack, onStart }) {
  const [zipCode, setZipCode] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [loading, setLoading] = useState(false)

  const stateName = US_STATES.find(s => s.code === stateCode)?.name ?? ''
  const isValid = zipCode.length === 5 && /^\d{5}$/.test(zipCode) && stateCode !== ''

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isValid || loading) return
    setLoading(true)
    const eiaData = await fetchStateEnergyData(stateCode)
    onStart(persona, {
      zipCode,
      stateCode,
      stateName,
      eiaData,
      isFallback: eiaData.isFallback ?? false,
    })
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Change character
      </button>

      {/* Selected persona reminder */}
      {persona && (
        <div className="flex items-center gap-3 mb-7 bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-sm">
          <span className="text-3xl">{persona.avatar}</span>
          <div>
            <p className="text-xs text-slate-400 leading-none mb-0.5">Playing as</p>
            <p className="font-bold text-slate-800">{persona.name}</p>
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-green-600 font-bold text-sm uppercase tracking-widest mb-2">Step 2 of 2</p>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">Where do you live?</h2>
        <p className="text-slate-500 text-base mb-8 leading-relaxed">
          We'll use real energy data for your state to personalize your experience.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Zip Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder="e.g. 92101"
              value={zipCode}
              onChange={e => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-green-400 focus:outline-none text-slate-900 text-base transition-colors bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              State
            </label>
            <select
              value={stateCode}
              onChange={e => setStateCode(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-green-400 focus:outline-none text-slate-900 text-base transition-colors bg-white appearance-none"
            >
              <option value="">Select your state</option>
              {US_STATES.map(s => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          </div>

          <motion.button
            type="submit"
            disabled={!isValid || loading}
            whileHover={isValid && !loading ? { scale: 1.02 } : {}}
            whileTap={isValid && !loading ? { scale: 0.98 } : {}}
            className={`w-full py-4 rounded-xl font-bold text-base transition-all shadow-sm flex items-center justify-center gap-2
              ${isValid && !loading
                ? 'bg-green-500 hover:bg-green-400 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Fetching energy data for {stateName}…
              </>
            ) : (
              'Start Game →'
            )}
          </motion.button>
        </form>

        <p className="text-xs text-slate-400 mt-5 leading-relaxed text-center">
          We use your state to find real electricity prices from the US Energy Information
          Administration. Your zip code personalizes the ZenPower solar installation data.
        </p>
      </motion.div>
    </div>
  )
}

function PersonaCard({ persona, colors, index, onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
      whileHover={{ y: -6, scale: 1.02 }}
      onClick={() => onSelect(persona)}
      className={`group cursor-pointer rounded-3xl border-2 ${colors.border} ${colors.hoverBorder} ${colors.bg} p-6 flex flex-col card-shadow-lg hover:shadow-xl ${colors.shadow} transition-all duration-200`}
    >
      <div className="text-6xl mb-3 text-center">{persona.avatar}</div>

      <h3 className={`text-2xl font-black text-center mb-1 ${colors.text}`}>
        {persona.name}
      </h3>

      <p className="text-slate-600 text-sm text-center leading-relaxed mb-5 flex-1">
        {persona.description}
      </p>

      <div className="space-y-2 border-t border-slate-200 pt-4 mb-5">
        <StatBadge label="☀️ Solar eligible" value={persona.canInstallSolar ? 'Yes!' : 'No (renter)'} colors={colors} />
        <StatBadge label="💰 Savings available" value={`$${persona.savings.toLocaleString()}`} colors={colors} />
      </div>

      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className={`w-full py-3 rounded-xl font-bold text-base ${colors.btn} transition-colors shadow-sm`}
      >
        Select →
      </motion.button>
    </motion.div>
  )
}

function StatBadge({ label, value, colors }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>{value}</span>
    </div>
  )
}
