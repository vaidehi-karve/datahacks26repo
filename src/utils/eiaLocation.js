const EIA_BASE = 'https://api.eia.gov/v2'
const API_KEY = import.meta.env.VITE_EIA_API_KEY || ''

// lbs CO2 per kWh — Source: EIA Electric Power Annual 2023
const STATE_CO2_FACTORS = {
  CA: 0.512, TX: 0.839, FL: 0.744, NY: 0.393,
  WA: 0.182, OR: 0.414, NV: 0.618, AZ: 0.716,
  CO: 0.908, IL: 0.681, PA: 0.730, OH: 0.881,
  MI: 0.906, GA: 0.682, NC: 0.671, VA: 0.579,
  MA: 0.529, NJ: 0.437, MD: 0.598, WI: 0.867,
  MN: 0.741, MO: 1.020, IN: 1.039, TN: 0.636,
  AL: 0.725, SC: 0.591, KY: 1.106, LA: 0.839,
  OK: 0.848, AR: 0.757, IA: 0.748, KS: 0.895,
  NE: 0.832, SD: 0.432, ND: 1.089, MT: 0.652,
  WY: 1.163, ID: 0.222, UT: 0.925, NM: 0.910,
  AK: 0.960, HI: 1.144, ME: 0.324, NH: 0.406,
  VT: 0.060, RI: 0.544, CT: 0.452, DE: 0.665,
  DC: 0.479, WV: 1.214, MS: 0.761,
}

// States with direct EIA weekly gas price series
const GAS_PRICE_SERIES = {
  CA: 'EMM_EPMR_PTE_CA_DPG',
  TX: 'EMM_EPMR_PTE_TX_DPG',
  FL: 'EMM_EPMR_PTE_FL_DPG',
  NY: 'EMM_EPMR_PTE_NY_DPG',
  WA: 'EMM_EPMR_PTE_WA_DPG',
  CO: 'EMM_EPMR_PTE_CO_DPG',
  OH: 'EMM_EPMR_PTE_OH_DPG',
  GA: 'EMM_EPMR_PTE_GA_DPG',
  MA: 'EMM_EPMR_PTE_MA_DPG',
  MN: 'EMM_EPMR_PTE_MN_DPG',
  MO: 'EMM_EPMR_PTE_MO_DPG',
  NJ: 'EMM_EPMR_PTE_NJ_DPG',
  NC: 'EMM_EPMR_PTE_NC_DPG',
  OR: 'EMM_EPMR_PTE_OR_DPG',
  DEFAULT: 'EMM_EPMR_PTE_NUS_DPG', // US national average
}

async function fetchEIAData(endpoint, params) {
  if (!API_KEY) throw new Error('No EIA API key configured')
  const url = new URL(`${EIA_BASE}${endpoint}`)
  url.searchParams.set('api_key', API_KEY)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`EIA API returned ${res.status}`)
  return res.json()
}

// Each fetch has its own try/catch so one failure never blocks the others

async function fetchResidentialPrice(stateCode) {
  try {
    const data = await fetchEIAData('/electricity/retail-sales/data', {
      'data[]': 'price',
      'facets[sectorid][]': 'RES',
      'facets[stateid][]': stateCode,
      frequency: 'annual',
      'sort[0][column]': 'period',
      'sort[0][direction]': 'desc',
      length: 1,
    })
    const price = parseFloat(data?.response?.data?.[0]?.price)
    return isNaN(price) || price <= 0 ? null : price
  } catch {
    return null
  }
}

async function fetchCommercialPrice(stateCode) {
  try {
    const data = await fetchEIAData('/electricity/retail-sales/data', {
      'data[]': 'price',
      'facets[sectorid][]': 'COM',
      'facets[stateid][]': stateCode,
      frequency: 'annual',
      'sort[0][column]': 'period',
      'sort[0][direction]': 'desc',
      length: 1,
    })
    const price = parseFloat(data?.response?.data?.[0]?.price)
    return isNaN(price) || price <= 0 ? null : price
  } catch {
    return null
  }
}

async function fetchSolarGeneration(stateCode) {
  try {
    const data = await fetchEIAData('/electricity/electric-power-operational-data/data', {
      'data[]': 'generation',
      'facets[fueltypeid][]': 'SUN',
      'facets[location][]': stateCode,
      frequency: 'annual',
      'sort[0][column]': 'period',
      'sort[0][direction]': 'desc',
      length: 1,
    })
    const gen = parseFloat(data?.response?.data?.[0]?.generation)
    return isNaN(gen) ? null : gen
  } catch {
    return null
  }
}

// Returns { price: number, source: 'state' | 'national' | 'fallback' }
async function fetchGasPrice(stateCode) {
  const seriesKey = GAS_PRICE_SERIES[stateCode] ? stateCode : 'DEFAULT'
  const seriesId = GAS_PRICE_SERIES[seriesKey]
  const source = seriesKey !== 'DEFAULT' ? 'state' : 'national'
  try {
    const data = await fetchEIAData('/petroleum/pri/gnd/data', {
      'data[]': 'value',
      'facets[series][]': seriesId,
      frequency: 'weekly',
      'sort[0][column]': 'period',
      'sort[0][direction]': 'desc',
      length: 1,
    })
    const price = parseFloat(data?.response?.data?.[0]?.value)
    if (!isNaN(price) && price > 0) return { price, source }
    return { price: 3.80, source: 'fallback' }
  } catch {
    return { price: 3.80, source: 'fallback' }
  }
}

export async function fetchStateEnergyData(stateCode) {
  try {
    const [residential, commercial, solar, gasResult] = await Promise.all([
      fetchResidentialPrice(stateCode),
      fetchCommercialPrice(stateCode),
      fetchSolarGeneration(stateCode),
      fetchGasPrice(stateCode),
    ])

    const residentialPriceCents = residential ?? 16.0
    const commercialPriceCents = commercial ?? 12.5
    // isFallback only when both electricity prices couldn't be fetched
    const isFallback = residential === null && commercial === null

    return {
      stateCode,
      residentialPriceCents,
      commercialPriceCents,
      solarGenerationMWh: solar,
      gasPricePerGallon: gasResult.price,
      gasPriceSource: gasResult.source,
      co2Factor: STATE_CO2_FACTORS[stateCode] ?? 0.700,
      isFallback,
    }
  } catch (error) {
    console.error('EIA fetch failed entirely, using fallbacks', error)
    return {
      stateCode,
      residentialPriceCents: 16.0,
      commercialPriceCents: 12.5,
      solarGenerationMWh: null,
      gasPricePerGallon: 3.80,
      gasPriceSource: 'fallback',
      co2Factor: STATE_CO2_FACTORS[stateCode] ?? 0.700,
      isFallback: true,
    }
  }
}
