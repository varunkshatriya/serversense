# ServerSense AI — Server Room Monitoring & Overheating Prevention System

Enterprise-grade data center telemetry and environmental safety dashboard built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Recharts**.

ServerSense AI monitors server-room environmental conditions, identifies overheating risks, monitors combustible gas-sensor conductivity, visualizes potentiometer-simulated humidity, manages alerts and incidents, generates historical audit logs, and computes PUE-adjusted energy and Scope 2 carbon footprint models.

---

## 🌟 Key Features

1. **Overview Executive Dashboard (`/`)**
   - KPI metric cards for Temperature, Gas ADC, Simulated Humidity, and System Health.
   - Live continuous temperature trend chart with warning (30°C) and critical (35°C) threshold tracking.
   - Mini-trend sparklines for gas and humidity.
   - Active incidents table with severity tags and hardware link status.

2. **Dedicated Live Monitoring Console (`/live`)**
   - High-frequency live stream updating deterministically every 2 seconds.
   - Start, pause, resume, and reset simulation controls (stops new readings without clearing history; reset includes confirmation).
   - Test Scenario Injector:
     - **Nominal Baseline:** Smooth 23.5°C thermal wave.
     - **HVAC Failure:** Overheat ramp beyond 35°C (triggers CRITICAL buzzer).
     - **Gas Leak:** Combustible gas spike beyond 400 ADC.
     - **Humidity Drift:** Potentiometer oscillation below 30% or above 70%.
   - Configurable stream refresh rates (1s, 2s, 5s).
   - Live telemetry packet stream table.

3. **Temperature Analytics & Prevention (`/temperature`)**
   - ASHRAE compliance envelope tracking (Recommended 18–27°C, Allowable 27–32°C, Overheat >35°C).
   - Time above warning threshold (% and sample count).
   - Time above critical threshold (% and sample count).
   - Statistical thermal distribution histogram.
   - Filterable by 1h, 24h, and 7d windows with CSV export.

4. **Gas Sensor ADC Telemetry (`/gas`)**
   - Uncalibrated raw analog conductivity (0–1023 ADC) from Arduino pin A0.
   - Clear technical distinction: **raw ADC value**, *not* calibrated CO₂ ppm or greenhouse gas measurement.
   - Detailed documentation on tin-dioxide (SnO₂) cross-sensitivity and pre-heating requirements.

5. **Relative Humidity Monitoring (`/humidity`)**
   - Prominently labeled with **`SIMULATED INPUT (A1 POTENTIOMETER)`** badge.
   - Safe operating band (30% to 70% RH).
   - Detailed risk analysis for low humidity (Electrostatic Discharge / ESD) and high humidity (Condensation / CAF corrosion).
   - Extensible data layer ready for DHT22/SHT31 physical sensors.

6. **Energy & Carbon Footprint Modeling (`/energy`)**
   - PUE-adjusted continuous power modeling.
   - Standard engineering formulas:
     $$\text{Energy (kWh)} = \frac{\text{Power (W)} \times \text{PUE} \times \text{Time (hours)}}{1000}$$
     $$\text{Estimated Carbon (kg CO}_2\text{e)} = \text{Energy (kWh)} \times \text{Grid Emission Factor}$$
   - Clearly marked model estimate notice explaining that the Arduino lacks an inline CT power meter.
   - Interactive sliders for rack load (Watts), server rack count, PUE, and emission factor.

7. **Alert & Incident Management Center (`/alerts`)**
   - Incident grouping: continuous excursions update `lastSeenAt` rather than spamming duplicate records.
   - Full lifecycle management: **ACTIVE** $\rightarrow$ **ACKNOWLEDGED** $\rightarrow$ **RESOLVED**.
   - Visual pulsing buzzer alert indicator.
   - Filterable by severity, sensor type, and status.

8. **Historical Audit Reports (`/reports`)**
   - Searchable readings archive with multi-column sorting and pagination.
   - Distinguishes **SIMULATION** from **HARDWARE** packet lineage.
   - Instant CSV export with proper MIME headers.

9. **Device & Gateway Management (`/devices`)**
   - Real-time Arduino UNO R3 connection monitor.
   - Validated hardware pinout map.
   - Built-in step-by-step instructions to run the local Node.js serial gateway.

10. **System Settings & Threshold Tuning (`/settings`)**
    - Contradictory threshold validation (critical strictly > warning).
    - Configurable poll rates, time formats, and baseline scenarios.
    - Single-click factory reset with confirmation dialog.

---

## 🔌 Hardware Circuit & Pinout (Arduino UNO R3)

| Component | Arduino UNO Pin | Interface Type | Functional Description |
| :--- | :--- | :--- | :--- |
| **TMP36 Temp Sensor** | `A3` | Analog Input | Ambient rack temperature ($\text{V}_{\text{out}} = 0.5\text{V} + 10\text{mV}/^\circ\text{C}$) |
| **MQ Gas Sensor** | `A0` | Analog Input | Raw ADC conductivity (0–1023) representing combustible smoke/gases |
| **Humidity Potentiometer** | `A1` | Analog Input | Simulated humidity input ($0\text{V} \rightarrow 0\%$, $5\text{V} \rightarrow 100\%$) |
| **Red Alert LED** | `D2` | Digital Output | Active HIGH on WARNING or CRITICAL conditions |
| **Green Status LED** | `D3` | Digital Output | Active HIGH when all environmental parameters are NORMAL |
| **Piezo Buzzer** | `D4` | Digital Output | 2.4 kHz pulsed alarm on CRITICAL overheat ($\ge 35^\circ\text{C}$) or gas ($\ge 400$) |
| **16x2 Character LCD** | `D5, D6, D8, D9, D10, D11` | Digital Parallel | RS=`D5`, EN=`D6`, D4=`D8`, D5=`D9`, D6=`D10`, D7=`D11` |

Serial Output: **9600 Baud**, JSON packet stream every 2000ms:
```json
{"deviceId":"server-room-01","temperatureC":28.5,"gasAdc":120,"humidityPercent":50,"source":"hardware"}
```

---

## 🚀 Quick Start Guide

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install --legacy-peer-deps
```

### 2. Run in Simulation Mode (No hardware required)
Start the Next.js development server:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser. The dashboard starts immediately with realistic seed history and continuous deterministic simulation.

### 3. Connect Real Arduino UNO Hardware
1. Flash `scripts/arduino_serversense.ino` to your Arduino UNO using the Arduino IDE.
2. In a separate terminal, launch the serial-to-HTTP gateway:
   ```bash
   node scripts/gateway.js --port COM3 --baud 9600
   ```
   *(Replace `COM3` with `/dev/ttyUSB0` on Linux/macOS).*
3. The dashboard will automatically transition from `SIMULATION MODE` to `HARDWARE ONLINE (COM3)`!

> **Tip:** You can also test hardware ingestion without a physical board by running:
> ```bash
> node scripts/gateway.js --test-hardware
> ```

---

## 🧪 Automated Testing

Run the included engineering verification suite:
```bash
node scripts/test-runner.js
```
Validates:
- TMP36 analog voltage-to-temperature conversion.
- Potentiometer 0–1023 ADC to 0–100% humidity mapping.
- Normal, Warning, and Critical alert classification logic.
- Energy (kWh) and Carbon ($\text{kg CO}_2\text{e}$) formulas.
- Zod sensor ingestion boundary constraints.
- Contradictory threshold prevention.

---

## 🗄️ Database Architecture (Prisma + PostgreSQL)

ServerSense AI is built with an **in-memory reactive fallback** so the entire dashboard runs seamlessly without external dependencies.

To enable PostgreSQL persistence:
1. Configure `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/serversense?schema=public"
   ```
2. Push the schema:
   ```bash
   npx prisma db push
   ```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/readings?limit=60&tick=true` | Retrieves latest sensor readings and dashboard statistics |
| `POST` | `/api/readings` | Ingests structured telemetry packets from hardware gateway |
| `GET` | `/api/alerts` | Lists all active and resolved alert incidents |
| `PATCH` | `/api/alerts/[id]` | Acknowledge (`{"action":"acknowledge"}`) or resolve incident |
| `GET` | `/api/settings` | Returns active threshold configuration |
| `PUT` | `/api/settings` | Updates thresholds with Zod validation |
| `POST` | `/api/simulation` | Start, pause, reset, or switch simulation scenario |
| `GET` | `/api/devices` | Returns Arduino UNO connection health and pinouts |
| `GET` | `/api/export?type=readings\|alerts\|energy\|temperature` | Downloads filtered datasets in CSV format |

---

## 🛡️ License
MIT License. Built for enterprise data-center reliability and overheating prevention.
