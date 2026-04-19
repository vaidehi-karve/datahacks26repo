import Papa from 'papaparse'
import csvFile from '../../data/comparison_data_by_state.csv?raw'

let approvalLookup = {}
let nationalAverage = 11.2

Papa.parse(csvFile, {
  header: true,
  skipEmptyLines: true,
  complete: (results) => {
    results.data.forEach((row) => {
      if (!row.state) return
      if (row.state.trim().toUpperCase() === 'AVERAGE') {
        const avg = parseFloat(row.approval_time)
        if (!isNaN(avg)) nationalAverage = avg
      } else {
        const days = parseFloat(row.approval_time)
        if (!isNaN(days)) {
          approvalLookup[row.state.trim().toUpperCase()] = days
        }
      }
    })
  },
})

export function getApprovalTime(stateCode) {
  const code = stateCode?.trim().toUpperCase()
  const days = code ? approvalLookup[code] : undefined

  if (days !== undefined && !isNaN(days)) {
    return {
      days,
      isStateSpecific: true,
      source: `${code} state average`,
    }
  }

  return {
    days: nationalAverage,
    isStateSpecific: false,
    source: 'national average (state not in dataset)',
  }
}
