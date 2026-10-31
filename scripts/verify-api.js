const http = require('http');

http.get('http://localhost:3001/api/readings?limit=2', (res) => {
  let raw = '';
  res.on('data', (chunk) => (raw += chunk));
  res.on('end', () => {
    try {
      const data = JSON.parse(raw);
      console.log('✓ API LIVE VERIFICATION SUCCESSFUL:');
      console.log('  Status Code       :', res.statusCode);
      console.log('  API Success       :', data.success);
      console.log('  Current Temp      :', data.data.stats.currentReading.temperatureC + '°C');
      console.log('  Current Gas ADC   :', data.data.stats.currentReading.gasAdc);
      console.log('  Current Humidity  :', data.data.stats.currentReading.humidityPercent + '%');
      console.log('  System Status     :', data.data.stats.overallStatus);
      console.log('  Readings Returned :', data.data.readings.length);
    } catch (e) {
      console.error('Failed to parse JSON:', e.message);
    }
  });
}).on('error', (e) => {
  console.error('HTTP request error:', e.message);
});
