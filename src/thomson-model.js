// Vereinfachtes Thomson-Modell mit geregeltem sinusförmigem Spulenstrom,
// höhenabhängiger Gegeninduktivität, RL-Ring und vertikaler Bewegung.
export const thomsonGeometry = Object.freeze({ mutualAtBase: 200e-6, decayHeight: 0.08,
  driveTimeConstant: 0.01, airDrag: 0.012, gravity: 9.81 })

export function thomsonParameters(values) {
  const { currentRms, windings, frequency, mass, ringResistance, ringInductance, closed, held } = values
  if (![currentRms, windings, frequency, mass, ringResistance, ringInductance].every(Number.isFinite) ||
    currentRms < 0 || windings <= 0 || frequency <= 0 || mass <= 0 || ringResistance <= 0 || ringInductance <= 0) {
    throw new RangeError('Strom darf null sein; Windungszahl, Frequenz, Masse, Ringwiderstand und Ringinduktivität müssen positiv sein.')
  }
  return { currentRms, windings, frequency, mass, ringResistance, ringInductance, closed, held,
    omega: 2 * Math.PI * frequency, mutualAtBase: thomsonGeometry.mutualAtBase * windings / 300,
    weight: mass * thomsonGeometry.gravity }
}

export function initialThomsonState() {
  return { time: 0, height: 0, velocity: 0, ringCurrent: 0, drive: 0 }
}

export function thomsonSample(state, parameters, powered) {
  const { time, height, velocity, drive } = state
  const { omega, currentRms, mutualAtBase, ringInductance, ringResistance, weight, closed } = parameters
  const phase = omega * time
  const driveDerivative = ((powered ? 1 : 0) - drive) / thomsonGeometry.driveTimeConstant
  const coilPeak = Math.SQRT2 * currentRms
  const coilCurrent = coilPeak * drive * Math.sin(phase)
  const coilDerivative = coilPeak * (driveDerivative * Math.sin(phase) + drive * omega * Math.cos(phase))
  const mutual = mutualAtBase * Math.exp(-Math.max(0, height) / thomsonGeometry.decayHeight)
  const mutualDerivative = -mutual / thomsonGeometry.decayHeight
  const inducedVoltage = -(mutual * coilDerivative + mutualDerivative * velocity * coilCurrent)
  const ringCurrent = closed ? state.ringCurrent : 0
  const ringDerivative = closed ? (inducedVoltage - ringResistance * ringCurrent) / ringInductance : 0
  const magneticForce = mutualDerivative * coilCurrent * ringCurrent
  const netForce = magneticForce - weight - thomsonGeometry.airDrag * velocity
  const ringReference = coilPeak * mutualAtBase * omega / Math.hypot(ringResistance, omega * ringInductance)
  return { phase, coilCurrent, coilDerivative, ringCurrent, ringDerivative, inducedVoltage,
    mutual, mutualDerivative, magneticForce, netForce, weight, driveDerivative,
    ringHeating: ringResistance * ringCurrent ** 2,
    coilField: coilPeak ? coilCurrent / coilPeak : 0,
    ringField: ringReference ? ringCurrent / ringReference : 0 }
}

// Zyklusmittel im eingeschwungenen Zustand für einen festgehaltenen Ring.
export function stationaryThomsonForce(height, parameters) {
  if (!parameters.closed) return 0
  const mutual = parameters.mutualAtBase * Math.exp(-height / thomsonGeometry.decayHeight)
  const { currentRms, omega, ringInductance, ringResistance } = parameters
  return mutual ** 2 / thomsonGeometry.decayHeight * currentRms ** 2 * omega ** 2 * ringInductance /
    (ringResistance ** 2 + (omega * ringInductance) ** 2)
}

function derivatives(state, parameters, powered) {
  const sample = thomsonSample(state, parameters, powered)
  const resting = state.height <= 0 && state.velocity <= 0 && sample.netForce <= 0
  return { height: parameters.held || resting ? 0 : state.velocity,
    velocity: parameters.held || resting ? 0 : sample.netForce / parameters.mass,
    ringCurrent: sample.ringDerivative, drive: sample.driveDerivative }
}

export function advanceThomson(state, parameters, duration, powered, onSample) {
  if (!Number.isFinite(duration) || duration < 0) throw new RangeError('Die Zeitschrittweite darf nicht negativ sein.')
  let next = { ...state }
  const maximumStep = Math.min(1 / (parameters.frequency * 160),
    parameters.ringInductance / parameters.ringResistance / 20, thomsonGeometry.driveTimeConstant / 20, 0.0005)
  const steps = Math.ceil(duration / maximumStep)
  if (!steps) return next
  const dt = duration / steps
  const fields = ['height', 'velocity', 'ringCurrent', 'drive']
  const shifted = (base, slope, delta) => {
    const value = { ...base, time: base.time + delta }
    for (const field of fields) value[field] += slope[field] * delta
    return value
  }
  for (let index = 0; index < steps; index++) {
    const k1 = derivatives(next, parameters, powered)
    const k2 = derivatives(shifted(next, k1, dt / 2), parameters, powered)
    const k3 = derivatives(shifted(next, k2, dt / 2), parameters, powered)
    const k4 = derivatives(shifted(next, k3, dt), parameters, powered)
    const result = { ...next, time: next.time + dt }
    for (const field of fields) result[field] += dt / 6 * (k1[field] + 2 * k2[field] + 2 * k3[field] + k4[field])
    result.drive = Math.max(0, Math.min(1, result.drive))
    if (!parameters.closed) result.ringCurrent = 0
    if (parameters.held || result.height < 0) { result.height = 0; result.velocity = 0 }
    next = result
    if (onSample) onSample(next, thomsonSample(next, parameters, powered))
  }
  return next
}

// Abschalten exakt am Impulsende, auch wenn ein Animationsschritt es überschreitet.
export function advanceThomsonPulse(state, parameters, duration, pulseEnd, onSample) {
  if (!Number.isFinite(duration) || duration < 0 || !Number.isFinite(pulseEnd) || pulseEnd < 0) {
    throw new RangeError('Impulsende und Zeitschritt müssen endliche, nicht negative Zeiten sein.')
  }
  const onDuration = Math.min(duration, Math.max(0, pulseEnd - state.time))
  let next = advanceThomson(state, parameters, onDuration, true, onSample)
  next = advanceThomson(next, parameters, duration - onDuration, false, onSample)
  return { state: next, powered: next.time < pulseEnd - 1e-12 }
}
