import { transmissionOperatingPoint, transmissionSample } from './transmission-model.js'

const svgNamespace = 'http://www.w3.org/2000/svg'
const number = (value, digits = 3) => Number(value.toPrecision(digits)).toLocaleString('de-DE')
const powerLabel = value => `${number(value / 1000)} kW`
const voltageLabel = value => Math.abs(value) >= 1000 ? `${number(value / 1000)} kV` : `${number(value)} V`

function transformerDrawing(x, name, reversed) {
  return `<g>
    <path class="transmission-core" fill-rule="evenodd"
      d="M${x} 220 h165 v280 h-165 Z M${x + 41} 275 h83 v170 h-83 Z"/>
    <g id="transmissionFlux${name}">${[12, 22, 32].map(inset =>
      `<path class="transmission-flux" d="M${x + inset + 10} ${220 + inset} H${x + 155 - inset}
        Q${x + 165 - inset} ${220 + inset} ${x + 165 - inset} ${230 + inset}
        V${490 - inset} Q${x + 165 - inset} ${500 - inset} ${x + 155 - inset} ${500 - inset}
        H${x + inset + 10} Q${x + inset} ${500 - inset} ${x + inset} ${490 - inset}
        V${230 + inset} Q${x + inset} ${220 + inset} ${x + inset + 10} ${220 + inset} Z"/>`).join('')}
      <path class="transmission-flux-arrow" d="M-7 -5 L7 0 L-7 5 Z" transform="translate(${x + 82} 242)"/>
      <path class="transmission-flux-arrow" d="M-7 -5 L7 0 L-7 5 Z" transform="translate(${x + 82} 478) rotate(180)"/>
    </g>
    <g id="transmissionLowCoil${name}" class="transmission-low-coil"/>
    <g id="transmissionHighCoil${name}" class="transmission-high-coil"/>
    <text x="${x + 82}" y="360" text-anchor="middle" class="transmission-flux-label">Φ${name}</text>
    <text id="transmissionFluxDirection${name}" x="${x + 82}" y="393" text-anchor="middle" class="transmission-direction"/>
    <text x="${x + 7}" y="535" text-anchor="middle" class="transmission-small">Primär ${name}</text>
    <text x="${x + 158}" y="535" text-anchor="middle" class="transmission-small">Sekundär ${name}</text>
    <text x="${x + 82}" y="562" text-anchor="middle" class="transmission-small">${reversed ? 'Spannung herunter' : 'Spannung hoch'}</text>
  </g>`
}

export function mountTransmission(panel) {
  panel.innerHTML = `
    <section class="card">
      <h2>Einstellungen zur Fernleitung</h2>
      <div class="transmission-controls">
        <label>Kraftwerksleistung (Mittelwert):
          <input id="transmissionPower" type="number" value="10" min="1" max="20" step="0.5" required> kW</label>
        <label>Spannung am Anfang der Fernleitung (Effektivwert):
          <input id="transmissionVoltage" type="number" value="2" min="0.5" max="20" step="any" required> kV</label>
        <label>Leitungswiderstand (Hin- und Rückleitung zusammen):
          <input id="transmissionResistance" type="number" value="20" min="0" max="100" step="1" required> Ω</label>
        <label>Frequenz zur Beobachtung:
          <input id="transmissionFrequency" type="number" value="0.4" min="0.1" max="2" step="0.1" required> Hz</label>
        <label>Abspielgeschwindigkeit:
          <select id="transmissionPlaybackSpeed" aria-describedby="transmissionPlaybackHint">
            <option value="1">Normal (1×)</option>
            <option value="0.5">Zeitlupe (½×)</option>
            <option value="0.25" selected>Zeitlupe (¼×)</option>
            <option value="0.1">Starke Zeitlupe (⅒×)</option>
          </select>
        </label>
      </div>
      <p id="transmissionPlaybackHint">Die Zeitlupe verlangsamt Animation und Momentanwerte gemeinsam.
        Frequenz und physikalische Berechnungen bleiben unverändert. Bei ¼× dauert eine Sekunde Simulationszeit vier echte Sekunden.</p>
      <div class="transmission-actions">
        <button class="transmission-toggle">Simulation starten</button>
        <button id="transmissionReset" title="Animation anhalten, Zeit auf 0 setzen und alle ursprünglichen Einstellungen wiederherstellen">Auf Startwerte zurücksetzen</button>
        <button id="transmissionHalve">Leitungsspannung halbieren</button>
        <button id="transmissionDouble">Leitungsspannung verdoppeln</button>
      </div>
      <p>Zum Vergleich bleiben Kraftwerksleistung und Leitungswiderstand beim Halbieren oder Verdoppeln gleich.</p>
      <p id="transmissionValidation" class="transmission-validation" role="status"></p>
    </section>
    <section class="card">
      <h2>Vom Kraftwerk zum Haushalt</h2>
      <div class="transmission-svg-container">
        <svg id="transmissionSvg" viewBox="0 0 1600 665" role="img"
          aria-labelledby="transmissionTitle transmissionDescription">
          <title id="transmissionTitle">Elektrische Energieübertragung mit zwei Transformatoren und Fernleitung</title>
          <desc id="transmissionDescription">Kraftwerk, Hochtransformator, Hin- und Rückleitung, Heruntertransformator
            und Haushalt. Grüne Flusslinien zeigen die wechselnden Magnetfelder in beiden Eisenkernen.
            Gelbe Punkte schwingen in Richtung der Elektronenbewegung. Aufsteigende orange Wärmewolken
            verbildlichen die Verluste ausschließlich in der Fernleitung.</desc>
          <defs>
            <radialGradient id="transmissionWarmth">
              <stop offset="0" stop-color="#ea580c" stop-opacity="1"/>
              <stop offset="0.65" stop-color="#f97316" stop-opacity="0.85"/>
              <stop offset="1" stop-color="#fb923c" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <text x="130" y="60" text-anchor="middle" class="transmission-heading">Kraftwerk</text>
          <text x="367" y="60" text-anchor="middle" class="transmission-heading">Hochtransformator</text>
          <text x="795" y="60" text-anchor="middle" class="transmission-heading">Fernleitung</text>
          <text x="1212" y="60" text-anchor="middle" class="transmission-heading">Heruntertransformator</text>
          <text x="1475" y="60" text-anchor="middle" class="transmission-heading">Haushalt</text>
          <text x="130" y="95" text-anchor="middle" class="transmission-small">230 V effektiv</text>
          <text id="transmissionLineRms" x="795" y="95" text-anchor="middle" class="transmission-small"/>
          <text x="795" y="122" text-anchor="middle" class="transmission-small">Effektivwert am Leitungsanfang</text>
          <text id="transmissionHomeRms" x="1475" y="95" text-anchor="middle" class="transmission-small"/>
          <g id="transmissionHeat"/>
          <path class="transmission-local-wire" d="M225 260 H270 V310 M270 430 V470 H225"/>
          <path class="transmission-high-wire" d="M465 310 V260 H1115 V310 M465 430 V470 H1115 V430"/>
          <path class="transmission-local-wire" d="M1310 310 V260 H1380 M1310 430 V470 H1380"/>
          <g id="transmissionElectrons"/>
          <rect x="35" y="235" width="190" height="265" rx="12" class="transmission-building"/>
          <circle cx="130" cy="347" r="57" class="transmission-generator-ring"/>
          <g id="transmissionRotor">
            <path d="M130 302 L140 337 L175 347 L140 357 L130 392 L120 357 L85 347 L120 337 Z"
              class="transmission-rotor"/>
          </g>
          <text x="130" y="441" text-anchor="middle" class="transmission-small">Generator ~</text>
          ${transformerDrawing(285, '1', false)}
          ${transformerDrawing(1130, '2', true)}
          <path class="transmission-house-roof" d="M1370 235 L1475 155 L1580 235"/>
          <rect x="1380" y="235" width="190" height="265" rx="10" class="transmission-building"/>
          <path id="transmissionHouseLight" d="M1420 290 h45 v65 h-45 Z M1485 290 h45 v65 h-45 Z"
            class="transmission-house-light"/>
          <path d="M1450 500 V408 H1500 V500" class="transmission-house-door"/>
          <text x="795" y="285" text-anchor="middle" class="transmission-small">Rückleitung</text>
          <text x="795" y="500" text-anchor="middle" class="transmission-small">Hinleitung</text>
          <text id="transmissionLineCurrent" x="795" y="352" text-anchor="middle" class="transmission-current-label"/>
          <text id="transmissionHeatLabel" x="795" y="385" text-anchor="middle" class="transmission-heat-label"/>
          <text x="795" y="417" text-anchor="middle" class="transmission-small">Wärmewolken = Verlustenergie</text>
          <text x="130" y="580" text-anchor="middle" class="transmission-small">Momentanwert</text>
          <text id="transmissionSourceInstant" x="130" y="615" text-anchor="middle" class="transmission-value"/>
          <text x="795" y="580" text-anchor="middle" class="transmission-small">Momentanwerte am Leitungsanfang</text>
          <text id="transmissionLineInstant" x="795" y="615" text-anchor="middle" class="transmission-value"/>
          <text x="1475" y="580" text-anchor="middle" class="transmission-small">Momentanwert</text>
          <text id="transmissionHomeInstant" x="1475" y="615" text-anchor="middle" class="transmission-value"/>
        </svg>
      </div>
      <div class="transmission-actions">
        <button class="transmission-toggle">Simulation starten</button>
        <span>Simulationszeit: <strong id="transmissionTime">0 s</strong></span>
      </div>
      <p>Die Zahlenanzeigen werden zur besseren Lesbarkeit alle 0,5 Sekunden aktualisiert.
        Beim Anhalten zeigen sie die Werte des angehaltenen Zustands.</p>
      <p>Die gelben Punkte zeigen die <strong>physikalische Stromrichtung (Elektronenbewegung)</strong>.
        Sie schwingen hin und her; ihre Auslenkung ist zur Beobachtung vergrößert.
        Die Energie wird vom Kraftwerk zum Haushalt übertragen, obwohl die Elektronen hin- und herschwingen.</p>
      <p>Die grünen Flusslinien werden stärker und schwächer und wechseln ihre Richtung.
        Die orangefarbenen Wolken sind ein <strong>Symbol für Wärmeverluste, kein echter Dampf</strong>.
        Ihre Menge zeigt die mittlere Verlustleistung; Wärme verschwindet beim Nulldurchgang des Stroms nicht sofort.</p>
    </section>
    <section class="card">
      <h2>Wie viel Leistung kommt an?</h2>
      <div class="transmission-metrics">
        <p>Kraftwerk liefert<strong id="transmissionGenerated"></strong></p>
        <p>Leitung verliert als Wärme<strong id="transmissionLoss"></strong></p>
        <p>Haushalt erhält<strong id="transmissionDelivered"></strong></p>
        <p>Wirkungsgrad der Übertragung<strong id="transmissionEfficiency"></strong></p>
      </div>
      <div id="transmissionPowerBar" class="transmission-power-bar" role="img" aria-label="Leistungsbilanz">
        <div id="transmissionDeliveredBar" class="transmission-delivered-bar"></div>
        <div id="transmissionLossBar" class="transmission-loss-bar"></div>
      </div>
      <p class="transmission-bar-key"><span>Grün: Leistung im Haushalt</span><span>Orange: Wärme in der Leitung</span></p>
      <p id="transmissionOutcome" role="status"></p>
      <h3>Effektivwerte und mittlere Leistungen</h3>
      <div class="transmission-table-container">
        <table class="transmission-table">
          <thead><tr><th scope="col">Ort</th><th scope="col">Spannung U</th><th scope="col">Stromstärke I</th><th scope="col">Leistung P</th></tr></thead>
          <tbody id="transmissionReadings"></tbody>
        </table>
      </div>
      <p>Die beiden Leitungsadern haben zusammen den eingestellten Widerstand. Ihre Verluste werden zusammen gezählt.</p>
    </section>
    <section class="card transmission-notes">
      <h2>Warum wird die Spannung hochtransformiert?</h2>
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <msub><mi>I</mi><mi>Leitung</mi></msub><mo>=</mo>
        <mfrac><msub><mi>P</mi><mi>Kraftwerk</mi></msub><msub><mi>U</mi><mi>Leitungsanfang</mi></msub></mfrac>
      </math>
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <msub><mi>P</mi><mi>Verlust</mi></msub><mo>=</mo><msubsup><mi>I</mi><mi>Leitung</mi><mn>2</mn></msubsup>
        <mo>·</mo><msub><mi>R</mi><mi>Leitung</mi></msub>
      </math>
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <msub><mi>P</mi><mi>Haushalt</mi></msub><mo>=</mo><msub><mi>P</mi><mi>Kraftwerk</mi></msub>
        <mo>−</mo><msub><mi>P</mi><mi>Verlust</mi></msub>
      </math>
      <p>Bei gleicher Kraftwerksleistung bedeutet doppelte Leitungsspannung halbe Stromstärke und
        <strong>ein Viertel der Wärmeverluste</strong>. Halbe Spannung bedeutet dagegen vierfache Verluste.</p>
      <p>Versuch: Halbiere die Leitungsspannung und beobachte Stromstärke, Wärmewolken und Leistungsbalken.
        Verdopple sie anschließend. Was bleibt gleich, was verändert sich?</p>
      <p>Modell: einphasige Wechselspannung, ideale verlustfreie Transformatoren ohne Magnetisierungsstrom
        und rein ohmsche Leitungen und Last. Das Kraftwerk liefert für den Vergleich eine feste mittlere Leistung;
        die Haushaltslast wird entsprechend angepasst. Ein fester Haushaltswiderstand wird nicht simuliert.</p>
      <p>Generator- und nominelle Haushaltsspannung sind hier 230 V. Das erste Übersetzungsverhältnis wird mit
        der Leitungsspannung verändert; der zweite Transformator verwendet das umgekehrte Verhältnis.
        Der Spannungsabfall ΔU = I · R in der Leitung führt deshalb im Haushalt zu weniger als 230 V.
        Es gibt keine automatische Spannungsregelung. Die Frequenz ist zur Beobachtung verlangsamt,
        Windungen und Magnetfelder sind schematisch dargestellt. Reale Drehstromnetze und weitere Umspannwerke
        werden nicht abgebildet.</p>
      <p>Physikalischer Hintergrund: <a href="https://openstax.org/books/university-physics-volume-2/pages/15-6-transformers"
        target="_blank" rel="noopener noreferrer">OpenStax: Transformatoren und Übertragungsverluste</a>.</p>
    </section>`

  const $ = selector => panel.querySelector(selector)
  const buttons = [...panel.querySelectorAll('.transmission-toggle')]
  const inputs = [...panel.querySelectorAll('input')]
  const playbackSpeed = $('#transmissionPlaybackSpeed')
  const defaultPlaybackSpeed = playbackSpeed.value
  let point = null, frequency = 0.4, time = 0, running = false, frame = null, lastTimestamp = null
  let lastNumberTimestamp = null

  const electronSegments = [
    { x1: 230, x2: 264, y: 260, sign: 1, count: 2, amplitude: 4 },
    { x1: 230, x2: 264, y: 470, sign: -1, count: 2, amplitude: 4 },
    { x1: 480, x2: 1100, y: 260, sign: 1, count: 22, amplitude: 12 },
    { x1: 480, x2: 1100, y: 470, sign: -1, count: 22, amplitude: 12 },
    { x1: 1320, x2: 1374, y: 260, sign: 1, count: 3, amplitude: 5 },
    { x1: 1320, x2: 1374, y: 470, sign: -1, count: 3, amplitude: 5 }
  ].map(segment => ({ ...segment, particles: Array.from({ length: segment.count }, (_, index) => {
    const circle = document.createElementNS(svgNamespace, 'circle')
    circle.setAttribute('r', '4')
    circle.setAttribute('class', 'transmission-electron')
    $('#transmissionElectrons').append(circle)
    return { circle, x: segment.x1 + (index + 0.5) / segment.count * (segment.x2 - segment.x1) }
  }) }))
  const clouds = Array.from({ length: 48 }, (_, index) => {
    const circle = document.createElementNS(svgNamespace, 'circle')
    circle.setAttribute('class', 'transmission-heat-cloud')
    $('#transmissionHeat').append(circle)
    return { circle, index, x: 500 + (index % 12) / 11 * 580, y: index < 24 ? 260 : 470,
      offset: (index * 0.61803398875) % 1 }
  })

  function drawCoils() {
    const highCount = Math.min(28, Math.max(7, Math.round(6 + 5 * Math.log2(point.stepUp))))
    for (const [x, side, reversed] of [[285, '1', false], [1130, '2', true]]) {
      const winding = (left, count) => Array.from({ length: count }, (_, index) => {
        const y = 310 + index / (count - 1) * 120
        return `<path d="M${left} ${y} h70"/>`
      }).join('')
      $(`#transmissionLowCoil${side}`).innerHTML = winding(reversed ? x + 110 : x - 15, 6)
      $(`#transmissionHighCoil${side}`).innerHTML = winding(reversed ? x - 15 : x + 110, highCount)
    }
  }

  function updateReadings() {
    $('#transmissionLineRms').textContent = `Spannung auf ${number(point.voltage, 5)} V hochtransformiert`
    $('#transmissionHomeRms').textContent = `${voltageLabel(point.homeVoltage)} effektiv`
    $('#transmissionGenerated').textContent = powerLabel(point.power)
    $('#transmissionLoss').textContent = `${powerLabel(point.loss)} (${number(100 * (1 - point.efficiency))} %)`
    $('#transmissionDelivered').textContent = powerLabel(point.delivered)
    $('#transmissionEfficiency').textContent = `${number(100 * point.efficiency)} %`
    $('#transmissionLineCurrent').textContent = `I = ${number(point.lineCurrent)} A · effektiv`
    $('#transmissionHeatLabel').textContent = `Wärmeverlust: ${powerLabel(point.loss)}`
    $('#transmissionDeliveredBar').style.width = `${100 * point.efficiency}%`
    $('#transmissionLossBar').style.width = `${100 * (1 - point.efficiency)}%`
    $('#transmissionPowerBar').setAttribute('aria-label', `${powerLabel(point.delivered)} im Haushalt; ${powerLabel(point.loss)} Wärmeverlust`)
    $('#transmissionOutcome').textContent = point.efficiency < 0.8
      ? 'Hohe Leitungsverluste: Ein großer Teil der Leistung wird zu Wärme. Auch die Haushaltsspannung sinkt deutlich.'
      : 'Ein großer Teil der Kraftwerksleistung erreicht den Haushalt. Höhere Leitungsspannung verringert die Wärmeverluste.'
    const rows = [
      ['Kraftwerk / Primärspule 1', point.sourceVoltage, point.sourceCurrent, point.power],
      ['Leitungsanfang / Sekundärspule 1', point.voltage, point.lineCurrent, point.power],
      ['Leitungsende / Primärspule 2', point.receivedVoltage, point.lineCurrent, point.delivered],
      ['Haushalt / Sekundärspule 2', point.homeVoltage, point.homeCurrent, point.delivered]
    ]
    $('#transmissionReadings').innerHTML = rows.map(([label, voltage, current, power]) =>
      `<tr><th scope="row">${label}</th><td>${voltageLabel(voltage)}</td><td>${number(current)} A</td><td>${powerLabel(power)}</td></tr>`).join('')
    drawCoils()
  }

  function updateDiagram(updateNumbers = true) {
    if (!point) return
    const sample = transmissionSample(time, frequency, point)
    if (updateNumbers) {
      $('#transmissionTime').textContent = `${number(time)} s`
      $('#transmissionSourceInstant').textContent = `u(t) = ${voltageLabel(sample.sourceVoltage)}`
      $('#transmissionLineInstant').textContent = `u(t) = ${voltageLabel(sample.sendingVoltage)} · i(t) = ${number(sample.lineCurrent)} A`
      $('#transmissionHomeInstant').textContent = `u(t) = ${voltageLabel(sample.homeVoltage)}`
    }
    $('#transmissionRotor').setAttribute('transform', `rotate(${time * frequency * 360 % 360} 130 347)`)
    for (const [side, x, flux] of [['1', 285, sample.flux1], ['2', 1130, sample.flux2]]) {
      const strength = Math.abs(flux)
      const group = $(`#transmissionFlux${side}`)
      group.style.opacity = strength < 1e-5 ? 0 : 0.1 + 0.9 * strength
      group.querySelectorAll('.transmission-flux').forEach(path => { path.style.strokeWidth = `${0.8 + 3 * strength}px` })
      group.querySelectorAll('.transmission-flux-arrow').forEach((arrow, index) => {
        arrow.setAttribute('transform', `translate(${x + 82} ${index ? 478 : 242}) rotate(${(index ? 180 : 0) + (flux < 0 ? 180 : 0)})`)
      })
      $(`#transmissionFluxDirection${side}`).textContent = strength < 1e-5 ? 'Φ = 0' : flux > 0 ? '↻' : '↺'
    }
    electronSegments.forEach(({ particles, y, amplitude, sign }) => particles.forEach(({ circle, x }) => {
      circle.setAttribute('cx', x + sign * amplitude * sample.electronMotion)
      circle.setAttribute('cy', y)
    }))
    const heat = Math.sqrt(1 - point.efficiency)
    clouds.forEach(({ circle, index, x, y, offset }) => {
      const progress = (time * 0.25 + offset) % 1
      circle.setAttribute('cx', x + 16 * Math.sin(progress * 4 + index))
      circle.setAttribute('cy', y - progress * (75 + heat * 85))
      circle.setAttribute('r', 12 + progress * (18 + heat * 15))
      const fade = Math.min(1, (1 - progress) / 0.45)
      circle.style.opacity = (index * 17 % 24) / 24 < heat ? fade * (0.65 + heat * 0.25) : 0
    })
    $('#transmissionHouseLight').style.opacity = 0.1 + point.efficiency * 0.9
    panel.querySelectorAll('.transmission-high-wire').forEach(path => {
      path.style.stroke = `rgb(${Math.round(140 + heat * 100)} ${Math.round(32 + heat * 80)} 65)`
    })
  }

  function stop() {
    running = false
    if (frame !== null) cancelAnimationFrame(frame)
    frame = null; lastTimestamp = null
    lastNumberTimestamp = null
    buttons.forEach(button => { button.textContent = time > 0 ? 'Simulation fortsetzen' : 'Simulation starten' })
    updateDiagram()
  }

  function readParameters() {
    const invalid = inputs.find(input => !input.validity.valid)
    if (invalid) throw new RangeError('Bitte gültige Werte innerhalb der angegebenen Grenzen eingeben.')
    frequency = Number($('#transmissionFrequency').value)
    return transmissionOperatingPoint({ power: Number($('#transmissionPower').value) * 1000,
      voltage: Number($('#transmissionVoltage').value) * 1000, resistance: Number($('#transmissionResistance').value) })
  }

  function refresh() {
    time = 0; stop()
    try {
      point = readParameters()
      $('#transmissionValidation').textContent = ''
      $('#transmissionSvg').classList.remove('transmission-invalid')
      buttons.forEach(button => { button.disabled = false })
      updateReadings(); updateDiagram()
    } catch (error) {
      point = null
      $('#transmissionValidation').textContent = error.message
      $('#transmissionSvg').classList.add('transmission-invalid')
      buttons.forEach(button => { button.disabled = true })
      for (const id of ['Generated', 'Loss', 'Delivered', 'Efficiency']) $(`#transmission${id}`).textContent = '—'
      $('#transmissionReadings').innerHTML = '<tr><td colspan="4">Für diese Einstellungen ist kein gültiger Betrieb möglich.</td></tr>'
      $('#transmissionOutcome').textContent = 'Bitte die Einstellungen korrigieren. Die Zeichnung zeigt noch den zuletzt gültigen Zustand.'
      $('#transmissionPowerBar').setAttribute('aria-label', 'Kein gültiger Betrieb')
      $('#transmissionDeliveredBar').style.width = '0%'
      $('#transmissionLossBar').style.width = '0%'
    }
    const voltage = Number($('#transmissionVoltage').value)
    $('#transmissionHalve').disabled = !Number.isFinite(voltage) || voltage / 2 < 0.5
    $('#transmissionDouble').disabled = !Number.isFinite(voltage) || voltage * 2 > 20
  }

  function animate(timestamp) {
    if (!running) return
    if (lastTimestamp !== null) time += Math.min((timestamp - lastTimestamp) / 1000, 0.1) * Number(playbackSpeed.value)
    lastTimestamp = timestamp
    const updateNumbers = lastNumberTimestamp === null || timestamp - lastNumberTimestamp >= 500
    updateDiagram(updateNumbers)
    if (updateNumbers) lastNumberTimestamp = timestamp
    frame = requestAnimationFrame(animate)
  }

  buttons.forEach(button => button.addEventListener('click', () => {
    if (running) { stop(); return }
    if (!point) return
    running = true; lastTimestamp = null
    buttons.forEach(item => { item.textContent = 'Simulation anhalten' })
    frame = requestAnimationFrame(animate)
  }))
  inputs.forEach(input => input.addEventListener('input', refresh))
  playbackSpeed.addEventListener('change', () => { lastTimestamp = null })
  $('#transmissionReset').addEventListener('click', () => {
    inputs.forEach(input => { input.value = input.defaultValue })
    playbackSpeed.value = defaultPlaybackSpeed
    refresh()
  })
  for (const [id, factor] of [['Halve', 0.5], ['Double', 2]]) {
    $(`#transmission${id}`).addEventListener('click', () => {
      $('#transmissionVoltage').value = Number($('#transmissionVoltage').value) * factor
      refresh()
    })
  }
  refresh()
  return { stop, resize() { updateDiagram() } }
}
