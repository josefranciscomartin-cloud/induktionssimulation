import { createMeasurements, answerDefinitions, checkAnswer, measurementsCsv, coilFactor } from './measurement-data.js'

const questions = [
  { title: 'Der Feldspulenstrom steigt. Welches Vorzeichen hat U_ind bei der Polung unserer Simulation?', options: ['Positiv', 'Negativ', 'Null'], answer: 1, hint: 'Verbinde das Vorzeichen von dI/dt mit dem Minuszeichen im Induktionsgesetz.', explanation: 'Die Steigung ist positiv. Der positive Spulenfaktor und das Minuszeichen ergeben eine negative Induktionsspannung.' },
  { title: 'Der sinusförmige Feldspulenstrom erreicht sein Maximum. Wie groß ist U_ind in diesem Moment?', options: ['Positives Maximum', 'Negatives Maximum', 'Null'], answer: 2, hint: 'Wie steil ist die Stromkurve an ihrem Maximum?', explanation: 'Am Maximum ist dI/dt = 0. Auch das Magnetfeld ändert sich momentan nicht: U_ind = 0.' },
  { title: 'Die Windungszahl der Induktionsspule wird verdoppelt. Alles andere bleibt gleich. Was passiert mit dem Betrag von U_ind?', options: ['Er verdoppelt sich', 'Er halbiert sich', 'Er bleibt gleich'], answer: 0, hint: 'Betrachte den Faktor N₂ im Induktionsgesetz.', explanation: 'U_ind ist proportional zur Windungszahl N₂. Die doppelte Windungszahl ergibt den doppelten Spannungsbetrag.' },
  { title: 'Der Feldspulenstrom bleibt konstant und ungleich null. Welche Aussage stimmt?', options: ['Magnetfeld und Induktionsspannung sind beide null', 'Das Magnetfeld ist vorhanden, U_ind ist null', 'U_ind wächst mit der Zeit'], answer: 1, hint: 'Unterscheide die Stärke des Magnetfelds von seiner zeitlichen Änderung.', explanation: 'Ein konstanter Strom erzeugt ein konstantes Magnetfeld. Ohne Flussänderung entsteht keine Induktionsspannung.' },
  { title: 'Wogegen wirkt das eigene Feld der Induktionsspule bei geschlossenem Stromkreis?', options: ['Immer gegen die Richtung des Feldspulenfelds', 'Gegen die Änderung des magnetischen Flusses', 'Immer in Richtung des Feldspulenfelds'], answer: 1, hint: 'Bei abnehmendem Feld kann das induzierte Feld die bisherige Feldrichtung unterstützen.', explanation: 'Nach der Lenzschen Regel wirkt das induzierte Feld der Flussänderung entgegen. Es kann daher auch gleichgerichtet zum Feldspulenfeld sein.' },
  { title: 'Die Induktionsspule ist offen und wird ideal hochohmig gemessen. Das äußere Feld ändert sich. Was ist möglich?', options: ['Spannung, aber kein Induktionsstrom und kein eigenes Feld', 'Strom ohne Spannung', 'Ein eigenes Feld ohne Strom'], answer: 0, hint: 'Für einen Strom braucht es einen geschlossenen Stromkreis.', explanation: 'Eine Induktionsspannung kann auch bei offenem Stromkreis entstehen. Im verwendeten Modell ist I₂ dann null und die Spule erzeugt kein eigenes B-Feld.' }
]

const format = (value, digits = 4) => Number(value.toPrecision(digits)).toLocaleString('de-DE', { maximumSignificantDigits: digits })

export function mountLearning({ onLeaveExperiment, onReturnExperiment }) {
  const tabs = [...document.querySelectorAll('.learning-tabs [role="tab"]')]
  const activate = tab => {
    if (tab.id !== 'tab-experiment') onLeaveExperiment()
    for (const item of tabs) {
      const selected = item === tab
      item.setAttribute('aria-selected', String(selected))
      item.tabIndex = selected ? 0 : -1
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected
    }
    if (tab.id === 'tab-experiment') onReturnExperiment()
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab))
    tab.addEventListener('keydown', event => {
      const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : offset ? (index + offset + tabs.length) % tabs.length : null
      if (next === null) return
      event.preventDefault()
      tabs[next].focus()
      activate(tabs[next])
    })
  })
  mountQuiz()
  mountMeasurements()
}

function mountQuiz() {
  const panel = document.querySelector('#quizPanel')
  panel.innerHTML = `
    <h2>Quiz: Induktion verstehen</h2>
    <p>Sechs Fragen zum idealisierten Versuch. Wähle jeweils eine Antwort. Du kannst beliebig oft prüfen;
      Hinweise helfen weiter, die Musterlösungen öffnest du selbst. Beim Wechsel vom Versuch wird die Simulation pausiert.</p>
    <form id="quizForm">
      ${questions.map((q, index) => `
        <fieldset class="quiz-question">
          <legend>${index + 1}. ${q.title}</legend>
          ${q.options.map((option, choice) => `<label><input type="radio" name="quiz-${index}" value="${choice}"> ${option}</label>`).join('')}
          <details><summary>Hinweis</summary><p>${q.hint}</p></details>
          <p id="quiz-feedback-${index}" class="answer-feedback" aria-live="polite"></p>
        </fieldset>`).join('')}
      <div class="learning-actions"><button type="submit">Antworten prüfen</button><button type="reset">Quiz zurücksetzen</button></div>
    </form>
    <p id="quizScore" role="status"></p>
    <details id="quizSolutions"><summary>Musterlösungen anzeigen</summary>
      <ol>${questions.map(q => `<li><strong>${q.options[q.answer]}.</strong> ${q.explanation}</li>`).join('')}</ol>
    </details>`
  const form = panel.querySelector('form')
  form.addEventListener('submit', event => {
    event.preventDefault()
    let score = 0, answered = 0
    questions.forEach((q, index) => {
      const selected = form.querySelector(`input[name="quiz-${index}"]:checked`)
      const correct = selected !== null && Number(selected.value) === q.answer
      if (selected) answered++
      if (correct) score++
      const feedback = document.querySelector(`#quiz-feedback-${index}`)
      feedback.textContent = !selected ? 'Wähle noch eine Antwort.' : correct ? 'Richtig! ' + q.explanation : 'Noch nicht richtig. Nutze den Hinweis und versuche es erneut.'
      feedback.dataset.result = correct ? 'correct' : 'retry'
    })
    document.querySelector('#quizScore').textContent = `${score} von ${questions.length} richtig · ${answered} Fragen beantwortet. Die Antworten werden nicht übertragen oder dauerhaft gespeichert.`
  })
  const clear = () => {
    panel.querySelectorAll('.answer-feedback').forEach(node => { node.textContent = ''; delete node.dataset.result })
    document.querySelector('#quizScore').textContent = ''
  }
  form.addEventListener('change', clear)
  form.addEventListener('reset', () => { clear(); document.querySelector('#quizSolutions').open = false })
}

function mountMeasurements() {
  const panel = document.querySelector('#dataPanel')
  panel.innerHTML = `
    <h2>Messdaten &amp; Selbsttest</h2>
    <p>Berechne aus einer Strommessung die erwartete Induktionsspannung. Die Übungsdaten verwenden eigene,
      unten angegebene Spulendaten und verändern den Versuch nicht. Starte mit Dreieckstrom und probiere danach Sinusstrom.</p>
    <div class="exercise-options">
      <label>Stromform <select id="exerciseWaveform"><option value="triangle">Dreieck – Grundlagen</option><option value="sine">Sinus – Vertiefung</option></select></label>
      <label>Datenstufe <select id="exerciseNoise"><option value="ideal">Ideale Werte, gerundet</option><option value="noisy">Simulierter Messversuch</option></select></label>
    </div>
    <div class="learning-actions"><button id="generateMeasurements">Neuen Datensatz erzeugen</button><button id="downloadMeasurements">Tabelle als CSV herunterladen</button></div>
    <p>Jeder Klick auf „Neuen Datensatz erzeugen“ wählt eine neue Stromamplitude und Frequenz und übernimmt die Auswahl. Dann werden die bisherigen Antworten gelöscht.
      Beim Prüfen, Wechseln der Reiter und Öffnen von Lösungen bleiben die Messwerte unverändert.</p>
    <p id="exerciseParameters" class="exercise-parameters"><br>
      Luftspulen (μᵣ ≈ 1), homogenes Feld, vollständig durchsetzte Induktionsspule, hochohmige Spannungsmessung.</p>
    <p>Verwende den Spulenfaktor K = N₂ · A₂ · μ₀ · N₁ / l ≈ 0,003016 V·s/A mit μ₀ ≈ 4π · 10⁻⁷ V·s/(A·m).</p>
    <math xmlns="http://www.w3.org/1998/Math/MathML" display="block" class="exercise-formula">
      <msub><mover><mi>U</mi><mo>¯</mo></mover><mtext>ind</mtext></msub><mo>=</mo><mo>−</mo><mi>K</mi><mo>·</mo>
      <mfrac><mrow><mi>Δ</mi><mi>I</mi></mrow><mrow><mi>Δ</mi><mi>t</mi></mrow></mfrac>
    </math>
    <p id="measurementDescription" role="status"></p>
    <div class="measurement-scroll" tabindex="0" role="region" aria-label="Messwerttabelle, bei Bedarf horizontal scrollbar">
      <table class="measurement-table"><caption id="measurementCaption"></caption>
        <thead><tr><th scope="col">Zeit t / ms</th><th scope="col">Strom I / mA</th><th scope="col">U_ind / mV</th><th scope="col">Verwendung</th></tr></thead>
        <tbody id="measurementRows"></tbody>
      </table>
    </div>
    <h3>Dein Rechenweg</h3>
    <p>Verwende für die mittlere Steigung die markierten Messpunkte bei <strong>50 ms und 200 ms</strong>.
      Vergleiche danach mit der gemessenen Spannung bei <strong>125 ms</strong>.
      Trage die Zwischenschritte ein und wähle immer eine Einheit. Komma, Dezimalpunkt und wissenschaftliche Schreibweise werden akzeptiert.</p>
    <form id="measurementForm" novalidate>
      ${answerDefinitions.map(def => `<div class="calculation-step">
        <label for="answer-${def.key}">${def.label}</label>
        <div class="answer-entry"><input id="answer-${def.key}" name="${def.key}" type="text" inputmode="decimal" maxlength="40" autocomplete="off" aria-describedby="feedback-${def.key}">
          <select id="unit-${def.key}" aria-label="Einheit: ${def.label}"><option value="">Einheit wählen</option>${def.units.map(([name]) => `<option value="${name}">${name}</option>`).join('')}</select></div>
        <details><summary>Hinweis zum Rechenschritt</summary><p>${def.hint}</p></details>
        <p id="feedback-${def.key}" class="answer-feedback" aria-live="polite"></p>
      </div>`).join('')}
      <label for="measurementReason">Deine Erklärung: Warum können Rechnung und Messwert voneinander abweichen?</label>
      <textarea id="measurementReason" rows="3" placeholder="Unterscheide Rundung, Messunsicherheit und gegebenenfalls mittlere bzw. momentane Änderung."></textarea>
      <div class="learning-actions"><button type="submit">Rechenweg prüfen</button><button type="reset">Antworten zurücksetzen</button></div>
    </form>
    <p id="measurementScore" role="status"></p>
    <p id="reasonFeedback"></p>
    <p>Die Zahlenprüfung verwendet die angezeigten Tabellenwerte. Akzeptiert werden 1 % Rechenrundung
      und kleine absolute Rundungstoleranzen für Werte nahe null; bei der Differenz mindestens 0,01 mV. Die physikalische Messunsicherheit
      wird davon getrennt beim Vergleich der Spannungen betrachtet. Deine eigene Erklärung wird nicht automatisch benotet.</p>
    <details id="measurementSolution"><summary>Musterlösung und Einordnung anzeigen</summary><div id="measurementSolutionContent"></div></details>`

  let dataset, serial = 0
  const form = document.querySelector('#measurementForm')
  const clearAnswers = () => {
    panel.querySelectorAll('.answer-feedback').forEach(node => { node.textContent = ''; delete node.dataset.result })
    document.querySelector('#measurementScore').textContent = ''
    document.querySelector('#reasonFeedback').textContent = ''
  }
  const generate = () => {
    dataset = createMeasurements(document.querySelector('#exerciseWaveform').value, document.querySelector('#exerciseNoise').value === 'noisy', Math.random, serial)
    serial++
    form.reset()
    clearAnswers()
    document.querySelector('#measurementSolution').open = false
    const name = dataset.waveform === 'triangle' ? 'Dreieckstrom' : 'Sinusstrom'
    const parameters = dataset.parameters
    document.querySelector('#exerciseParameters').innerHTML =
      `N₁ = ${parameters.n1} · N₂ = ${parameters.n2} · A₁ = ${format(parameters.a1)} m² · A₂ = ${format(parameters.a2)} m² · ` +
      `l = ${format(parameters.length)} m · I<sub>max</sub> = ${format(parameters.amplitude)} A · f = ${format(parameters.frequency)} Hz.<br>` +
      'Luftspulen (μᵣ ≈ 1), homogenes Feld, vollständig durchsetzte Induktionsspule, hochohmige Spannungsmessung.'
    document.querySelector('#measurementCaption').textContent = `Datensatz ${serial}: ${name} · ${dataset.noisy ? 'simulierte Messung' : 'ideale, gerundete Werte'}`
    document.querySelector('#measurementDescription').textContent = dataset.noisy
      ? 'Synthetische Messwerte mit unabhängiger, gleichverteilter Streuung: Strom ±0,5 mA, Spannung ±0,08 mV. Einschließlich Rundung gelten Fehlergrenzen von ±0,55 mA und ±0,085 mV. Die Zeitpunkte sind im Modell exakt.'
      : 'Ideale Modellwerte, auf 0,1 mA und 0,01 mV gerundet. Rundungsgrenzen: ±0,05 mA und ±0,005 mV. Die Zeitpunkte sind im Modell exakt.'
    document.querySelector('#measurementRows').innerHTML = dataset.rows.map((row, index) => `<tr class="${[2, 8].includes(index) ? 'slope-row' : index === 5 ? 'comparison-row' : ''}"><td>${row.timeMs}</td><td>${row.currentMa.toFixed(1).replace('.', ',')}</td><td>${row.voltageMv.toFixed(2).replace('.', ',')}</td><td>${index === 2 ? 'Start der Steigungsmessung' : index === 8 ? 'Ende der Steigungsmessung' : index === 5 ? 'Spannung zum Vergleich' : '—'}</td></tr>`).join('')
    document.querySelector('#measurementSolutionContent').innerHTML = solutionHtml(dataset)
  }
  document.querySelector('#generateMeasurements').addEventListener('click', generate)
  form.addEventListener('reset', () => { clearAnswers(); document.querySelector('#measurementSolution').open = false })
  form.addEventListener('input', clearAnswers)
  form.addEventListener('change', clearAnswers)
  form.addEventListener('submit', event => {
    event.preventDefault()
    let correct = 0
    answerDefinitions.forEach(def => {
      const result = checkAnswer(def, document.querySelector(`#answer-${def.key}`).value, document.querySelector(`#unit-${def.key}`).value, dataset.targets[def.key])
      if (result.correct) correct++
      const feedback = document.querySelector(`#feedback-${def.key}`)
      feedback.textContent = result.message
      feedback.dataset.result = result.correct ? 'correct' : 'retry'
    })
    document.querySelector('#measurementScore').textContent = `${correct} von ${answerDefinitions.length} Rechenschritten richtig. Die Messdaten bleiben unverändert.`
    document.querySelector('#reasonFeedback').textContent = 'Zur Selbstprüfung deiner Erklärung: ' + (dataset.waveform === 'sine'
      ? 'Du vergleichst eine mittlere Spannung über 50–200 ms mit einem Momentanwert bei 125 ms. Diese sind beim Sinus auch ohne Messfehler nicht genau gleich.'
      : 'Beim Dreieck ist die Steigung in diesem Intervall konstant. Mittlere und momentane Spannung stimmen im idealen Modell überein.') + (dataset.noisy ? ' Hinzu kommen Messstreuung und Rundung. Größere Messabstände verringern den Einfluss der Strommessfehler auf den Differenzenquotienten.' : ' Kleine Abweichungen können durch die gerundeten Tabellenwerte entstehen.')
  })
  document.querySelector('#downloadMeasurements').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([measurementsCsv(dataset)], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `induktion-${dataset.waveform}-${dataset.noisy ? 'messung' : 'ideal'}-${serial}.csv`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  })
  generate()
}

function solutionHtml(data) {
  const t = data.targets
  const start = data.rows[2], end = data.rows[8]
  return `<ol>
    <li>ΔI = (${format(end.currentMa)} − ${format(start.currentMa)}) mA = <strong>${format(t.deltaI * 1000)} mA = ${format(t.deltaI)} A</strong>.</li>
    <li>Δt = (200 − 50) ms = <strong>150 ms = 0,150 s</strong>.</li>
    <li>ΔI/Δt = ${format(t.deltaI)} A / 0,150 s = <strong>${format(t.slope)} A/s</strong>.</li>
    <li>Ū_ind = −${format(coilFactor, 6)} V·s/A · ${format(t.slope)} A/s = <strong>${format(t.voltage * 1000)} mV</strong>. Positive Stromsteigung ergibt negative Induktionsspannung.</li>
    <li>Bei 125 ms wird <strong>${format(t.measured * 1000)} mV</strong> abgelesen.</li>
    <li>|Ū_ind − U_ind(125 ms)| = <strong>${format(t.difference * 1000)} mV</strong>.</li>
  </ol>
  <p>${data.waveform === 'triangle' ? 'Beim Dreieck ist die Stromsteigung konstant; ohne Rundung und Messstreuung stimmen beide Spannungen überein.' : 'Beim Sinus verändert sich die Stromsteigung. Der Differenzenquotient liefert die mittlere Spannung im Intervall; die Tabellenzeile bei 125 ms liefert einen Momentanwert. Auch perfekte Messungen müssen hier nicht exakt übereinstimmen.'}</p>
  <p>Eine konservative Fehlergrenze allein aus Strom- und Spannungsmessung beträgt hier
    K · (2 · δI / Δt) + δU ≈ <strong>${format(data.voltageComparisonBoundMv)} mV</strong>.
    ${data.waveform === 'sine' ? 'Der Unterschied zwischen mittlerer und momentaner Steigung kommt zusätzlich hinzu.' : 'Damit lässt sich abschätzen, ob die beobachtete Differenz durch die angegebenen Fehlergrenzen erklärbar ist.'}</p>
  <p>Bei verrauschten Daten helfen ein größeres Zeitintervall oder eine Ausgleichsgerade durch mehrere Messpunkte.
    Bei gekrümmten Verläufen muss das Intervall zugleich klein genug bleiben, wenn eine lokale Steigung gesucht ist.</p>`
}
