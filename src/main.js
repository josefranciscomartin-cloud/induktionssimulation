import './style.css'
import Chart from 'chart.js/auto'

document.querySelector('#app').innerHTML = `
  <div class="app">
    <header class="header">
      <h1>Induktionssimulation</h1>
      <p>Simulation elektromagnetischer Induktion</p>
    </header>

    <main class="main">
      <section class="card">
        <h2>Einstellungen</h2>

        <label>
          Frequenz:
          <input id="frequenz" type="number" value="1" min="0.1" step="0.1" required>
          Hz
        </label>

        <div class="coil-settings">
          <section class="coil-settings-column">
            <h3>Feldspule</h3>

            <label>
              Stromverlauf:
              <select id="stromverlauf" aria-describedby="waveformHint">
                <option value="sine">Sinus</option>
                <option value="triangle">Dreieck</option>
                <option value="square">Rechteck</option>
              </select>
            </label>
            <p id="waveformHint">Sinusstrom: Die Induktionsspannung ist gegenüber dem Strom um eine Viertelperiode verschoben.</p>

            <label>
              Windungszahl N₁:
              <input id="feldwindungszahl" type="number" value="100" min="1" step="1" required>
            </label>

            <label>
              Spulenfläche A₁:
              <input id="feldspulenflaeche" type="number" value="0.01" min="0" step="any" required>
              m²
            </label>

            <label>
              Stromamplitude I<sub>max</sub>:
              <input id="stromstaerke" type="number" value="0.1" min="0" step="any" required>
              A
            </label>

            <label>
              Spulenlänge l:
              <input id="spulenlaenge" type="number" value="0.2" min="0.001" step="any" required>
              m
            </label>

            <p>Luftspule ohne Eisenkern (μᵣ ≈ 1).</p>
          </section>
          <section class="coil-settings-column">
            <h3>Induktionsspule</h3>

            <label>
              Windungszahl N₂:
              <input id="windungszahl" type="number" value="100" min="1" step="1" required>
            </label>

            <label>
              Spulenfläche A₂:
              <input id="spulenflaeche" type="number" value="0.01" min="0" step="any" required>
              m²
            </label>
            <label>
              <input id="secondaryClosed" type="checkbox" checked>
              Stromkreis der Induktionsspule schließen
            </label>
            <label>
              Lastwiderstand R:
              <input id="lastwiderstand" type="number" value="100" min="1" step="any" required>
              Ω
            </label>
            <p>Vereinfachtes Widerstandsmodell: I₂ = U_ind / R.
              Selbstinduktion der Induktionsspule und ihre Rückwirkung auf die Feldspule
              werden vernachlässigt. Bei offenem Stromkreis ist I₂ = 0.</p>
          </section>
        </div>

        <button id="startButton">Simulation starten</button>
      </section>

      <section class="card">
        <h2>Versuchsaufbau</h2>

        <div id="simulation">
          <svg id="experiment" viewBox="0 -245 1000 805" xmlns="http://www.w3.org/2000/svg"
            role="img" aria-labelledby="experimentTitle experimentDescription">
            <title id="experimentTitle">Induktionsspule innerhalb einer Feldspule am Funktionsgenerator</title>
            <desc id="experimentDescription">Die schwarze Feldspule umschließt die blaue Induktionsspule.
              Ein Funktionsgenerator treibt den Feldspulenstrom. Das Messgerät zeigt Strom und Induktionsspannung.</desc>

            <!-- Dieselbe Induktionsspule, separat zur Darstellung ihres eigenen Feldes. -->
            <g transform="translate(0 -235)">
              <rect x="55" y="10" width="890" height="215" rx="10" class="secondary-panel"/>
              <text x="80" y="40" class="svg-title">B-Feld der Induktionsspule · separate Ansicht</text>
              <path d="M155 90 H85 V195 H235 M285 195 H360 M405 195 H445 V156 H355" class="induction-wire"/>
              <rect x="235" y="187" width="50" height="16" class="load-resistor"/>
              <path id="secondarySwitch" d="M360 195 H405" class="induction-wire"/>
              <circle cx="360" cy="195" r="3" class="induction-terminal"/>
              <circle cx="405" cy="195" r="3" class="induction-terminal"/>
              <g class="secondary-coil">${createCoil(155, 90, 11, 20, 66)}</g>
              <g id="secondaryMagneticField" visibility="hidden">
                <text id="secondaryLeftPole" x="120" y="93" text-anchor="middle" class="magnetic-pole">N</text>
                <text id="secondaryRightPole" x="400" y="93" text-anchor="middle" class="magnetic-pole">S</text>
                <g id="secondaryFieldLines">
                  <line x1="200" y1="65" x2="330" y2="65" class="secondary-field-line"/>
                  <polygon points="330,65 315,58 315,72" class="secondary-field-arrow"/>
                  <path d="M120 113 H400 C455 66 65 66 120 113" class="secondary-field-line"/>
                  <path d="M120 133 H400 C455 180 65 180 120 133" class="secondary-field-line"/>
                  <polygon points="300,113 290,108 290,118" class="secondary-field-arrow"/>
                  <polygon points="300,133 290,128 290,138" class="secondary-field-arrow"/>
                </g>
              </g>
              <text id="secondaryCircuitState" x="500" y="87" class="svg-label">Stromkreis geschlossen · R = 100 Ω</text>
              <text id="secondaryCurrent" x="500" y="122" class="digital-value">I₂ = 0.00 µA</text>
              <text id="secondaryFieldState" x="500" y="155" class="svg-label">Simulation starten</text>
              <text x="500" y="190" class="coil-parameters">Feldlinien schematisch, keine gemeinsame Stärkeskala.</text>
            </g>

            <!-- Funktionsgenerator, räumliches Gehäuse -->
            <path d="M620 80 L650 45 H950 L920 80 Z" class="device-top"/>
            <path d="M920 80 L950 45 V480 L920 515 Z" class="device-side"/>
            <rect x="620" y="80" width="300" height="435" rx="3" class="device-face"/>
            <rect x="634" y="96" width="272" height="46" rx="4" class="device-heading"/>
            <text x="770" y="126" text-anchor="middle" class="svg-title">Funktionsgenerator</text>
            <text x="645" y="177" class="svg-label">Frequenz f</text>
            <rect x="645" y="189" width="250" height="42" rx="4" class="digital-display"/>
            <text id="generatorFrequency" x="878" y="218" text-anchor="end" class="digital-value">1 Hz</text>
            <text x="645" y="260" class="svg-label">Stromamplitude Iₘₐₓ</text>
            <rect x="645" y="272" width="250" height="42" rx="4" class="digital-display"/>
            <text id="generatorAmplitude" x="878" y="301" text-anchor="end" class="digital-value">0.1 A</text>
            <text x="645" y="345" class="svg-label">Stromverlauf</text>
            <rect x="645" y="357" width="250" height="38" rx="4" class="waveform-display"/>
            <text id="generatorWaveform" x="770" y="382" text-anchor="middle" class="svg-value">Sinus</text>
            <text x="655" y="426" class="svg-label">U(t)</text>
            <text id="sourceVoltage" x="878" y="426" text-anchor="end" class="svg-value">0.00 V</text>
            <circle id="generatorStatusLight" cx="660" cy="480" r="7" fill="#94a3b8"/>
            <text id="generatorStatus" x="680" y="486" class="svg-label">Aus</text>

            <!-- Feldspulenstromkreis: Generator → Spule → Strommessung → Generator -->
            <path d="M430 260 V320 H570 V420 H620" class="wire"/>
            <path d="M100 120 H60 V423 H90" class="wire"/>
            <path d="M90 460 H45 V535 H585 V450 H620" class="wire"/>
            <circle cx="620" cy="420" r="6" class="terminal"/>
            <circle cx="620" cy="450" r="6" class="terminal"/>

            <!-- Große äußere Feldspule und kleine innere Induktionsspule -->
            <g id="fieldCoil">${createCoil(100, 120, 12, 30, 140)}</g>
            <g id="inductionCoil">${createCoil(210, 163, 11, 11, 54)}</g>

            <!-- Separate blaue Messleitungen von der inneren Spule -->
            <path d="M210 163 H190 V238 H475 V420 H380" class="induction-wire"/>
            <path d="M320 217 H490 V457 H380" class="induction-wire"/>

            <defs>
              <marker id="fieldArrowhead" viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 Z" class="field-arrow"/>
              </marker>
            </defs>
            <g id="magneticField" visibility="hidden">
              <text x="265" y="66" text-anchor="middle" class="field-caption">B-Feld der Feldspule</text>
              <text id="leftMagneticPole" x="145" y="104" text-anchor="middle" class="magnetic-pole">S</text>
              <text id="rightMagneticPole" x="385" y="104" text-anchor="middle" class="magnetic-pole">N</text>
              <!-- Nur die Geometrie spiegeln: Die Polbeschriftungen bleiben lesbar. -->
              <g id="magneticFieldLines">
                <line x1="185" y1="96" x2="345" y2="96" class="field-direction"/>
                <polygon points="345,96 330,89 330,103" class="field-arrow"/>
                <!-- Ausschnitte an den Spulenenden; die Mitte bleibt frei. -->
                <path d="M78 134 Q114 157 145 160 L180 160" class="field-line"/>
                <path d="M78 170 Q116 178 145 180 L180 180" class="field-line"/>
                <path d="M78 210 Q116 202 145 200 L180 200" class="field-line"/>
                <path d="M78 246 Q114 223 145 220 L180 220" class="field-line"/>
                <path d="M350 160 L385 160 Q416 157 452 134" class="field-line"/>
                <path d="M350 180 L385 180 Q414 178 452 170" class="field-line"/>
                <path d="M350 200 L385 200 Q414 202 452 210" class="field-line"/>
                <path d="M350 220 L385 220 Q416 223 452 246" class="field-line"/>
              </g>
            </g>
            <text x="100" y="295" class="svg-title">Feldspule</text>
            <text id="fieldCoilParameters" x="100" y="320" class="coil-parameters"/>
            <text x="255" y="350" text-anchor="middle" class="svg-title induction-text">Induktionsspule (innen)</text>
            <text id="inductionCoilParameters" x="255" y="372" text-anchor="middle" class="coil-parameters induction-text"/>

            <!-- Gemeinsames Messgerät mit getrennten Strom- und Spannungseingängen -->
            <path d="M90 400 L103 387 H393 L380 400 Z" class="device-top"/>
            <path d="M380 400 L393 387 V487 L380 500 Z" class="device-side"/>
            <rect x="90" y="400" width="290" height="100" rx="3" class="device-face"/>
            <text x="112" y="424" class="svg-label">Strom I(t)</text>
            <text x="250" y="424" class="svg-label induction-text">U_ind(t)</text>
            <rect x="107" y="438" width="120" height="42" rx="4" class="digital-display"/>
            <rect x="243" y="438" width="120" height="42" rx="4" class="voltage-display"/>
            <text id="fieldCurrent" x="167" y="465" text-anchor="middle" class="meter-value">0.00 A</text>
            <text id="inducedVoltage" x="303" y="465" text-anchor="middle" class="meter-value induction-text">0.00 V</text>
            <circle cx="90" cy="423" r="4" class="terminal"/>
            <circle cx="90" cy="460" r="4" class="terminal"/>
            <circle cx="380" cy="420" r="4" class="induction-terminal"/>
            <circle cx="380" cy="457" r="4" class="induction-terminal"/>
          </svg>
        </div>
        <p class="field-explanation">Die grünen Linien zeigen Ausschnitte des B-Felds an den Spulenenden.
          Im Inneren verläuft es von S nach N; außen schließen sich die Feldlinien von N nach S.
          Die Mitte und die äußeren Rückwege sind zur Übersicht ausgespart.
          Bei umgekehrtem Strom tauschen Nord- und Südpol die Seiten; bei I = 0 verschwindet das Feld.</p>
        <p class="field-explanation">Die separate Ansicht darüber zeigt dieselbe Induktionsspule
          mit ihrem eigenen, orange dargestellten B-Feld. Dieses entsteht nur bei geschlossenem Stromkreis
          durch den Induktionsstrom und wirkt der Änderung des Feldspulenfelds entgegen (Lenzsche Regel).
          Bei abnehmendem Feld können beide Felder in dieselbe Richtung zeigen.</p>
      </section>

      <section class="card">
        <h2>Diagramme</h2>
        <label>
          <input id="showSourceVoltage" type="checkbox" checked>
          Quellspannung anzeigen
        </label>
        <div class="chart-container">
          <canvas id="voltageChart"></canvas>
        </div>
      </section>

      <section class="card">
        <h2>Magnetfeld</h2>

        <label>
          Magnetische Flussdichte B<sub>max</sub> (berechneter Scheitelwert):
          <output id="magnetfeldstaerke"></output>
          T
        </label>
      </section>

      <section class="card">
        <h2>Induktion durch Magnetfeldänderung</h2>
        <p>Eine Induktionsspule mit n<sub>Induktionsspule</sub> Windungen und der
          Querschnittsfläche A<sub>Induktionsspule</sub> befindet sich in einem
          zeitlich veränderlichen Magnetfeld mit der Flussdichte B.</p>
        <div class="model-formulas">
          <div class="model-formula">
            <span>Bei linearer Änderung des Magnetfelds</span>
            <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
              <msub><mi>U</mi><mtext>ind</mtext></msub><mo>=</mo><mo>−</mo><msub><mi>n</mi><mtext>Induktionsspule</mtext></msub><mo>·</mo><msub><mi>A</mi><mtext>Induktionsspule</mtext></msub><mo>·</mo><mfrac><mrow><mi>Δ</mi><mi>B</mi></mrow><mrow><mi>Δ</mi><mi>t</mi></mrow></mfrac>
            </math>
          </div>
          <div class="model-formula">
            <span>Allgemein mit der zeitlichen Ableitung</span>
            <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
              <msub><mi>U</mi><mtext>ind</mtext></msub><mo>=</mo><mo>−</mo><msub><mi>n</mi><mtext>Induktionsspule</mtext></msub><mo>·</mo><msub><mi>A</mi><mtext>Induktionsspule</mtext></msub><mo>·</mo><mover accent="true"><mi>B</mi><mo>˙</mo></mover>
            </math>
          </div>
        </div>
        <p>Der Differenzenquotient ΔB/Δt beschreibt die mittlere Änderung der Flussdichte.
          Bei linearer Änderung ist er gleich der zeitlichen Ableitung.
          Der Punkt über B bezeichnet diese Ableitung nach der Zeit.</p>
      </section>

      <section class="card">
        <h2>Induktion durch eine äußere, mit Strom durchflossene Feldspule</h2>
        <p>Ein zeitlich veränderlicher Strom I(t) durch die Feldspule erzeugt ein
          zeitlich veränderliches Magnetfeld B(t). Dabei ist l<sub>Feldspule</sub>
          die Länge der Feldspule und μ₀ die magnetische Feldkonstante.</p>
        <div class="model-formulas">
          <div class="model-formula">
            <span>Magnetfeld der Feldspule</span>
            <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
              <mi>B</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo><mfrac><mrow><msub><mi>μ</mi><mn>0</mn></msub><mo>·</mo><msub><mi>n</mi><mtext>Feldspule</mtext></msub></mrow><mrow><msub><mi>l</mi><mtext>Feldspule</mtext></msub></mrow></mfrac><mo>·</mo><mi>I</mi><mo>(</mo><mi>t</mi><mo>)</mo>
            </math>
          </div>
          <div class="model-formula">
            <span>Magnetische Feldkonstante (Näherungswert)</span>
            <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
              <msub><mi>μ</mi><mn>0</mn></msub><mo>≈</mo><mn>4</mn><mo>·</mo><mi>π</mi><mo>·</mo><msup><mn>10</mn><mrow><mo>−</mo><mn>7</mn></mrow></msup><mo>·</mo><mfrac><mrow><mi mathvariant="normal">V</mi><mo>·</mo><mi mathvariant="normal">s</mi></mrow><mrow><mi mathvariant="normal">A</mi><mo>·</mo><mi mathvariant="normal">m</mi></mrow></mfrac>
            </math>
          </div>
          <div class="model-formula">
            <span>Induktionsspannung bei linearer Änderung des Stroms</span>
            <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
              <msub><mi>U</mi><mtext>ind</mtext></msub><mo>=</mo><mo>−</mo><msub><mi>n</mi><mtext>Induktionsspule</mtext></msub><mo>·</mo><msub><mi>A</mi><mtext>Induktionsspule</mtext></msub><mo>·</mo><mfrac><mrow><msub><mi>μ</mi><mn>0</mn></msub><mo>·</mo><msub><mi>n</mi><mtext>Feldspule</mtext></msub></mrow><mrow><msub><mi>l</mi><mtext>Feldspule</mtext></msub></mrow></mfrac><mo>·</mo><mfrac><mrow><mi>Δ</mi><mi>I</mi></mrow><mrow><mi>Δ</mi><mi>t</mi></mrow></mfrac>
            </math>
          </div>
          <div class="model-formula">
            <span>Induktionsspannung mit der zeitlichen Ableitung</span>
            <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
              <msub><mi>U</mi><mtext>ind</mtext></msub><mo>=</mo><mo>−</mo><msub><mi>n</mi><mtext>Induktionsspule</mtext></msub><mo>·</mo><msub><mi>A</mi><mtext>Induktionsspule</mtext></msub><mo>·</mo><mfrac><mrow><msub><mi>μ</mi><mn>0</mn></msub><mo>·</mo><msub><mi>n</mi><mtext>Feldspule</mtext></msub></mrow><mrow><msub><mi>l</mi><mtext>Feldspule</mtext></msub></mrow></mfrac><mo>·</mo><mover accent="true"><mi>I</mi><mo>˙</mo></mover>
            </math>
          </div>
        </div>
        <p>Für beliebige Stromverläufe wird der Differenzenquotient ΔI/Δt durch
          die zeitliche Ableitung ersetzt. Der Punkt über I bezeichnet die Ableitung
          der Stromstärke nach der Zeit.</p>
        <p>Zuordnung zu den Eingaben: n<sub>Induktionsspule</sub> = N₂,
          A<sub>Induktionsspule</sub> = A₂, n<sub>Feldspule</sub> = N₁ und
          l<sub>Feldspule</sub> = l.
          Die Feldspulenformeln aus der Vorlage gelten für μᵣ = 1 und eine vollständig
          vom Feld durchsetzte Induktionsspulenfläche. Die Simulation berücksichtigt
          eine Luftspule mit μᵣ ≈ 1 und verwendet bei kleinerer Feldspulenfläche
          die wirksame Fläche min(A₁, A₂).</p>
        <p>Idealisierte lange Feldspule ohne Eisenkern,
          konzentrische Spulen und homogenes Feld senkrecht zu den Spulenflächen.
          Außerhalb der Feldspulenfläche wird das Feld vernachlässigt.
          Die Quellspannung wird ohne Wicklungswiderstand und ohne Rückwirkung des Induktionsstroms berechnet.
          Die SVG-Zeichnung ist schematisch.</p>
      </section>
    </main>
  </div>
`
const chartCanvas = document.querySelector('#voltageChart')
const showSourceVoltage = document.querySelector('#showSourceVoltage')

const voltageChart = new Chart(chartCanvas, {
  type: 'line',

  data: {
    labels: [],

    datasets: [
      {
        label: 'Quellspannung U(t)',
        yAxisID: 'y',
        data: [],
        borderWidth: 2,
        pointRadius: 0,
        tension: 0
      },
      {
        label: 'Induktionsspannung Uind(t)',
        yAxisID: 'y',
        data: [],
        borderWidth: 2,
        pointRadius: 0,
        tension: 0
      },
      {
        label: 'Feldspulenstrom I(t)',
        yAxisID: 'current',
        data: [],
        borderWidth: 2,
        borderDash: [6, 3],
        pointRadius: 0,
        tension: 0
      }
    ]
  },

  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,

    plugins: {
      legend: {
        onClick(event, legendItem, legend) {
          const chart = legend.chart
          const index = legendItem.datasetIndex
          chart.setDatasetVisibility(index, !chart.isDatasetVisible(index))
          showSourceVoltage.checked = chart.isDatasetVisible(0)
          chart.update()
        }
      },
      tooltip: {
        callbacks: {
          label(context) {
            const unit = context.dataset.yAxisID === 'current' ? 'A' : 'V'
            return `${context.dataset.label}: ${context.formattedValue} ${unit}`
          }
        }
      }
    },

    scales: {
      x: {
        type: 'linear',
        title: {
          display: true,
          text: 'Zeit t in s'
        }
      },

      y: {
        position: 'left',
        afterDataLimits: centerAxisOnZero,
        title: {
          display: true,
          text: 'Spannung U in V'
        }
      },

      current: {
        type: 'linear',
        position: 'right',
        afterDataLimits: centerAxisOnZero,
        grid: {
          drawOnChartArea: false
        },
        title: {
          display: true,
          text: 'Stromstärke I in A'
        }
      }
    }
  }
})

showSourceVoltage.addEventListener('change', () => {
  voltageChart.setDatasetVisibility(0, showSourceVoltage.checked)
  voltageChart.update()
})

function centerAxisOnZero(scale) {
  // Gemeinsame Nulllinie für den Phasenvergleich trotz unterschiedlicher Einheiten.
  const limit = Math.max(Math.abs(scale.min), Math.abs(scale.max)) || 1
  scale.min = -limit
  scale.max = limit
}

function createCoil(startX, startY, turns, spacing, height) {
  let coil = ''

  for (let i = 0; i < turns; i++) {
    const x = startX + i * spacing

    coil += `
      <ellipse
        cx="${x}"
        cy="${startY + height / 2}"
        rx="${height * 0.18}"
        ry="${height / 2}"
        class="coil-turn"
      />
    `
  }

  return coil
}

let animationId = null
let startTime = null
let running = false

const startButton = document.querySelector('#startButton')
const sourceVoltageText = document.querySelector('#sourceVoltage')
const inducedVoltageText = document.querySelector('#inducedVoltage')
const magneticField = document.querySelector('#magneticField')
const parameterInputs = document.querySelectorAll('.card input[type="number"]')
const waveformSelect = document.querySelector('#stromverlauf')
const secondaryClosed = document.querySelector('#secondaryClosed')
const loadResistance = document.querySelector('#lastwiderstand')
let lastSecondarySample = null

secondaryClosed.addEventListener('change', () => {
  loadResistance.disabled = !secondaryClosed.checked
  updateSecondaryField(lastSecondarySample)
})

function calculateSecondaryCurrent(inducedVoltage, resistance, closed) {
  return closed && Number.isFinite(resistance) && resistance > 0 ? inducedVoltage / resistance : 0
}

function updateSecondaryField(sample) {
  const closed = secondaryClosed.checked
  const valid = loadResistance.validity.valid
  const resistance = Number(loadResistance.value)
  const secondaryCurrent = sample && valid
    ? calculateSecondaryCurrent(sample.inducedVoltage, resistance, closed)
    : 0
  const hasField = Math.abs(secondaryCurrent) > 1e-12
  document.querySelector('#secondarySwitch').setAttribute('d', closed ? 'M360 195 H405' : 'M360 195 L400 177')
  document.querySelector('#secondaryCircuitState').textContent = closed
    ? `Stromkreis geschlossen · R = ${loadResistance.value} Ω`
    : 'Stromkreis offen'
  const currentUnit = Math.abs(secondaryCurrent) >= 0.001 ? 'mA' : 'µA'
  const currentScale = currentUnit === 'mA' ? 1000 : 1e6
  document.querySelector('#secondaryCurrent').textContent = `I₂ = ${(secondaryCurrent * currentScale).toFixed(2)} ${currentUnit}`
  document.querySelector('#secondaryMagneticField').style.visibility = hasField ? 'visible' : 'hidden'
  document.querySelector('#secondaryFieldLines').setAttribute('transform',
    secondaryCurrent >= 0 ? 'translate(0 0)' : 'translate(520 0) scale(-1 1)')
  document.querySelector('#secondaryFieldLines').style.opacity =
    0.3 + 0.7 * Math.min(Math.abs(secondaryCurrent) / 1e-5, 1)
  const left = document.querySelector('#secondaryLeftPole')
  const right = document.querySelector('#secondaryRightPole')
  left.textContent = secondaryCurrent >= 0 ? 'S' : 'N'
  right.textContent = secondaryCurrent >= 0 ? 'N' : 'S'
  left.setAttribute('fill', secondaryCurrent >= 0 ? '#0369a1' : '#be123c')
  right.setAttribute('fill', secondaryCurrent >= 0 ? '#be123c' : '#0369a1')
  document.querySelector('#secondaryFieldState').textContent = !closed
    ? 'Kein Induktionsstrom → kein eigenes B-Feld'
    : !valid ? 'Bitte gültigen Lastwiderstand eingeben'
      : !sample ? 'Simulation starten'
        : !hasField ? 'Momentan kein eigenes B-Feld'
          : secondaryCurrent > 0 ? 'Eigenes B-Feld nach rechts →' : 'Eigenes B-Feld nach links ←'
}

function updateGenerator() {
  document.querySelector('#generatorFrequency').textContent = `${document.querySelector('#frequenz').value} Hz`
  document.querySelector('#generatorAmplitude').textContent = `${document.querySelector('#stromstaerke').value} A`
  document.querySelector('#generatorWaveform').textContent =
    { sine: 'Sinus', triangle: 'Dreieck', square: 'Rechteck' }[waveformSelect.value]
  document.querySelector('#generatorStatus').textContent = running ? 'Ein' : 'Aus / pausiert'
  document.querySelector('#generatorStatusLight').setAttribute('fill', running ? '#16a34a' : '#94a3b8')
}

function formatVoltage(value) {
  // Ohne Eisenkern liegen die Spannungen häufig im Millivoltbereich.
  if (value !== 0 && Math.abs(value) < 1) return `${(value * 1000).toFixed(2)} mV`
  return `${value.toFixed(2)} V`
}

waveformSelect.addEventListener('change', () => {
  const hints = {
    sine: 'Sinusstrom: Die Induktionsspannung ist gegenüber dem Strom um eine Viertelperiode verschoben.',
    triangle: 'Dreieckstrom: Auf den geraden Rampen ist die Induktionsspannung konstant. An den Umkehrpunkten wechselt ihr Vorzeichen.',
    square: 'Rechteckstrom: Auf den Plateaus ist die Induktionsspannung null; an den Flanken entstehen Spannungspulse. Ideale Sprünge hätten unendlich hohe, unendlich kurze Spannungsspitzen. Hier dauert jede lineare Flanke 5 % einer Periode.'
  }
  document.querySelector('#waveformHint').textContent = hints[waveformSelect.value]
  // Ein neuer Verlauf beginnt bei t = 0, ohne alte Kurvenformen zu verbinden.
  const wasRunning = running
  stopSimulation()
  resetChart()
  sourceVoltageText.textContent = '0.00 V'
  inducedVoltageText.textContent = '0.00 V'
  document.querySelector('#fieldCurrent').textContent = '0.00 A'
  magneticField.style.visibility = 'hidden'
  lastSecondarySample = null
  updateSecondaryField(null)
  if (wasRunning) startSimulation()
})

function evaluateWaveform(time, frequency, waveform) {
  const phase = ((time * frequency) % 1 + 1) % 1
  if (waveform === 'triangle') {
    if (phase < 0.25) return { value: 4 * phase, derivative: 4 * frequency }
    if (phase < 0.75) return { value: 2 - 4 * phase, derivative: -4 * frequency }
    return { value: 4 * phase - 4, derivative: 4 * frequency }
  }
  if (waveform === 'square') {
    // Lineare Flanken von jeweils 0.05 T; eine steigende Flanke liegt um t = 0.
    const halfEdge = 0.025
    if (phase < halfEdge) return { value: phase / halfEdge, derivative: frequency / halfEdge }
    if (phase < 0.5 - halfEdge) return { value: 1, derivative: 0 }
    if (phase < 0.5 + halfEdge) return { value: (0.5 - phase) / halfEdge, derivative: -frequency / halfEdge }
    if (phase < 1 - halfEdge) return { value: -1, derivative: 0 }
    return { value: (phase - 1) / halfEdge, derivative: frequency / halfEdge }
  }
  const omega = 2 * Math.PI * frequency
  return { value: Math.sin(2 * Math.PI * phase), derivative: omega * Math.cos(2 * Math.PI * phase) }
}

function calculateValues(time, frequency, waveform, field, turns, area) {
  const signal = evaluateWaveform(time, frequency, waveform)
  const fieldDerivative = field.amplitude * signal.derivative
  return {
    fieldCurrent: field.currentAmplitude * signal.value,
    magneticFieldValue: field.amplitude * signal.value,
    sourceVoltage: field.turns * field.area * fieldDerivative,
    // Faraday: U_ind = -N₂ * A_eff * dB/dt.
    inducedVoltage: -turns * Math.min(field.area, area) * fieldDerivative
  }
}

function getFieldParameters() {
  const turns = Number(document.querySelector('#feldwindungszahl').value)
  const area = Number(document.querySelector('#feldspulenflaeche').value)
  const currentAmplitude = Number(document.querySelector('#stromstaerke').value)
  const length = Number(document.querySelector('#spulenlaenge').value)
  const mu0 = 4 * Math.PI * 1e-7 // Näherung in H/m.
  const amplitude = mu0 * turns * currentAmplitude / length
  return { turns, area, amplitude, currentAmplitude }
}

function updateCoilLabels() {
  updateGenerator()
  updateSecondaryField(lastSecondarySample)
  for (const [labelId, turnsId, areaId, index] of [
    ['fieldCoilParameters', 'feldwindungszahl', 'feldspulenflaeche', '₁'],
    ['inductionCoilParameters', 'windungszahl', 'spulenflaeche', '₂']
  ]) {
    const turns = document.getElementById(turnsId)
    const area = document.getElementById(areaId)
    if (turns.validity.valid && area.validity.valid) {
      document.getElementById(labelId).textContent =
        `N${index} = ${turns.value} · A${index} = ${area.value} m²`
    }
  }
  document.querySelector('#magnetfeldstaerke').textContent =
    [...parameterInputs].every(input => input.validity.valid)
      ? getFieldParameters().amplitude.toPrecision(4)
      : '—'
}

parameterInputs.forEach(input => input.addEventListener('input', updateCoilLabels))
updateCoilLabels()

function validateParameters() {
  for (const input of parameterInputs) {
    if (!input.reportValidity()) {
      return false
    }
  }
  return true
}

startButton.addEventListener('click', () => {
  if (!running) {
    startSimulation()
  } else {
    stopSimulation()
  }
})

function startSimulation() {
  if (!validateParameters()) {
    return
  }

  running = true
  startTime = performance.now()
  resetChart()
  lastSecondarySample = null
  updateSecondaryField(null)

  startButton.textContent = 'Simulation stoppen'
  updateGenerator()

  animationId = requestAnimationFrame(animate)
}

function stopSimulation() {
  running = false

  if (animationId !== null) {
    cancelAnimationFrame(animationId)
  }

  startButton.textContent = 'Simulation starten'
  updateGenerator()
}

function animate(currentTime) {
  if (!running) {
    return
  }

  if (!validateParameters()) {
    stopSimulation()
    return
  }

  const frequenz = Number(document.querySelector('#frequenz').value)
  const turns = Number(document.querySelector('#windungszahl').value)
  const area = Number(document.querySelector('#spulenflaeche').value)
  const field = getFieldParameters()
  const fieldAmplitude = field.amplitude
  const waveform = waveformSelect.value

  const elapsedSeconds = (currentTime - startTime) / 1000

  const sampleAt = time => calculateValues(time, frequenz, waveform, field, turns, area)
  const { magneticFieldValue, sourceVoltage, inducedVoltage, fieldCurrent } = sampleAt(elapsedSeconds)
  lastSecondarySample = { inducedVoltage }
  updateSecondaryField(lastSecondarySample)

  sourceVoltageText.textContent =
    formatVoltage(sourceVoltage)

  inducedVoltageText.textContent =
    formatVoltage(inducedVoltage)

  document.querySelector('#fieldCurrent').textContent = `${fieldCurrent.toFixed(3)} A`

  updateMagneticField(fieldAmplitude > 0 && field.area > 0 ? magneticFieldValue / fieldAmplitude : 0)
  
  updateChart(elapsedSeconds, frequenz, sampleAt)

  animationId = requestAnimationFrame(animate)
}

function updateMagneticField(value) {
  const strength = Math.abs(value)
  magneticField.style.visibility = strength > 1e-6 ? 'visible' : 'hidden'
  document.querySelector('#magneticFieldLines').style.opacity = 0.3 + Math.min(strength, 1) * 0.7
  document.querySelector('#magneticFieldLines').setAttribute(
    'transform', value >= 0 ? 'translate(0 0)' : 'translate(530 0) scale(-1 1)'
  )
  const leftPole = document.querySelector('#leftMagneticPole')
  const rightPole = document.querySelector('#rightMagneticPole')
  leftPole.textContent = value >= 0 ? 'S' : 'N'
  rightPole.textContent = value >= 0 ? 'N' : 'S'
  leftPole.setAttribute('fill', value >= 0 ? '#0369a1' : '#be123c')
  rightPole.setAttribute('fill', value >= 0 ? '#be123c' : '#0369a1')
}

let lastChartUpdate = 0
let nextChartTime = 0
const maxChartPoints = 2000

function resetChart() {
  lastChartUpdate = -Infinity
  nextChartTime = 0
  voltageChart.data.labels.length = 0
  voltageChart.data.datasets.forEach(dataset => { dataset.data.length = 0 })
  voltageChart.update()
}

function updateChart(time, frequency, sampleAt) {
  if (time - lastChartUpdate < 0.05) {
    return
  }

  lastChartUpdate = time

  // Mindestens 200 Messpunkte pro Periode: auch schmale Rechteckpulse erfassen,
  // unabhängig von Bildrate und ausgelassenen Animationsframes.
  const step = Math.min(0.05, 1 / (frequency * 200))
  nextChartTime = Math.max(nextChartTime, time - (maxChartPoints - 1) * step)
  const count = Math.min(maxChartPoints, Math.floor((time - nextChartTime) / step + 1e-8) + 1)
  for (let i = 0; i < count; i++) {
    const sampleTime = nextChartTime + i * step
    const { sourceVoltage, inducedVoltage, fieldCurrent } = sampleAt(sampleTime)
    voltageChart.data.labels.push(sampleTime)
    voltageChart.data.datasets[0].data.push(sourceVoltage)
    voltageChart.data.datasets[1].data.push(inducedVoltage)
    voltageChart.data.datasets[2].data.push(fieldCurrent)
  }
  nextChartTime += count * step

  const excess = voltageChart.data.labels.length - maxChartPoints
  if (excess > 0) {
    voltageChart.data.labels.splice(0, excess)
    voltageChart.data.datasets.forEach(dataset => dataset.data.splice(0, excess))
  }

  voltageChart.update()
}
