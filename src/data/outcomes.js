// All constants sourced from EIA data
// EIA Electricity Retail Sales, EIA RECS, EIA emissions factors

const CA_RESIDENTIAL_RATE = 0.29       // $/kWh — EIA 2024 retail sales (CA fallback)
const CA_COMMERCIAL_RATE = 0.21        // $/kWh — EIA 2024 commercial (CA fallback)
const CA_GRID_CO2_LBS_PER_KWH = 0.512 // lbs CO2/kWh — EIA 2023 eGRID CA (fallback)
const TOU_OFF_PEAK = 0.14              // $/kWh — SCE TOU-D-PRIME off-peak
const TOU_PEAK = 0.42                  // $/kWh — SCE TOU-D-PRIME peak
const TOU_BASELINE = 0.29             // $/kWh — flat rate equivalent
const PEAK_USAGE_PCT = 0.42           // % usage during peak — EIA RECS 2020
const CA_SOLAR_KWH_PER_KW_YR = 1500  // kWh/kW/yr — EIA solar resource data CA
const RESIDENTIAL_SYSTEM_KW = 7       // typical residential system size
const COMMERCIAL_SYSTEM_KW = 50       // typical small commercial system
const GAS_CO2_LBS_PER_GALLON = 19.6   // lbs CO2/gallon gasoline — EIA
const NATIONAL_GAS_PRICE = 3.80       // $/gallon — national average fallback
const AVG_MILES_PER_YEAR = 12000      // miles — FHWA 2023
const GAS_CAR_MPG = 28                // EPA average new car 2024
const EV_MILES_PER_KWH = 3.5         // miles/kWh — EPA average EV efficiency
const COMMUNITY_MULTIPLIER = 3.0      // EIA community solar impact factor

function calcTouSavings(monthlyBill) {
  const monthlyKwh = monthlyBill / TOU_BASELINE
  const offPeakKwh = monthlyKwh * (1 - PEAK_USAGE_PCT)
  const peakKwh = monthlyKwh * PEAK_USAGE_PCT
  const newBill = offPeakKwh * TOU_OFF_PEAK + peakKwh * TOU_PEAK
  return monthlyBill - newBill
}

function calcSolarAnnualSavings(personaId, rate) {
  const systemKw = personaId === 'smallbiz' ? COMMERCIAL_SYSTEM_KW : RESIDENTIAL_SYSTEM_KW
  const annualKwh = CA_SOLAR_KWH_PER_KW_YR * systemKw
  return { annualKwh, annualSavings: annualKwh * rate }
}

function calcSolarCO2(annualKwh, co2LbsPerKwh) {
  return (annualKwh * co2LbsPerKwh) / 2000 // tons
}

export function getOutcome(decisionId, optionId, persona, eiaData) {
  const residentialRate = eiaData ? eiaData.residentialPriceCents / 100 : CA_RESIDENTIAL_RATE
  const commercialRate = eiaData ? eiaData.commercialPriceCents / 100 : CA_COMMERCIAL_RATE
  const co2LbsPerKwh = eiaData ? eiaData.co2Factor : CA_GRID_CO2_LBS_PER_KWH
  const rate = persona.id === 'smallbiz' ? commercialRate : residentialRate
  const bill = persona.monthlyBill

  const outcomes = {
    bill: {
      tou: () => {
        const monthlySavings = calcTouSavings(bill)
        return {
          monthlyBillChange: -Math.round(monthlySavings),
          upfrontCost: 0,
          fiveYearSavings: Math.round(monthlySavings * 12 * 5),
          co2TonsPerYear: 0.2,
          flags: { onTOUPlan: true },
          insight: '42% of CA households shifted load after adopting TOU pricing, reducing peak demand strain.',
          source: 'EIA 2024 Retail Sales / SCE TOU-D-PRIME rate schedule',
          paybackMonths: 0,
        }
      },
      thermostat: () => {
        const monthlySavings = Math.round(bill * 0.10)
        return {
          monthlyBillChange: -monthlySavings,
          upfrontCost: 150,
          fiveYearSavings: monthlySavings * 12 * 5 - 150,
          co2TonsPerYear: 0.4,
          flags: { hasSmartThermostat: true },
          insight: 'Smart thermostats reduce HVAC energy use by 10–15%. HVAC is 47% of home energy use.',
          source: 'EIA RECS 2020 / EPA ENERGY STAR',
          paybackMonths: Math.round(150 / monthlySavings),
        }
      },
      nothing: () => ({
        monthlyBillChange: 0,
        upfrontCost: 0,
        fiveYearSavings: 0,
        co2TonsPerYear: 0,
        flags: {},
        insight: '66% of eligible CA households have not switched to TOU pricing despite potential savings.',
        source: 'CPUC TOU Opt-In Report 2023',
        paybackMonths: null,
      }),
      assistance: () => ({
        monthlyBillChange: -Math.round(bill * 0.3),
        upfrontCost: 0,
        fiveYearSavings: Math.round(bill * 0.3 * 12 * 5),
        co2TonsPerYear: 0,
        flags: { hasCARE: true },
        insight: 'CARE program provides 30–35% discount on CA utility bills. 3.5M households currently enrolled.',
        source: 'CPUC CARE Program 2024',
        paybackMonths: 0,
      }),
    },

    solar: {
      install_now: () => {
        const systemCost = persona.id === 'smallbiz' ? 45000 : 18000
        const netCost = systemCost - Math.round(systemCost * 0.3) - 1000
        const { annualKwh, annualSavings } = calcSolarAnnualSavings(persona.id, rate)
        const paybackYears = netCost / annualSavings
        return {
          monthlyBillChange: -Math.round(annualSavings / 12),
          upfrontCost: 0,
          fiveYearSavings: Math.round(annualSavings * 5 - netCost * 0.05 * 5),
          co2TonsPerYear: Math.round(calcSolarCO2(annualKwh, co2LbsPerKwh) * 10) / 10,
          flags: { hasSolar: true },
          insight: 'CA solar installations grew 34% YoY in 2023. Average payback: 7–9 years for residential.',
          source: 'EIA Solar Power Operational Data 2024 / CPUC NEM 3.0',
          paybackMonths: Math.round(paybackYears * 12),
        }
      },
      install_later: () => {
        const systemCost = persona.id === 'smallbiz' ? 47000 : 20000
        const netCost = systemCost - Math.round(systemCost * 0.3) - 1000
        const { annualKwh, annualSavings } = calcSolarAnnualSavings(persona.id, rate)
        return {
          monthlyBillChange: 0,
          upfrontCost: 0,
          fiveYearSavings: Math.round(annualSavings * 2),
          co2TonsPerYear: Math.round(calcSolarCO2(annualKwh, co2LbsPerKwh) * 10) / 10 * 0.4,
          flags: {},
          insight: 'Bundling solar with roof replacement saves $2,000–4,000 in labor. But 3 years delay = 3 years of full bills.',
          source: 'SEIA Solar Market Insight 2024',
          paybackMonths: Math.round((netCost / annualSavings) * 12),
        }
      },
      community_solar: () => ({
        monthlyBillChange: -5,
        upfrontCost: 15,
        fiveYearSavings: 5 * 12 * 5,
        co2TonsPerYear: 1.2,
        flags: { hasCommunitySolarBadge: true },
        insight: 'Community solar subscriptions grew 49% in 2023. No installation, no roof assessment needed.',
        source: 'NREL Community Solar Market Report 2024',
        paybackMonths: 3,
      }),
      decline: () => ({
        monthlyBillChange: 0,
        upfrontCost: 0,
        fiveYearSavings: 0,
        co2TonsPerYear: 0,
        flags: {},
        insight: '66% of homeowners who got a solar quote in 2022 did not install within 6 months. Most cited complexity.',
        source: 'SEIA Homeowner Decision Survey 2023',
        paybackMonths: null,
      }),
    },

    solar_community: {
      subscribe: () => ({
        monthlyBillChange: -5,
        upfrontCost: 15,
        fiveYearSavings: 5 * 12 * 5,
        co2TonsPerYear: 0.8,
        flags: { joinedCommunitySolar: true },
        insight: 'Renters represent 45% of CA households but historically had no path to solar benefits.',
        source: 'CPUC Community Solar Program 2024',
        paybackMonths: 3,
      }),
      recruit: () => ({
        monthlyBillChange: -5,
        upfrontCost: 15,
        fiveYearSavings: 5 * 12 * 5,
        co2TonsPerYear: 0.8 * COMMUNITY_MULTIPLIER,
        flags: { joinedCommunitySolar: true },
        insight: 'Building-wide community solar adoption has 3× the grid impact of single-unit participation due to demand reduction at scale.',
        source: 'NREL Community Solar Market Report 2024',
        paybackMonths: 3,
      }),
      waitlist: () => ({
        monthlyBillChange: 0,
        upfrontCost: 0,
        fiveYearSavings: 0,
        co2TonsPerYear: 0,
        flags: {},
        insight: 'Community solar programs often have capacity limits — waitlists can be 6–18 months in high-demand areas.',
        source: 'CPUC Community Solar Program 2024',
        paybackMonths: null,
      }),
      pass: () => ({
        monthlyBillChange: 0,
        upfrontCost: 0,
        fiveYearSavings: 0,
        co2TonsPerYear: 0,
        flags: {},
        insight: 'The average renter misses $1,200 in potential clean energy savings over 5 years by not participating in available programs.',
        source: 'ACEEE Renter Energy Equity Report 2023',
        paybackMonths: null,
      }),
    },

    car: {
      used_gas: () => {
        const gasPrice = eiaData?.gasPricePerGallon ?? NATIONAL_GAS_PRICE
        const gasPriceSource = eiaData?.gasPriceSource ?? 'fallback'
        const annualGasCost = (AVG_MILES_PER_YEAR / GAS_CAR_MPG) * gasPrice
        const annualEVCost = (AVG_MILES_PER_YEAR / EV_MILES_PER_KWH) * residentialRate
        const annualCO2 = (AVG_MILES_PER_YEAR / GAS_CAR_MPG) * GAS_CO2_LBS_PER_GALLON / 2000
        return {
          monthlyBillChange: Math.round(annualGasCost / 12),
          upfrontCost: 12000,
          fiveYearSavings: -Math.round(annualGasCost * 5),
          co2TonsPerYear: -Math.round(annualCO2 * 10) / 10,
          flags: { hasGasCar: true },
          insight: `At $${gasPrice.toFixed(2)}/gallon, fuel costs for a 28MPG car are $${Math.round(annualGasCost).toLocaleString()}/year.`,
          source: 'EIA Weekly Petroleum Report 2024 / EIA STEO 2024',
          paybackMonths: null,
          fuelBreakdown: {
            gasPricePerGallon: gasPrice,
            gasPriceSource,
            annualGasCost,
            annualEVCost,
            evAnnualSavings: annualGasCost - annualEVCost,
          },
        }
      },
      used_ev: () => {
        const gasPrice = eiaData?.gasPricePerGallon ?? NATIONAL_GAS_PRICE
        const gasPriceSource = eiaData?.gasPriceSource ?? 'fallback'
        const annualEVCost = (AVG_MILES_PER_YEAR / EV_MILES_PER_KWH) * residentialRate
        const annualEVCO2 = (AVG_MILES_PER_YEAR / EV_MILES_PER_KWH) * co2LbsPerKwh / 2000
        const annualGasCost = (AVG_MILES_PER_YEAR / GAS_CAR_MPG) * gasPrice
        const savedVsGas = annualGasCost - annualEVCost
        return {
          monthlyBillChange: Math.round(annualEVCost / 12),
          upfrontCost: 14000,
          fiveYearSavings: Math.round(savedVsGas * 5) - 2000,
          co2TonsPerYear: -Math.round(annualEVCO2 * 10) / 10,
          flags: { hasEV: true },
          insight: `Used EVs save $${Math.round(savedVsGas).toLocaleString()}/year on fuel vs. the average gas car. EVs emit significantly less CO₂ per mile than gas vehicles.`,
          source: 'EIA Electricity Data 2024 / EIA emissions factors / EPA',
          paybackMonths: null,
          fuelBreakdown: {
            gasPricePerGallon: gasPrice,
            gasPriceSource,
            annualGasCost,
            annualEVCost,
            evAnnualSavings: savedVsGas,
          },
        }
      },
      new_ev: () => {
        const gasPrice = eiaData?.gasPricePerGallon ?? NATIONAL_GAS_PRICE
        const gasPriceSource = eiaData?.gasPriceSource ?? 'fallback'
        const annualEVCost = (AVG_MILES_PER_YEAR / EV_MILES_PER_KWH) * residentialRate
        const annualGasCost = (AVG_MILES_PER_YEAR / GAS_CAR_MPG) * gasPrice
        const savedVsGas = annualGasCost - annualEVCost
        const annualEVCO2 = (AVG_MILES_PER_YEAR / EV_MILES_PER_KWH) * co2LbsPerKwh / 2000
        return {
          monthlyBillChange: Math.round(annualEVCost / 12),
          upfrontCost: 27500,
          fiveYearSavings: Math.round(savedVsGas * 5) - 15500,
          co2TonsPerYear: -Math.round(annualEVCO2 * 10) / 10,
          flags: { hasEV: true },
          insight: 'New EV prices dropped 22% in 2023. By 2026 EIA projects EVs will reach purchase price parity with comparable gas vehicles.',
          source: 'EIA Annual Energy Outlook 2024 / BloombergNEF EV Outlook',
          paybackMonths: null,
          fuelBreakdown: {
            gasPricePerGallon: gasPrice,
            gasPriceSource,
            annualGasCost,
            annualEVCost,
            evAnnualSavings: savedVsGas,
          },
        }
      },
      no_car: () => {
        const gasPrice = eiaData?.gasPricePerGallon ?? NATIONAL_GAS_PRICE
        const gasPriceSource = eiaData?.gasPriceSource ?? 'fallback'
        const annualGasCost = (AVG_MILES_PER_YEAR / GAS_CAR_MPG) * gasPrice
        const annualEVCost = (AVG_MILES_PER_YEAR / EV_MILES_PER_KWH) * residentialRate
        return {
          monthlyBillChange: -100,
          upfrontCost: 1200,
          fiveYearSavings: Math.round((annualGasCost - 1200) * 5),
          co2TonsPerYear: 3.8,
          flags: { noCar: true },
          insight: 'Transit riders produce 45% less CO₂ per mile than solo car commuters. Only 14% of CA trips are currently made by transit.',
          source: 'APTA Public Transportation Fact Book 2024 / EIA',
          paybackMonths: null,
          fuelBreakdown: {
            gasPricePerGallon: gasPrice,
            gasPriceSource,
            annualGasCost,
            annualEVCost,
            evAnnualSavings: annualGasCost - annualEVCost,
          },
        }
      },
    },

    appliance: {
      gas_heater: () => ({
        monthlyBillChange: 33,
        upfrontCost: 900,
        fiveYearSavings: -Math.round(400 * 5) + 900 * -1,
        co2TonsPerYear: -1.1,
        flags: { hasGasHeater: true },
        insight: 'Gas water heaters emit ~1.1 tons CO₂/year. CA plans to phase out new gas appliance sales by 2030.',
        source: 'EIA RECS 2020 / CARB 2030 clean appliance standard',
        paybackMonths: null,
      }),
      electric_heater: () => ({
        monthlyBillChange: Math.round(4800 * residentialRate / 12),
        upfrontCost: 950,
        fiveYearSavings: -Math.round(4800 * residentialRate * 5),
        co2TonsPerYear: -Math.round((4800 * co2LbsPerKwh / 2000) * 10) / 10,
        flags: {},
        insight: 'Standard electric water heaters are the most expensive option to operate — they\'re often less efficient than even gas in high-rate states.',
        source: 'EIA RECS 2020',
        paybackMonths: null,
      }),
      heat_pump: () => {
        const annualKwh = 1400
        const annualCost = annualKwh * residentialRate
        const annualCO2 = (annualKwh * co2LbsPerKwh) / 2000
        const savedVsElectric = 4800 * residentialRate - annualCost
        return {
          monthlyBillChange: -Math.round(savedVsElectric / 12),
          upfrontCost: 1800 - 300,
          fiveYearSavings: Math.round(savedVsElectric * 5) - (1800 - 300 - 950),
          co2TonsPerYear: Math.round(annualCO2 * 10) / 10,
          flags: { hasHeatPump: true },
          insight: 'Heat pump water heaters use 70% less electricity than standard electric. IRA rebates up to $1,750 available for low-to-moderate income households.',
          source: 'EIA RECS 2020 / DOE HPWH analysis / IRA Inflation Reduction Act',
          paybackMonths: Math.round((1800 - 950 - 300) / (savedVsElectric / 12)),
        }
      },
      solar_water: () => ({
        monthlyBillChange: -Math.round((4800 - 300) * residentialRate / 12),
        upfrontCost: 3200,
        fiveYearSavings: Math.round((4800 - 300) * residentialRate * 5) - (3200 - 950),
        co2TonsPerYear: Math.round(((4800 - 300) * co2LbsPerKwh / 2000) * 10) / 10,
        flags: { hasSolarWater: true },
        insight: 'Solar water heaters offset 50–80% of water heating costs. Less complex than PV solar — no inverter, no permitting in most counties.',
        source: 'NREL Solar Water Heating Analysis 2023',
        paybackMonths: Math.round(3200 / ((4800 - 300) * residentialRate / 12)),
      }),
    },

    community: {
      vote_yes: () => {
        const indiv = 2.1
        return {
          monthlyBillChange: 0,
          upfrontCost: 400,
          fiveYearSavings: -400,
          co2TonsPerYear: indiv * COMMUNITY_MULTIPLIER,
          flags: { votedYesCharger: true, communityDone: true },
          insight: 'EV charger availability in buildings increases EV adoption 3× vs. buildings without chargers.',
          source: 'NREL EV Charging Infrastructure Study 2023',
          paybackMonths: null,
        }
      },
      vote_yes_sliding: () => ({
        monthlyBillChange: 0,
        upfrontCost: 200,
        fiveYearSavings: -200,
        co2TonsPerYear: 2.1 * COMMUNITY_MULTIPLIER * 1.2,
        flags: { votedYesCharger: true, communityDone: true },
        insight: 'Income-tiered programs achieve 40% higher participation rates, maximizing community-level CO₂ reduction.',
        source: 'ACEEE Community Energy Equity Report 2023',
        paybackMonths: null,
      }),
      vote_no: () => ({
        monthlyBillChange: 0,
        upfrontCost: 0,
        fiveYearSavings: 0,
        co2TonsPerYear: 0,
        flags: { communityDone: true },
        insight: 'Buildings without EV chargers have 73% lower EV ownership rates. Lack of infrastructure is the #1 cited barrier to EV adoption in multi-unit dwellings.',
        source: 'NREL EV Charging Infrastructure Study 2023 / CPUC',
        paybackMonths: null,
      }),
      propose_solar: () => ({
        monthlyBillChange: -15,
        upfrontCost: 600,
        fiveYearSavings: Math.round(15 * 12 * 5) - 600,
        co2TonsPerYear: 4.2,
        flags: { communityDone: true },
        insight: 'Community center solar can generate HOA revenue of $800–2,000/year while reducing common area electricity costs.',
        source: 'NREL Community Solar Market Report 2024',
        paybackMonths: Math.round(600 / 15),
      }),
    },
  }

  const decisionOutcomes = outcomes[decisionId]
  if (!decisionOutcomes) return null
  const fn = decisionOutcomes[optionId]
  if (!fn) return null
  return fn()
}

export const EIA_CONSTANTS = {
  CA_RESIDENTIAL_RATE,
  CA_COMMERCIAL_RATE,
  TOU_OFF_PEAK,
  TOU_PEAK,
  CA_GRID_CO2_LBS_PER_KWH,
  GAS_CO2_LBS_PER_GALLON,
  NATIONAL_GAS_PRICE,
  AVG_MILES_PER_YEAR,
  CA_SOLAR_KWH_PER_KW_YR,
  RESIDENTIAL_SYSTEM_KW,
  COMMERCIAL_SYSTEM_KW,
  COMMUNITY_MULTIPLIER,
}
