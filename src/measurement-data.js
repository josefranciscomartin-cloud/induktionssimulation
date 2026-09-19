// Eigenständige Übungsdaten; die Einstellungen und Rechnungen des Versuchs bleiben unverändert.
export const exerciseCoils = Object.freeze({ n1: 400, n2: 600, a1: 0.004, a2: 0.002, length: 0.2, amplitude: 0.2, frequency: 1 })
export const exerciseRuns = Object.freeze([
  Object.freeze({ amplitude: 0.2, frequency: 1 }),
  Object.freeze({ amplitude: 0.16, frequency: 0.75 }),
  Object.freeze({ amplitude: 0.24, frequency: 0.75 }),
  Object.freeze({ amplitude: 0.18, frequency: 0.5 })
])
const mu0 = 4 * Math.PI * 1e-7
export const coilFactor = exerciseCoils.n2 * Math.min(exerciseCoils.a1, exerciseCoils.a2) * mu0 * exerciseCoils.n1 / exerciseCoils.length
const round = (value, decimals) => Number(value.toFixed(decimals))

export function createMeasurements(waveform = 'triangle', noisy = false, random = Math.random, runNumber = 0) {
  const run = exerciseRuns[((runNumber % exerciseRuns.length) + exerciseRuns.length) % exerciseRuns.length]
  const parameters = { ...exerciseCoils, ...run }
  const rows = Array.from({ length: 10 }, (_, index) => {
    const t = index * 0.025
    const angle = 2 * Math.PI * parameters.frequency * t
    const current = waveform === 'sine' ? parameters.amplitude * Math.sin(angle) : 4 * parameters.amplitude * parameters.frequency * t
    const derivative = waveform === 'sine' ? parameters.amplitude * 2 * Math.PI * parameters.frequency * Math.cos(angle) : 4 * parameters.amplitude * parameters.frequency
    return {
      timeMs: index * 25,
      currentMa: round(current * 1000 + (noisy ? (random() * 2 - 1) * 0.5 : 0), 1),
      voltageMv: round(-coilFactor * derivative * 1000 + (noisy ? (random() * 2 - 1) * 0.08 : 0), 2)
    }
  })
  // Rechenziele konsequent aus den sichtbaren, gerundeten Tabellenwerten bestimmen.
  const start = rows[2], end = rows[8], middle = rows[5]
  const deltaI = (end.currentMa - start.currentMa) / 1000
  const deltaT = (end.timeMs - start.timeMs) / 1000
  const slope = deltaI / deltaT
  const voltage = -coilFactor * slope
  const measured = middle.voltageMv / 1000
  return {
    waveform, noisy, rows, parameters,
    targets: { deltaI, deltaT, slope, voltage, measured, difference: Math.abs(voltage - measured) },
    // Fehlergrenzen einschließlich der Rundung auf die letzte dargestellte Stelle.
    currentUncertaintyMa: noisy ? 0.55 : 0.05,
    voltageUncertaintyMv: noisy ? 0.085 : 0.005,
    voltageComparisonBoundMv: coilFactor * (2 * (noisy ? 0.55 : 0.05) / 1000) / deltaT * 1000 + (noisy ? 0.085 : 0.005)
  }
}

export const answerDefinitions = [
  { key: 'deltaI', label: '1. Stromänderung ΔI zwischen 50 ms und 200 ms', units: [['A', 1], ['mA', 0.001]], hint: 'ΔI = I(200 ms) − I(50 ms). Die Tabelle gibt I in mA an.', floor: 0.00005 },
  { key: 'deltaT', label: '2. Zeitintervall Δt', units: [['s', 1], ['ms', 0.001]], hint: 'Δt = 200 ms − 50 ms. Für A/s musst du die Zeit in Sekunden einsetzen.', floor: 0.00005 },
  { key: 'slope', label: '3. Mittlere Stromsteigung ΔI/Δt', units: [['A/s', 1], ['mA/s', 0.001]], hint: 'Teile die Stromänderung durch das Zeitintervall. Ein positiver Quotient bedeutet einen ansteigenden Strom.', floor: 0.0005 },
  { key: 'voltage', label: '4. Berechnete mittlere Induktionsspannung', units: [['V', 1], ['mV', 0.001]], hint: 'U_ind = −K · ΔI/Δt. Verwende K = 0,003016 V·s/A. Beachte das Minuszeichen!', floor: 0.000005 },
  { key: 'measured', label: '5. Gemessene Induktionsspannung bei 125 ms', units: [['V', 1], ['mV', 0.001]], hint: 'Lies U_ind bei 125 ms aus der Tabelle ab. Dieser Wert gehört zu einem Zeitpunkt, nicht zum ganzen Intervall.', floor: 0.000005 },
  { key: 'difference', label: '6. Betrag der Differenz zwischen Rechnung und Messwert', units: [['V', 1], ['mV', 0.001]], hint: 'Berechne |U_berechnet − U_gemessen(125 ms)|. Rechne zunächst mit ungerundeten Zwischenergebnissen.', floor: 0.00001 }
]

export function parseAnswer(value) {
  const text = value.trim().replace(/−/g, '-').replace(',', '.')
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) return null
  const number = Number(text)
  return Number.isFinite(number) ? number : null
}

export function checkAnswer(definition, value, unit, expected) {
  const number = parseAnswer(value)
  const scale = definition.units.find(([name]) => name === unit)?.[1]
  if (number === null) return { correct: false, message: 'Bitte eine Zahl eingeben, z. B. −2,41. Die Einheit wählst du daneben.' }
  if (scale === undefined) return { correct: false, message: 'Bitte die passende Einheit auswählen.' }
  const actual = number * scale
  const tolerance = Math.max(Math.abs(expected) * 0.01, definition.floor)
  if (Math.abs(actual - expected) <= tolerance) return { correct: true, message: 'Richtig – Wert, Einheit und Vorzeichen passen.' }
  if (expected * actual < 0) return { correct: false, message: 'Prüfe das Vorzeichen. Bei der Induktionsspannung ist das Minuszeichen der Lenzschen Regel entscheidend.' }
  const ratio = expected ? Math.abs(actual / expected) : 0
  if (Math.abs(ratio - 1000) < 20 || Math.abs(ratio - 0.001) < 0.00002) return { correct: false, message: 'Prüfe die Umrechnung: 1000 mA = 1 A, 1000 ms = 1 s, 1000 mV = 1 V.' }
  return { correct: false, message: 'Noch nicht passend. Prüfe den Rechenschritt mit den angezeigten Tabellenwerten und dem Hinweis.' }
}

export function measurementsCsv(data) {
  const number = value => String(value).replace('.', ',')
  return '\uFEFF' + [
    'Zeit (ms);Strom (mA);Induktionsspannung (mV);Stromform;Datenstufe;N1;N2;A1 (m²);A2 (m²);l (m);Imax (A);f (Hz);Fehlergrenze I (mA);Fehlergrenze U (mV)',
    ...data.rows.map(row => [row.timeMs, row.currentMa, row.voltageMv, data.waveform === 'sine' ? 'Sinus' : 'Dreieck', data.noisy ? 'Simulierte Messung' : 'Ideal gerundet', data.parameters.n1, data.parameters.n2, data.parameters.a1, data.parameters.a2, data.parameters.length, data.parameters.amplitude, data.parameters.frequency, data.currentUncertaintyMa, data.voltageUncertaintyMv].map(number).join(';'))
  ].join('\r\n')
}
