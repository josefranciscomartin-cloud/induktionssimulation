// Einphasiges Vergleichsmodell: ideale Transformatoren, rein ohmsche Hin- und
// Rückleitung und angepasste ohmsche Last bei konstanter Kraftwerksleistung.
export function transmissionOperatingPoint({ power, voltage, resistance }) {
  if (![power, voltage, resistance].every(Number.isFinite) || power < 0 || voltage <= 0 || resistance < 0) {
    throw new RangeError('Leistung und Widerstand müssen nichtnegativ sein, die Spannung muss positiv sein.')
  }
  const sourceVoltage = 230
  const homeNominalVoltage = 230
  const lineCurrent = power / voltage
  const voltageDrop = lineCurrent * resistance
  const receivedVoltage = voltage - voltageDrop
  if (receivedVoltage <= 0) {
    throw new RangeError('Diese Kombination würde die gesamte Kraftwerksleistung in der Leitung verbrauchen oder überschreiten. Spannung erhöhen, Leistung oder Leitungswiderstand senken.')
  }
  const loss = lineCurrent ** 2 * resistance
  const delivered = power - loss
  const homeVoltage = receivedVoltage * homeNominalVoltage / voltage
  const sourceCurrent = power / sourceVoltage
  const homeCurrent = lineCurrent * voltage / homeNominalVoltage
  return { power, voltage, resistance, sourceVoltage, homeNominalVoltage, lineCurrent,
    voltageDrop, receivedVoltage, loss, delivered, homeVoltage, sourceCurrent, homeCurrent,
    efficiency: power > 0 ? delivered / power : 1,
    stepUp: voltage / sourceVoltage, stepDown: homeNominalVoltage / voltage }
}

export function transmissionSample(time, frequency, point) {
  const phase = 2 * Math.PI * frequency * time
  const sine = Math.sin(phase)
  const peak = Math.SQRT2 * sine
  return {
    phase,
    sourceVoltage: point.sourceVoltage * peak,
    sendingVoltage: point.voltage * peak,
    receivedVoltage: point.receivedVoltage * peak,
    homeVoltage: point.homeVoltage * peak,
    lineCurrent: point.lineCurrent * peak,
    loss: 2 * point.loss * sine ** 2,
    delivered: 2 * point.delivered * sine ** 2,
    flux1: -Math.cos(phase),
    flux2: -Math.cos(phase) * point.receivedVoltage / point.voltage,
    // Elektronenbewegung: negatives Integral des sinusförmigen Stroms.
    electronMotion: Math.cos(phase)
  }
}
