/*****************************************************
 *  ESTACIÓN DE PRUEBA DE SENSORES – ESP32 (CORREGIDO)
 *  - DHT11: lectura cada 2500 ms (evita NAN)

 *  - Sensor de luz (fototransistor)
 *  - Micrófono (KY-038) (si tu módulo da analog)
 *  - DS18B20 (OneWire)
 *****************************************************/

#include "DHT.h"
#include <OneWire.h>
#include <DallasTemperature.h>

// ---------- DHT11 ----------
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);
unsigned long lastDhtMillis = 0;
const unsigned long DHT_INTERVAL = 2500; // ms
float lastDhtT = NAN;
float lastDhtH = NAN;

// ---------- Sensor de luz ----------
#define LIGHT_PIN 32   // ADC

// ---------- KY-038 micrófono 
#define MIC_ANALOG 35
const int maxADC = 4095;
const float vref = 3.3;

// ---------- DS18B20 ----------
#define DS18B20_PIN 25
OneWire oneWire(DS18B20_PIN);
DallasTemperature sensors(&oneWire);
unsigned long lastDsMillis = 0;
const unsigned long DS_INTERVAL = 1500;
float lastDsTemp = NAN;

void setup() {
  Serial.begin(9600);
  delay(200);

  // DHT init
  dht.begin();
  lastDhtMillis = millis();

  // KY-002

  // DS18B20
  sensors.begin();
  lastDsMillis = 0;

 
}

void loop() {
  unsigned long now = millis();

  // ----- 1) LECTURA DHT11 (cada DHT_INTERVAL ms) -----
  if (now - lastDhtMillis >= DHT_INTERVAL) {
    lastDhtMillis = now;
    float h = dht.readHumidity();
    float t = dht.readTemperature();
    if (!isnan(h) && !isnan(t)) {
      lastDhtH = h;
      lastDhtT = t;
    } else {
      // lectura fallida: no sobreescribir lastDht*
      Serial.println("[DHT] Lectura fallida (se mantiene último valor válido)");
    }
  }

  // ----- 2) LECTURA DS18B20 (cada DS_INTERVAL ms) -----
  if (now - lastDsMillis >= DS_INTERVAL) {
    lastDsMillis = now;
    sensors.requestTemperatures();
    float tempC = sensors.getTempCByIndex(0);
    if (tempC != DEVICE_DISCONNECTED_C) lastDsTemp = tempC;
    else Serial.println("[DS18B20] Sensor no detectado");
  }

  // ----- 3) LECTURAS INMEDIATAS (no bloqueantes) -----
  

  // Luz
  int luz = analogRead(LIGHT_PIN);

  // Micro (si tu módulo entrega analógico real)
  int micRaw = analogRead(MIC_ANALOG);
  float micV = micRaw * (vref / maxADC);

  // ----- 4) IMPRIMIR TODO EN SERIE -----
  Serial.println("\n--- LECTURAS SENSOR (snapshot) ---");

  // DHT11
  Serial.println("\n[DHT11]");
  if (!isnan(lastDhtT) && !isnan(lastDhtH)) {
    Serial.print("Temp DHT11: "); Serial.print(lastDhtT); Serial.print(" °C  ");
    Serial.print("Humedad: "); Serial.print(lastDhtH); Serial.println(" %");
  } else {
    Serial.println("DHT11: sin lecturas válidas aún");
  }

  // DS18B20
  Serial.println("\n[DS18B20]");
  if (!isnan(lastDsTemp)) {
    Serial.print("Temp DS18B20: "); Serial.print(lastDsTemp); Serial.println(" °C");
  } else {
    Serial.println("DS18B20: sin lecturas válidas aún / desconectado");
  }

  
  // Luz
  Serial.println("\n[Luz]");
  Serial.print("Valor ADC: "); Serial.print(luz); Serial.println(" (0..4095)");

  // Micro
  Serial.println("\n[Micrófono]");
  Serial.print("RAW: "); Serial.print(micRaw);
  Serial.print(" | V: "); Serial.print(micV, 3); Serial.println(" V");

  Serial.println("\n------------------------------------");

  delay(300);
}

