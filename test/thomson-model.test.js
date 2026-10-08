import test from 'node:test'
import assert from 'node:assert/strict'
import { initialThomsonState, thomsonParameters, thomsonSample, stationaryThomsonForce, advanceThomson, advanceThomsonPulse } from '../src/thomson-model.js'

const values = { currentRms: 4, windings: 300, frequency: 50, mass: 0.01,
  ringResistance: 0.001, ringInductance: 20e-6, closed: true, held: false }
const parameters = thomsonParameters(values)
const near = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) < tolerance,
  `Expected ${expected}, received ${actual}`)

test('A closed ring lifts, while a slit ring has induced voltage but no ring current or lift', () => {
  const closed = advanceThomson(initialThomsonState(), parameters, 0.3, true)
  assert.ok(closed.height > 0.01)
  const openParameters = thomsonParameters({ ...values, closed: false })
  const open = advanceThomson(initialThomsonState(), openParameters, 0.3, true)
  near(open.height, 0); near(open.velocity, 0); near(open.ringCurrent, 0)
  const sample = thomsonSample(open, openParameters, true)
  near(sample.magneticForce, 0)
  assert.ok(Math.abs(sample.inducedVoltage) > 0.1)
})

test('Stationary numerical cycle average agrees with the inductive phase-lag formula', () => {
  const held = thomsonParameters({ ...values, held: true })
  const state = advanceThomson(initialThomsonState(), held, 0.5, true)
  let integral = 0, before = thomsonSample(state, held, true).magneticForce, lastTime = state.time
  advanceThomson(state, held, 1 / held.frequency, true, (next, sample) => {
    integral += (before + sample.magneticForce) / 2 * (next.time - lastTime)
    before = sample.magneticForce; lastTime = next.time
  })
  near(integral * held.frequency, stationaryThomsonForce(0, held), 1e-5)
  assert.ok(stationaryThomsonForce(0, held) > held.weight)
})

test('Ring equation includes resistive, inductive and motional terms consistently', () => {
  const state = { time: 0.002, height: 0.05, velocity: 0.4, ringCurrent: -15, drive: 0.8 }
  const sample = thomsonSample(state, parameters, true)
  near(sample.inducedVoltage, -(sample.mutual * sample.coilDerivative + sample.mutualDerivative * state.velocity * sample.coilCurrent))
  near(parameters.ringInductance * sample.ringDerivative + parameters.ringResistance * sample.ringCurrent, sample.inducedVoltage)
  near(sample.inducedVoltage * sample.ringCurrent, sample.ringHeating + parameters.ringInductance * sample.ringCurrent * sample.ringDerivative)
  near(sample.magneticForce, sample.mutualDerivative * sample.coilCurrent * sample.ringCurrent)
})

test('Attraction and repulsion both occur during a settled AC cycle', () => {
  const held = thomsonParameters({ ...values, held: true, ringResistance: 0.01 })
  const state = advanceThomson(initialThomsonState(), held, 0.3, true)
  let minimum = Infinity, maximum = -Infinity
  advanceThomson(state, held, 1 / held.frequency, true, (_, sample) => {
    minimum = Math.min(minimum, sample.magneticForce); maximum = Math.max(maximum, sample.magneticForce)
  })
  assert.ok(minimum < 0); assert.ok(maximum > 0)
  assert.ok(stationaryThomsonForce(0, held) > 0)
})

test('Stronger current gives quadratic mean force and lifting weakens with height', () => {
  const doubled = thomsonParameters({ ...values, currentRms: 8 })
  near(stationaryThomsonForce(0, doubled), stationaryThomsonForce(0, parameters) * 4)
  assert.ok(stationaryThomsonForce(0.1, parameters) < stationaryThomsonForce(0, parameters))
})

test('After switch-off the fields decay and the ring falls back; zero current stays at rest', () => {
  const raised = advanceThomson(initialThomsonState(), parameters, 0.3, true)
  const off = advanceThomson(raised, parameters, 1.5, false)
  near(off.height, 0); near(off.velocity, 0)
  assert.ok(Math.abs(off.ringCurrent) < 1e-8)
  const zero = thomsonParameters({ ...values, currentRms: 0 })
  const idle = advanceThomson(initialThomsonState(), zero, 0.3, true)
  near(idle.height, 0); near(idle.ringCurrent, 0)
  assert.ok(Object.values(idle).every(Number.isFinite))
})

test('Integration converges when the timestep is reduced and rejects invalid parameters', () => {
  const whole = advanceThomson(initialThomsonState(), parameters, 0.1, true)
  let divided = initialThomsonState()
  for (let index = 0; index < 2000; index++) divided = advanceThomson(divided, parameters, 0.00005, true)
  near(whole.height, divided.height, 2e-4)
  near(whole.ringCurrent, divided.ringCurrent, 0.03)
  for (const change of [{ mass: 0 }, { frequency: 0 }, { ringResistance: -1 }, { currentRms: NaN }]) {
    assert.throws(() => thomsonParameters({ ...values, ...change }), RangeError)
  }
})

test('A timed pulse switches off exactly and the ring continues rising before falling back', () => {
  const pulseEnd = 0.08
  const launch = advanceThomsonPulse(initialThomsonState(), parameters, pulseEnd, pulseEnd)
  assert.equal(launch.powered, false)
  assert.ok(launch.state.height > 0.03)
  assert.ok(launch.state.velocity > 0.9)
  const flight = advanceThomsonPulse(launch.state, parameters, 0.08, pulseEnd)
  assert.equal(flight.powered, false)
  assert.ok(flight.state.height > launch.state.height)
  assert.ok(flight.state.drive < 0.001)
  const landed = advanceThomsonPulse(flight.state, parameters, 1, pulseEnd)
  near(landed.state.height, 0); near(landed.state.velocity, 0)

  // Ein großer Schritt darf die Quelle nicht über das Impulsende hinaus betreiben.
  const crossing = advanceThomsonPulse(initialThomsonState(), parameters, 0.16, pulseEnd)
  near(crossing.state.height, flight.state.height, 1e-8)
  near(crossing.state.ringCurrent, flight.state.ringCurrent, 1e-8)
  assert.equal(crossing.powered, false)
  assert.equal(advanceThomsonPulse(initialThomsonState(), parameters, 0.04, pulseEnd).powered, true)
  for (const bad of [-1, NaN, Infinity]) {
    assert.throws(() => advanceThomsonPulse(initialThomsonState(), parameters, bad, pulseEnd), RangeError)
    assert.throws(() => advanceThomsonPulse(initialThomsonState(), parameters, 0.1, bad), RangeError)
  }
})

test('Continuous AC settles near the force-balance height with small residual AC motion', () => {
  const equilibrium = 0.08 / 2 * Math.log(stationaryThomsonForce(0, parameters) / parameters.weight)
  const settled = advanceThomson(initialThomsonState(), parameters, 15, true)
  let minimum = Infinity, maximum = -Infinity
  advanceThomson(settled, parameters, 0.5, true, next => {
    minimum = Math.min(minimum, next.height); maximum = Math.max(maximum, next.height)
  })
  near((minimum + maximum) / 2, equilibrium, 0.0002)
  assert.ok(maximum - minimum < 0.0002)
})
