import Chart from 'chart.js/auto'
import { thomsonParameters, initialThomsonState, thomsonSample, advanceThomson, advanceThomsonPulse } from './thomson-model.js'

const svgNamespace = 'http://www.w3.org/2000/svg'
const number = (value, digits = 3) => Number(value.toPrecision(digits)).toLocaleString('de-DE')

export function mountThomson(panel) {
  panel.innerHTML = `
    <section class="card">
      <h2>Thomsonscher Ringversuch</h2>
      <div class="thomson-controls">
        <label>Spulenstrom I₁ (Effektivwert): <input id="thomsonCurrent" type="number" value="4" min="0" max="8" step="0.5" required> A</label>
        <label>Windungszahl N₁: <input id="thomsonWindings" type="number" value="300" min="100" max="600" step="20" required></label>
        <label>Frequenz: <input id="thomsonFrequency" type="number" value="50" min="10" max="100" step="10" required> Hz</label>
        <label>Ringmasse: <input id="thomsonMass" type="number" value="10" min="3" max="60" step="1" required> g</label>
        <label>Ringwiderstand R₂: <input id="thomsonResistance" type="number" value="1" min="0.2" max="10" step="0.2" required> mΩ</label>
        <label>Ringinduktivität L₂: <input id="thomsonInductance" type="number" value="20" min="5" max="50" step="1" required> µH</label>
        <label>Ring: <select id="thomsonRingType"><option value="closed">Geschlossener Aluminiumring</option><option value="slit">Geschlitzter Aluminiumring</option></select></label>
        <label>Versuchsvariante: <select id="thomsonMode"><option value="continuous">1 · Dauerbetrieb: Ausschwingen und Schweben</option><option value="pulse">2 · Kurzer Stromimpuls: Ring springt hoch</option></select></label>
        <label id="thomsonPulseControl" hidden>Impulsdauer: <input id="thomsonPulseDuration" type="number" value="80" min="20" max="200" step="20" required disabled> ms (physikalische Zeit)</label>
        <label>Zeitlupe: <select id="thomsonPlayback"><option value="0.1">10-fach verlangsamt (Ringbewegung beobachten)</option><option value="0.02">50-fach verlangsamt</option><option value="0.01" selected>100-fach verlangsamt</option><option value="0.005">200-fach verlangsamt</option></select></label>
      </div>
      <label><input id="thomsonHeld" type="checkbox"> Ring auf der Spule festhalten (Gedankenexperiment zur Kraftmessung)</label>
      <div class="thomson-actions">
        <button class="thomson-power">Wechselstrom einschalten</button>
        <button class="thomson-toggle" disabled>Simulation starten</button>
        <button class="thomson-quarter" disabled>Eine Viertelperiode weiter</button>
        <button id="thomsonReset">Auf Startwerte zurücksetzen</button>
      </div>
      <p>Die Zeitlupe verlangsamt alle Bewegungen und Felder gemeinsam; die physikalischen Werte bleiben unverändert.
        Bei 50 Hz und 100-facher Zeitlupe dauert eine elektrische Periode zwei echte Sekunden.
        Änderungen der Versuchseinstellungen beginnen einen neuen Versuch mit ausgeschalteter Quelle.</p>
      <p id="thomsonVariantHint"></p>
      <p id="thomsonValidation" class="thomson-validation" role="status"></p>
    </section>
    <section class="card">
      <h2>Magnetfelder und Ringbewegung</h2>
      <p id="thomsonStatus" class="thomson-status" role="status"></p>
      <div class="thomson-svg-container">
        <svg id="thomsonSvg" viewBox="0 0 1100 720" role="img" aria-labelledby="thomsonTitle thomsonDescription">
          <title id="thomsonTitle">Aluminiumring über einer Spule auf einem vertikalen Stahlstab</title>
          <desc id="thomsonDescription">Die Spule sitzt auf einem L-förmigen Eisenkern und ist mit einer geregelten Wechselstromquelle verbunden.
            Der Aluminiumring bewegt sich am Stahlstab. Grün zeigt den Magnetfeldbeitrag der Spule, Violett den des Rings.
            Blaue Punkte zeigen die Elektronenbewegung. Ein Kraftpfeil zeigt momentane Abstoßung oder Anziehung,
            ein weiterer Pfeil die Gewichtskraft.</desc>
          <rect x="730" y="415" width="310" height="250" rx="12" class="thomson-source-box"/>
          <path class="thomson-core" d="M120 350 H210 V560 H490 V650 H120 Z"/>
          <rect x="440" y="85" width="42" height="485" class="thomson-guide"/>
          <text x="140" y="130" class="thomson-label">Stahlstab</text>
          <path class="thomson-label-line" d="M270 135 L440 160"/>
          <g id="thomsonCoilField"/>
          <path class="thomson-wire" d="M522 430 H860 V500 M522 560 H860 V580"/>
          <rect x="398" y="415" width="126" height="155" class="thomson-coil-body"/>
          <g id="thomsonCoilTurns"/>
          <path class="thomson-coil-cap" d="M390 414 H532 M390 570 H532"/>
          <text x="285" y="481" text-anchor="end" class="thomson-label">Spule</text>
          <path class="thomson-label-line" d="M290 477 L396 480"/>
          <text id="thomsonTurnsLabel" x="461" y="695" text-anchor="middle" class="thomson-small"/>
          <text x="152" y="690" class="thomson-label">Eisenkern</text>
          <g id="thomsonRingField"/>
          <g id="thomsonRing">
            <path class="thomson-ring" fill-rule="evenodd" d="M385 0 A76 22 0 1 0 537 0 A76 22 0 1 0 385 0 Z
              M421 0 A40 9 0 1 0 501 0 A40 9 0 1 0 421 0 Z"/>
            <path id="thomsonSlit" d="M457 8 L457 24" class="thomson-slit"/>
            <g id="thomsonRingElectrons"/>
          </g>
          <text x="739" y="230" class="thomson-label">Aluminiumring</text>
          <path id="thomsonRingLabelLine" class="thomson-label-line"/>
          <path id="thomsonMagneticArrow" class="thomson-magnetic-arrow"/>
          <path id="thomsonGravityArrow" class="thomson-gravity-arrow"/>
          <text id="thomsonForceLabel" class="thomson-force-label"/>
          <text id="thomsonGravityLabel" class="thomson-gravity-label"/>
          <text x="739" y="110" class="thomson-field-key thomson-coil-key">Grün: Magnetfeld der Spule</text>
          <text x="739" y="147" class="thomson-field-key thomson-ring-key">Violett: Magnetfeld des Rings</text>
          <text x="739" y="184" class="thomson-field-key thomson-electron-key">Blau: Elektronenbewegung</text>
          <g id="thomsonRingTop" transform="translate(885 315)">
            <text y="-62" text-anchor="middle" class="thomson-small">Ring von oben · vergrößert</text>
            <circle r="51" class="thomson-ring"/>
            <circle r="34" fill="white" stroke="#475569" stroke-width="2"/>
            <path id="thomsonTopSlit" d="M0 34 V52" class="thomson-slit"/>
            <text id="thomsonRingDirection" y="9" text-anchor="middle" class="thomson-ring-direction"/>
            <g id="thomsonTopElectrons"/>
          </g>
          <text id="thomsonRingDirectionLabel" x="739" y="207" class="thomson-small"/>
          <text x="885" y="397" text-anchor="middle" class="thomson-label">Wechselstromquelle</text>
          <circle cx="860" cy="540" r="40" class="thomson-source"/>
          <text x="860" y="554" text-anchor="middle" class="thomson-source-wave">~</text>
          <circle id="thomsonPowerLight" cx="1000" cy="475" r="10"/>
          <text id="thomsonSourceReading" x="885" y="621" text-anchor="middle" class="thomson-small"/>
          <g id="thomsonCoilElectrons"/>
        </svg>
      </div>
      <div class="thomson-actions">
        <button class="thomson-power">Wechselstrom einschalten</button>
        <button class="thomson-toggle" disabled>Simulation starten</button>
        <button class="thomson-quarter" disabled>Eine Viertelperiode weiter</button>
        <span>Physikalische Zeit: <strong id="thomsonTime">0 ms</strong></span>
      </div>
      <div class="thomson-readings">
        <p>Spulenstrom (Momentanwert)<strong id="thomsonCoilCurrent"></strong></p>
        <p>Ringstrom (Momentanwert)<strong id="thomsonRingCurrent"></strong></p>
        <p>Induktionsspannung im Ring<strong id="thomsonVoltage"></strong></p>
        <p>Ringhöhe über der Auflage<strong id="thomsonHeight"></strong></p>
      </div>
      <p>Die Zahlen werden alle 0,5 Sekunden aktualisiert, beim Anhalten und Einzelschritt exakt.
        Die größeren blauen Punkte laufen auf dem Ring und in der Ansicht von oben umher, entgegen der technischen Stromrichtung.
        Bei Wechselstrom kehrt ihre Umlaufrichtung regelmäßig um. Die Bewegung ist stark vergrößert;
        reale Elektronen legen pro Halbwelle nur kleine Driftstrecken zurück.
        In der Draufsicht bedeutet ⊙ ein Ringfeld nach oben (aus der Ebene), ⊗ nach unten (in die Ebene).
        Grün und Violett stellen zwei Beiträge dar; das tatsächliche Magnetfeld ist ihre Überlagerung.</p>
    </section>
    <section class="card">
      <h2>Warum hebt sich der Ring?</h2>
      <div class="thomson-readings">
        <p>Momentane Magnetkraft<strong id="thomsonForce"></strong></p>
        <p>Gewichtskraft<strong id="thomsonWeight"></strong></p>
        <p>Magnetkraft: Mittel der letzten Periode<strong id="thomsonMeanForce"></strong></p>
      </div>
      <p id="thomsonForceHint" class="thomson-status"></p>
      <p>Eine positive Magnetkraft zeigt nach oben, eine negative nach unten.
        Ist die mittlere Magnetkraft größer als die Gewichtskraft, kann der Ring ansteigen.
        Im Schwebegleichgewicht gleichen sie sich ungefähr aus.
        Während der Bewegung wirken außerdem Trägheit und Luftwiderstand.
        Der Ring kann zunächst über seine spätere Schwebehöhe hinausschwingen.
        Im Dauerbetrieb bleibt schließlich eine nahezu feste Höhe; eine sehr kleine,
        schnelle Bewegung durch die wechselnde Magnetkraft ist weiterhin möglich.</p>
      <p>Vergleich: Wähle einen geschlitzten Ring. Es wird weiterhin eine Spannung induziert,
        aber kein umlaufender Strom: Das Ringmagnetfeld und der elektromagnetische Auftrieb verschwinden.
        Halte den geschlossenen Ring im Gedankenexperiment fest, um die Phasen und Kräfte in Ruhe zu vergleichen.</p>
    </section>
    <section class="card">
      <h2>Ströme, Induktionsspannung und Kraft im Zeitverlauf</h2>
      <button class="thomson-toggle" disabled>Simulation starten</button>
      <div class="thomson-charts">
        <div><h3>Spulenstrom i₁</h3><div class="chart-container thomson-chart"><canvas id="thomsonCoilChart"></canvas></div></div>
        <div><h3>Ringstrom i₂</h3><div class="chart-container thomson-chart"><canvas id="thomsonRingChart"></canvas></div></div>
        <div><h3>Induktionsspannung Uind im Ring</h3><div class="chart-container thomson-chart"><canvas id="thomsonVoltageChart"></canvas></div></div>
        <div><h3>Magnetkraft und Gewichtskraft</h3><div class="chart-container thomson-chart"><canvas id="thomsonForceChart"></canvas></div></div>
      </div>
      <p>Alle Diagramme zeigen dieselbe physikalische Zeit. Die beiden Stromdiagramme haben eigene,
        beschriftete Ampere-Skalen. Es werden nur bereits berechnete Zustände angezeigt, die letzten fünf elektrischen Perioden.</p>
    </section>
    <section class="card thomson-notes">
      <h2>Induktion und Selbstinduktion im Ring</h2>
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <msub><mi>U</mi><mi>ind</mi></msub><mo>=</mo><mo>−</mo>
        <mfrac><mrow><mi>d</mi><mi>Φ</mi></mrow><mrow><mi>d</mi><mi>t</mi></mrow></mfrac>
      </math>
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <msub><mi>L</mi><mn>2</mn></msub><mo>·</mo><mfrac><mrow><mi>d</mi><msub><mi>i</mi><mn>2</mn></msub></mrow><mrow><mi>d</mi><mi>t</mi></mrow></mfrac>
        <mo>+</mo><msub><mi>R</mi><mn>2</mn></msub><mo>·</mo><msub><mi>i</mi><mn>2</mn></msub><mo>=</mo><msub><mi>U</mi><mi>ind</mi></msub>
      </math>
      <p>Der Ring ist eine kurzgeschlossene Sekundärspule mit einer Windung.
        Der veränderliche Fluss der Spule induziert eine Spannung im Ring. Seine Selbstinduktivität
        verschiebt den Ringstrom zusätzlich gegenüber der Induktionsspannung.
        Zusammen mit dem räumlich veränderlichen Feld entsteht eine im Mittel aufwärts gerichtete Kraft.</p>
      <p>Die Felder sind nicht immer entgegengerichtet: Die Lenzsche Regel richtet sich gegen die Änderung.
        Im Wechselstrombetrieb können zeitweise Anziehung und Abstoßung auftreten.
        Deshalb zeigt die Simulation die momentane Kraft und das Mittel über eine vollständige letzte Periode.</p>
      <details><summary>Modell und Grenzen</summary>
        <p>Das Modell verwendet eine geregelte sinusförmige Spulenstromquelle mit sanftem Ein- und Ausschalten,
          einen linearen Eisenkern und einen Ring mit konstantem Widerstand und konstanter Selbstinduktivität.
          Die Rückwirkung des Rings auf den vorgegebenen Spulenstrom wird von der idealen Stromregelung ausgeglichen.
          Einschaltvorgang, Selbstinduktion und Bewegung werden gemeinsam berechnet.</p>
        <p>Die Kopplung nimmt mit der Höhe ab: M(z) = M₀ exp(−z/h), mit h = 8 cm und M₀ = 200 µH bei N₁ = 300.
          Es gilt Uind = −d(Mi₁)/dt und Fmag = i₁i₂ dM/dz. Die Bewegung folgt dem Kräftegleichgewicht mit
          Gewichtskraft und einem kleinen Luftwiderstand. Die Auflage ist ein unelastischer Anschlag.
          Festhalten bedeutet eine zusätzliche äußere Haltekraft.</p>
        <p>Feldhelligkeit, Elektronenbewegung und Pfeillängen sind schematisch skaliert.
          Die angezeigten Kräfte und Höhen gelten für dieses Vergleichsmodell, nicht für ein kalibriertes reales Gerät.
          Eine Erwärmung ändert R₂ hier nicht. Die elektrischen Parameter und die Masse sind unabhängig einstellbar.
          Der Ring wird idealisiert vertikal geführt; seitliches Kippen und das Verlassen des Stabs werden nicht berechnet.</p>
      </details>
      <p>Physikalischer Hintergrund: <a href="https://www.grinnell.edu/sites/default/files/documents/measurements_and_mechanisms_of_thomsoms_jumping_ring_0.pdf"
        target="_blank" rel="noopener noreferrer">Tjossem und Cornejo: Messungen und Mechanismen des Ringversuchs</a>.</p>
    </section>`

  const $ = selector => panel.querySelector(selector)
  const inputs = [...panel.querySelectorAll('input[type="number"]')]
  const toggles = [...panel.querySelectorAll('.thomson-toggle')]
  const powers = [...panel.querySelectorAll('.thomson-power')]
  const quarters = [...panel.querySelectorAll('.thomson-quarter')]
  const mode = $('#thomsonMode'), pulseDuration = $('#thomsonPulseDuration')
  const playback = $('#thomsonPlayback'), defaultPlayback = playback.value
  let parameters = null, state = initialThomsonState(), powered = false, running = false, frame = null
  let pulseEnd = null
  let lastTimestamp = null, lastNumbers = null, lastChart = null, history = [], ringAngle = 0, coilOffset = 0
  const fieldArrows = []
  for (const side of [-1, 1]) {
    for (let index = 0; index < 3; index++) {
      const inner = 461 + side * (7 + index * 4), outer = 461 + side * (130 + index * 20), top = 105 + index * 12
      const path = document.createElementNS(svgNamespace, 'path')
      path.setAttribute('d', `M${inner} 595 V${top} C${inner} ${top - 35} ${outer} ${top - 35} ${outer} ${top}
        V595 C${outer} 635 ${inner} 635 ${inner} 595 Z`)
      path.setAttribute('class', 'thomson-coil-field')
      $('#thomsonCoilField').append(path)
      const arrow = document.createElementNS(svgNamespace, 'path')
      arrow.setAttribute('d', 'M-5 7 L0 -7 L5 7 Z')
      arrow.setAttribute('class', 'thomson-coil-arrow')
      $('#thomsonCoilField').append(arrow)
      fieldArrows.push({ arrow, x: inner })
    }
  }
  const ringFieldPaths = []
  for (const side of [-1, 1]) {
    for (let index = 0; index < 2; index++) {
      const path = document.createElementNS(svgNamespace, 'path')
      path.setAttribute('class', 'thomson-ring-field')
      $('#thomsonRingField').append(path)
      const arrow = document.createElementNS(svgNamespace, 'path')
      arrow.setAttribute('d', 'M-9 10 L0 -10 L9 10 Z')
      arrow.setAttribute('class', 'thomson-ring-arrow')
      $('#thomsonRingField').append(arrow)
      const outerArrow = arrow.cloneNode(true)
      $('#thomsonRingField').append(outerArrow)
      ringFieldPaths.push({ path, arrow, outerArrow, inner: 461 + side * (10 + index * 5), outer: 461 + side * (100 + index * 16) })
    }
  }
  const ringParticles = Array.from({ length: 8 }, (_, index) => {
    const circle = document.createElementNS(svgNamespace, 'circle')
    circle.setAttribute('class', index === 0 ? 'thomson-electron thomson-electron-highlight' : 'thomson-electron'); circle.setAttribute('r', index === 0 ? '7' : '5')
    $('#thomsonRingElectrons').append(circle)
    return circle
  })
  const topParticles = ringParticles.map(particle => {
    const circle = particle.cloneNode(true)
    $('#thomsonTopElectrons').append(circle)
    return circle
  })
  const coilParticles = [430, 560].flatMap(y => Array.from({ length: 8 }, (_, index) => {
    const circle = document.createElementNS(svgNamespace, 'circle')
    circle.setAttribute('class', 'thomson-electron'); circle.setAttribute('r', '4')
    $('#thomsonCoilElectrons').append(circle)
    return { circle, x: 560 + index * 20, y, sign: y === 430 ? -1 : 1 }
  }))

  const cursor = { id: 'thomsonCursor', afterDraw(chart) {
    const { ctx, chartArea, scales } = chart
    if (!chartArea) return
    const x = scales.x.getPixelForValue(state.time * 1000)
    ctx.save(); ctx.strokeStyle = '#475569'; ctx.setLineDash([4, 4])
    ctx.beginPath(); ctx.moveTo(x, chartArea.top); ctx.lineTo(x, chartArea.bottom); ctx.stroke(); ctx.restore()
  } }
  function createChart(canvas, definitions, unit) {
    return new Chart(canvas, { type: 'line', plugins: [cursor],
      data: { datasets: definitions.map(([label, color], index) => ({ label, borderColor: color,
        borderDash: index ? [6, 4] : [], borderWidth: 2, pointRadius: 0, tension: 0, data: [] })) },
      options: { responsive: true, maintainAspectRatio: false, animation: false,
        interaction: { mode: 'index', intersect: false },
        scales: { x: { type: 'linear', title: { display: true, text: 'Physikalische Zeit / ms' } },
          y: { title: { display: true, text: unit }, afterDataLimits(scale) {
            const limit = Math.max(Math.abs(scale.min), Math.abs(scale.max)) || 1; scale.min = -limit; scale.max = limit
          } } },
        plugins: { tooltip: { callbacks: { label(context) { return `${context.dataset.label}: ${number(context.parsed.y, 4)} ${unit}` } } } }
      }
    })
  }
  const coilChart = createChart($('#thomsonCoilChart'), [['Spulenstrom i₁', '#15803d']], 'A')
  const ringChart = createChart($('#thomsonRingChart'), [['Ringstrom i₂', '#9333ea']], 'A')
  const voltageChart = createChart($('#thomsonVoltageChart'), [['Induktionsspannung Uind', '#d97706']], 'V')
  const forceChart = createChart($('#thomsonForceChart'), [['Magnetkraft (nach oben positiv)', '#2563eb'], ['Gewichtskraft (Betrag)', '#c2410c']], 'N')
  const charts = [coilChart, ringChart, voltageChart, forceChart]

  function record(next, sample) {
    const previous = history.at(-1), dt = previous ? next.time - previous.time : 0
    const coilPeak = Math.SQRT2 * parameters.currentRms
    const ringPeak = coilPeak * parameters.mutualAtBase * parameters.omega /
      Math.hypot(parameters.ringResistance, parameters.omega * parameters.ringInductance)
    // Stark vergrößerte Drift: sichtbare Umläufe, weiterhin mit dem Vorzeichen des Elektronenstroms.
    if (ringPeak) ringAngle -= (sample.ringCurrent + (previous?.ringCurrent ?? sample.ringCurrent)) / 2 / ringPeak * parameters.frequency * 360 * 12 * dt
    if (coilPeak) coilOffset -= (sample.coilCurrent + (previous?.coilCurrent ?? sample.coilCurrent)) / 2 / coilPeak * parameters.frequency * 80 * dt
    history.push({ time: next.time, coilCurrent: sample.coilCurrent, ringCurrent: sample.ringCurrent,
      voltage: sample.inducedVoltage, force: sample.magneticForce })
  }

  function cycleAverage() {
    const period = 1 / parameters.frequency, start = state.time - period
    if (start < 0 || history.length < 2) return null
    let integral = 0
    for (let index = 1; index < history.length; index++) {
      const before = history[index - 1], after = history[index]
      if (after.time <= start) continue
      const begin = Math.max(start, before.time)
      const fraction = (begin - before.time) / (after.time - before.time)
      const initial = before.force + fraction * (after.force - before.force)
      integral += (initial + after.force) / 2 * (after.time - begin)
    }
    return integral / period
  }

  function advance(duration) {
    if (pulseEnd !== null) {
      const result = advanceThomsonPulse(state, parameters, duration, pulseEnd, record)
      state = result.state
      if (powered !== result.powered) { powered = result.powered; setButtons() }
    } else state = advanceThomson(state, parameters, duration, powered, record)
    const cutoff = state.time - 5 / parameters.frequency
    // Ein zusätzlicher Punkt bleibt für die Trapezregel am linken Rand erhalten.
    const first = history.findIndex(point => point.time >= cutoff)
    if (first > 1) history.splice(0, first - 1)
  }

  function setButtons() {
    powers.forEach(button => { button.disabled = !parameters; button.textContent = mode.value === 'pulse' ? powered ? 'Impuls abbrechen' : 'Stromimpuls auslösen' : powered ? 'Wechselstrom ausschalten' : 'Wechselstrom einschalten' })
    toggles.forEach(button => { button.disabled = !parameters || !powered && state.time === 0
      button.textContent = running ? 'Simulation anhalten' : state.time > 0 ? 'Simulation fortsetzen' : 'Simulation starten' })
    quarters.forEach(button => { button.disabled = !parameters || !powered && state.time === 0 })
  }

  function updateNumbers(sample) {
    $('#thomsonTime').textContent = `${number(state.time * 1000)} ms`
    $('#thomsonCoilCurrent').textContent = `${number(sample.coilCurrent)} A`
    $('#thomsonRingCurrent').textContent = `${number(sample.ringCurrent)} A`
    $('#thomsonVoltage').textContent = `${number(sample.inducedVoltage)} V`
    $('#thomsonHeight').textContent = `${number(state.height * 100)} cm`
    $('#thomsonForce').textContent = `${number(sample.magneticForce)} N`
    $('#thomsonWeight').textContent = `${number(parameters.weight)} N`
    const average = cycleAverage()
    $('#thomsonMeanForce').textContent = average === null ? 'Noch keine ganze Periode' : `${number(average)} N`
    $('#thomsonSourceReading').textContent = `I₁,eff eingestellt: ${number(parameters.currentRms)} A · ${number(parameters.frequency)} Hz`
  }

  function updateDiagram(updateValues = true) {
    if (!parameters) return
    const sample = thomsonSample(state, parameters, powered)
    if (updateValues) updateNumbers(sample)
    const displayHeight = Math.max(0.3, state.height * 1.2), ringY = 398 - state.height / displayHeight * 310
    $('#thomsonRing').setAttribute('transform', `translate(0 ${ringY})`)
    $('#thomsonSlit').style.display = parameters.closed ? 'none' : ''
    $('#thomsonRingElectrons').style.visibility = parameters.closed && Math.abs(sample.ringField) + state.drive > 1e-6 ? 'visible' : 'hidden'
    ringParticles.forEach((particle, index) => {
      const angle = (index / ringParticles.length * 360 + ringAngle) * Math.PI / 180
      particle.setAttribute('cx', 461 + 59 * Math.cos(angle)); particle.setAttribute('cy', -15 * Math.sin(angle))
      topParticles[index].setAttribute('cx', 43 * Math.cos(angle)); topParticles[index].setAttribute('cy', -43 * Math.sin(angle))
    })
    $('#thomsonTopElectrons').style.visibility = $('#thomsonRingElectrons').style.visibility
    $('#thomsonTopSlit').style.display = parameters.closed ? 'none' : ''
    $('#thomsonRingDirection').textContent = Math.abs(sample.ringField) < 1e-5 ? '—' : sample.ringField > 0 ? '⊙' : '⊗'
    $('#thomsonRingDirection').style.opacity = Math.abs(sample.ringField) < 1e-5 ? 1 : 0.35 + 0.65 * Math.min(1, Math.abs(sample.ringField))
    $('#thomsonRingDirectionLabel').textContent = Math.abs(sample.ringField) < 1e-5 ? 'Ringfeld: momentan null' : `Ringfeld im Inneren: ${sample.ringField > 0 ? '↑ nach oben' : '↓ nach unten'}`
    coilParticles.forEach(({ circle, x, y, sign }) => {
      circle.setAttribute('cx', x + sign * Math.max(-30, Math.min(30, coilOffset)))
      circle.setAttribute('cy', y)
      circle.style.opacity = state.drive < 1e-5 || parameters.currentRms === 0 ? 0 : 1
    })
    const coilStrength = Math.min(1, Math.abs(sample.coilField)), ringStrength = Math.min(1, Math.abs(sample.ringField))
    $('#thomsonCoilField').style.opacity = coilStrength < 1e-5 ? 0 : 0.15 + 0.85 * coilStrength
    $('#thomsonCoilField').querySelectorAll('.thomson-coil-field').forEach(path => { path.style.strokeWidth = `${0.8 + 2.6 * coilStrength}px` })
    fieldArrows.forEach(({ arrow, x }) => arrow.setAttribute('transform', `translate(${x} 300) rotate(${sample.coilField < 0 ? 180 : 0})`))
    $('#thomsonRingField').style.opacity = ringStrength < 1e-5 ? 0 : 0.15 + 0.85 * ringStrength
    ringFieldPaths.forEach(({ path, arrow, outerArrow, inner, outer }) => {
      const top = ringY - 50, bottom = ringY + 50
      path.setAttribute('d', `M${inner} ${bottom} V${top} C${inner} ${top - 20} ${outer} ${top - 20} ${outer} ${top}
        V${bottom} C${outer} ${bottom + 20} ${inner} ${bottom + 20} ${inner} ${bottom} Z`)
      path.style.strokeWidth = `${1 + 2.6 * ringStrength}px`
      arrow.setAttribute('transform', `translate(${inner} ${ringY - 38}) rotate(${sample.ringField < 0 ? 180 : 0})`)
      outerArrow.setAttribute('transform', `translate(${outer} ${ringY}) rotate(${sample.ringField < 0 ? 0 : 180})`)
    })
    $('#thomsonRingLabelLine').setAttribute('d', `M730 230 L540 ${ringY}`)
    const forceLength = Math.min(95, Math.abs(sample.magneticForce) / parameters.weight * 42)
    const sign = sample.magneticForce >= 0 ? -1 : 1, end = ringY + sign * forceLength
    $('#thomsonMagneticArrow').setAttribute('d', `M590 ${ringY} V${end} M583 ${end - sign * 9} L590 ${end} L597 ${end - sign * 9}`)
    $('#thomsonMagneticArrow').style.opacity = forceLength < 1 ? 0 : 1
    $('#thomsonForceLabel').setAttribute('x', '600'); $('#thomsonForceLabel').setAttribute('y', String(end - 8))
    $('#thomsonForceLabel').textContent = forceLength < 1 ? 'Fmag ≈ 0' : sign < 0 ? 'Fmag ↑' : 'Fmag ↓'
    $('#thomsonGravityArrow').setAttribute('d', `M665 ${ringY} v42 M658 ${ringY + 33} L665 ${ringY + 42} L672 ${ringY + 33}`)
    $('#thomsonGravityLabel').setAttribute('x', '679'); $('#thomsonGravityLabel').setAttribute('y', String(ringY + 43))
    $('#thomsonGravityLabel').textContent = 'Fg'
    $('#thomsonPowerLight').style.fill = powered ? '#16a34a' : '#94a3b8'
    $('#thomsonStatus').textContent = !powered && state.drive < 1e-5 && state.height < 1e-5
      ? mode.value === 'pulse' ? 'Der Ring liegt auf der Spule. Löse einen kurzen Stromimpuls aus.' : 'Der Ring liegt auf der Spule. Schalte den Wechselstrom für Ausschwingen und Schweben ein.'
      : parameters.held ? 'Der Ring wird festgehalten. Die äußere Haltekraft verhindert seine Bewegung.'
      : !parameters.closed ? 'Geschlitzter Ring: Spannung wird induziert, aber kein umlaufender Ringstrom und kein Auftrieb.'
      : powered ? !running ? 'Quelle eingeschaltet; die Simulation ist angehalten.' : mode.value === 'pulse' ? `Stromimpuls aktiv: automatisches Abschalten bei ${number(pulseEnd * 1000)} ms.` : 'Dauerbetrieb: Der Ring schwingt um die Schwebehöhe; die Ausschläge klingen ab.'
      : mode.value === 'pulse' ? 'Impuls beendet: Die Felder klingen ab. Der Ring steigt durch seine Trägheit weiter, erreicht den höchsten Punkt und fällt zurück.' : 'Quelle ausgeschaltet: Ströme und Felder klingen ab; der Ring fällt unter dem Einfluss seiner Gewichtskraft zurück.'
    $('#thomsonForceHint').textContent = !parameters.closed ? 'Der Schlitz unterbricht den Stromweg: keine Magnetkraft auf den Ring.'
      : parameters.held ? 'Die Pfeile zeigen die magnetische Kraft und die Gewichtskraft. Zusätzlich wirkt die Haltekraft.'
      : sample.magneticForce < -1e-5 ? 'Momentan wirkt die Magnetkraft nach unten: Anziehung. Entscheidend für den Auftrieb ist die Kraft im zeitlichen Mittel.'
      : sample.magneticForce > parameters.weight ? 'Momentan ist die aufwärts gerichtete Magnetkraft größer als die Gewichtskraft.'
      : 'Momentan überwiegt die Gewichtskraft. Der Ring kann durch seine bereits vorhandene Aufwärtsgeschwindigkeit trotzdem noch steigen.'
  }

  function updateCharts() {
    if (!parameters) return
    const start = Math.max(0, state.time - 5 / parameters.frequency)
    const end = Math.max(state.time, 1 / parameters.frequency) * 1000
    const definitions = [[coilChart, 'coilCurrent'], [ringChart, 'ringCurrent'], [voltageChart, 'voltage'], [forceChart, 'force']]
    for (const [chart, key] of definitions) {
      chart.data.datasets[0].data = history.map(point => ({ x: point.time * 1000, y: point[key] }))
      if (chart === forceChart) chart.data.datasets[1].data = history.map(point => ({ x: point.time * 1000, y: parameters.weight }))
      chart.options.scales.x.min = start * 1000; chart.options.scales.x.max = end
      chart.update('none')
    }
  }

  function stop() {
    running = false
    if (frame !== null) cancelAnimationFrame(frame)
    frame = null; lastTimestamp = null; lastNumbers = null; lastChart = null
    setButtons(); updateDiagram(); updateCharts()
  }

  function updateVariantControls() {
    const pulse = mode.value === 'pulse'
    $('#thomsonPulseControl').hidden = !pulse; pulseDuration.disabled = !pulse
    $('#thomsonHeld').disabled = pulse
    $('#thomsonVariantHint').textContent = pulse
      ? `Der Ring startet unten. Die Wechselstromquelle schaltet nach ${pulseDuration.value} ms automatisch ab (${number(Number(pulseDuration.value) / 1000 / Number(playback.value))} Sekunden in dieser Zeitlupe). Jeder neue Impuls beginnt wieder auf der Auflage.`
      : 'Die Quelle bleibt eingeschaltet. Der Ring schwingt zunächst auf und ab und nähert sich einer Schwebehöhe. Zum Beobachten des Ausschwingens eignet sich die 10-fache Zeitlupe; für Feld- und Stromrichtungen die 100-fache.'
  }

  function reset() {
    updateVariantControls()
    stop(); state = initialThomsonState(); powered = false; pulseEnd = null; history = []; ringAngle = 0; coilOffset = 0
    try {
      if (inputs.some(input => !input.validity.valid)) throw new RangeError('Bitte gültige Werte innerhalb der angegebenen Grenzen eingeben.')
      parameters = thomsonParameters({ currentRms: Number($('#thomsonCurrent').value), windings: Number($('#thomsonWindings').value),
        frequency: Number($('#thomsonFrequency').value), mass: Number($('#thomsonMass').value) / 1000,
        ringResistance: Number($('#thomsonResistance').value) / 1000, ringInductance: Number($('#thomsonInductance').value) / 1000000,
        closed: $('#thomsonRingType').value === 'closed', held: mode.value !== 'pulse' && $('#thomsonHeld').checked })
      $('#thomsonValidation').textContent = ''; $('#thomsonSvg').classList.remove('thomson-invalid')
      const count = Math.round(parameters.windings / 15)
      $('#thomsonCoilTurns').innerHTML = Array.from({ length: count }, (_, index) => `<path d="M400 ${422 + index / (count - 1) * 141} h122"/>`).join('')
      $('#thomsonTurnsLabel').textContent = `N₁ = ${parameters.windings} · eine Linie ≈ 15 Windungen`
      record(state, thomsonSample(state, parameters, powered)); updateDiagram(); updateCharts()
    } catch (error) {
      parameters = null; $('#thomsonValidation').textContent = error.message
      $('#thomsonSvg').classList.add('thomson-invalid')
      $('#thomsonStatus').textContent = 'Bitte gültige Einstellungen wählen; die Zeichnung zeigt noch den letzten gültigen Zustand.'
      for (const id of ['CoilCurrent', 'RingCurrent', 'Voltage', 'Height', 'Force', 'Weight', 'MeanForce']) $(`#thomson${id}`).textContent = '—'
      charts.forEach(chart => { chart.data.datasets.forEach(dataset => { dataset.data = [] }); chart.update('none') })
    }
    setButtons()
  }

  function animate(timestamp) {
    if (!running) return
    if (lastTimestamp !== null) advance(Math.min((timestamp - lastTimestamp) / 1000, 0.1) * Number(playback.value))
    lastTimestamp = timestamp
    const updateValues = lastNumbers === null || timestamp - lastNumbers >= 500
    updateDiagram(updateValues)
    if (updateValues) lastNumbers = timestamp
    if (lastChart === null || timestamp - lastChart >= 100) { updateCharts(); lastChart = timestamp }
    frame = requestAnimationFrame(animate)
  }
  function start() {
    if (!parameters) return
    running = true; lastTimestamp = null; lastNumbers = null; lastChart = null
    setButtons(); frame = requestAnimationFrame(animate)
  }
  powers.forEach(button => button.addEventListener('click', () => {
    if (!parameters) return
    if (mode.value === 'pulse' && !powered) {
      reset()
      if (!parameters) return
      pulseEnd = Number(pulseDuration.value) / 1000
      powered = true
    } else { powered = !powered; pulseEnd = null }
    if (!running) start()
    setButtons(); updateDiagram()
  }))
  toggles.forEach(button => button.addEventListener('click', () => running ? stop() : start()))
  quarters.forEach(button => button.addEventListener('click', () => {
    stop(); advance(1 / parameters.frequency / 4); updateDiagram(); updateCharts(); setButtons()
  }))
  inputs.forEach(input => input.addEventListener('input', reset))
  mode.addEventListener('change', reset)
  $('#thomsonRingType').addEventListener('change', reset)
  $('#thomsonHeld').addEventListener('change', reset)
  playback.addEventListener('change', () => { lastTimestamp = null; updateVariantControls() })
  $('#thomsonReset').addEventListener('click', () => {
    inputs.forEach(input => { input.value = input.defaultValue })
    mode.value = 'continuous'; $('#thomsonHeld').checked = false; $('#thomsonRingType').value = 'closed'; playback.value = defaultPlayback
    reset()
  })
  reset()
  return { stop, resize() { charts.forEach(chart => chart.resize()); updateDiagram(); updateCharts() } }
}
