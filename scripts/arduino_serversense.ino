/*
 * ServerSense AI — Server Room Monitoring & Overheating Prevention System
 * Microcontroller Firmware: Arduino UNO R3
 * 
 * Circuit Pin Assignments:
 * - LCD 16x2 Display: RS=D5, Enable=D6, D4=D8, D5=D9, D6=D10, D7=D11
 * - Red Alert LED: D2
 * - Green Status LED: D3
 * - Piezo Buzzer: D4
 * - Gas Sensor Analog Output (MQ-2 / MQ-135): A0
 * - Humidity Simulation Potentiometer: A1
 * - TMP36 Temperature Sensor Vout: A3
 *
 * Serial Protocol: 9600 Baud, JSON packet stream every 2000 ms
 */

#include <LiquidCrystal.h>

// LCD Pin configuration
const int PIN_LCD_RS = 5;
const int PIN_LCD_EN = 6;
const int PIN_LCD_D4 = 8;
const int PIN_LCD_D5 = 9;
const int PIN_LCD_D6 = 10;
const int PIN_LCD_D7 = 11;

// Actuators & Indicators
const int PIN_LED_RED   = 2;
const int PIN_LED_GREEN = 3;
const int PIN_BUZZER    = 4;

// Analog Sensors
const int PIN_GAS_SENSOR = A0;
const int PIN_HUMIDITY   = A1; // Potentiometer simulated input
const int PIN_TEMP_TMP36 = A3;

// Thresholds for local safety fallback
const float TEMP_WARN_THRESHOLD = 30.0;
const float TEMP_CRIT_THRESHOLD = 35.0;
const int   GAS_CRIT_THRESHOLD  = 400;

LiquidCrystal lcd(PIN_LCD_RS, PIN_LCD_EN, PIN_LCD_D4, PIN_LCD_D5, PIN_LCD_D6, PIN_LCD_D7);

unsigned long lastTransmitTime = 0;
const unsigned long TRANSMIT_INTERVAL_MS = 2000;

void setup() {
  Serial.begin(9600);
  
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  
  digitalWrite(PIN_LED_RED, LOW);
  digitalWrite(PIN_LED_GREEN, HIGH);
  digitalWrite(PIN_BUZZER, LOW);
  
  lcd.begin(16, 2);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("ServerSense AI");
  lcd.setCursor(0, 1);
  lcd.print("Booting v1.2.4..");
  delay(1500);
  lcd.clear();
}

void loop() {
  unsigned long currentMillis = millis();

  // Read TMP36 on A3 (Voltage = ADC * (5.0 / 1024.0), Temp = (Voltage - 0.5) * 100)
  int rawTempAdc = analogRead(PIN_TEMP_TMP36);
  float voltage = (rawTempAdc * 5.0) / 1024.0;
  float temperatureC = (voltage - 0.5) * 100.0;

  // Read MQ Gas sensor on A0 (0 - 1023 raw ADC)
  int gasAdc = analogRead(PIN_GAS_SENSOR);

  // Read Potentiometer on A1 mapped to 0 - 100% simulated humidity
  int rawPot = analogRead(PIN_HUMIDITY);
  int humidityPercent = map(rawPot, 0, 1023, 0, 100);

  // Determine local status
  bool isCritical = (temperatureC >= TEMP_CRIT_THRESHOLD) || (gasAdc >= GAS_CRIT_THRESHOLD);
  bool isWarning  = (temperatureC >= TEMP_WARN_THRESHOLD) && !isCritical;

  // Drive LEDs & Buzzer
  if (isCritical) {
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_RED, HIGH);
    tone(PIN_BUZZER, 2400, 200); // Alert pulse
  } else if (isWarning) {
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_RED, HIGH);
    noTone(PIN_BUZZER);
  } else {
    digitalWrite(PIN_LED_GREEN, HIGH);
    digitalWrite(PIN_LED_RED, LOW);
    noTone(PIN_BUZZER);
  }

  // Update local 16x2 LCD
  lcd.setCursor(0, 0);
  lcd.print("T:");
  lcd.print(temperatureC, 1);
  lcd.print((char)223); // degree symbol
  lcd.print("C G:");
  lcd.print(gasAdc);
  lcd.print("   ");

  lcd.setCursor(0, 1);
  lcd.print("H:");
  lcd.print(humidityPercent);
  lcd.print("% ");
  if (isCritical) {
    lcd.print("[CRITICAL]");
  } else if (isWarning) {
    lcd.print("[WARN]    ");
  } else {
    lcd.print("[NORMAL]  ");
  }

  // Periodic Serial JSON packet transmission
  if (currentMillis - lastTransmitTime >= TRANSMIT_INTERVAL_MS) {
    lastTransmitTime = currentMillis;

    Serial.print("{\"deviceId\":\"server-room-01\",\"temperatureC\":");
    Serial.print(temperatureC, 1);
    Serial.print(",\"gasAdc\":");
    Serial.print(gasAdc);
    Serial.print(",\"humidityPercent\":");
    Serial.print(humidityPercent);
    Serial.print(",\"source\":\"hardware\"}\n");
  }

  delay(200);
}
