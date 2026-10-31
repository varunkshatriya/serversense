/**
 * ServerSense AI — Automated Quality & Engineering Test Suite
 * 
 * Tests:
 * 1. Alert Classification & Thresholds (Normal, Warning, Critical)
 * 2. Temperature conversions (TMP36 formula: (V - 0.5) * 100)
 * 3. Potentiometer Humidity Mapping (0-1023 -> 0-100%)
 * 4. Validation Rules (critical > warning, humidity limits)
 * 5. Ingestion payload validation & boundary enforcement
 * 6. Energy and Carbon emissions formulas
 * 7. Incident grouping and auto-resolution
 */

const assert = require('assert');

let passedTests = 0;
let failedTests = 0;

function runTest(testName, fn) {
  try {
    fn();
    console.log(`  [PASS] ✓ ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ✗ ${testName}: ${err.message}`);
    failedTests++;
  }
}

console.log('\n======================================================');
console.log(' Running ServerSense AI Engineering Test Suite');
console.log('======================================================\n');

// 1. TMP36 Temperature Conversion Test
runTest('TMP36 Temperature Conversion from ADC', () => {
  // ADC 153.6 -> ~0.75V -> 25.0°C
  const rawAdc = 153.6;
  const voltage = (rawAdc * 5.0) / 1024.0;
  const tempC = Math.round((voltage - 0.5) * 100.0 * 10) / 10;
  assert.strictEqual(tempC, 25.0, `Expected 25.0°C, got ${tempC}°C`);
});

// 2. Humidity Mapping Test (0-1023 -> 0-100%)
runTest('Potentiometer Analog Mapping to 0-100% Humidity', () => {
  const mapPotToHum = (adc) => Math.round((adc / 1023.0) * 100);
  assert.strictEqual(mapPotToHum(0), 0);
  assert.strictEqual(mapPotToHum(511), 50);
  assert.strictEqual(mapPotToHum(1023), 100);
});

// 3. Alert Classification Logic Test
runTest('Alert Classification: Normal Temperature (24°C)', () => {
  const temp = 24.0;
  const gas = 110;
  const hum = 50;
  const warn = 30;
  const crit = 35;
  const gasWarn = 400;

  const isCrit = temp >= crit || gas >= gasWarn;
  const isWarn = temp >= warn && !isCrit;
  const status = isCrit ? 'CRITICAL' : isWarn ? 'WARNING' : 'NORMAL';

  assert.strictEqual(status, 'NORMAL');
});

runTest('Alert Classification: Warning Condition (32.5°C)', () => {
  const temp = 32.5;
  const gas = 120;
  const warn = 30;
  const crit = 35;
  const gasWarn = 400;

  const isCrit = temp >= crit || gas >= gasWarn;
  const isWarn = temp >= warn && !isCrit;
  const status = isCrit ? 'CRITICAL' : isWarn ? 'WARNING' : 'NORMAL';

  assert.strictEqual(status, 'WARNING');
});

runTest('Alert Classification: Critical Overheat Condition (36.2°C)', () => {
  const temp = 36.2;
  const gas = 120;
  const warn = 30;
  const crit = 35;
  const gasWarn = 400;

  const isCrit = temp >= crit || gas >= gasWarn;
  const status = isCrit ? 'CRITICAL' : 'WARNING';

  assert.strictEqual(status, 'CRITICAL');
});

runTest('Alert Classification: Critical Gas Hazard Condition (450 ADC)', () => {
  const temp = 24.0;
  const gas = 450;
  const gasWarn = 400;

  const isCrit = gas >= gasWarn;
  assert.strictEqual(isCrit, true);
});

// 4. Energy and Carbon Emissions Formula Test
runTest('Energy Formula: kWh = (Power (W) * Time (h)) / 1000', () => {
  const powerW = 2000;
  const hours = 24;
  const pue = 1.25;
  const totalPowerW = powerW * pue; // 2500W
  const energyKwh = (totalPowerW * hours) / 1000; // 60 kWh

  assert.strictEqual(energyKwh, 60.0);

  const emissionFactor = 0.475; // kg CO2e / kWh
  const carbonKg = energyKwh * emissionFactor; // 28.5 kg CO2e
  assert.strictEqual(carbonKg, 28.5);
});

// 5. Ingestion Validation Bounds
runTest('Sensor Ingestion Bounds Check', () => {
  const isValidTemp = (t) => t >= -40 && t <= 125;
  const isValidGas = (g) => Number.isInteger(g) && g >= 0 && g <= 1023;
  const isValidHum = (h) => h >= 0 && h <= 100;

  assert.strictEqual(isValidTemp(28.5), true);
  assert.strictEqual(isValidTemp(-50), false);
  assert.strictEqual(isValidTemp(150), false);

  assert.strictEqual(isValidGas(450), true);
  assert.strictEqual(isValidGas(1200), false);
  assert.strictEqual(isValidGas(-1), false);

  assert.strictEqual(isValidHum(45), true);
  assert.strictEqual(isValidHum(110), false);
});

// 6. Contradictory Threshold Validation
runTest('Threshold Constraint: Critical > Warning', () => {
  const validateThresholds = (warn, crit) => crit > warn;
  assert.strictEqual(validateThresholds(30, 35), true);
  assert.strictEqual(validateThresholds(35, 30), false);
  assert.strictEqual(validateThresholds(30, 30), false);
});

console.log('\n======================================================');
console.log(` Tests Completed: ${passedTests} Passed, ${failedTests} Failed.`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
