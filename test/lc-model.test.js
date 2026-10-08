import test from 'node:test'
import assert from 'node:assert/strict'
import { lcProperties, lcSample } from '../src/lc-model.js'

const parameters = { inductance: 0.1, capacitance: 100e-6, voltage: 6 }
const properties = lcProperties(parameters)
const near = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) < tolerance,
  `Expected ${expected}, received ${actual}`)

test('Quarter periods exchange field energy and reverse charge and current', () => {
  const [start, quarter, half, threeQuarters, end] = [0, 1, 2, 3, 4].map(index => lcSample(index * properties.period / 4, properties))
  near(start.uC, 6); near(start.current, 0); near(start.magneticEnergy, 0)
  near(start.electricEnergy, 0.0018)
  near(quarter.uC, 0); near(quarter.current, properties.currentMax)
  near(quarter.electricEnergy, 0); near(quarter.magneticEnergy, properties.energy)
  near(half.uC, -6); near(half.current, 0); near(half.electricEnergy, properties.energy)
  near(threeQuarters.current, -properties.currentMax); near(threeQuarters.uC, 0)
  near(end.uC, start.uC); near(end.current, start.current)
})

test('Free oscillation conserves total energy and satisfies the capacitor and inductor equations', () => {
  const h = properties.period * 1e-5
  for (let index = 0; index < 200; index++) {
    const time = index / 200 * properties.period
    const sample = lcSample(time, properties), before = lcSample(time - h, properties), after = lcSample(time + h, properties)
    near(sample.electricEnergy + sample.magneticEnergy, properties.energy)
    near(sample.uC + sample.uL, 0)
    near(sample.current, -(after.charge - before.charge) / (2 * h), 1e-8)
    near(sample.uL, -parameters.inductance * (after.current - before.current) / (2 * h), 1e-7)
    const velocity = (after.electronMotion - before.electronMotion) / (2 * h)
    near(velocity, -properties.omega * sample.current / properties.currentMax, 1e-5)
  }
})

test('L and C control the physical period and current independently of playback speed', () => {
  near(properties.period, 2 * Math.PI * Math.sqrt(parameters.inductance * parameters.capacitance))
  near(properties.currentMax, 6 * Math.sqrt(parameters.capacitance / parameters.inductance))
  const largerL = lcProperties({ ...parameters, inductance: parameters.inductance * 4 })
  const largerC = lcProperties({ ...parameters, capacitance: parameters.capacitance * 4 })
  near(largerL.period, properties.period * 2); near(largerL.currentMax, properties.currentMax / 2)
  near(largerC.period, properties.period * 2); near(largerC.currentMax, properties.currentMax * 2)
  near(largerL.energy, properties.energy); near(largerC.energy, properties.energy * 4)
})

test('Self-induction opposes current changes, vanishes at current extrema and peaks at zero current', () => {
  const start = lcSample(0, properties)
  near(start.current, 0)
  near(start.currentDerivative, parameters.voltage / parameters.inductance)
  near(start.inducedVoltage, -parameters.voltage)
  const quarter = lcSample(properties.period / 4, properties)
  near(quarter.current, properties.currentMax)
  near(quarter.currentDerivative, 0)
  near(quarter.inducedVoltage, 0)
  for (let index = 0; index < 100; index++) {
    const sample = lcSample(index / 100 * properties.period, properties)
    near(sample.inducedVoltage, sample.uL)
    near(sample.inducedVoltage, -parameters.inductance * sample.currentDerivative)
    assert.ok(sample.inducedVoltage * sample.currentDerivative <= 0)
  }
  assert.ok(lcSample(properties.period / 8, properties).inducedVoltage * lcSample(properties.period / 8, properties).current < 0)
  assert.ok(lcSample(3 * properties.period / 8, properties).inducedVoltage * lcSample(3 * properties.period / 8, properties).current > 0)
})

test('Zero initial voltage has no charge, current or energy and invalid inputs are rejected', () => {
  const zero = lcProperties({ ...parameters, voltage: 0 })
  const sample = lcSample(zero.period / 3, zero)
  for (const key of ['uC', 'uL', 'charge', 'current', 'electricEnergy', 'magneticEnergy', 'totalEnergy', 'electricField', 'magneticField', 'electronMotion', 'currentDerivative', 'inducedVoltage']) near(sample[key], 0)
  assert.ok(Object.values(zero).every(Number.isFinite))
  for (const changes of [{ inductance: 0 }, { capacitance: -1 }, { voltage: -1 }, { voltage: NaN }, { inductance: Infinity }]) {
    assert.throws(() => lcProperties({ ...parameters, ...changes }), RangeError)
  }
})

test('L/4 reference has four times the initial slope, half the period and the same starting energy', () => {
  const reference = lcProperties({ ...parameters, inductance: parameters.inductance / 4 })
  near(reference.capacitance, properties.capacitance)
  near(reference.voltage, properties.voltage)
  near(reference.energy, properties.energy)
  near(reference.period, properties.period / 2)
  near(reference.currentMax, properties.currentMax * 2)
  near(lcSample(0, reference).currentDerivative, lcSample(0, properties).currentDerivative * 4)
  assert.ok(lcSample(properties.period / 100, reference).current > lcSample(properties.period / 100, properties).current)
  near(lcSample(2 * properties.period, reference).current, 0)
  near(lcSample(2 * properties.period, reference).currentDerivative, lcSample(0, reference).currentDerivative)
})
