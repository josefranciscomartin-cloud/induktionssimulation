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
          <input id="frequenz" type="number" value="1" min="0.1" step="0.1">
          Hz
        </label>

        <label>
          Spannung:
          <input id="spannung" type="number" value="5" min="0" step="0.5">
          V
        </label>

        <button id="startButton">Simulation starten</button>
      </section>

      <section class="card">
        <h2>Versuchsaufbau</h2>

        <div id="simulation">
          <svg
            id="experiment"
            viewBox="0 0 1000 420"
            xmlns="http://www.w3.org/2000/svg"
          >

            <!-- Spannungsquelle -->
            <rect
              x="40"
              y="150"
              width="120"
              height="100"
              rx="10"
              class="source"
            />

            <text
              x="100"
              y="190"
              text-anchor="middle"
              class="svg-title"
            >
              Quelle
            </text>

            <text
              id="sourceVoltage"
              x="100"
              y="220"
              text-anchor="middle"
              class="svg-value"
            >
              0.00 V
            </text>

            <!-- Leitungen zur Feldspule -->
            <line x1="160" y1="175" x2="240" y2="175" class="wire"/>
            <line x1="160" y1="225" x2="240" y2="225" class="wire"/>

            <!-- Feldspule -->
            <g id="fieldCoil">
              ${createCoil(250, 150, 12, 18, 100)}
            </g>

            <text
              x="370"
              y="110"
              text-anchor="middle"
              class="svg-title"
            >
              Feldspule
            </text>

            <!-- Eisenkern -->
            <rect
              x="245"
              y="185"
              width="500"
              height="30"
              rx="5"
              class="core"
            />

            <!-- Magnetfeldpfeile -->
            <g id="magneticField">
              <line x1="420" y1="170" x2="570" y2="170" class="field-line"/>
              <polygon points="570,170 550,160 550,180" class="field-arrow"/>

              <line x1="420" y1="230" x2="570" y2="230" class="field-line"/>
              <polygon points="570,230 550,220 550,240" class="field-arrow"/>
            </g>

            <!-- Induktionsspule -->
            <g id="inductionCoil">
              ${createCoil(620, 150, 12, 18, 100)}
            </g>

            <text
              x="735"
              y="110"
              text-anchor="middle"
              class="svg-title"
            >
              Induktionsspule
            </text>

            <!-- Messgerät -->
            <line x1="850" y1="175" x2="900" y2="175" class="wire"/>
            <line x1="850" y1="225" x2="900" y2="225" class="wire"/>

            <circle
              cx="930"
              cy="200"
              r="45"
              class="meter"
            />

            <text
              x="930"
              y="190"
              text-anchor="middle"
              class="svg-title"
            >
              Uind
            </text>

            <text
              id="inducedVoltage"
              x="930"
              y="220"
              text-anchor="middle"
              class="svg-value"
            >
              0.00 V
            </text>

          </svg>
        </div>
      </section>

      <section class="card">
        <h2>Diagramme</h2>
        <div class="chart-container">
          <canvas id="voltageChart"></canvas>
        </div>
      </section>
    </main>
  </div>
`
const chartCanvas = document.querySelector('#voltageChart')

const voltageChart = new Chart(chartCanvas, {
  type: 'line',

  data: {
    labels: [],

    datasets: [
      {
        label: 'Quellspannung U(t)',
        data: [],
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.2
      },
      {
        label: 'Induktionsspannung Uind(t)',
        data: [],
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.2
      }
    ]
  },

  options: {
    responsive: true,
    animation: false,

    scales: {
      x: {
        title: {
          display: true,
          text: 'Zeit t in s'
        }
      },

      y: {
        title: {
          display: true,
          text: 'Spannung U in V'
        }
      }
    }
  }
})

function createCoil(startX, startY, turns, spacing, height) {
  let coil = ''

  for (let i = 0; i < turns; i++) {
    const x = startX + i * spacing

    coil += `
      <ellipse
        cx="${x}"
        cy="${startY + height / 2}"
        rx="10"
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

startButton.addEventListener('click', () => {
  if (!running) {
    startSimulation()
  } else {
    stopSimulation()
  }
})

function startSimulation() {
  running = true
  startTime = performance.now()

  startButton.textContent = 'Simulation stoppen'

  animationId = requestAnimationFrame(animate)
}

function stopSimulation() {
  running = false

  if (animationId !== null) {
    cancelAnimationFrame(animationId)
  }

  startButton.textContent = 'Simulation starten'
}

function animate(currentTime) {
  if (!running) {
    return
  }

  const frequenz = Number(document.querySelector('#frequenz').value)
  const amplitude = Number(document.querySelector('#spannung').value)

  const elapsedSeconds = (currentTime - startTime) / 1000

  const omega = 2 * Math.PI * frequenz

  // Quellspannung:
  // U(t) = Umax * sin(omega * t)
  const sourceVoltage =
    amplitude * Math.sin(omega * elapsedSeconds)

  // Vereinfachtes Modell:
  // Magnetischer Fluss ist proportional zur Quellspannung.
  const magneticFlux =
    Math.sin(omega * elapsedSeconds)

  // Induktionsspannung:
  // proportional zur zeitlichen Änderung des Flusses.
  //
  // d/dt sin(omega t) = omega cos(omega t)
  //
  // Wegen Lenz:
  // U_ind = -k * omega * cos(omega t)
  const inductionFactor = 0.4

  const inducedVoltage =
    -inductionFactor *
    amplitude *
    omega *
    Math.cos(omega * elapsedSeconds)

  sourceVoltageText.textContent =
    `${sourceVoltage.toFixed(2)} V`

  inducedVoltageText.textContent =
    `${inducedVoltage.toFixed(2)} V`

  updateMagneticField(magneticFlux)
  
  updateChart(
    elapsedSeconds,
    sourceVoltage,
    inducedVoltage
  )

  animationId = requestAnimationFrame(animate)
}

function updateMagneticField(value) {
  const strength = Math.abs(value)

  // Sichtbarkeit des Magnetfeldes
  magneticField.style.opacity =
    0.15 + strength * 0.85

  // Feldrichtung
  if (value >= 0) {
    magneticField.style.transform = 'scaleX(1)'
    magneticField.style.transformOrigin = '500px 200px'
  } else {
    magneticField.style.transform = 'scaleX(-1)'
    magneticField.style.transformOrigin = '500px 200px'
  }
}

let lastChartUpdate = 0

function updateChart(time, sourceVoltage, inducedVoltage) {
  if (time - lastChartUpdate < 0.05) {
    return
  }

  lastChartUpdate = time

  voltageChart.data.labels.push(time.toFixed(2))

  voltageChart.data.datasets[0].data.push(sourceVoltage)
  voltageChart.data.datasets[1].data.push(inducedVoltage)

  if (voltageChart.data.labels.length > 200) {
    voltageChart.data.labels.shift()
    voltageChart.data.datasets[0].data.shift()
    voltageChart.data.datasets[1].data.shift()
  }

  voltageChart.update()
}