import Chart from 'chart.js/auto'
import { transformerSample, drawnTurns } from './transformer-model.js'

const svgNamespace = 'http://www.w3.org/2000/svg'
const number = (value, digits = 3) => Number(value.toPrecision(digits)).toLocaleString('de-DE')

export function mountTransformer(panel) {
  panel.innerHTML = `
    <section class="card">
      <h2>Transformator · Einstellungen</h2>
      <div class="coil-settings">
        <div>
          <h3 class="transformer-primary-text">Primärseite</h3>
          <label>Windungszahl N₁: <input id="transformerN1" type="number" min="20" max="1000" step="20" value="200" required></label>
          <label>Primärspannung U₁ (Effektivwert): <input id="transformerVoltage" type="number" min="0" max="24" step="0.5" value="6" required> V</label>
          <label>Frequenz f: <input id="transformerFrequency" type="number" min="0.1" max="2" step="0.1" value="0.4" required> Hz</label>
        </div>
        <div>
          <h3 class="transformer-secondary-text">Sekundärseite</h3>
          <label>Windungszahl N₂: <input id="transformerN2" type="number" min="20" max="1000" step="20" value="100" required></label>
          <label><input id="transformerClosed" type="checkbox" checked> Sekundärstromkreis schließen</label>
          <label>Lastwiderstand R: <input id="transformerResistance" type="number" min="10" max="10000" step="10" value="100" required> Ω</label>
          <p>Bei offenem Sekundärstromkreis entsteht eine Spannung, aber kein Sekundärstrom.</p>
        </div>
      </div>
      <div class="diagram-actions">
        <button class="transformer-toggle">Simulation starten</button>
        <button id="transformerReset">Zurücksetzen</button>
      </div>
      <p id="transformerValidation" role="status"></p>
    </section>
    <section class="card">
      <h2>Versuchsaufbau</h2>
      <div class="transformer-svg-container">
        <svg id="transformerSvg" viewBox="0 0 1000 660" role="img" aria-labelledby="transformerTitle transformerDescription">
          <title id="transformerTitle">Transformator mit Primärspule, Sekundärspule und geschlossenem Eisenkern</title>
          <desc id="transformerDescription">Zweidimensionale Vorderansicht des geschlossenen Eisenkerns mit zwei Spulen.
            Mehrere grüne Flusslinien verlaufen im Eisenkern. Helligkeit und Richtung wechseln.
            Gelbe Markierungen zeigen die wechselnde Bewegungsrichtung der Elektronen in den beiden Stromkreisen.</desc>
          <path d="M291 120 H714 Q730 120 730 136 V524 Q730 540 714 540 H291 Q275 540 275 524 V136 Q275 120 291 120 Z
            M382 215 H623 Q635 215 635 227 V433 Q635 445 623 445 H382 Q370 445 370 433 V227 Q370 215 382 215 Z"
            fill-rule="evenodd" class="transformer-core"/>
          <text x="160" y="65" class="svg-title transformer-primary-text">Primärspule</text>
          <text id="transformerPrimaryLabel" x="160" y="92" class="svg-label transformer-primary-text"/>
          <text x="760" y="65" class="svg-title transformer-secondary-text">Sekundärspule</text>
          <text id="transformerSecondaryLabel" x="760" y="92" class="svg-label transformer-secondary-text"/>
          <g id="transformerFluxLines"/>
          <text x="502" y="297" text-anchor="middle" class="svg-title transformer-flux-text">Magnetischer Fluss Φ</text>
          <text id="transformerFluxValue" x="502" y="332" text-anchor="middle" class="svg-value transformer-flux-text"/>
          <text id="transformerFluxDirection" x="502" y="360" text-anchor="middle" class="svg-label transformer-flux-text"/>
          <text x="502" y="403" text-anchor="middle" class="coil-parameters">hell / dünn → schwach</text>
          <text x="502" y="425" text-anchor="middle" class="coil-parameters">dunkel / breit → stark</text>
          <path id="transformerPrimaryCircuit" class="transformer-primary-wire"/>
          <path id="transformerSecondaryCircuit" class="transformer-secondary-wire"/>
          <g id="transformerPrimaryParticles"/>
          <g id="transformerSecondaryParticles"/>
          <circle cx="120" cy="347" r="32" class="transformer-source"/>
          <text x="120" y="360" text-anchor="middle" class="transformer-source-wave">~</text>
          <text x="120" y="410" text-anchor="middle" class="svg-label">Wechselspannung</text>
          <rect x="860" y="323" width="22" height="48" class="transformer-load"/>
          <path id="transformerSwitch" d="M871 405 V435" class="transformer-secondary-wire"/>
          <circle cx="871" cy="405" r="4" class="transformer-secondary-terminal"/>
          <circle cx="871" cy="435" r="4" class="transformer-secondary-terminal"/>
          <text x="900" y="355" class="svg-label">R</text>
          <text x="502" y="580" text-anchor="middle" class="svg-title">Eisenkern</text>
          <text x="120" y="550" text-anchor="middle" class="svg-label transformer-primary-text">Primärseite</text>
          <text x="120" y="575" text-anchor="middle" class="svg-label">Momentanwerte</text>
          <text id="transformerPrimaryVoltage" x="120" y="605" text-anchor="middle" class="svg-value"/>
          <text id="transformerPrimaryCurrent" x="120" y="635" text-anchor="middle" class="svg-value"/>
          <text x="865" y="550" text-anchor="middle" class="svg-label transformer-secondary-text">Sekundärseite</text>
          <text x="865" y="575" text-anchor="middle" class="svg-label">Momentanwerte</text>
          <text id="transformerSecondaryVoltage" x="865" y="605" text-anchor="middle" class="svg-value"/>
          <text id="transformerSecondaryCurrent" x="865" y="635" text-anchor="middle" class="svg-value"/>
        </svg>
      </div>
      <div class="transformer-readings">
        <p>Spannungsverhältnis: <strong id="transformerRatio"></strong></p>
        <p>Primärspannung U₁ (Effektivwert): <strong id="transformerPrimaryRms"></strong></p>
        <p>Sekundärspannung U₂ (Effektivwert): <strong id="transformerRms"></strong></p>
        <p>Zeit: <strong id="transformerTime"></strong></p>
      </div>
      <p>Die laufenden Anzeigen zeigen die Momentanwerte u₁(t), u₂(t), i₁(t) und i₂(t).
        Bei sinusförmiger Spannung ist der Maximalwert √2-mal so groß wie der Effektivwert.</p>
      <p>Die gelben Markierungen schwingen vor und zurück und zeigen die <strong>physikalische Stromrichtung (Elektronenbewegung)</strong>.
        Sie bewegen sich entgegen der technischen Stromrichtung. Ihre Auslenkung ist zur Veranschaulichung vergrößert.
        Zwischen den Spulen fließen keine Ladungen durch den Eisenkern.</p>
      <p>Die Spulenzeichnung ist verdichtet: Eine sichtbare Windung steht für etwa 20 echte Windungen.
        Mehr eingestellte Windungen ergeben entsprechend mehr gezeichnete Windungen.</p>
    </section>
    <section class="card">
      <h2>Spannungen, Ströme und magnetischer Fluss</h2>
      <button class="transformer-toggle">Simulation starten</button>
      <div class="chart-container transformer-chart"><canvas id="transformerChart"></canvas></div>
      <p>Die Kurven zeigen die Momentanwerte. Der senkrechte Zeitzeiger verbindet das Diagramm mit dem momentanen Zustand im Versuchsaufbau.
        Über die Legende lassen sich einzelne Kurven ein- und ausblenden.</p>
      <h3>Stromstärken im Vergleich</h3>
      <div class="chart-container transformer-chart"><canvas id="transformerCurrentChart" aria-label="Primärstrom und Sekundärstrom auf einer gemeinsamen Ampere-Achse" role="img"></canvas></div>
      <p>Beide Stromstärken verwenden hier dieselbe Ampere-Achse. Im oberen Diagramm können sich
        Strom- und Spannungskurven durch die unterschiedlichen Achsenskalierungen überdecken.</p>
    </section>
    <section class="card transformer-model-notes">
      <h2>Was passiert im Inneren?</h2>
      <p>Die Wechselspannung erzeugt einen veränderlichen magnetischen Fluss im gemeinsamen Eisenkern.
        Dieser durchsetzt beide Spulen und induziert die Sekundärspannung. Der Fluss wechselt seine Richtung;
        mehrere grüne Linien zeigen seine Stärke und Richtung. Die Farbe wird relativ zum Scheitelwert der
        aktuellen Einstellungen skaliert; der Zahlenwert zeigt die tatsächliche Flussgröße.</p>
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mfrac><msub><mi>U</mi><mn>2</mn></msub><msub><mi>U</mi><mn>1</mn></msub></mfrac>
        <mo>=</mo><mfrac><msub><mi>N</mi><mn>2</mn></msub><msub><mi>N</mi><mn>1</mn></msub></mfrac>
        <mspace width="2em"/><msub><mi>u</mi><mn>1</mn></msub><mo>=</mo><msub><mi>N</mi><mn>1</mn></msub><mo>·</mo>
        <mfrac><mrow><mi>d</mi><mi>Φ</mi></mrow><mrow><mi>d</mi><mi>t</mi></mrow></mfrac>
      </math>
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mfrac><msub><mi>I</mi><mn>2</mn></msub><msub><mi>I</mi><mn>1</mn></msub></mfrac>
        <mo>=</mo><mfrac><msub><mi>N</mi><mn>1</mn></msub><msub><mi>N</mi><mn>2</mn></msub></mfrac>
        <mspace width="2em"/><msub><mi>U</mi><mn>1</mn></msub><mo>·</mo><msub><mi>I</mi><mn>1</mn></msub>
        <mo>=</mo><msub><mi>U</mi><mn>2</mn></msub><mo>·</mo><msub><mi>I</mi><mn>2</mn></msub>
      </math>
      <p>Für die Effektivwerte gilt bei angeschlossener Last: Auf der Seite mit der höheren Spannung
        ist die Stromstärke entsprechend kleiner. Zum Beispiel ergibt die doppelte Sekundärspannung
        die halbe Sekundärstromstärke gegenüber dem Primärstrom. Die übertragene Leistung bleibt gleich.
        Der Lastwiderstand bestimmt die Sekundärstromstärke durch I₂ = U₂ / R.</p>
      <p>Wichtig: Bei maximaler Spannung ändert sich der Fluss am schnellsten und geht durch null.
        Beim Nulldurchgang der Spannung erreicht der Fluss einen Extremwert. Die anliegende Primärspannung
        gleicht die entgegengerichtete induzierte Spannung aus. Die gewählten Anschlussrichtungen ergeben
        gleichphasige Primär- und Sekundärspannungen.</p>
      <p>Modell: idealer Transformator im sinusförmigen stationären Betrieb mit ohmscher Last.
        Magnetisierungsstrom, Verluste, Streufluss und Sättigung werden vernachlässigt.
        Bei offener Sekundärseite sind beide Ströme null; die Sekundärspannung und der wechselnde
        magnetische Fluss bleiben bestehen. Die niedrige Frequenz dient der Beobachtung.</p>
    </section>`

  const $ = selector => panel.querySelector(selector)
  const inputs = [...panel.querySelectorAll('input[type="number"]')]
  const buttons = [...panel.querySelectorAll('.transformer-toggle')]
  let parameters, running = false, time = 0, frame = null, lastTimestamp = null, lastChartTime = -Infinity, chartWindow = null
  const fluxPaths = []
  for (let index = 0; index < 5; index++) {
    const inset = 14 + index * 12
    const left = 275 + inset, right = 730 - inset
    const top = 120 + inset, bottom = 540 - inset, radius = 22
    const path = document.createElementNS(svgNamespace, 'path')
    path.setAttribute('d', `M${left + radius} ${top} H${right - radius} Q${right} ${top} ${right} ${top + radius}
      V${bottom - radius} Q${right} ${bottom} ${right - radius} ${bottom} H${left + radius}
      Q${left} ${bottom} ${left} ${bottom - radius} V${top + radius} Q${left} ${top} ${left + radius} ${top} Z`)
    path.setAttribute('class', 'transformer-flux-line')
    $('#transformerFluxLines').append(path)
    const markers = [0.13, 0.39, 0.63, 0.87].map(fraction => {
      const arrow = document.createElementNS(svgNamespace, 'path')
      arrow.setAttribute('d', 'M-7 -5 L7 0 L-7 5 Z')
      arrow.setAttribute('class', 'transformer-flux-arrow')
      $('#transformerFluxLines').append(arrow)
      return { arrow, fraction }
    })
    fluxPaths.push({ path, markers })
  }
  const particleGroups = ['Primary', 'Secondary'].map(side => {
    const path = $(`#transformer${side}Circuit`)
    const particles = Array.from({ length: 24 }, () => {
      const circle = document.createElementNS(svgNamespace, 'circle')
      circle.setAttribute('r', '4')
      circle.setAttribute('class', 'transformer-current-particle')
      $(`#transformer${side}Particles`).append(circle)
      return circle
    })
    return { path, particles }
  })
  const cursor = {
    id: 'transformerTimeCursor',
    afterDraw(chart) {
      const { ctx, chartArea, scales } = chart
      if (!chartArea) return
      const x = scales.x.getPixelForValue(time)
      if (x < chartArea.left || x > chartArea.right) return
      ctx.save()
      ctx.strokeStyle = '#334155'
      ctx.setLineDash([5, 4])
      ctx.beginPath(); ctx.moveTo(x, chartArea.top); ctx.lineTo(x, chartArea.bottom); ctx.stroke()
      ctx.restore()
    }
  }
  const axis = (position, title) => ({ position, title: { display: true, text: title },
    grid: { drawOnChartArea: position === 'left' },
    afterDataLimits(scale) { const limit = Math.max(Math.abs(scale.min), Math.abs(scale.max)) || 1; scale.min = -limit; scale.max = limit }
  })
  const chart = new Chart($('#transformerChart'), {
    type: 'line', plugins: [cursor],
    data: { datasets: [
      ['Primärspannung u₁', 'voltage', '#dc2626'], ['Sekundärspannung u₂', 'voltage', '#3155d9'],
      ['Primärstrom i₁', 'current', '#be123c'], ['Sekundärstrom i₂', 'current', '#7c3aed'],
      ['Magnetischer Fluss Φ', 'flux', '#16804a']
    ].map(([label, yAxisID, borderColor]) => ({ label, yAxisID, borderColor, data: [], borderWidth: 2,
      pointRadius: 0, tension: 0, borderDash: yAxisID === 'current' ? [5, 3] : [] })) },
    options: { responsive: true, maintainAspectRatio: false, animation: false,
      interaction: { mode: 'index', intersect: false },
      scales: { x: { type: 'linear', title: { display: true, text: 'Zeit t / s' } },
        voltage: axis('left', 'Spannung / V'), current: axis('right', 'Strom / A'), flux: axis('right', 'Fluss / mWb') },
      plugins: { tooltip: { callbacks: { label(context) {
        const unit = { voltage: 'V', current: 'A', flux: 'mWb' }[context.dataset.yAxisID]
        return `${context.dataset.label}: ${number(context.parsed.y, 4)} ${unit}`
      } } } }
    }
  })

  const currentChart = new Chart($('#transformerCurrentChart'), {
    type: 'line', plugins: [cursor],
    data: { datasets: [
      { label: 'Primärstrom i₁', borderColor: '#be123c', borderDash: [] },
      { label: 'Sekundärstrom i₂', borderColor: '#7c3aed', borderDash: [8, 5] }
    ].map(dataset => ({ ...dataset, data: [], borderWidth: 3, pointRadius: 0, tension: 0 })) },
    options: { responsive: true, maintainAspectRatio: false, animation: false,
      interaction: { mode: 'index', intersect: false },
      scales: { x: { type: 'linear', title: { display: true, text: 'Zeit t / s' } },
        y: axis('left', 'Stromstärke / A') },
      plugins: { tooltip: { callbacks: { label(context) {
        return `${context.dataset.label}: ${number(context.parsed.y, 4)} A`
      } } } }
    }
  })

  function readParameters() {
    const invalid = inputs.find(input => !input.disabled && !input.validity.valid)
    $('#transformerValidation').textContent = invalid ? 'Bitte einen gültigen Wert innerhalb der angegebenen Grenzen eingeben.' : ''
    if (invalid) return null
    return { n1: Number($('#transformerN1').value), n2: Number($('#transformerN2').value),
      voltage: Number($('#transformerVoltage').value), frequency: Number($('#transformerFrequency').value),
      resistance: Number($('#transformerResistance').value), closed: $('#transformerClosed').checked }
  }

  function coilCircuit(primary, turns) {
    const count = drawnTurns(turns)
    const left = primary ? 263 : 623, right = primary ? 382 : 742
    const start = 235, end = 425
    const spacing = count > 1 ? (end - start) / (count - 1) : 0
    const near = primary ? left : right, far = primary ? right : left
    let path = `M${primary ? 120 : 871} ${start} H${near}`
    for (let index = 0; index < count; index++) {
      const y = start + index * spacing
      path += ` M${near} ${y} H${far}`
    }
    return path + ` M${near} ${end}` + (primary ? ` H120 V${start}` : ` H871 V435 M871 405 V${start}`)
  }

  function rebuild() {
    $('#transformerPrimaryCircuit').setAttribute('d', coilCircuit(true, parameters.n1))
    $('#transformerSecondaryCircuit').setAttribute('d', coilCircuit(false, parameters.n2))
    $('#transformerPrimaryLabel').textContent = `N₁ = ${parameters.n1} Windungen`
    $('#transformerSecondaryLabel').textContent = `N₂ = ${parameters.n2} Windungen`
    $('#transformerSwitch').setAttribute('d', parameters.closed ? 'M871 405 V435' : 'M871 405 L894 430')
    $('#transformerSecondaryCircuit').setAttribute('stroke-dasharray', parameters.closed ? '' : '5 4')
    $('#transformerRatio').textContent = `N₂ / N₁ = ${number(parameters.n2 / parameters.n1)}`
    $('#transformerRms').textContent = `${number(parameters.voltage * parameters.n2 / parameters.n1)} V`
    $('#transformerPrimaryRms').textContent = `${number(parameters.voltage)} V`
    for (const group of particleGroups) group.length = group.path.getTotalLength()
    for (const item of fluxPaths) item.length = item.path.getTotalLength()
  }

  function updateDiagram() {
    const sample = transformerSample(time, parameters)
    $('#transformerPrimaryVoltage').textContent = `u₁ = ${number(sample.u1)} V`
    $('#transformerSecondaryVoltage').textContent = `u₂ = ${number(sample.u2)} V`
    $('#transformerPrimaryCurrent').textContent = `i₁ = ${number(sample.i1)} A`
    $('#transformerSecondaryCurrent').textContent = `i₂ = ${number(sample.i2)} A`
    $('#transformerFluxValue').textContent = `Φ = ${number(sample.flux * 1000)} mWb`
    $('#transformerTime').textContent = `${number(time)} s`
    const strength = sample.fluxPeak ? Math.min(1, Math.abs(sample.flux / sample.fluxPeak)) : 0
    $('#transformerFluxLines').style.opacity = strength < 1e-5 ? 0 : 0.08 + 0.92 * strength
    $('#transformerFluxDirection').textContent = strength < 1e-5 ? 'Momentan kein Fluss' :
      sample.flux > 0 ? '↻ im Uhrzeigersinn' : '↺ gegen den Uhrzeigersinn'
    for (const { path, length, markers } of fluxPaths) {
      path.style.strokeWidth = `${0.8 + 1.8 * strength}px`
      for (const { arrow, fraction } of markers) {
        const distance = fraction * length
        const point = path.getPointAtLength(distance)
        const next = path.getPointAtLength(distance + 1)
        const angle = Math.atan2(next.y - point.y, next.x - point.x) * 180 / Math.PI + (sample.flux < 0 ? 180 : 0)
        arrow.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${angle})`)
      }
    }
    particleGroups.forEach(({ path, length, particles }, side) => {
      const peak = side ? sample.i2Peak : sample.i1Peak
      const motion = side ? sample.secondaryMotion : sample.primaryMotion
      $(`#transformer${side ? 'Secondary' : 'Primary'}Particles`).style.visibility = peak > 0 ? 'visible' : 'hidden'
      particles.forEach((particle, index) => {
        const distance = ((index / particles.length * length - 40 * motion) % length + length) % length
        const point = path.getPointAtLength(distance)
        particle.setAttribute('cx', point.x); particle.setAttribute('cy', point.y)
      })
    })
  }

  function updateChart() {
    // Zwei Perioden einschließlich einer festen Vorschau; Zeitzeiger zeigt den Live-Zustand.
    const start = Math.floor(time * parameters.frequency / 2) * 2 / parameters.frequency
    if (chartWindow === start) { chart.draw(); currentChart.draw(); return }
    chartWindow = start
    for (const dataset of chart.data.datasets) dataset.data = []
    for (const dataset of currentChart.data.datasets) dataset.data = []
    for (let index = 0; index <= 400; index++) {
      const t = start + index / 200 / parameters.frequency
      const sample = transformerSample(t, parameters)
      const values = [sample.u1, sample.u2, sample.i1, sample.i2, sample.flux * 1000]
      chart.data.datasets.forEach((dataset, side) => dataset.data.push({ x: t, y: values[side] }))
      currentChart.data.datasets[0].data.push({ x: t, y: sample.i1 })
      currentChart.data.datasets[1].data.push({ x: t, y: sample.i2 })
    }
    chart.options.scales.x.min = start
    chart.options.scales.x.max = start + 2 / parameters.frequency
    chart.update('none')
    currentChart.options.scales.x.min = start
    currentChart.options.scales.x.max = start + 2 / parameters.frequency
    currentChart.update('none')
  }

  function stop() {
    running = false
    if (frame !== null) cancelAnimationFrame(frame)
    frame = null; lastTimestamp = null
    buttons.forEach(button => { button.textContent = time > 0 ? 'Simulation fortsetzen' : 'Simulation starten' })
  }

  function animate(timestamp) {
    if (!running) return
    if (lastTimestamp !== null) time += Math.min((timestamp - lastTimestamp) / 1000, 0.1)
    lastTimestamp = timestamp
    updateDiagram()
    if (time - lastChartTime >= 0.04) { updateChart(); lastChartTime = time }
    frame = requestAnimationFrame(animate)
  }

  function start() {
    const next = readParameters()
    if (!next) return
    parameters = next; running = true; lastTimestamp = null
    buttons.forEach(button => { button.textContent = 'Simulation anhalten' })
    frame = requestAnimationFrame(animate)
  }

  function reset() {
    stop(); time = 0; lastChartTime = -Infinity; chartWindow = null
    parameters = readParameters()
    if (!parameters) return
    rebuild(); updateDiagram(); updateChart()
    buttons.forEach(button => { button.textContent = 'Simulation starten' })
  }

  buttons.forEach(button => button.addEventListener('click', () => running ? stop() : start()))
  $('#transformerReset').addEventListener('click', reset)
  inputs.forEach(input => input.addEventListener('input', reset))
  $('#transformerClosed').addEventListener('change', () => {
    $('#transformerResistance').disabled = !$('#transformerClosed').checked
    reset()
  })
  reset()
  return { stop, resize() { chart.resize(); currentChart.resize(); if (parameters) { rebuild(); updateDiagram(); updateChart() } } }
}
