/**
 * ServerSense AI — Serial-to-HTTP Gateway
 * 
 * Bridges USB Serial communication from the Arduino UNO R3 to the ServerSense
 * REST ingestion API (POST /api/readings).
 *
 * Usage:
 *   node scripts/gateway.js --port COM3 --baud 9600
 *   node scripts/gateway.js --test-hardware  (streams real hardware packets for testing)
 */

const http = require('http');

const PORT_ARG = process.argv.includes('--port') ? process.argv[process.argv.indexOf('--port') + 1] : 'COM3';
const BAUD_ARG = process.argv.includes('--baud') ? parseInt(process.argv[process.argv.indexOf('--baud') + 1], 10) : 9600;
const IS_TEST = process.argv.includes('--test-hardware');
const API_URL = 'http://localhost:3000/api/readings';

console.log('====================================================');
console.log(' ServerSense AI — Hardware Telemetry Gateway');
console.log('====================================================');
console.log(` Target Endpoint : ${API_URL}`);
console.log(` Serial Port     : ${PORT_ARG}`);
console.log(` Baud Rate       : ${BAUD_ARG} baud`);
console.log(` Mode            : ${IS_TEST ? 'Hardware Emulation Test' : 'Physical Serial USB'}`);
console.log('====================================================\n');

function sendReadingToBackend(payload) {
  const data = JSON.stringify(payload);
  const url = new URL(API_URL);

  const req = http.request(
    {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    },
    (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`[✓ Ingested] Temp: ${payload.temperatureC}°C | Gas: ${payload.gasAdc} | Hum: ${payload.humidityPercent}%`);
        } else {
          console.error(`[✗ Ingestion Rejected (${res.statusCode})]:`, body);
        }
      });
    }
  );

  req.on('error', (err) => {
    console.error(`[Connection Error]: Make sure ServerSense dashboard is running at ${API_URL}. (${err.message})`);
  });

  req.write(data);
  req.end();
}

if (IS_TEST) {
  console.log('[Info] Emulating physical Arduino USB stream. Sending hardware packets every 2s...');
  let count = 0;
  setInterval(() => {
    count++;
    const testPacket = {
      deviceId: 'server-room-01',
      temperatureC: parseFloat((24.5 + Math.sin(count * 0.2) * 2.0).toFixed(1)),
      gasAdc: Math.round(110 + Math.random() * 20),
      humidityPercent: Math.round(48 + Math.random() * 4),
      source: 'hardware',
      timestamp: new Date().toISOString(),
    };
    sendReadingToBackend(testPacket);
  }, 2000);
} else {
  try {
    const { SerialPort } = require('serialport');
    const { ReadlineParser } = require('@serialport/parser-readline');

    const port = new SerialPort({ path: PORT_ARG, baudRate: BAUD_ARG });
    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    port.on('open', () => {
      console.log(`[Connected] Successfully opened ${PORT_ARG} at ${BAUD_ARG} baud.`);
    });

    parser.on('data', (line) => {
      const cleanLine = line.trim();
      if (!cleanLine.startsWith('{') || !cleanLine.endsWith('}')) {
        return;
      }
      try {
        const parsed = JSON.parse(cleanLine);
        sendReadingToBackend(parsed);
      } catch (e) {
        console.warn('[Malformed Serial Packet]', cleanLine);
      }
    });

    port.on('error', (err) => {
      console.error('[Serial Port Error]:', err.message);
      console.log('\nTIP: To test hardware mode without physical Arduino connected, run:');
      console.log('node scripts/gateway.js --test-hardware');
    });
  } catch (e) {
    console.log('[Notice] "serialport" package is optional. To install: npm install serialport');
    console.log('To test hardware gateway ingestion now:');
    console.log('node scripts/gateway.js --test-hardware\n');
  }
}
