// Idealer Transformator im stationären Sinusbetrieb mit ohmscher Last.
// Magnetisierungsstrom, Verluste und Streufluss werden vernachlässigt.

export function transformerSample(time, { n1, n2, voltage, frequency, resistance, closed }) {
  const omega = 2 * Math.PI * frequency
  const phase = omega * time
  const ratio = n2 / n1
  const u1Peak = Math.SQRT2 * voltage
  const fluxPeak = u1Peak / (omega * n1)
  const i2Peak = closed ? u1Peak * ratio / resistance : 0
  const reflectedPeak = ratio * i2Peak
  const i1Peak = reflectedPeak
  return {
    phase, ratio, u1: u1Peak * Math.sin(phase), u2: u1Peak * ratio * Math.sin(phase),
    flux: -fluxPeak * Math.cos(phase), fluxPeak,
    i1: reflectedPeak * Math.sin(phase),
    i2: i2Peak * Math.sin(phase), i1Peak, i2Peak,
    // Normierte Integrale der Ströme: Markierungen schwingen ohne Netto-Transport.
    primaryMotion: i1Peak ? -Math.cos(phase) : 0,
    secondaryMotion: i2Peak ? -Math.cos(phase) : 0
  }
}

// Verdichtete Darstellung: etwa eine gezeichnete Windung pro 20 echten Windungen.
export function drawnTurns(turns) {
  return Math.max(1, Math.min(50, Math.round(turns / 20)))
}
