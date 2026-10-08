// Freier, ungedämpfter LC-Kreis. i > 0 bedeutet Entladung der oberen,
// zunächst positiven Kondensatorplatte: i = -dq/dt.
export function lcProperties({ inductance, capacitance, voltage }) {
  if (![inductance, capacitance, voltage].every(Number.isFinite) || inductance <= 0 || capacitance <= 0 || voltage < 0) {
    throw new RangeError('L und C müssen positiv sein; die Ladespannung darf nicht negativ sein.')
  }
  const omega = 1 / Math.sqrt(inductance * capacitance)
  const period = 2 * Math.PI / omega
  return { inductance, capacitance, voltage, omega, period, frequency: 1 / period,
    chargeMax: capacitance * voltage, currentMax: voltage * Math.sqrt(capacitance / inductance),
    energy: 0.5 * capacitance * voltage ** 2 }
}

export function lcSample(time, properties) {
  const { omega, voltage, chargeMax, currentMax, capacitance, inductance, energy } = properties
  const phase = omega * time
  const clean = value => Math.abs(value) < 1e-12 ? 0 : value
  const electricField = voltage > 0 ? clean(Math.cos(phase)) : 0
  const magneticField = voltage > 0 ? clean(Math.sin(phase)) : 0
  const uC = voltage * electricField
  const current = currentMax * magneticField
  const currentDerivative = voltage / inductance * electricField
  return { phase, charge: chargeMax * electricField, uC, uL: -uC, current,
    currentDerivative, inducedVoltage: -inductance * currentDerivative,
    electricEnergy: 0.5 * capacitance * uC ** 2,
    magneticEnergy: 0.5 * inductance * current ** 2,
    totalEnergy: energy, electricField, magneticField,
    // Negatives Integral von i: Elektronen bewegen sich entgegen i.
    electronMotion: electricField }
}
