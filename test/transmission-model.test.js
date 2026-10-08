import test from 'node:test'
import assert from 'node:assert/strict'
import { transmissionOperatingPoint, transmissionSample } from '../src/transmission-model.js'

const parameters = { power: 10000, voltage: 2000, resistance: 20 }
const near = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) < tolerance,
  `Expected ${expected}, received ${actual}`)

test('Default operating point balances generation, transmission losses and household power', () => {
  const point = transmissionOperatingPoint(parameters)
  near(point.lineCurrent, 5)
  near(point.loss, 500)
  near(point.delivered, 9500)
  near(point.efficiency, 0.95)
  near(point.receivedVoltage, 1900)
  near(point.homeVoltage, 218.5)
  near(point.sourceVoltage * point.sourceCurrent, point.power)
  near(point.homeVoltage * point.homeCurrent, point.delivered)
  near(point.receivedVoltage * point.lineCurrent, point.delivered)
})

test('Doubling voltage halves current and quarters losses at the same input power', () => {
  const initial = transmissionOperatingPoint(parameters)
  const doubled = transmissionOperatingPoint({ ...parameters, voltage: 4000 })
  const halved = transmissionOperatingPoint({ ...parameters, voltage: 1000 })
  near(doubled.power, initial.power)
  near(doubled.lineCurrent, initial.lineCurrent / 2)
  near(doubled.loss, initial.loss / 4)
  near(halved.lineCurrent, initial.lineCurrent * 2)
  near(halved.loss, initial.loss * 4)
  assert.ok(doubled.delivered > initial.delivered)
  assert.ok(halved.delivered < initial.delivered)
})

test('Transformers preserve power, with inverse current and voltage ratios', () => {
  const point = transmissionOperatingPoint(parameters)
  near(point.voltage / point.sourceVoltage, point.sourceCurrent / point.lineCurrent)
  near(point.receivedVoltage / point.homeVoltage, point.homeCurrent / point.lineCurrent)
  near(point.stepUp * point.stepDown, 1)
})

test('Instantaneous and average losses agree, with negative electron current direction', () => {
  const point = transmissionOperatingPoint(parameters)
  const frequency = 0.4
  let averageLoss = 0, averageDelivered = 0
  for (let index = 0; index < 1000; index++) {
    const time = index / 1000 / frequency
    const sample = transmissionSample(time, frequency, point)
    near(sample.loss, sample.lineCurrent ** 2 * point.resistance)
    near(sample.sendingVoltage * sample.lineCurrent, sample.loss + sample.delivered)
    near(sample.receivedVoltage * sample.lineCurrent, sample.delivered)
    averageLoss += sample.loss / 1000
    averageDelivered += sample.delivered / 1000
    const h = 1e-5
    const velocity = (transmissionSample(time + h, frequency, point).electronMotion -
      transmissionSample(time - h, frequency, point).electronMotion) / (2 * h)
    near(velocity, -2 * Math.PI * frequency * sample.lineCurrent / (Math.SQRT2 * point.lineCurrent), 1e-7)
  }
  near(averageLoss, point.loss)
  near(averageDelivered, point.delivered)
  const peak = transmissionSample(0.25 / frequency, frequency, point)
  near(peak.sendingVoltage, Math.SQRT2 * point.voltage)
  near(peak.flux1, 0)
  near(transmissionSample(0, frequency, point).flux1, -1)
})

test('Zero resistance and zero load are finite, lossless limits', () => {
  const lossless = transmissionOperatingPoint({ ...parameters, resistance: 0 })
  near(lossless.loss, 0)
  near(lossless.homeVoltage, 230)
  near(lossless.delivered, parameters.power)
  const unloaded = transmissionOperatingPoint({ ...parameters, power: 0 })
  near(unloaded.lineCurrent, 0)
  near(unloaded.loss, 0)
  near(unloaded.efficiency, 1)
  assert.ok(Object.values(unloaded).every(Number.isFinite))
})

test('Impossible operating points and invalid inputs are rejected instead of negative household power', () => {
  for (const voltage of [400, Math.sqrt(parameters.power * parameters.resistance)]) {
    assert.throws(() => transmissionOperatingPoint({ ...parameters, voltage }), RangeError)
  }
  for (const changes of [{ voltage: 0 }, { power: -1 }, { resistance: -1 }, { power: NaN }, { voltage: Infinity }]) {
    assert.throws(() => transmissionOperatingPoint({ ...parameters, ...changes }), RangeError)
  }
})
