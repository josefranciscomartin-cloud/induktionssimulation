import Chart from 'chart.js/auto'
import { lcProperties, lcSample } from './lc-model.js'

const svgNamespace = 'http://www.w3.org/2000/svg'
const number = (value, digits = 3) => Number(value.toPrecision(digits)).toLocaleString('de-DE')

export function mountLcCircuit(panel) {
  panel.innerHTML = `
    <section class="card">
      <h2>Der ungedämpfte elektromagnetische Schwingkreis</h2>
      <div class="lc-controls">
        <label>Induktivität L: <input id="lcInductance" type="number" value="100" min="10" max="1000" step="10" required> mH</label>
        <label>Kapazität C: <input id="lcCapacitance" type="number" value="100" min="10" max="1000" step="10" required> µF</label>
        <label>Ladespannung U₀: <input id="lcVoltage" type="number" value="6" min="1" max="24" step="0.5" required> V</label>
        <label>Zeitlupe: <select id="lcPlayback" aria-describedby="lcSpeedHint">
          <option value="0.005">200-fach verlangsamt</option>
          <option value="0.0025" selected>400-fach verlangsamt</option>
          <option value="0.00125">800-fach verlangsamt</option>
          <option value="0.000625">1600-fach verlangsamt</option>
        </select></label>
      </div>
      <p id="lcSpeedHint">Die Zeitlupe verlangsamt nur die Wiedergabe. Die tatsächliche Frequenz ergibt sich aus L und C.
        Bei den Startwerten dauert eine Schwingung in der 400-fachen Zeitlupe etwa 8 echte Sekunden.</p>
      <div class="lc-actions">
        <button id="lcCharge">Kondensator laden</button>
        <button class="lc-toggle" disabled>Schwingkreis schließen &amp; starten</button>
        <button class="lc-quarter" disabled>Ein Viertel der Periode weiter</button>
        <button id="lcReset">Auf Startwerte zurücksetzen</button>
      </div>
      <p id="lcValidation" class="lc-validation" role="status"></p>
    </section>
    <section class="card">
      <h2>Ladung, Strom und Felder sehen</h2>
      <p id="lcState" class="lc-state" role="status"></p>
      <div class="lc-svg-container">
        <svg id="lcSvg" viewBox="0 0 1100 660" role="img" aria-labelledby="lcTitle lcDescription">
          <title id="lcTitle">Umschaltbarer Stromkreis mit Spannungsquelle, Kondensator und Spule</title>
          <desc id="lcDescription">In der Stellung Laden ist die Spannungsquelle angeschlossen.
            Beim Umschalten wird die Quelle getrennt und der verlustfreie LC-Kreis geschlossen.
            Orange Feldpfeile zwischen den Kondensatorplatten zeigen das elektrische Feld,
            grüne gekrümmte Feldlinien um die Spule das Magnetfeld. Beide Felder wechseln ihre Richtung.
            Blaue Punkte zeigen die Elektronenbewegung ausschließlich im Draht.</desc>
          <g id="lcChargeBranch">
            <path class="lc-wire" d="M140 235 V130 H340 M140 395 V535 H300 M400 535 H520"/>
            <circle cx="140" cy="315" r="80" class="lc-source"/>
            <text x="140" y="302" text-anchor="middle" class="lc-source-sign">+</text>
            <text x="140" y="353" text-anchor="middle" class="lc-source-sign">−</text>
            <text id="lcSourceVoltage" x="280" y="435" text-anchor="middle" class="lc-label"/>
            <text x="280" y="467" text-anchor="middle" class="lc-small">Spannungsquelle</text>
            <rect x="300" y="521" width="100" height="28" class="lc-resistor"/>
            <text x="350" y="585" text-anchor="middle" class="lc-small">Ladewiderstand</text>
          </g>
          <path id="lcReturnWire" class="lc-wire" d="M520 190 V535"/>
          <path id="lcElectronPath" class="lc-wire" d="M820 245 V130 H520 M520 190 V535 H820 V490"/>
          <path class="lc-wire" d="M820 320 V390"/>
          <path id="lcSwitch" class="lc-switch" d="M520 130 L365 105"/>
          <circle cx="340" cy="130" r="6" class="lc-contact"/>
          <circle cx="520" cy="130" r="6" class="lc-contact"/>
          <circle cx="520" cy="190" r="6" class="lc-contact"/>
          <text x="355" y="100" class="lc-small">Laden</text>
          <text x="410" y="225" class="lc-small">LC-Kreis</text>
          <text x="470" y="90" class="lc-label">S</text>
          <circle cx="660" cy="130" r="25" class="lc-meter"/>
          <text x="660" y="140" text-anchor="middle" class="lc-label">A</text>
          <text x="707" y="116" class="lc-small">+</text>
          <text x="603" y="116" class="lc-small">−</text>
          <g id="lcElectricField"/>
          <g id="lcMagneticField"/>
          <path id="lcCoil" class="lc-coil" d="M820 390 C851 390 851 415 820 415 C851 415 851 440 820 440
            C851 440 851 465 820 465 C851 465 851 490 820 490"/>
          <path id="lcMotionTrack" fill="none" stroke="none" d="M820 245 V130 H520 V535 H820 V490
            C851 490 851 465 820 465 C851 465 851 440 820 440 C851 440 851 415 820 415
            C851 415 851 390 820 390 V320"/>
          <g id="lcElectrons"/>
          <path class="lc-capacitor" d="M750 245 H890 M750 320 H890"/>
          <g id="lcPlateCharges"/>
          <text id="lcTopPolarity" x="720" y="255" text-anchor="middle" class="lc-polarity"/>
          <text id="lcBottomPolarity" x="720" y="330" text-anchor="middle" class="lc-polarity"/>
          <text x="730" y="290" text-anchor="end" class="lc-electric-label">Elektrisches Feld E</text>
          <text x="820" y="555" text-anchor="middle" class="lc-magnetic-label">Magnetfeld B</text>
          <text x="650" y="355" text-anchor="middle" class="lc-induction-label">Selbstinduktion</text>
          <g id="lcInductionArrow">
            <title>Violetter Pfeil: Wirkung der Selbstinduktionsspannung auf positive Ladungen, keine Feldlinie.</title>
            <path id="lcInductionDirection" class="lc-induction-arrow" d="M0 -45 V45 M-8 34 L0 45 L8 34"/>
            <text id="lcInductionTopPolarity" x="690" y="398" class="lc-induction-polarity"/>
            <text id="lcInductionBottomPolarity" x="690" y="507" class="lc-induction-polarity"/>
          </g>
          <text x="912" y="280" class="lc-label">C</text>
          <text x="915" y="455" class="lc-label">L</text>
          <path class="lc-meter-wire" d="M820 218 H985 V258 M820 347 H985 V308 M820 367 H985 V420 M820 511 H985 V470"/>
          <circle cx="985" cy="283" r="25" class="lc-meter"/>
          <circle cx="985" cy="445" r="25" class="lc-meter"/>
          <text x="985" y="293" text-anchor="middle" class="lc-label">V</text>
          <text x="985" y="455" text-anchor="middle" class="lc-label">V</text>
          <text x="1023" y="275" class="lc-small">uC</text>
          <text x="1023" y="437" class="lc-small">uL</text>
          <text x="997" y="247" class="lc-small">+</text><text x="997" y="330" class="lc-small">−</text>
          <text x="997" y="407" class="lc-small">+</text><text x="997" y="490" class="lc-small">−</text>
          <text x="660" y="589" text-anchor="middle" class="lc-small">Momentanwerte</text>
          <text id="lcInstantValues" x="660" y="625" text-anchor="middle" class="lc-value"/>
        </svg>
      </div>
      <div class="lc-actions">
        <button class="lc-toggle" disabled>Schwingkreis schließen &amp; starten</button>
        <button class="lc-quarter" disabled>Ein Viertel der Periode weiter</button>
        <span>Physikalische Zeit: <strong id="lcTime">0 ms</strong></span>
      </div>
      <p>Die blauen Punkte zeigen die <strong>physikalische Stromrichtung (Elektronenbewegung)</strong>.
        Zwischen den Kondensatorplatten fließen keine Elektronen durch den Isolator.
        Die Feldpfeile zeigen jeweils die Feldrichtung; ihre Helligkeit und Breite zeigen die relative Feldstärke.</p>
      <p>Die Zahlen wechseln nur alle 0,5 Sekunden. Beim Anhalten und beim Viertelperioden-Schritt
        zeigen sie den genauen Zustand der Zeichnung.</p>
      <div class="lc-induction-info">
        <p><strong>Selbstinduktionsspannung:</strong> <strong id="lcInductionValue"></strong>
          · Stromänderung di/dt: <strong id="lcCurrentChange"></strong></p>
        <p id="lcInductionHint"></p>
        <p>Der violette Pfeil zeigt, in welche Richtung die Selbstinduktion positive Ladungen antreibt.
          Er ist keine Magnetfeldlinie. Seine Stärke hängt von der <strong>Änderung</strong> der Stromstärke ab,
          das grüne Magnetfeld dagegen von der Stromstärke selbst.</p>
      </div>
    </section>
    <section class="card">
      <h2>Die Energie pendelt zwischen Kondensator und Spule</h2>
      <div class="lc-energy-grid">
        <div class="lc-energy-box"><h3>Elektrische Energie im Kondensator</h3><strong id="lcElectricEnergy"></strong>
          <div class="lc-energy-track"><div id="lcElectricBar" class="lc-electric-bar"></div></div></div>
        <div class="lc-energy-box"><h3>Magnetische Energie in der Spule</h3><strong id="lcMagneticEnergy"></strong>
          <div class="lc-energy-track"><div id="lcMagneticBar" class="lc-magnetic-bar"></div></div></div>
      </div>
      <p>Gesamtenergie: <strong id="lcTotalEnergy"></strong> · <span id="lcEnergyHint"></span></p>
      <p id="lcPhaseHint" class="lc-phase-hint"></p>
      <div class="lc-properties">
        <p>Eigenfrequenz: <strong id="lcFrequency"></strong></p>
        <p>Periodendauer: <strong id="lcPeriod"></strong></p>
        <p>Maximale Stromstärke: <strong id="lcCurrentMax"></strong></p>
      </div>
    </section>
    <section class="card">
      <h2>Spannungen und Strom im Zeitverlauf</h2>
      <button class="lc-toggle" disabled>Schwingkreis schließen &amp; starten</button>
      <h3>Kondensator- und Spulenspannung</h3>
      <div class="chart-container lc-chart"><canvas id="lcVoltageChart"></canvas></div>
      <h3>Stromaufbau: große und kleine Induktivität vergleichen</h3>
      <p>Die blaue Stromkurve zeigt den gezeichneten Schwingkreis mit der eingestellten Induktivität L.
        Die orange gestrichelte Stromkurve zeigt einen Vergleichskreis mit <strong>einem Viertel dieser Induktivität</strong>.
        C und U₀ sind in beiden Schwingkreisen gleich. Die blaue Stromkurve gehört zur animierten Zeichnung.</p>
      <div class="chart-container lc-chart"><canvas id="lcCurrentChart"></canvas></div>
      <div class="lc-comparison-slopes">
        <p class="lc-main-slope">Gezeichneter Kreis: <strong id="lcMainSlope"></strong></p>
        <p class="lc-reference-slope">Vergleichskreis: <strong id="lcReferenceSlope"></strong></p>
      </div>
      <p>Die kurzen punktierten Geraden markieren die Anfangstangenten. Größeres L ergibt eine
        flachere Anfangssteigung und einen späteren ersten Stromscheitel.
        Beide Stromkurven verwenden dieselbe Zeit- und Stromachse; sie werden nicht einzeln auf gleiche Höhe skaliert.</p>
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <msub><mrow><mo>(</mo><mfrac><mrow><mi>d</mi><mi>i</mi></mrow><mrow><mi>d</mi><mi>t</mi></mrow></mfrac><mo>)</mo></mrow><mrow><mi>t</mi><mo>=</mo><mn>0</mn></mrow></msub>
        <mo>=</mo><mfrac><msub><mi>U</mi><mn>0</mn></msub><mi>L</mi></mfrac>
      </math>
      <p>Der senkrechte Zeitzeiger zeigt den momentanen Zustand. Beide Diagramme haben dieselbe Zeitachse.
        Die freie Schwingung wird nach dem Umschalten auf den LC-Kreis angezeigt.</p>
    </section>
    <section class="card lc-notes">
      <h2>Was passiert in einer Schwingung?</h2>
      <ol>
        <li>Der geladene Kondensator speichert die Energie im elektrischen Feld. Der Strom ist zunächst null.</li>
        <li>Beim Entladen nimmt das elektrische Feld ab. Der Strom und das Magnetfeld der Spule wachsen.</li>
        <li>Nach einer Viertelperiode ist der Kondensator ungeladen. Stromstärke und magnetische Energie sind maximal.</li>
        <li>Die Spule hält den Strom aufrecht und lädt den Kondensator mit umgekehrter Polarität.
          Nach einer halben Periode steckt die Energie wieder vollständig im elektrischen Feld.</li>
      </ol>
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mi>T</mi><mo>=</mo><mn>2</mn><mi>π</mi><msqrt><mi>L</mi><mi>C</mi></msqrt>
        <mspace width="2em"/><mi>f</mi><mo>=</mo><mfrac><mn>1</mn><mrow><mn>2</mn><mi>π</mi><msqrt><mi>L</mi><mi>C</mi></msqrt></mrow></mfrac>
      </math>
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <msub><mi>W</mi><mi>el</mi></msub><mo>=</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mi>C</mi><msubsup><mi>u</mi><mi>C</mi><mn>2</mn></msubsup>
        <mspace width="2em"/><msub><mi>W</mi><mi>mag</mi></msub><mo>=</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mi>L</mi><msup><mi>i</mi><mn>2</mn></msup>
      </math>
      <p>Größeres L oder C ergibt eine längere Periodendauer. Vierfaches L oder vierfaches C verdoppelt T.
        Die Gesamtenergie bleibt im geschlossenen idealen LC-Kreis konstant: Es gibt keine Dämpfung.</p>
      <p>Vorzeichen: uC und uL werden jeweils von oben nach unten gemessen. Im freien Kreis gilt uC + uL = 0.
        Ein positiver Strom i fließt in technischer Richtung oben vom Kondensator zum Schalter, also rechts nach links.
        Die Elektronen bewegen sich entgegengesetzt.</p>
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <msub><mi>U</mi><mi>ind</mi></msub><mo>=</mo><mo>−</mo><mi>L</mi><mo>·</mo>
        <mfrac><mrow><mi>d</mi><mi>i</mi></mrow><mrow><mi>d</mi><mi>t</mi></mrow></mfrac>
      </math>
      <p>Die Selbstinduktion wirkt der Stromänderung entgegen: Beim Stromanstieg hemmt sie den Anstieg.
        Bei abnehmendem Strom hält sie den bisherigen Strom aufrecht und gibt magnetische Energie ab.
        Die Selbstinduktionsspannung ist bei den Stromextrema null und beim Stromnulldurchgang maximal.
        Mit den gewählten Bezugsrichtungen entspricht Uind dem angezeigten uL.</p>
      <p>Das Laden wird idealisiert: „Kondensator laden“ bereitet sofort einen vollständig auf U₀ geladenen
        Kondensator bei Stromstärke null vor. Der zeitliche Ladevorgang wird nicht berechnet.
        Der Ladewiderstand und die Quelle gehören nur zum Ladezweig; nach dem Umschalten ist dieser Zweig getrennt.
        Im LC-Kreis werden ohmsche Verluste, Strahlung und der Strombedarf der Messgeräte vernachlässigt.
        Die Felddarstellung ist relativ zum jeweiligen Maximalwert skaliert und zeigt keine absoluten E- oder B-Werte.</p>
      <p>Physikalischer Hintergrund: <a href="https://openstax.org/books/university-physics-volume-2/pages/14-5-oscillations-in-an-lc-circuit"
        target="_blank" rel="noopener noreferrer">OpenStax: Schwingungen im LC-Kreis</a>.</p>
    </section>`

  const $ = selector => panel.querySelector(selector)
  const inputs = [...panel.querySelectorAll('input')]
  const toggles = [...panel.querySelectorAll('.lc-toggle')]
  const quarters = [...panel.querySelectorAll('.lc-quarter')]
  const playback = $('#lcPlayback'), defaultPlayback = playback.value
  let properties = null, reference = null, mode = 'uncharged', time = 0, running = false, frame = null
  let lastTimestamp = null, lastNumberTimestamp = null, chartWindow = null

  const fieldArrows = []
  for (let index = 0; index < 5; index++) {
    const x = 770 + index * 25
    const arrow = document.createElementNS(svgNamespace, 'path')
    arrow.setAttribute('d', 'M0 -25 V25 M-5 18 L0 25 L5 18')
    arrow.setAttribute('class', 'lc-electric-arrow')
    $('#lcElectricField').append(arrow)
    fieldArrows.push({ arrow, x })
  }
  const magneticArrows = []
  for (const side of [-1, 1]) {
    for (let index = 0; index < 3; index++) {
      const inner = 820 + side * (8 + index * 5), outer = 820 + side * (55 + index * 15)
      const top = 380 - index * 6, bottom = 500 + index * 6
      const path = document.createElementNS(svgNamespace, 'path')
      path.setAttribute('d', `M${inner} ${bottom} V${top} C${inner} ${top - 25} ${outer} ${top - 25} ${outer} ${top}
        V${bottom} C${outer} ${bottom + 25} ${inner} ${bottom + 25} ${inner} ${bottom} Z`)
      path.setAttribute('class', 'lc-magnetic-line')
      $('#lcMagneticField').append(path)
      const arrow = document.createElementNS(svgNamespace, 'path')
      arrow.setAttribute('d', 'M-5 7 L0 -7 L5 7 Z')
      arrow.setAttribute('class', 'lc-magnetic-arrow')
      $('#lcMagneticField').append(arrow)
      magneticArrows.push({ arrow, x: inner })
    }
  }
  const charges = []
  for (let index = 0; index < 7; index++) {
    for (const upper of [true, false]) {
      const text = document.createElementNS(svgNamespace, 'text')
      text.setAttribute('x', String(760 + index * 20))
      text.setAttribute('y', upper ? '236' : '345')
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('class', 'lc-charge-symbol')
      $('#lcPlateCharges').append(text)
      charges.push({ text, upper })
    }
  }
  const particles = Array.from({ length: 28 }, () => {
    const circle = document.createElementNS(svgNamespace, 'circle')
    circle.setAttribute('class', 'lc-electron')
    circle.setAttribute('r', '4')
    $('#lcElectrons').append(circle)
    return circle
  })

  const cursor = { id: 'lcTimeCursor', afterDraw(chart) {
    const { ctx, chartArea, scales } = chart
    if (!chartArea) return
    const x = scales.x.getPixelForValue(time * 1000)
    if (x < chartArea.left || x > chartArea.right) return
    ctx.save(); ctx.strokeStyle = '#334155'; ctx.setLineDash([5, 4])
    ctx.beginPath(); ctx.moveTo(x, chartArea.top); ctx.lineTo(x, chartArea.bottom); ctx.stroke(); ctx.restore()
  } }
  const initialTangents = { id: 'lcInitialTangents', afterDatasetsDraw(chart) {
    if (!properties || !reference || mode !== 'oscillating' || !chart.chartArea) return
    const { ctx, scales, chartArea } = chart
    const start = scales.x.min
    const duration = reference.period / 12
    ctx.save()
    ctx.beginPath(); ctx.rect(chartArea.left, chartArea.top, chartArea.width, chartArea.height); ctx.clip()
    ctx.font = 'bold 12px sans-serif'
    for (const [index, configuration, color] of [[0, properties, '#2563eb'], [1, reference, '#b45309']]) {
      if (!chart.isDatasetVisible(index)) continue
      const slope = lcSample(0, configuration).currentDerivative
      const x0 = scales.x.getPixelForValue(start), y0 = scales.y.getPixelForValue(0)
      const x1 = scales.x.getPixelForValue(start + duration * 1000)
      const y1 = scales.y.getPixelForValue(slope * duration * 1000)
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2; ctx.setLineDash([2, 3])
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillText(`${number(slope)} A/s`, x1 + 8, y1 - 5)
    }
    ctx.restore()
  } }
  function createChart(canvas, definitions, unit, axisTitle, extraPlugins = []) {
    return new Chart(canvas, {
      type: 'line', plugins: [cursor, ...extraPlugins], data: { datasets: definitions.map(([label, color], index) => ({
        label, borderColor: color, borderDash: index ? [7, 4] : [], data: [], borderWidth: 3, pointRadius: 0, tension: 0 })) },
      options: { responsive: true, maintainAspectRatio: false, animation: false,
        interaction: { mode: 'index', intersect: false },
        scales: { x: { type: 'linear', title: { display: true, text: 'Physikalische Zeit t / ms' } },
          y: { title: { display: true, text: axisTitle }, afterDataLimits(scale) {
            const limit = Math.max(Math.abs(scale.min), Math.abs(scale.max)) || 1
            scale.min = -limit; scale.max = limit
          } } },
        plugins: { tooltip: { callbacks: { label(context) { return `${context.dataset.label}: ${number(context.parsed.y, 4)} ${unit}` } } } }
      }
    })
  }
  const voltageChart = createChart($('#lcVoltageChart'), [['Kondensatorspannung uC', '#ea580c'], ['Spulenspannung uL', '#15803d']], 'V', 'Spannung / V')
  const currentChart = createChart($('#lcCurrentChart'), [['Stromstärke i (L)', '#2563eb'], ['Vergleichsstrom (L/4)', '#b45309']], 'mA', 'Stromstärke / mA', [initialTangents])

  function sampleState(t = time) {
    const sample = lcSample(mode === 'oscillating' ? t : 0, properties)
    if (mode === 'charged') return { ...sample, uL: 0, currentDerivative: 0, inducedVoltage: 0 }
    if (mode === 'uncharged') return { ...sample, uC: 0, uL: 0, charge: 0, current: 0,
      electricEnergy: 0, magneticEnergy: 0, totalEnergy: 0, electricField: 0, magneticField: 0, electronMotion: 0,
      currentDerivative: 0, inducedVoltage: 0 }
    return sample
  }

  function setButtons() {
    toggles.forEach(button => {
      button.disabled = !properties || mode === 'uncharged'
      button.textContent = running ? 'Schwingung anhalten' : mode === 'oscillating' ? 'Schwingung fortsetzen' : 'Schwingkreis schließen & starten'
    })
    quarters.forEach(button => { button.disabled = !properties || mode === 'uncharged' })
    $('#lcCharge').disabled = !properties
  }

  function updateValues(sample) {
    $('#lcTime').textContent = `${number(time * 1000)} ms`
    $('#lcInstantValues').textContent = `uC = ${number(sample.uC)} V · uL = ${number(sample.uL)} V · i = ${number(sample.current * 1000)} mA`
    $('#lcElectricEnergy').textContent = `${number(sample.electricEnergy * 1000)} mJ`
    $('#lcMagneticEnergy').textContent = `${number(sample.magneticEnergy * 1000)} mJ`
    $('#lcTotalEnergy').textContent = `${number(sample.totalEnergy * 1000)} mJ`
    $('#lcInductionValue').textContent = `${number(sample.inducedVoltage)} V`
    $('#lcCurrentChange').textContent = `${number(sample.currentDerivative)} A/s`
  }

  function updateDiagram(updateNumbers = true) {
    if (!properties) return
    const sample = sampleState()
    if (updateNumbers) updateValues(sample)
    const electric = Math.abs(sample.electricField), magnetic = Math.abs(sample.magneticField)
    const induction = Math.abs(sample.inducedVoltage) / properties.voltage
    $('#lcInductionArrow').style.opacity = induction < 1e-5 ? 0 : 0.2 + 0.8 * induction
    $('#lcInductionDirection').setAttribute('transform', `translate(650 445) rotate(${sample.inducedVoltage > 0 ? 180 : 0})`)
    $('#lcInductionDirection').style.strokeWidth = `${2 + 4 * induction}px`
    $('#lcInductionTopPolarity').textContent = sample.inducedVoltage > 0 ? '+' : '−'
    $('#lcInductionBottomPolarity').textContent = sample.inducedVoltage > 0 ? '−' : '+'
    $('#lcInductionHint').textContent = mode !== 'oscillating'
      ? 'Vor dem Schließen des LC-Kreises fließt kein Strom und ändert sich kein Strom: keine Selbstinduktionsspannung.'
      : induction < 1e-5 ? 'Die Stromstärke erreicht gerade ein Extremum. Ihre Änderung ist null: keine Selbstinduktionsspannung, obwohl das Magnetfeld maximal ist.'
      : magnetic < 1e-5 ? 'Die Stromstärke ist gerade null, ändert sich aber am stärksten: Die Selbstinduktionsspannung ist maximal, obwohl das Magnetfeld gerade null ist.'
      : sample.current * sample.currentDerivative > 0
        ? 'Der Betrag der Stromstärke wächst. Die Selbstinduktion wirkt der Stromrichtung entgegen und hemmt den Anstieg; das Magnetfeld baut sich auf.'
        : 'Der Betrag der Stromstärke nimmt ab. Die Selbstinduktion wirkt in der bisherigen Stromrichtung und hält den Strom aufrecht; das Magnetfeld gibt Energie ab.'
    $('#lcElectricField').style.opacity = electric < 1e-5 ? 0 : 0.15 + electric * 0.85
    fieldArrows.forEach(({ arrow, x }) => {
      arrow.setAttribute('transform', `translate(${x} 282.5) rotate(${sample.electricField < 0 ? 180 : 0})`)
      arrow.style.strokeWidth = `${1 + 3 * electric}px`
    })
    $('#lcMagneticField').style.opacity = magnetic < 1e-5 ? 0 : 0.15 + magnetic * 0.85
    $('#lcMagneticField').querySelectorAll('.lc-magnetic-line').forEach(path => { path.style.strokeWidth = `${0.8 + magnetic * 2.5}px` })
    magneticArrows.forEach(({ arrow, x }) => arrow.setAttribute('transform', `translate(${x} 440) rotate(${sample.magneticField < 0 ? 180 : 0})`))
    charges.forEach(({ text, upper }) => {
      const positive = upper ? sample.charge >= 0 : sample.charge < 0
      text.textContent = positive ? '+' : '−'
      text.style.fill = positive ? '#dc2626' : '#2563eb'
      text.style.opacity = electric < 1e-5 ? 0 : 0.2 + 0.8 * electric
    })
    $('#lcTopPolarity').textContent = electric < 1e-5 ? '0' : sample.charge > 0 ? '+' : '−'
    $('#lcBottomPolarity').textContent = electric < 1e-5 ? '0' : sample.charge > 0 ? '−' : '+'
    $('#lcChargeBranch').style.opacity = mode === 'oscillating' ? 0.3 : 1
    $('#lcReturnWire').style.opacity = mode === 'oscillating' ? 1 : 0.3
    $('#lcSwitch').setAttribute('d', mode === 'oscillating' ? 'M520 130 V190' : mode === 'charged' ? 'M520 130 H340' : 'M520 130 L365 105')
    $('#lcElectrons').style.visibility = mode === 'oscillating' ? 'visible' : 'hidden'
    const track = $('#lcMotionTrack'), length = track.getTotalLength()
    particles.forEach((particle, index) => {
      const distance = 40 + index / (particles.length - 1) * (length - 80) + 28 * sample.electronMotion
      const point = track.getPointAtLength(distance)
      particle.setAttribute('cx', point.x); particle.setAttribute('cy', point.y)
    })
    $('#lcElectricBar').style.width = `${100 * sample.electricEnergy / properties.energy}%`
    $('#lcMagneticBar').style.width = `${100 * sample.magneticEnergy / properties.energy}%`
    $('#lcEnergyHint').textContent = mode === 'uncharged' ? 'Noch keine gespeicherte Energie.' : 'Bleibt im idealen LC-Kreis erhalten.'
    const fraction = (sample.phase / (2 * Math.PI) % 1 + 1) % 1
    $('#lcState').textContent = mode === 'uncharged' ? 'Vor dem Laden: Schalter S offen, Kondensator ungeladen, kein Strom, keine Felder.'
      : mode === 'charged' ? 'Ladestellung: Kondensator vollständig geladen, elektrisches Feld maximal, Strom und Magnetfeld null.'
      : running ? 'LC-Kreis geschlossen: Die Quelle ist getrennt, die Schwingung läuft ohne Dämpfung.' : 'LC-Kreis geschlossen: Schwingung angehalten.'
    $('#lcPhaseHint').textContent = mode === 'uncharged' ? 'Lade zuerst den Kondensator und schließe danach den LC-Kreis.'
      : mode === 'charged' ? 'Alle Energie liegt im elektrischen Feld. Mit „Ein Viertel der Periode weiter“ kannst du die Schwingung schrittweise betrachten.'
      : electric > 0.999999 ? 'Kondensator maximal geladen: elektrische Energie maximal, Strom und Magnetfeld null.'
      : magnetic > 0.999999 ? 'Kondensator ungeladen: Stromstärke und magnetische Energie maximal. Der Strom fließt weiter.'
      : fraction < 0.25 || fraction > 0.5 && fraction < 0.75
        ? 'Kondensator entlädt sich: Das elektrische Feld wird schwächer, das Magnetfeld stärker.'
        : 'Der weiterfließende Strom lädt den Kondensator auf: Das Magnetfeld wird schwächer, das elektrische Feld stärker.'
  }

  function updateCharts(force = false) {
    if (!properties) return
    const window = Math.floor(time / (2 * properties.period))
    const key = `${mode}:${window}`
    if (!force && chartWindow === key) { voltageChart.draw(); currentChart.draw(); return }
    chartWindow = key
    const start = window * 2 * properties.period
    voltageChart.data.datasets.forEach(dataset => { dataset.data = [] })
    currentChart.data.datasets.forEach(dataset => { dataset.data = [] })
    for (let index = 0; index <= 400; index++) {
      const t = start + index / 200 * properties.period, sample = sampleState(t), x = t * 1000
      voltageChart.data.datasets[0].data.push({ x, y: sample.uC })
      voltageChart.data.datasets[1].data.push({ x, y: sample.uL })
      currentChart.data.datasets[0].data.push({ x, y: sample.current * 1000 })
      currentChart.data.datasets[1].data.push({ x, y: mode === 'oscillating' ? lcSample(t, reference).current * 1000 : 0 })
    }
    // Eine gemeinsame Skala bleibt auch beim Ausblenden einer Kurve erhalten.
    const currentLimit = Math.max(properties.currentMax, reference.currentMax) * 1000 * 1.15
    currentChart.options.scales.y.min = -currentLimit
    currentChart.options.scales.y.max = currentLimit
    for (const chart of [voltageChart, currentChart]) {
      chart.options.scales.x.min = start * 1000
      chart.options.scales.x.max = (start + 2 * properties.period) * 1000
      chart.update('none')
    }
  }

  function stop() {
    running = false
    if (frame !== null) cancelAnimationFrame(frame)
    frame = null; lastTimestamp = null; lastNumberTimestamp = null
    setButtons(); updateDiagram(); updateCharts()
  }

  function resetToUncharged() {
    mode = 'uncharged'; time = 0; chartWindow = null; stop()
    try {
      if (inputs.some(input => !input.validity.valid)) throw new RangeError('Bitte gültige Werte innerhalb der angegebenen Grenzen eingeben.')
      properties = lcProperties({ inductance: Number($('#lcInductance').value) / 1000,
        capacitance: Number($('#lcCapacitance').value) / 1000000, voltage: Number($('#lcVoltage').value) })
      reference = lcProperties({ ...properties, inductance: properties.inductance / 4 })
      $('#lcValidation').textContent = ''
      $('#lcSvg').classList.remove('lc-invalid')
      $('#lcSourceVoltage').textContent = `U₀ = ${number(properties.voltage)} V`
      $('#lcFrequency').textContent = `${number(properties.frequency)} Hz`
      $('#lcPeriod').textContent = `${number(properties.period * 1000)} ms`
      $('#lcCurrentMax').textContent = `${number(properties.currentMax * 1000)} mA`
      $('#lcMainSlope').textContent = `L = ${number(properties.inductance * 1000)} mH · Anfangssteigung ${number(lcSample(0, properties).currentDerivative)} A/s`
      $('#lcReferenceSlope').textContent = `L/4 = ${number(reference.inductance * 1000)} mH · Anfangssteigung ${number(lcSample(0, reference).currentDerivative)} A/s`
      currentChart.data.datasets[0].label = `Stromstärke i · L = ${number(properties.inductance * 1000)} mH`
      currentChart.data.datasets[1].label = `Vergleichsstrom · L = ${number(reference.inductance * 1000)} mH`
      updateDiagram(); updateCharts(true)
    } catch (error) {
      properties = null
      reference = null
      $('#lcValidation').textContent = error.message
      $('#lcSvg').classList.add('lc-invalid')
      $('#lcState').textContent = 'Bitte die Einstellungen korrigieren; die Zeichnung zeigt noch den zuletzt gültigen Zustand.'
      for (const id of ['Frequency', 'Period', 'CurrentMax', 'ElectricEnergy', 'MagneticEnergy', 'TotalEnergy', 'InductionValue', 'CurrentChange', 'MainSlope', 'ReferenceSlope']) $(`#lc${id}`).textContent = '—'
      voltageChart.data.datasets.forEach(dataset => { dataset.data = [] })
      currentChart.data.datasets.forEach(dataset => { dataset.data = [] })
      voltageChart.update('none'); currentChart.update('none')
    }
    setButtons()
  }

  function animate(timestamp) {
    if (!running) return
    if (lastTimestamp !== null) time += Math.min((timestamp - lastTimestamp) / 1000, 0.1) * Number(playback.value)
    lastTimestamp = timestamp
    const updateNumbers = lastNumberTimestamp === null || timestamp - lastNumberTimestamp >= 500
    updateDiagram(updateNumbers)
    if (updateNumbers) lastNumberTimestamp = timestamp
    updateCharts()
    frame = requestAnimationFrame(animate)
  }
  $('#lcCharge').addEventListener('click', () => {
    if (!properties) return
    mode = 'charged'; time = 0; chartWindow = null; stop()
  })
  toggles.forEach(button => button.addEventListener('click', () => {
    if (running) { stop(); return }
    if (!properties || mode === 'uncharged') return
    mode = 'oscillating'; running = true; lastTimestamp = null; lastNumberTimestamp = null
    setButtons(); updateDiagram(); updateCharts()
    frame = requestAnimationFrame(animate)
  }))
  quarters.forEach(button => button.addEventListener('click', () => {
    if (!properties || mode === 'uncharged') return
    mode = 'oscillating'
    time = (Math.floor(time / properties.period * 4 + 1e-9) + 1) * properties.period / 4
    stop()
  }))
  inputs.forEach(input => input.addEventListener('input', resetToUncharged))
  playback.addEventListener('change', () => { lastTimestamp = null })
  $('#lcReset').addEventListener('click', () => {
    inputs.forEach(input => { input.value = input.defaultValue })
    playback.value = defaultPlayback
    resetToUncharged()
  })
  resetToUncharged()
  return { stop, resize() { voltageChart.resize(); currentChart.resize(); updateDiagram(); updateCharts() } }
}
