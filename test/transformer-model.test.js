import test from 'node:test'
import assert from 'node:assert/strict'
import { transformerSample, drawnTurns } from '../src/transformer-model.js'

const parameters = { n1: 200, n2: 100, voltage: 6, frequency: 0.4, resistance: 100, closed: true }
const near = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) < tolerance,
  `Expected ${expected}, received ${actual}`)

test('Flux derivative produces the applied voltage throughout a period', () => {
  const h = 1e-5
  for (let index = 0; index < 100; index++) {
    const t = index / 100 / parameters.frequency
    const derivative = (transformerSample(t + h, parameters).flux - transformerSample(t - h, parameters).flux) / (2 * h)
    near(parameters.n1 * derivative, transformerSample(t, parameters).u1, 1e-7)
  }
  near(transformerSample(0.25 / parameters.frequency, parameters).flux, 0)
  near(transformerSample(0, parameters).u1, 0)
})

test('Turns ratio determines voltage and more turns produce more drawn windings', () => {
  const t = 0.25 / parameters.frequency
  const sample = transformerSample(t, parameters)
  near(sample.u2 / sample.u1, parameters.n2 / parameters.n1)
  const doubled = transformerSample(t, { ...parameters, n2: parameters.n2 * 2 })
  near(doubled.u2, sample.u2 * 2)
  assert.equal(drawnTurns(400), drawnTurns(200) * 2)
})

test('Open secondary retains voltage and flux without current on either side', () => {
  const open = { ...parameters, closed: false }
  near(transformerSample(0, open).i2, 0)
  near(transformerSample(0, open).i1, 0)
  assert.notEqual(transformerSample(0, open).flux, 0)
  assert.notEqual(transformerSample(0.25 / open.frequency, open).u2, 0)
  near(transformerSample(0, open).secondaryMotion, 0)
  near(transformerSample(0, open).primaryMotion, 0)
})

test('Step-up and step-down currents have the inverse voltage ratio and equal instantaneous power', () => {
  for (const n2 of [100, 200, 400]) {
    const configuration = { ...parameters, n2 }
    for (let index = 0; index < 100; index++) {
      const sample = transformerSample(index / 100 / parameters.frequency, configuration)
      near(sample.i1, n2 / parameters.n1 * sample.i2)
      near(sample.i2, sample.u2 / parameters.resistance)
      near(sample.u1 * sample.i1, sample.u2 * sample.i2)
    }
    const peak = transformerSample(0.25 / parameters.frequency, configuration)
    near(peak.i2 / peak.i1, parameters.n1 / n2)
  }
  const initial = transformerSample(0.25 / parameters.frequency, parameters)
  near(initial.i1 / Math.SQRT2, 0.015)
  near(initial.i2 / Math.SQRT2, 0.030)
})

test('Average primary and secondary power agree for a lossless core', () => {
  let primary = 0, secondary = 0
  for (let index = 0; index < 1000; index++) {
    const sample = transformerSample(index / 1000 / parameters.frequency, parameters)
    primary += sample.u1 * sample.i1 / 1000
    secondary += sample.u2 * sample.i2 / 1000
  }
  near(primary, secondary)
  near(secondary, (parameters.voltage * parameters.n2 / parameters.n1) ** 2 / parameters.resistance)
})

test('Charge markers reverse consistently with current and return after one period', () => {
  const h = 1e-5
  for (let index = 0; index < 100; index++) {
    const t = index / 100 / parameters.frequency
    const sample = transformerSample(t, parameters)
    const before = transformerSample(t - h, parameters), after = transformerSample(t + h, parameters)
    const omega = 2 * Math.PI * parameters.frequency
    near((after.primaryMotion - before.primaryMotion) / (2 * h), omega * sample.i1 / sample.i1Peak, 1e-7)
    near((after.secondaryMotion - before.secondaryMotion) / (2 * h), omega * sample.i2 / sample.i2Peak, 1e-7)
  }
  const start = transformerSample(0, parameters), end = transformerSample(1 / parameters.frequency, parameters)
  near(start.primaryMotion, end.primaryMotion)
  near(start.secondaryMotion, end.secondaryMotion)
})

test('Zero applied voltage gives zero flux and current without invalid values', () => {
  const sample = transformerSample(0.3, { ...parameters, voltage: 0 })
  for (const key of ['u1', 'u2', 'i1', 'i2', 'flux', 'primaryMotion', 'secondaryMotion']) near(sample[key], 0)
  assert.ok(Object.values(sample).every(Number.isFinite))
})
