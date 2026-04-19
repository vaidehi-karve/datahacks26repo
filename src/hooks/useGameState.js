import { useState, useCallback } from 'react'
import { getDecisionsForPersona } from '../data/decisions'
import { getOutcome } from '../data/outcomes'

const initialState = {
  persona: null,
  round: 0,
  decisions: [],
  totalBillSavings: 0,
  totalCO2Avoided: 0,
  totalUpfrontCost: 0,
  currentMonthlyBill: 0,
  hasSolar: false,
  hasEV: false,
  hasSmartThermostat: false,
  onTOUPlan: false,
  noCar: false,
  hasHeatPump: false,
  hasSolarWater: false,
  hasGasHeater: false,
  hasGasCar: false,
  hasCARE: false,
  hasCommunitySolarBadge: false,
  joinedCommunitySolar: false,
  communityDone: false,
  votedYesCharger: false,
  // location fields
  zipCode: null,
  stateCode: null,
  stateName: null,
  eiaData: null,
  isFallback: false,
  screen: 'welcome', // welcome | persona | decision | outcome | final
  lastOutcome: null,
}

function calcBaselineBill(personaId, eiaData) {
  if (!eiaData) return null
  if (personaId === 'homeowner') return Math.round((eiaData.residentialPriceCents / 100) * 900)
  if (personaId === 'renter') return Math.round((eiaData.residentialPriceCents / 100) * 600)
  if (personaId === 'smallbiz') return Math.round((eiaData.commercialPriceCents / 100) * 2500)
  return null
}

export function useGameState() {
  const [state, setState] = useState(initialState)

  // Called from App after location data is fetched — starts the game
  const selectPersona = useCallback((persona, locationData) => {
    const eiaData = locationData?.eiaData ?? null
    const realBill = calcBaselineBill(persona.id, eiaData)
    const monthlyBill = realBill ?? persona.monthlyBill
    setState((s) => ({
      ...s,
      persona: { ...persona, monthlyBill },
      currentMonthlyBill: monthlyBill,
      zipCode: locationData?.zipCode ?? null,
      stateCode: locationData?.stateCode ?? null,
      stateName: locationData?.stateName ?? null,
      eiaData,
      isFallback: locationData?.isFallback ?? false,
      screen: 'decision',
      round: 0,
    }))
  }, [])

  const makeDecision = useCallback((decisionId, optionId) => {
    setState((s) => {
      const outcome = getOutcome(decisionId, optionId, s.persona, s.eiaData)
      if (!outcome) return s
      return {
        ...s,
        round: s.round + 1,
        decisions: [...s.decisions, { decisionId, optionId, outcome }],
        totalBillSavings: s.totalBillSavings + (outcome.fiveYearSavings || 0),
        totalCO2Avoided: s.totalCO2Avoided + (outcome.co2TonsPerYear || 0),
        totalUpfrontCost: s.totalUpfrontCost + (outcome.upfrontCost || 0),
        currentMonthlyBill: s.currentMonthlyBill + (outcome.monthlyBillChange || 0),
        ...outcome.flags,
        lastOutcome: { decisionId, optionId, outcome },
        screen: 'outcome',
      }
    })
  }, [])

  const continueToNext = useCallback(() => {
    setState((s) => {
      const decisions = getDecisionsForPersona(s.persona.id)
      if (s.round >= decisions.length) {
        return { ...s, screen: 'final' }
      }
      return { ...s, screen: 'decision' }
    })
  }, [])

  const goToPersonaSelect = useCallback(() => {
    setState((s) => ({ ...s, screen: 'persona' }))
  }, [])

  const restart = useCallback(() => {
    setState(initialState)
  }, [])

  const currentDecision = useCallback(() => {
    if (!state.persona) return null
    const decisions = getDecisionsForPersona(state.persona.id)
    return decisions[state.round] ?? null
  }, [state.persona, state.round])

  const totalDecisions = state.persona
    ? getDecisionsForPersona(state.persona.id).length
    : 5

  return {
    state,
    selectPersona,
    makeDecision,
    continueToNext,
    goToPersonaSelect,
    restart,
    currentDecision,
    totalDecisions,
  }
}
