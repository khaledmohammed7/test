/* ═══════════════════════════════════════════════════════════════
   Falla7 — Capstone Engineering Toolkit
   React Application (JSX — transpiled in browser by Babel)
   Author: Khaled Mohammed — STEM ALEX S27
   
   Dependencies (loaded in index.html):
     • React 18  (react.production.min.js)
     • ReactDOM  (react-dom.production.min.js)
     • Babel Standalone (for JSX transpilation)
   
   ⚠  This file uses JSX syntax.
      It must be loaded with <script type="text/babel">
═══════════════════════════════════════════════════════════════ */

const { useState, useRef, useEffect } = React;


    // ─── Inline diff engine (replaces jsdiff CDN) ────────────────────────────────
    const diffLines = (oldStr, newStr) => {
      const oldLines = oldStr.split("\n");
      const newLines = newStr.split("\n");
      const result = [];
      let oi = 0, ni = 0;
      while (oi < oldLines.length || ni < newLines.length) {
        if (oi >= oldLines.length) {
          result.push({ value: newLines[ni] + "\n", added: true, removed: false, count: 1 });
          ni++;
        } else if (ni >= newLines.length) {
          result.push({ value: oldLines[oi] + "\n", added: false, removed: true, count: 1 });
          oi++;
        } else if (oldLines[oi] === newLines[ni]) {
          const last = result[result.length - 1];
          if (last && !last.added && !last.removed) {
            last.value += newLines[ni] + "\n";
            last.count++;
          } else {
            result.push({ value: newLines[ni] + "\n", added: false, removed: false, count: 1 });
          }
          oi++; ni++;
        } else {
          // Try to find next match
          let found = false;
          for (let lookahead = 1; lookahead < 8 && !found; lookahead++) {
            if (oi + lookahead < oldLines.length && oldLines[oi + lookahead] === newLines[ni]) {
              for (let d = 0; d < lookahead; d++) {
                result.push({ value: oldLines[oi + d] + "\n", added: false, removed: true, count: 1 });
              }
              oi += lookahead;
              found = true;
            } else if (ni + lookahead < newLines.length && oldLines[oi] === newLines[ni + lookahead]) {
              for (let d = 0; d < lookahead; d++) {
                result.push({ value: newLines[ni + d] + "\n", added: true, removed: false, count: 1 });
              }
              ni += lookahead;
              found = true;
            }
          }
          if (!found) {
            result.push({ value: oldLines[oi] + "\n", added: false, removed: true, count: 1 });
            result.push({ value: newLines[ni] + "\n", added: true, removed: false, count: 1 });
            oi++; ni++;
          }
        }
      }
      return result;
    };

    // ─── MCU LIBRARY ─────────────────────────────────────────────────────────────
    const MCU = {
      uno: {
        label: "Arduino Uno", icon: "UNO", chip: "ATmega328P", voltage: "5V", analog: ["A0", "A1", "A2", "A3", "A4", "A5"], i2c: "SDA→A4, SCL→A5", serial: "Serial.begin(9600);", intPin: "D2",
        note: "Best for beginners. 14 digital + 6 analog pins. Huge community support and tutorials. Most affordable and easy to find in Egypt."
      },
      mega: {
        label: "Arduino Mega 2560", icon: "MEGA", chip: "ATmega2560", voltage: "5V", analog: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"], i2c: "SDA→D20, SCL→D21", serial: "Serial.begin(9600);", intPin: "D2",
        note: "More pins & memory. 54 digital + 16 analog pins. Great for complex projects with many sensors and actuators. Same code as Uno."
      },
      nano: {
        label: "Arduino Nano", icon: "NANO", chip: "ATmega328P", voltage: "5V", analog: ["A0", "A1", "A2", "A3", "A6", "A7"], i2c: "SDA→A4, SCL→A5", serial: "Serial.begin(9600);", intPin: "D2",
        note: "Same as Uno but compact. Fits on a breadboard. Good for tight builds. Identical code to Arduino Uno."
      },
      esp32: {
        label: "ESP32", icon: "ESP32", chip: "Xtensa LX6 DC", voltage: "3.3V", analog: ["GPIO34", "GPIO35", "GPIO36", "GPIO39"], i2c: "SDA→GPIO21, SCL→GPIO22", serial: "Serial.begin(115200);", intPin: "GPIO4",
        note: "Built-in WiFi & Bluetooth. Dual-core processor. Great for IoT and data logging to phone/web. Uses 3.3V — some sensors need level shifter."
      },
      esp8266: {
        label: "ESP8266 (NodeMCU)", icon: "8266", chip: "Tensilica L106", voltage: "3.3V", analog: ["A0"], i2c: "SDA→D2, SCL→D1", serial: "Serial.begin(115200);", intPin: "D5",
        note: "Budget WiFi board. Only 1 analog pin. Good for simple IoT projects. Uses 3.3V. Not recommended for projects needing many analog sensors."
      },
    };

    const MCU_RELAY = {
      uno: ["D6", "D7", "D8", "D9", "D10", "D11"],
      mega: ["D6", "D7", "D8", "D9", "D10", "D11"],
      nano: ["D6", "D7", "D8", "D9", "D10", "D11"],
      esp32: ["GPIO16", "GPIO17", "GPIO18", "GPIO19", "GPIO23", "GPIO25"],
      esp8266: ["D0", "D1", "D5", "D6", "D7", "D8"],
    };

    const MCU_DIG = {
      uno: ["D2", "D3", "D4", "D5"],
      mega: ["D2", "D3", "D4", "D5"],
      nano: ["D2", "D3", "D4", "D5"],
      esp32: ["GPIO4", "GPIO5", "GPIO12", "GPIO13"],
      esp8266: ["D4", "D5", "D6", "D7"],
    };

    // ─── SENSOR LIBRARY ──────────────────────────────────────────────────────────
    function sWiring(mcu, type, idx) {
      const m = MCU[mcu] || MCU.uno;
      if (type === "analog") return "Signal → " + (m.analog[idx] || "A0") + ", VCC → " + m.voltage + ", GND → GND";
      if (type === "digital") return "Data → " + (MCU_DIG[mcu]?.[idx] || "D2") + ", VCC → " + m.voltage + ", GND → GND, 10kΩ pull-up";
      if (type === "I2C") return m.i2c + ", VCC → " + m.voltage + ", GND → GND";
      if (type === "interrupt") return "Signal → " + (m.intPin || "D2") + " (interrupt pin), VCC → 5V, GND → GND";
      return "";
    }

    const SENSORS = {
      dht22: { label: "DHT22 Temp & Humidity", icon: "DHT22", type: "digital", lib: '#include <DHT.h>', systems: ["greenhouse", "aquaculture"], defMin: 20, defMax: 35 },
      dht11: { label: "DHT11 Temp & Humidity", icon: "DHT11", type: "digital", lib: '#include <DHT.h>', systems: ["greenhouse", "aquaculture"], defMin: 20, defMax: 35 },
      ds18b20: { label: "DS18B20 Waterproof Temp", icon: "DS18B20", type: "digital", lib: '#include <OneWire.h>\n#include <DallasTemperature.h>', systems: ["greenhouse", "aquaculture"], defMin: 22, defMax: 30 },
      water_level: { label: "Water Level Sensor", icon: "WLVL", type: "analog", lib: "", systems: ["greenhouse", "aquaculture"], defMin: 200, defMax: 800 },
      soil_moisture: { label: "Soil Moisture Sensor", icon: "SOIL", type: "analog", lib: "", systems: ["greenhouse"], defMin: 300, defMax: 700 },
      cap_soil: { label: "Capacitive Soil v1.2", icon: "CSOIL", type: "analog", lib: "", systems: ["greenhouse"], defMin: 1500, defMax: 3000 },
      ldr: { label: "LDR Photoresistor (2-pin)", icon: "LDR", type: "ldr2pin", lib: "", systems: ["greenhouse"], defMin: 200, defMax: 900 },      bh1750: { label: "BH1750 Digital Light", icon: "BH1750", type: "I2C", lib: '#include <Wire.h>\n#include <BH1750.h>', systems: ["greenhouse"], defMin: 1000, defMax: 50000 },
      tds: { label: "TDS Sensor V1.0", icon: "TDS", type: "analog", lib: "", systems: ["aquaculture"], defMin: 200, defMax: 800 },
      ph: { label: "Analog pH Meter", icon: "pH", type: "analog", lib: "", systems: ["greenhouse", "aquaculture"], defMin: 60, defMax: 75 },
      turbidity: { label: "Turbidity Sensor", icon: "TURB", type: "analog", lib: "", systems: ["aquaculture"], defMin: 0, defMax: 500 },
      flow: { label: "Flow Sensor YF-S201C", icon: "FLOW", type: "interrupt", lib: "", systems: ["greenhouse", "aquaculture"], defMin: 0, defMax: 100 },
      mq135: { label: "MQ-135 Air Quality", icon: "MQ135", type: "analog", lib: "", systems: ["greenhouse", "aquaculture"], defMin: 0, defMax: 400 },
    };

    // ─── ACTUATOR LIBRARY ─────────────────────────────────────────────────────────
    const ACTUATORS = {
      fan:     { label: "Fan (Cooling/Ventilation)", icon: "FAN",    systems: ["greenhouse", "aquaculture"] },
      pump:    { label: "5V Water Pump",             icon: "PUMP",   systems: ["greenhouse", "aquaculture"] },
      lamp:    { label: "Grow Light / Lamp",         icon: "LAMP",   systems: ["greenhouse"] },
      thermal: { label: "Thermal Lamp",              icon: "T-LAMP", systems: ["greenhouse", "aquaculture"] },
      ptc:     { label: "12V PTC Heater",            icon: "PTC",    systems: ["greenhouse", "aquaculture"] },
      aerator: { label: "Air Pump / Aerator",        icon: "AIR",    systems: ["aquaculture"] },
    };

    // Default parameter each actuator controls — sensor key + condition (hi/lo) + label
    // hi = activates when sensor reads HIGH / above max
    // lo = activates when sensor reads LOW / below min
    const ACT_PARAM_DEFAULTS = {
      fan:     [
        { sensor: "dht22",        cond: "hi", label: "Temp too HIGH" },
        { sensor: "dht11",        cond: "hi", label: "Temp too HIGH" },
        { sensor: "ds18b20",      cond: "hi", label: "Water Temp too HIGH" },
        { sensor: "mq135",        cond: "hi", label: "Air Quality too HIGH (ventilate)" },
        { sensor: "dht22_hum",    cond: "hi", label: "Humidity too HIGH" },
      ],
      pump:    [
        { sensor: "soil_moisture",cond: "lo", label: "Soil Moisture too LOW" },
        { sensor: "cap_soil",     cond: "hi", label: "Cap Soil too HIGH (dry)" },
        { sensor: "water_level",  cond: "lo", label: "Water Level too LOW" },
        { sensor: "tds",          cond: "lo", label: "TDS too LOW (dilute)" },
      ],
      lamp:    [
        { sensor: "bh1750",       cond: "lo", label: "Light Level too LOW" },
        { sensor: "ldr",          cond: "lo", label: "LDR Light too LOW" },
      ],
      thermal: [
        { sensor: "dht22",        cond: "lo", label: "Temp too LOW" },
        { sensor: "dht11",        cond: "lo", label: "Temp too LOW" },
        { sensor: "ds18b20",      cond: "lo", label: "Water Temp too LOW" },
      ],
      ptc:     [
        { sensor: "ds18b20",      cond: "lo", label: "Water Temp too LOW" },
        { sensor: "dht22",        cond: "lo", label: "Air Temp too LOW" },
        { sensor: "dht11",        cond: "lo", label: "Air Temp too LOW" },
      ],
      aerator: [
        { sensor: "tds",          cond: "hi", label: "TDS too HIGH" },
        { sensor: "turbidity",    cond: "hi", label: "Turbidity too HIGH" },
        { sensor: "ph",           cond: "hi", label: "pH too HIGH" },
        { sensor: "ph",           cond: "lo", label: "pH too LOW" },
        { sensor: "mq135",        cond: "hi", label: "Air Quality poor" },
        { sensor: "water_level",  cond: "lo", label: "Water Level too LOW" },
      ],
    };

    // Pick best matching default param given currently selected sensors
    function pickActDefault(actKey, selectedSensors) {
      const defs = ACT_PARAM_DEFAULTS[actKey] || [];
      const sKeys = Object.keys(selectedSensors);
      // return ALL matching defaults as array (OR logic — any can activate)
      const matches = defs.filter(d => sKeys.includes(d.sensor.replace("_hum", "")));
      if (matches.length) return matches.map(d => ({ sensor: d.sensor, cond: d.cond }));
      return defs[0] ? [{ sensor: defs[0].sensor, cond: defs[0].cond }] : [{ sensor: "manual", cond: "hi" }];
    }

    // ─── COST DATABASE (EGP) ──────────────────────────────────────────────────────
    const COSTS = {
      mcu: { uno: 360, mega: 1250, nano: 240, esp32: 280, esp8266: 115 },
      sensor: { dht22: 200, dht11: 50, ds18b20: 60, water_level: 25, soil_moisture: 50, cap_soil: 85, ldr: 25, bh1750: 195, tds: 450, ph: 1300, turbidity: 495, flow: 300, mq135: 75 },
      actuator: { fan: 150, pump: 45, lamp: 350, thermal: 30, ptc: 145, aerator: 185 },
      relay: 35,
      misc: 150,
    };

    // ─── SENSOR COMPARE DATA ──────────────────────────────────────────────────────
    const SENSOR_COMPARE = {
      dht22: { name: "DHT22", accuracy: "±0.5°C / ±2%RH", range: "-40–80°C, 0–100%RH", price: 195, voltage: "3.3–5V", protocol: "Digital", pros: "High accuracy, measures both temp & humidity", cons: "Slow 2s sampling, slightly expensive" },
      dht11: { name: "DHT11", accuracy: "±2°C / ±5%RH", range: "0–50°C, 20–90%RH", price: 50, voltage: "3.3–5V", protocol: "Digital", pros: "Cheap, widely available in Egypt", cons: "Low accuracy, limited range" },
      ds18b20: { name: "DS18B20", accuracy: "±0.5°C", range: "-55–125°C", price: 180, voltage: "3.0–5.5V", protocol: "1-Wire", pros: "Waterproof, chain multiple sensors on 1 pin", cons: "Needs 4.7kΩ resistor, slower reading" },
      water_level: { name: "Water Level", accuracy: "Relative", range: "Analog 0–1023", price: 65, voltage: "3.3–5V", protocol: "Analog", pros: "Very cheap, simple to use", cons: "Corrodes over time in water" },
      soil_moisture: { name: "Soil Moisture", accuracy: "Relative", range: "Analog 0–1023", price: 95, voltage: "3.3–5V", protocol: "Analog", pros: "Cheap, instant reading", cons: "Metal probes corrode — prefer capacitive" },
      cap_soil: { name: "Capacitive Soil", accuracy: "Relative", range: "Analog 0–4095", price: 195, voltage: "3.3V", protocol: "Analog", pros: "No corrosion, long lifespan", cons: "3.3V only — careful with 5V boards" },
      ldr: { name: "LDR (2-pin)", accuracy: "Relative", range: "Analog 0–1023", price: 15, voltage: "3.3–5V", protocol: "Analog + 10kΩ", pros: "Extremely cheap, only 2 pins, no module needed", cons: "Needs external 10kΩ resistor for voltage divider" },      bh1750: { name: "BH1750", accuracy: "±20%", range: "1–65535 lux", price: 195, voltage: "3.3–5V", protocol: "I2C", pros: "Accurate lux values, digital I2C output", cons: "Fragile, costs more than LDR" },
      tds: { name: "TDS V1.0", accuracy: "±10%", range: "0–1000 ppm", price: 350, voltage: "3.3–5V", protocol: "Analog", pros: "Gives dissolved solids reading in ppm", cons: "Needs temperature compensation for accuracy" },
      ph: { name: "pH Meter", accuracy: "±0.1 pH", range: "0–14 pH", price: 650, voltage: "5V", protocol: "Analog", pros: "Essential for aquaculture water quality", cons: "Expensive, needs buffer calibration" },
      turbidity: { name: "Turbidity", accuracy: "Relative", range: "Analog 0–4095", price: 320, voltage: "5V", protocol: "Analog", pros: "Detects water cloudiness reliably", cons: "Needs clean sensor window" },
      flow: { name: "YF-S201C Flow", accuracy: "±10%", range: "1–30 L/min", price: 275, voltage: "5–24V", protocol: "Pulse", pros: "Measures actual water flow rate", cons: "Needs interrupt pin, mechanical wear" },
      mq135: { name: "MQ-135", accuracy: "Relative", range: "Analog 0–1023", price: 195, voltage: "5V", protocol: "Analog", pros: "Detects CO2, NH3, smoke, benzene", cons: "20s warmup, needs calibration, drifts" },
    };

    // ─── TROUBLESHOOTING TREE ─────────────────────────────────────────────────────
    const TROUBLE = [
      // ── UPLOAD & IDE ISSUES
      { cat: "UPLOAD & IDE", q: "Code won't upload to Arduino", steps: ["Check USB cable — try a different one (many are charge-only, not data)", "Select correct board: Tools → Board → your MCU (e.g. Arduino Uno)", "Select correct port: Tools → Port → COM? (Windows) or /dev/ttyUSB? (Linux/Mac)", "Press Upload then immediately press the Reset button on the board if it hangs", "For Nano: go to Tools → Processor → ATmega328P (Old Bootloader) — this is the #1 Nano fix in Egypt", "Try a lower baud rate — Uno/Nano use 9600, ESP32/ESP8266 use 115200", "Install CH340 driver manually if board is not detected on Windows: search 'CH340 driver download'", "Try a different USB port on your computer — front ports are often unpowered hubs"] },
      { cat: "UPLOAD & IDE", q: "'Port not found' or board disappears from COM list", steps: ["The USB cable is charge-only — swap it for a data cable (a phone cable that can transfer files)", "Wrong or missing driver — install CH340 driver from wch-ic.com for Chinese boards", "On Windows: open Device Manager → look for yellow warning under 'Ports (COM & LPT)'", "Try unplugging all USB devices and plugging only the Arduino back in", "On Windows 11: right-click the device in Device Manager → Update Driver → Browse → Let me pick → choose CH340", "Some Nano clones need a specific older CH340 driver version — search 'CH340 Windows 11 fix'", "Try a different USB cable and different USB port on your laptop"] },
      { cat: "UPLOAD & IDE", q: "'avrdude: stk500_recv() programmer not responding'", steps: ["This is the most common Nano error in Egypt — caused by wrong bootloader", "Go to Tools → Processor → ATmega328P (Old Bootloader) — this almost always fixes it", "Also check: correct board selected in Tools → Board → Arduino Nano", "Check COM port: Tools → Port → make sure a COM port is selected", "Try pressing Reset button on the Nano right as the IDE shows 'Uploading...'", "If still failing, try a different USB cable — many Nano problems are cable-only", "Verify the CH340 driver is installed (see Device Manager on Windows)"] },
      { cat: "UPLOAD & IDE", q: "ESP32 stuck at 'Connecting...' during upload", steps: ["Hold the BOOT (or FLASH) button on the ESP32 while clicking Upload, release after the dots appear", "Some ESP32 boards need you to hold BOOT, click Upload, wait for 'Connecting...', then release", "Check that you installed the ESP32 board package: File → Preferences → add Espressif URL → Boards Manager → esp32", "Baud rate must be 115200 for ESP32 — set it in Tools → Upload Speed", "Make sure you're using a good quality USB cable (500mA+ current)", "Add a 100µF capacitor between 3.3V and GND if uploads are intermittent", "In Arduino IDE 2.x: try lowering Upload Speed to 460800 or 115200"] },
      { cat: "UPLOAD & IDE", q: "Library not found / #include error", steps: ["Open Arduino IDE → Sketch → Include Library → Manage Libraries", "Search for the library name (e.g. 'DHT sensor library' by Adafruit for DHT22/DHT11)", "For DS18B20: install 'DallasTemperature' AND 'OneWire' — both are required", "For BH1750: search 'BH1750' by Christopher Laws", "Install only the exact library shown in Falla7's generated code comment", "If a library installs but #include still fails, close and reopen Arduino IDE completely", "Make sure you are using Arduino IDE version 1.8.x or 2.x — very old versions have library bugs"] },

      // ── SENSOR PROBLEMS
      { cat: "SENSOR ISSUES", q: "DHT22 / DHT11 returns NaN, -999, or 0.00", steps: ["Check wiring: VCC→3.3–5V, GND→GND, Data→correct digital pin", "Add a 10kΩ pull-up resistor between Data pin and VCC — this is essential for reliable readings", "Declare the DHT object globally (before setup), NOT inside loop()", "Add delay(2000) after Serial.begin and before the first read — DHT needs 2 seconds to warm up", "Try a completely different pin — pin 0 and pin 1 conflict with Serial on Uno", "Verify the library: must be 'DHT sensor library' by Adafruit (v1.4.x), not a random DHT library", "Check if the sensor plastic body is cracked or corroded — DHT sensors are fragile"] },
      { cat: "SENSOR ISSUES", q: "DS18B20 temperature reads 85°C or -127°C always", steps: ["85°C means the sensor didn't initialize — most likely wiring or resistor problem", "Add a 4.7kΩ resistor between the Data wire and VCC — this is mandatory, not optional", "Check your color codes: for most DS18B20: Red=VCC, Black=GND, Yellow/White=Data", "Parasitic power mode (2-wire) sometimes causes 85°C — try 3-wire mode with dedicated VCC", "In code: sensors.begin() must be called in setup(), and sensors.requestTemperatures() before getTemp", "If using multiple DS18B20 sensors on one wire, each needs a unique address — use the address scanner sketch", "Verify the probe is DS18B20 and not a fake (common in Egypt markets) — genuine ones have Maxim logo"] },
      { cat: "SENSOR ISSUES", q: "Soil moisture / water level sensor reads 0 or 1023 only", steps: ["Sensor pins are completely dry (0) or shorted (1023) — check the probe is making proper contact", "For resistive soil sensor: the two metal probes must both touch the soil at the same time", "Verify analog pin: Uno/Nano use A0-A5, ESP32 uses GPIO34/35/36/39 (input-only pins)", "Read the pin directly: Serial.println(analogRead(A0)) to see the raw value", "Capacitive soil sensors need 3.3V — connecting to 5V on Uno may damage them", "Make sure analogRead is in loop() not just setup()", "If reading is always 1023 on ESP32, check the pin — some ESP32 pins don't have ADC"] },
      { cat: "SENSOR ISSUES", q: "pH sensor gives wrong / drifting values", steps: ["You MUST calibrate with pH 4.0 and pH 7.0 buffer solutions — without calibration values are meaningless", "Soak the glass electrode in pH 7 buffer or KCl storage solution for at least 30 minutes before use", "pH readings need 30–60 seconds to stabilize after dipping — wait before recording", "Check that the BNC connector is fully screwed in — loose connection causes noise", "The pH module has a potentiometer: adjust it while probe is in pH 7 buffer until reading shows 7.0", "pH electrodes dry out — if stored dry for months, they may be permanently damaged (replace)", "Keep pH probe away from high-voltage wires and relay modules — they cause electrical interference"] },
      { cat: "SENSOR ISSUES", q: "TDS sensor reads 0 or unrealistic values", steps: ["TDS reads conductivity of water — pure distilled water reads 0 TDS, which is correct", "Verify the probe is submerged — both stainless steel probes must be fully in water", "Read raw analog value first: Serial.println(analogRead(A0)) to check the sensor is responding", "Temperature affects TDS readings significantly — add temperature compensation (see TDS library examples)", "Verify analog pin mapping: on ESP32 the ADC is 12-bit (0-4095) not 10-bit (0-1023)", "Check the BNC or 3-pin connector is fully seated on the module", "If using cheap TDS sensors from local market, calibrate with a known TDS solution first"] },
      { cat: "SENSOR ISSUES", q: "LDR / Light sensor always reads full brightness or darkness", steps: ["LDR is a 2-pin component (no VCC/GND/Signal pins like a module) — it needs a voltage divider circuit to work", "Without the resistor, the pin floats and reads random values", "Correct wiring: LDR Pin1 → analog pin (A0) AND 5V via 10kΩ resistor | LDR Pin2 → GND — the 10kΩ resistor is mandatory", "Read the raw analog value: Serial.println(analogRead(A0)) to see if it changes with light", "For BH1750: run the I2C scanner to confirm address (0x23 or 0x5C) - make sure Wire is initialized", "BH1750 requires both SDA and SCL - they vary per board (Uno: A4/A5, ESP32: GPIO21/22)", "Verify the BH1750 is not damaged by 5V on an ESP32 (3.3V board)"] },
      { cat: "SENSOR ISSUES", q: "Flow sensor reads 0 or wrong flow rate", steps: ["Flow sensor YF-S201 uses pulse counting — it must be connected to an interrupt pin", "On Uno/Nano: interrupt pins are D2 and D3 only — not any other pin", "In code: use attachInterrupt(digitalPinToInterrupt(FLOW_PIN), pulseCounter, RISING)", "Make sure water is actually flowing through the sensor — it won't read if pipe is empty", "Check pulse count variable is declared volatile: 'volatile int pulseCount = 0;'", "Confirm VCC is 5–24V — the flow sensor needs at least 5V, not 3.3V", "If reading is slightly off, calibrate: compare against a measured volume (1L) and adjust factor"] },
      { cat: "SENSOR ISSUES", q: "MQ-135 / Air quality sensor reads erratic values", steps: ["MQ sensors need a 20-second warmup time after power-on before readings stabilize", "Add: delay(20000); at the start of setup() to wait for warmup", "MQ-135 reads relative values — calibrate by taking a baseline reading in clean air", "The heating element gets hot — keep away from flammable materials and ensure ventilation", "MQ sensors drift significantly with temperature and humidity — readings are comparative, not absolute", "Check 5V supply — MQ sensors draw 150–300mA heating current, which can stress USB power", "Use moving average: take 10 readings over 10 seconds and average them for stable output"] },

      // ── ACTUATOR & RELAY PROBLEMS
      { cat: "RELAY & ACTUATORS", q: "Relay clicks but device doesn't turn on", steps: ["Check which terminal you're using: device must be on COM and NO (Normally Open), not NC", "When relay activates (LOW signal), the COM and NO terminals connect — measure with multimeter", "Verify the device actually works — plug it directly to mains power to test", "Check wiring polarity on DC devices (fans, pumps) — swap positive and negative if motor doesn't spin", "Make sure the relay is rated for the device voltage and current (e.g. 10A 250VAC)", "For pumps: check if the pump is submerged — dry-running pumps make noise but don't pump", "Some relay modules have an active HIGH trigger instead of active LOW — check your module's datasheet"] },
      { cat: "RELAY & ACTUATORS", q: "Relay not clicking / not responding to code", steps: ["Active-low modules: LOW = ON, HIGH = OFF — this is counterintuitive but standard", "Test manually: set pin LOW in setup() and see if the relay clicks", "Verify relay VCC is connected to 5V, not 3.3V — relays need 5V coil voltage to activate", "Check if there's a JD-VCC jumper on the module — some modules need it connected for isolation", "The relay module LED should light when activated — if it doesn't, check signal wiring", "Make sure you're using the correct pin in code (e.g. const int RELAY_PIN = 6)", "Try a completely different digital pin — some pins have alternate functions that cause conflicts"] },
      { cat: "RELAY & ACTUATORS", q: "Arduino resets or freezes when relay activates", steps: ["Relay coil causes voltage spikes — add a 100µF capacitor between 5V and GND near the relay", "Use a separate 5V power supply for the relay module — don't power relay from Arduino 5V pin", "Connect a freewheeling diode (1N4007) across the relay coil if using a bare relay (not module)", "If relay module has optocoupler isolation, make sure JD-VCC is on separate power", "Ground the relay module GND to the same GND as Arduino — shared ground is essential", "Add delay(10) before and after toggling relays in code to give power supply time to settle", "Check that wires are not touching — a short on the relay side can reset the microcontroller"] },
      { cat: "RELAY & ACTUATORS", q: "Water pump not working / bubbling but not pumping", steps: ["Submersible pumps must be fully submerged — running dry even briefly can burn the motor", "Verify pump voltage: 5V pumps need 5V, not 3.3V or a weak USB supply", "Check water level: the pump inlet must be below water level", "Remove the pump and check if the impeller spins freely — debris can jam it", "Some cheap pumps are directional — check if there's an arrow indicating water flow direction", "Verify the relay is actually switching (measure with multimeter or test LED first)", "Use an external 5V power supply rated at 1A or more — Arduino 5V pin cannot power most pumps"] },
      { cat: "RELAY & ACTUATORS", q: "Fan not spinning / spinning slowly", steps: ["DC fans need correct polarity — swap VCC and GND connections if fan doesn't spin", "Most cooling fans are 12V, not 5V — verify your fan's rated voltage on the label", "5V fans from USB sources work with Arduino but need at least 500mA — use external supply", "If fan vibrates but doesn't spin, it may be jammed — remove obstruction from blades", "Check relay COM/NO terminals — only COM and NO should be connected, not NC", "For PWM speed control, use a PWM-capable digital pin and analogWrite() — this won't work through a simple relay", "Measure voltage at the fan terminals with a multimeter while relay is ON to confirm power is reaching it"] },

      // ── MICROCONTROLLER PROBLEMS
      { cat: "MCU PROBLEMS", q: "ESP32 / ESP8266 keeps restarting (boot loop)", steps: ["Check power — ESP needs 300–500mA; cheap USB hubs or weak chargers cause resets", "Add a 100µF electrolytic capacitor between 3.3V and GND close to the ESP board", "Never connect 5V sensors directly to ESP pins — 5V on an ESP pin destroys the GPIO instantly", "Check your code for infinite loops or blocking code that triggers the watchdog timer", "Add delay(10) at the end of loop() — a loop with zero delay triggers the watchdog", "Use Serial.println() to find exactly where the code crashes before the reset", "Update to the latest ESP32 board package in Board Manager — older versions have known crash bugs"] },
      { cat: "MCU PROBLEMS", q: "Arduino Uno / Nano resets randomly during operation", steps: ["External power issue — attach a 100µF capacitor between 5V and GND on the breadboard", "Check the reset pin (RST) — a loose wire touching RST causes resets", "Relay switching, motors, or solenoids cause voltage spikes — use a separate power supply for high-current loads", "Measure 5V with a multimeter while running — if it drops below 4.5V, the power supply is inadequate", "Check for infinite loops in code — if loop() never yields, the board can behave erratically", "Reduce the number of Serial.println() calls — too many can cause timing issues", "Make sure all GNDs are connected — a floating GND is a common source of random resets"] },
      { cat: "MCU PROBLEMS", q: "Analog readings are noisy / fluctuating wildly", steps: ["Add a 100nF ceramic capacitor between the sensor VCC and GND pins — placed physically close to the sensor", "Route sensor signal wires away from relay coil wires, motor wires, and power cables", "Take an average: read the pin 10 times and divide by 10 — eliminates most noise", "Add delay(10) before analogRead() to let the ADC settle after switching channels", "Use a proper external 5V power adapter instead of USB power — USB is noisy", "For liquid sensors: ensure the liquid is not touching the electronics or PCB", "ESP32 ADC is notoriously noisy — use GPIO34-39 (input-only) and add more averaging"] },
      { cat: "MCU PROBLEMS", q: "I2C sensor not detected (BH1750, LCD, etc.)", steps: ["Run the I2C Scanner sketch to find all connected I2C addresses (search 'Arduino I2C scanner code')", "Check SDA and SCL pins — they are different for each board: Uno=A4/A5, Mega=D20/D21, ESP32=GPIO21/22", "Add external 4.7kΩ pull-up resistors from SDA→VCC and from SCL→VCC", "Verify sensor voltage: BH1750 works at 3.3V or 5V, but confirm with your specific module", "Some sensors have an ADDR pin that selects between two I2C addresses (e.g. 0x23 or 0x5C for BH1750)", "Make sure Wire.begin() is called in setup() before any I2C communication", "If using ESP32: specify pins manually with Wire.begin(SDA_PIN, SCL_PIN)"] },

      // ── CODE ISSUES
      { cat: "CODE ISSUES", q: "Code compiles but sensor always reads 0", steps: ["Verify the pin number in your code matches where you physically wired the sensor", "For Uno/Nano analog sensors: you must use analogRead(A0) not analogRead(0) — they're different", "Add Serial.println(analogRead(A0)) right at the start of loop() to see the raw value", "Check that the sensor has power — measure VCC pin with multimeter (should be 3.3V or 5V)", "Some sensors need a warm-up delay — MQ sensors need 20 seconds, capacitive soil needs 1 second", "Make sure you're not reading the pin before setup() has completed — always read in loop()", "Check if a library function is failing silently — add error checks or print intermediate values"] },
      { cat: "CODE ISSUES", q: "Setpoints not triggering actuators (relay never switches)", steps: ["Add Serial.println() to print the sensor value AND the setpoint — check if the condition is ever true", "Check your comparison operator: use < for 'below threshold' and > for 'above threshold'", "Verify the relay pin number in code matches the physical wiring", "Test the relay independently: in setup(), add digitalWrite(RELAY_PIN, LOW); delay(1000); — if it clicks, relay is fine", "Check that the relay pin is declared as OUTPUT in setup(): pinMode(RELAY_PIN, OUTPUT)", "Make sure the sensor library is initialized: dht.begin(), sensors.begin(), bh1750.begin()", "If using multiple sensors, check that values are being read before the if-statement is evaluated"] },
      { cat: "CODE ISSUES", q: "Serial Monitor shows garbage characters or nothing", steps: ["Baud rate mismatch: Serial Monitor baud rate must match Serial.begin() in your code", "Uno/Nano: use 9600. ESP32/ESP8266: use 115200. Match both exactly", "In Serial Monitor: check the dropdown in bottom right — set it to the correct baud rate", "Make sure Serial.begin() is inside setup(), not loop()", "On ESP32: the first few characters on reset may be garbled — this is normal (ROM bootloader output)", "Try closing and reopening the Serial Monitor after uploading", "If no output at all: check that your code calls Serial.println() in loop(), not only in setup()"] },
      { cat: "CODE ISSUES", q: "Code works once then stops after a few minutes", steps: ["Memory leak: if you're creating variables inside loop(), they accumulate — declare them globally", "Check for delays that add up: multiple delay() calls inside loop() slow everything down", "Sensor reads that fail silently can lock up the loop — add timeout checks", "For ESP32: the watchdog timer reboots the board if loop() takes too long — add yield() or small delays", "Check heap memory: on ESP32, print ESP.getFreeHeap() to see if memory is running out", "Look for String concatenation in a loop — it fragments memory on AVR boards (Uno/Nano)", "Try adding delay(100) at the end of loop() as a temporary fix to find if timing is the issue"] },
    ];

    // ── DEBUG QUICK CODES ──────────────────────────────────────────────────────────
    const QUICK_CODES = {
      i2c_scan: `// I2C Scanner — finds all connected I2C devices and their addresses
#include <Wire.h>
void setup() {
  Serial.begin(9600);
  Wire.begin();
  Serial.println("Scanning I2C addresses...");
  for (byte addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.print("Found device at 0x");
      Serial.println(addr, HEX);
    }
  }
  Serial.println("Scan complete.");
}
void loop() {}`,

      analog_test: `// Analog Pin Tester — prints all analog pins every second
void setup() { Serial.begin(9600); }
void loop() {
  Serial.println("--- Analog Readings ---");
  Serial.print("A0: "); Serial.println(analogRead(A0));
  Serial.print("A1: "); Serial.println(analogRead(A1));
  Serial.print("A2: "); Serial.println(analogRead(A2));
  Serial.print("A3: "); Serial.println(analogRead(A3));
  delay(1000);
}`,

      relay_test: `// Relay Test — cycles relay ON and OFF every 2 seconds
const int RELAY_PIN = 6; // Change to your relay pin
void setup() {
  Serial.begin(9600);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // Start OFF (active-low)
  Serial.println("Relay test started");
}
void loop() {
  Serial.println("Relay ON");
  digitalWrite(RELAY_PIN, LOW);   // ON for active-low modules
  delay(2000);
  Serial.println("Relay OFF");
  digitalWrite(RELAY_PIN, HIGH);  // OFF
  delay(2000);
}`,

      dht_test: `// DHT22/DHT11 Tester
#include <DHT.h>
#define DHTPIN 4       // Change to your data pin
#define DHTTYPE DHT22  // Or DHT11
DHT dht(DHTPIN, DHTTYPE);
void setup() {
  Serial.begin(9600);
  dht.begin();
  delay(2000); // Wait for sensor to stabilize
}
void loop() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (isnan(h) || isnan(t)) {
    Serial.println("ERROR: DHT read failed! Check wiring and pull-up resistor.");
  } else {
    Serial.print("Temp: "); Serial.print(t); Serial.print("°C  Hum: ");
    Serial.print(h); Serial.println("%");
  }
  delay(2500);
}`,

      esp32_adc: `// ESP32 ADC Test — use GPIO34/35/36/39 for best analog results
void setup() { Serial.begin(115200); }
void loop() {
  int raw = analogRead(34); // GPIO34 — change as needed
  float voltage = raw * (3.3 / 4095.0);
  Serial.print("Raw: "); Serial.print(raw);
  Serial.print("  Voltage: "); Serial.print(voltage, 2);
  Serial.println("V");
  delay(500);
}`,
    };

    // ─── REPORT TEMPLATE GENERATOR ────────────────────────────────────────────────
    function generateReport(mcu, system, spKey, sensors, actuators) {
      const m = MCU[mcu] || {};
      const sp = spKey && SPECIES[system]?.[spKey];
      const sysLabel = system === "greenhouse" ? "Greenhouse" : system === "aquaculture" ? "Aquaculture" : "Hybrid Aquaponics";
      const sKeys = Object.keys(sensors);
      const aKeys = Object.keys(actuators);
      let r = "";
      r += "FALLA7 CAPSTONE PROJECT REPORT\n";
      r += "Engineering the Living System — Feedback Control System\n";
      r += "Capstone Challenge 2025-2026\n";
      r += "=".repeat(55) + "\n\n";
      r += "STUDENT INFORMATION\n" + "-".repeat(30) + "\n";
      r += "Name       : ____________________________\n";
      r += "School     : ____________________________\n";
      r += "Grade      : 11\n";
      r += "Date       : " + new Date().toLocaleDateString("en-EG") + "\n\n";
      r += "PROJECT OVERVIEW\n" + "-".repeat(30) + "\n";
      r += "System Type     : " + sysLabel + "\n";
      r += "Target Species  : " + (sp?.name || "General") + "\n";
      r += (sp?.desc ? "Species Notes   : " + sp.desc + "\n" : "");
      r += "Microcontroller : " + (m.label || "N/A") + " (" + (m.chip || "") + ")\n";
      r += "Operating Volt  : " + (m.voltage || "5V") + "\n\n";
      r += "PROBLEM STATEMENT\n" + "-".repeat(30) + "\n";
      r += "Manual monitoring of " + sysLabel.toLowerCase() + " environments is time-consuming and ";
      r += "error-prone. Changes in " + (sKeys.slice(0, 2).map(k => SENSORS[k]?.label || k).join(", ")) + " can harm ";
      r += (sp?.name || "the organisms") + " if not detected quickly. This project automates monitoring and ";
      r += "response using a closed-loop feedback control system built from recycled materials.\n\n";
      r += "ENGINEERING DESIGN\n" + "-".repeat(30) + "\n";
      r += "This system uses a closed-loop feedback control architecture:\n";
      r += "  SENSE → PROCESS → ACT → (repeat)\n\n";
      r += "1. SENSORS USED (" + sKeys.length + " total)\n";
      sKeys.forEach((k, i) => {
        const s = SENSORS[k];
        const v = sensors[k];
        r += "   " + (i + 1) + ". " + (s?.label || k) + "\n";
        r += "      - Measures: " + (s?.label || k) + "\n";
        r += "      - Target range: " + v.min + " – " + v.max + "\n";
        r += "      - Connection type: " + (s?.type || "analog") + "\n";
      });
      r += "\n2. ACTUATORS USED (" + aKeys.length + " total)\n";
      aKeys.forEach((k, i) => {
        r += "   " + (i + 1) + ". " + (ACTUATORS[k]?.label || k) + " (controlled via relay module)\n";
      });
      r += "\n3. CONTROL LOGIC\n";
      r += "   Each sensor reading is compared to its setpoint range.\n";
      r += "   If the value goes out of range, the corresponding actuator activates.\n";
      r += "   This creates a negative feedback loop that maintains optimal conditions.\n\n";
      r += "MATERIALS LIST\n" + "-".repeat(30) + "\n";
      r += "   - 1x " + (m.label || "Arduino") + "\n";
      sKeys.forEach(k => r += "   - 1x " + (SENSORS[k]?.label || k) + "\n");
      aKeys.forEach(k => r += "   - 1x " + (ACTUATORS[k]?.label || k) + " + relay module\n");
      r += "   - Breadboard and jumper wires\n";
      r += "   - USB cable and power supply\n";
      r += "   - Recycled materials for enclosure: ____________________________\n\n";
      r += "RESULTS & OBSERVATIONS\n" + "-".repeat(30) + "\n";
      r += "   Date of test  : ____________________________\n";
      r += "   Duration      : ____________________________\n";
      r += "   Sensor readings observed:\n";
      sKeys.forEach(k => r += "      " + (SENSORS[k]?.label || k) + " : ____________________________\n");
      r += "   Actuators triggered: ____________________________\n";
      r += "   Did the system maintain target conditions? Yes / No\n\n";
      r += "DISCUSSION\n" + "-".repeat(30) + "\n";
      r += "   What worked well:\n   ____________________________\n\n";
      r += "   Challenges faced:\n   ____________________________\n\n";
      r += "   How recycled materials were used:\n   ____________________________\n\n";
      r += "CONCLUSION\n" + "-".repeat(30) + "\n";
      r += "   This project successfully demonstrates a closed-loop feedback control system\n";
      r += "   for " + sysLabel.toLowerCase() + " using " + sKeys.length + " sensors and " + aKeys.length + " actuators.\n";
      r += "   The system automatically maintains optimal conditions for " + (sp?.name || "the target species") + ".\n\n";
      r += "REFERENCES\n" + "-".repeat(30) + "\n";
      r += "   - Arduino Documentation: https://docs.arduino.cc\n";
      r += "   - Falla7 Assistant: Generated using Falla7 Code Generator\n";
      r += "   - DHT Library: Adafruit DHT sensor library\n";
      r += "   - ____________________________\n";
      return r;
    }

    // ─── SPECIES DB ───────────────────────────────────────────────────────────────
    const SPECIES = {
      greenhouse: {
        // ── Original 15 ──
        tomato:     { name: "Tomato",     desc: "Warm-season fruit. Needs high light and consistent moisture. Very popular in Egyptian greenhouses.",          dht22: [18, 28], bh1750: [6000, 40000], soil_moisture: [400, 700] },
        pepper:     { name: "Pepper",     desc: "Heat-loving crop. Needs bright light and moderate watering. Grows well in hot Egyptian climate.",             dht22: [20, 30], bh1750: [8000, 50000], soil_moisture: [400, 650] },
        cucumber:   { name: "Cucumber",   desc: "Fast-growing vine. Loves warmth and consistent moisture. High water demand in summer.",                       dht22: [18, 26], bh1750: [5000, 35000], soil_moisture: [450, 750] },
        lettuce:    { name: "Lettuce",    desc: "Cool-season leafy green. Prefers lower temperatures. Quick to harvest — great for beginners.",               dht22: [15, 22], bh1750: [2000, 20000], soil_moisture: [500, 800] },
        basil:      { name: "Basil",      desc: "Aromatic herb. Grows fast and loves warmth. Sensitive to cold — keep above 18°C at all times.",              dht22: [18, 30], bh1750: [4000, 30000], soil_moisture: [400, 700] },
        strawberry: { name: "Strawberry", desc: "Sweet fruiting plant. Needs cooler nights and bright days. Popular in hydroponic greenhouse setups.",         dht22: [15, 24], bh1750: [4000, 40000], soil_moisture: [350, 650] },
        spinach:    { name: "Spinach",    desc: "Cold-tolerant leafy green. Low light requirement. Fast growing — harvest in 4–6 weeks.",                     dht22: [10, 20], bh1750: [2000, 20000], soil_moisture: [500, 750] },
        mint:       { name: "Mint",       desc: "Hardy perennial herb. Spreads easily. Needs moisture and partial shade. High market value in Egypt.",         dht22: [15, 25], bh1750: [2000, 20000], soil_moisture: [500, 800] },
        carrot:     { name: "Carrot",     desc: "Root vegetable. Needs loose, deep soil and consistent watering. Cooler temps improve sweetness.",             dht22: [15, 22], bh1750: [3000, 30000], soil_moisture: [400, 700] },
        eggplant:   { name: "Eggplant",   desc: "Warm-season fruiting vegetable. Very common in Egypt. Loves heat and needs steady moisture supply.",          dht22: [20, 30], bh1750: [6000, 40000], soil_moisture: [400, 700] },
        zucchini:   { name: "Zucchini",   desc: "Prolific squash variety. Grows quickly in warm conditions. Needs good airflow to prevent fungal disease.",    dht22: [18, 28], bh1750: [5000, 35000], soil_moisture: [420, 720] },
        parsley:    { name: "Parsley",    desc: "Biennial herb with high market demand. Tolerates light frost. Slow to germinate but easy to maintain.",       dht22: [10, 24], bh1750: [2000, 25000], soil_moisture: [450, 750] },
        coriander:  { name: "Coriander",  desc: "Fast-growing herb. Prefers cool conditions — bolts quickly in heat. Harvest leaves before flowering.",        dht22: [10, 22], bh1750: [2000, 20000], soil_moisture: [400, 700] },
        beans:      { name: "Beans",      desc: "Nitrogen-fixing legume. Easy to grow and harvest. Needs warm temps and consistent moisture.",                 dht22: [18, 28], bh1750: [4000, 35000], soil_moisture: [400, 700] },
        corn:       { name: "Corn",       desc: "Tall warm-season grain. Needs full sun and high light intensity. High water requirement during growth.",       dht22: [18, 30], bh1750: [8000, 50000], soil_moisture: [400, 700] },
        // ── New 20 greenhouse ──
        onion:      { name: "Onion",      desc: "Bulb vegetable. Needs long days and dry conditions near harvest. Very widely grown across Egypt.",            dht22: [13, 24], bh1750: [4000, 35000], soil_moisture: [300, 600] },
        garlic:     { name: "Garlic",     desc: "Aromatic bulb crop. Needs cool temp early, warmth at bulbing. Very high market demand year-round.",           dht22: [10, 22], bh1750: [3000, 30000], soil_moisture: [300, 600] },
        potato:     { name: "Potato",     desc: "Starchy tuber. Prefers cool soil for tuber formation. Sensitive to waterlogging — keep drainage good.",      dht22: [15, 22], bh1750: [3000, 30000], soil_moisture: [350, 650] },
        sweet_potato: { name: "Sweet Potato", desc: "Tropical tuber. Needs warm temps and full sun. Very drought-tolerant once established.",                 dht22: [20, 30], bh1750: [6000, 40000], soil_moisture: [300, 600] },
        watermelon: { name: "Watermelon", desc: "Large fruiting vine. Needs intense heat and full sun. Egypt is a leading global exporter.",                   dht22: [22, 32], bh1750: [8000, 60000], soil_moisture: [350, 650] },
        melon:      { name: "Melon",      desc: "Sweet fruiting vine. Needs high temps and low humidity at harvest for best flavor. Very popular in Egypt.",   dht22: [22, 30], bh1750: [7000, 55000], soil_moisture: [300, 600] },
        pumpkin:    { name: "Pumpkin",    desc: "Large gourd. Needs warm temps and space. Very easy to grow — popular in school greenhouse projects.",         dht22: [18, 28], bh1750: [5000, 40000], soil_moisture: [380, 680] },
        cabbage:    { name: "Cabbage",    desc: "Cool-season brassica. Very nutritious. Susceptible to heat — grow in autumn/winter in Egypt.",               dht22: [10, 20], bh1750: [2500, 25000], soil_moisture: [480, 780] },
        cauliflower:{ name: "Cauliflower",desc: "Brassica crop. Requires cool temps for curd formation. Popular in Egyptian winter markets.",                  dht22: [10, 20], bh1750: [2500, 25000], soil_moisture: [480, 780] },
        broccoli:   { name: "Broccoli",   desc: "Nutritious brassica. Needs cool temps and consistent moisture. Bolt-prone in heat above 25°C.",               dht22: [10, 18], bh1750: [2500, 25000], soil_moisture: [480, 780] },
        celery:     { name: "Celery",     desc: "Long-season cool crop. Needs very consistent watering. High humidity prevents tip burn.",                     dht22: [12, 20], dht22_hum: [60, 80], bh1750: [2000, 20000], soil_moisture: [550, 850] },
        peas:       { name: "Peas",       desc: "Cool-season legume. Climbs trellises. Fix nitrogen — good companion plant. Harvest before summer heat.",     dht22: [10, 18], bh1750: [3000, 30000], soil_moisture: [450, 750] },
        okra:       { name: "Okra",       desc: "Heat-loving subtropical vegetable. Very common in Egyptian cuisine. Drought-tolerant but benefits from irrigation.", dht22: [22, 34], bh1750: [8000, 60000], soil_moisture: [300, 600] },
        sunflower:  { name: "Sunflower",  desc: "Tall oil/ornamental crop. Needs full sun and warm temps. Useful for school projects and phytoremediation.", dht22: [18, 28], bh1750: [8000, 65000], soil_moisture: [300, 600] },
        chamomile:  { name: "Chamomile",  desc: "Medicinal herb. Prefers cool, dry conditions. High commercial value in Egyptian herbal export market.",       dht22: [10, 22], bh1750: [2000, 20000], soil_moisture: [300, 550] },
        rosemary:   { name: "Rosemary",   desc: "Woody Mediterranean herb. Drought-tolerant. Needs well-drained soil and lots of sunlight.",                  dht22: [15, 28], bh1750: [4000, 40000], soil_moisture: [200, 450] },
        thyme:      { name: "Thyme",      desc: "Small aromatic herb. Very drought-tolerant. Prefers light soil and bright sun. Strong Egyptian export demand.", dht22: [15, 28], bh1750: [4000, 40000], soil_moisture: [200, 450] },
        lemon:      { name: "Lemon",      desc: "Citrus tree/dwarf variety. Needs warmth and deep watering. High value in Egyptian fruit markets.",            dht22: [15, 30], bh1750: [6000, 50000], soil_moisture: [350, 700] },
        fig:        { name: "Fig",        desc: "Hardy fruit tree. Drought-resistant once established. Needs hot dry summers typical of Egyptian climate.",    dht22: [18, 34], bh1750: [6000, 50000], soil_moisture: [250, 550] },
        grape:      { name: "Grape",      desc: "Fruiting vine. Needs summer heat and dry harvest. Widely grown in Upper Egypt. Requires trellis support.",    dht22: [18, 32], bh1750: [6000, 50000], soil_moisture: [300, 600] },
        // ── New 50 greenhouse ──
        radish:       { name: "Radish",       desc: "Fast-maturing root vegetable. Ready in 3–4 weeks. Prefers cool temps. Great for beginners and school projects.",      dht22: [10, 20], bh1750: [3000, 28000], soil_moisture: [400, 700] },
        turnip:       { name: "Turnip",       desc: "Hardy cool-season root crop. Both roots and leaves are edible. Very common in Egyptian winter markets.",              dht22: [10, 20], bh1750: [3000, 28000], soil_moisture: [380, 680] },
        beet:         { name: "Beet",         desc: "Dual-use crop — roots and leaves both eaten. Needs consistent moisture. Good for Egyptian autumn planting.",          dht22: [10, 22], bh1750: [3000, 28000], soil_moisture: [400, 700] },
        leek:         { name: "Leek",         desc: "Long-season onion relative. Tolerates cold. Needs steady watering. High demand in Egyptian winter markets.",          dht22: [10, 22], bh1750: [3000, 28000], soil_moisture: [420, 720] },
        swiss_chard:  { name: "Swiss Chard",  desc: "Hardy leafy green. Tolerates heat better than spinach. Easy to grow year-round in moderate Egyptian climates.",       dht22: [12, 26], bh1750: [2000, 22000], soil_moisture: [450, 750] },
        kale:         { name: "Kale",         desc: "Superfood brassica. Very cold-tolerant. Grows well in Egyptian winters. High nutritional and export value.",          dht22: [8, 20], bh1750: [2500, 24000], soil_moisture: [450, 750] },
        arugula:      { name: "Arugula",      desc: "Fast-growing peppery salad leaf. Bolts quickly in heat — grow in autumn/winter. Harvest in just 3 weeks.",           dht22: [10, 20], bh1750: [2000, 20000], soil_moisture: [400, 680] },
        chives:       { name: "Chives",       desc: "Small perennial herb. Very low maintenance. Regrows after harvest. Excellent for hydroponic channels.",               dht22: [15, 24], bh1750: [2500, 22000], soil_moisture: [420, 700] },
        dill:         { name: "Dill",         desc: "Aromatic herb. Prefers cool weather. Widely used in Egyptian cooking. Bolts in heat — plant in autumn.",              dht22: [10, 22], bh1750: [3000, 28000], soil_moisture: [350, 650] },
        fennel:       { name: "Fennel",       desc: "Aromatic vegetable/herb. Edible bulb and fronds. Prefers full sun. Very popular in Mediterranean cuisine.",           dht22: [12, 24], bh1750: [5000, 40000], soil_moisture: [320, 620] },
        sage:         { name: "Sage",         desc: "Woody perennial herb. Drought-tolerant. Needs full sun and good drainage. Strong export demand for herbal market.",   dht22: [15, 28], bh1750: [4000, 38000], soil_moisture: [200, 480] },
        oregano:      { name: "Oregano",      desc: "Mediterranean herb. Very drought-tolerant once established. Needs well-drained soil and strong sunlight.",            dht22: [15, 28], bh1750: [4000, 40000], soil_moisture: [200, 450] },
        tarragon:     { name: "Tarragon",     desc: "French aromatic herb. Prefers dry, warm conditions. High-value culinary herb with growing Egyptian export demand.",   dht22: [15, 26], bh1750: [3500, 35000], soil_moisture: [220, 480] },
        lemongrass:   { name: "Lemongrass",   desc: "Tropical grass herb. Loves heat and full sun. Very popular in Egyptian herbal medicine and culinary markets.",        dht22: [20, 34], bh1750: [6000, 50000], soil_moisture: [350, 650] },
        stevia:       { name: "Stevia",       desc: "Natural sweetener plant. Needs warm sunny conditions. Very high commercial value as sugar substitute.",               dht22: [18, 30], bh1750: [5000, 42000], soil_moisture: [350, 650] },
        lavender:     { name: "Lavender",     desc: "Aromatic perennial shrub. Very drought-tolerant. Needs well-drained alkaline soil. High essential oil value.",        dht22: [15, 28], bh1750: [5000, 45000], soil_moisture: [200, 450] },
        calendula:    { name: "Calendula",    desc: "Medicinal and edible flower. Thrives in cool seasons. Easy to grow. Used in cosmetics and herbal products.",          dht22: [10, 22], bh1750: [4000, 35000], soil_moisture: [350, 650] },
        aloe_vera:    { name: "Aloe Vera",    desc: "Succulent with medicinal value. Extremely drought-tolerant. Needs minimal water and well-drained soil.",              dht22: [15, 32], bh1750: [5000, 50000], soil_moisture: [150, 400] },
        moringa:      { name: "Moringa",      desc: "Superfood tree. Fast-growing in Egyptian heat. Leaves, pods, and seeds all have high nutritional and market value.", dht22: [22, 36], bh1750: [7000, 60000], soil_moisture: [250, 550] },
        amaranth:     { name: "Amaranth",     desc: "Grain and leafy vegetable. Very heat-tolerant. Grows fast in Egyptian summer. High protein content.",                dht22: [20, 34], bh1750: [6000, 50000], soil_moisture: [300, 600] },
        quinoa:       { name: "Quinoa",       desc: "High-protein grain crop. Prefers cool temps and dry conditions. Emerging premium crop in Egyptian agriculture.",      dht22: [12, 24], bh1750: [5000, 40000], soil_moisture: [280, 560] },
        artichoke:    { name: "Artichoke",    desc: "Thistle vegetable. Prefers cool temps and deep watering. Egypt is a top global producer and exporter.",              dht22: [12, 22], bh1750: [5000, 40000], soil_moisture: [420, 720] },
        asparagus:    { name: "Asparagus",    desc: "Perennial vegetable. Takes 2–3 seasons to establish but then produces for 10+ years. Very high market value.",       dht22: [14, 24], bh1750: [5000, 40000], soil_moisture: [350, 650] },
        endive:       { name: "Endive",       desc: "Bitter leafy vegetable. Prefers cool conditions. Good in Egyptian autumn/winter. Grown for high-end restaurant markets.", dht22: [10, 20], bh1750: [2000, 20000], soil_moisture: [450, 750] },
        radicchio:    { name: "Radicchio",    desc: "Red chicory. Bitter and colorful salad leaf. Cool-season crop. High value in Egyptian export and premium markets.",   dht22: [10, 18], bh1750: [2000, 20000], soil_moisture: [450, 750] },
        pak_choi:     { name: "Pak Choi",     desc: "Asian brassica. Very fast-growing cool-season crop. Harvest in 4–5 weeks. Popular in hydroponic greenhouse systems.", dht22: [10, 20], bh1750: [2500, 22000], soil_moisture: [480, 780] },
        kohlrabi:     { name: "Kohlrabi",     desc: "Unusual brassica with swollen stem. Fast-maturing cool crop. Crunchy and nutritious. Good for greenhouse projects.",  dht22: [10, 20], bh1750: [2500, 24000], soil_moisture: [450, 750] },
        bok_choy:     { name: "Bok Choy",     desc: "Chinese cabbage variety. Very fast growth in cool weather. Ideal for hydroponic systems. Harvest in 4 weeks.",        dht22: [10, 20], bh1750: [2500, 22000], soil_moisture: [480, 780] },
        brussels_sprouts: { name: "Brussels Sprouts", desc: "Small brassica heads. Needs cool weather and long growing season. Slow but very high nutritional value.",   dht22: [8, 18], bh1750: [3000, 28000], soil_moisture: [480, 780] },
        microgreens:  { name: "Microgreens",  desc: "Young seedlings harvested at 1–2 weeks. Very fast crop. No soil needed — perfect for simple hydroponic trays.",      dht22: [18, 24], bh1750: [3000, 28000], soil_moisture: [500, 800] },
        wheatgrass:   { name: "Wheatgrass",   desc: "Young wheat shoots harvested at 7–10 days. High nutritional value. Extremely easy to grow in trays.",                dht22: [16, 22], bh1750: [3000, 28000], soil_moisture: [550, 850] },
        sprouts:      { name: "Bean Sprouts", desc: "Germinated mung beans. No soil needed — just water. Harvest in 3–4 days. Very easy intro project for beginners.",    dht22: [20, 28], bh1750: [0, 5000], soil_moisture: [600, 900] },
        watercress:   { name: "Watercress",   desc: "Aquatic leafy herb. Grows in shallow flowing water. Very nutritious. Ideal for water-based hydroponic channels.",    dht22: [10, 18], bh1750: [2000, 20000], soil_moisture: [700, 1000] },
        nasturtium:   { name: "Nasturtium",   desc: "Edible flower and herb. Easy to grow. Tolerates poor soil. Flowers and leaves both edible. Good school project.",    dht22: [14, 24], bh1750: [4000, 35000], soil_moisture: [300, 600] },
        marigold:     { name: "Marigold",     desc: "Companion plant and medicinal flower. Repels pests naturally. Very easy to grow. Useful alongside vegetable crops.",  dht22: [16, 30], bh1750: [5000, 45000], soil_moisture: [300, 580] },
        hibiscus:     { name: "Hibiscus",     desc: "Medicinal flower plant — karkadeh. Very popular Egyptian crop. Needs heat and full sun. High export value.",          dht22: [20, 34], bh1750: [7000, 55000], soil_moisture: [300, 600] },
        jasmine:      { name: "Jasmine",      desc: "Fragrant flowering vine. Needs warmth and support. Very popular in Egypt for perfume and essential oil extraction.", dht22: [18, 30], bh1750: [5000, 42000], soil_moisture: [350, 650] },
        geranium:     { name: "Geranium",     desc: "Ornamental and medicinal plant. Drought-tolerant. Used for essential oil extraction. Easy to propagate by cuttings.", dht22: [15, 28], bh1750: [4000, 40000], soil_moisture: [250, 520] },
        pomegranate:  { name: "Pomegranate",  desc: "Drought-tolerant fruit shrub/tree. Very well-adapted to Egyptian climate. High value fruit for local and export markets.", dht22: [18, 34], bh1750: [7000, 60000], soil_moisture: [250, 550] },
        olive:        { name: "Olive",        desc: "Mediterranean tree. Extremely drought-tolerant. Egypt is a significant producer. Long lifespan and very high oil value.", dht22: [14, 32], bh1750: [7000, 65000], soil_moisture: [150, 400] },
        mango:        { name: "Mango",        desc: "Tropical fruiting tree. Loves Egyptian heat. Dwarf varieties work well in greenhouses. Very high market value.",      dht22: [22, 36], bh1750: [8000, 65000], soil_moisture: [300, 600] },
        guava:        { name: "Guava",        desc: "Tropical fruit tree. Grows fast in Egyptian heat. Dwarf container varieties ideal for greenhouse systems.",           dht22: [20, 34], bh1750: [6000, 55000], soil_moisture: [300, 600] },
        banana:       { name: "Banana",       desc: "Tropical plant. Needs high heat, moisture, and rich soil. Dwarf varieties suitable for large greenhouses.",          dht22: [22, 36], bh1750: [8000, 60000], soil_moisture: [400, 700] },
        papaya:       { name: "Papaya",       desc: "Fast-growing tropical fruit. Fruits within 9 months. Needs heat and protection from cold. Very high nutrition.",     dht22: [22, 36], bh1750: [7000, 60000], soil_moisture: [350, 650] },
        passion_fruit:{ name: "Passion Fruit",desc: "Climbing tropical vine. Needs warmth and support. Fast-growing. Very high market value in Egyptian premium markets.", dht22: [20, 32], bh1750: [6000, 55000], soil_moisture: [350, 650] },
        dragon_fruit: { name: "Dragon Fruit", desc: "Cactus fruit with growing Egyptian market. Extremely drought-tolerant. Needs full sun and well-drained soil.",       dht22: [18, 34], bh1750: [7000, 65000], soil_moisture: [180, 420] },
        pitaya:       { name: "Pitaya",       desc: "Climbing cactus crop. Needs minimal water and full sun. Very ornamental. High commercial value as exotic fruit.",    dht22: [18, 34], bh1750: [7000, 65000], soil_moisture: [180, 420] },
        turmeric:     { name: "Turmeric",     desc: "Tropical root spice. Needs warmth and humidity. Very high demand in Egyptian herbal medicine and spice markets.",    dht22: [20, 32], dht22_hum: [60, 80], bh1750: [4000, 36000], soil_moisture: [450, 750] },
        ginger:       { name: "Ginger",       desc: "Tropical root spice. Needs warmth and partial shade. Very high demand in Egyptian cooking and herbal medicine.",     dht22: [20, 32], dht22_hum: [60, 80], bh1750: [2000, 20000], soil_moisture: [450, 750] },
        saffron:      { name: "Saffron",      desc: "Luxury spice crocus. Needs cool dry conditions at flowering. One of the highest-value crops per gram in the world.", dht22: [10, 18], bh1750: [5000, 45000], soil_moisture: [250, 500] },
        cardamom:     { name: "Cardamom",     desc: "Tropical spice plant. Needs warmth, humidity and partial shade. Very high market value in Egyptian spice trade.",    dht22: [18, 30], dht22_hum: [65, 85], bh1750: [2000, 18000], soil_moisture: [450, 750] },
        cinnamon:     { name: "Cinnamon",     desc: "Tropical tree grown for bark spice. Needs warmth and humidity. Dwarf/pot varieties suitable for greenhouse projects.", dht22: [20, 32], dht22_hum: [60, 80], bh1750: [4000, 36000], soil_moisture: [400, 700] },
      },
      aquaculture: {
        // ── Original 10 ──
        tilapia:   { name: "Tilapia",    desc: "Hardy warm-water fish. Most farmed fish in Egypt. Tolerates low oxygen and poor water quality well.",          ds18b20: [25, 30], ph: [65, 85], tds: [200, 600], water_level: [400, 900] },
        catfish:   { name: "Catfish",    desc: "Bottom-feeding omnivore. Grows fast and handles stress well. Very popular in Egyptian fish farms.",            ds18b20: [22, 28], ph: [60, 80], tds: [100, 500], water_level: [400, 900] },
        trout:     { name: "Trout",      desc: "Cold-water fish. Needs clean, well-oxygenated water. High market value but sensitive to temperature.",         ds18b20: [10, 18], ph: [65, 80], tds: [100, 400], water_level: [400, 900] },
        carp:      { name: "Carp",       desc: "Omnivorous freshwater fish. Very tolerant and adaptable. Grows well in Egyptian ponds and tanks.",             ds18b20: [20, 28], ph: [65, 85], tds: [200, 700], water_level: [400, 900] },
        shrimp:    { name: "Shrimp",     desc: "Fast-growing crustacean with high export value. Sensitive to water quality — monitor TDS and pH closely.",    ds18b20: [24, 30], ph: [75, 85], tds: [300, 800], water_level: [400, 900] },
        bass:      { name: "Bass",       desc: "Predatory freshwater fish. Grows well in controlled tank systems. Needs clean, cool, oxygenated water.",       ds18b20: [18, 24], ph: [65, 80], tds: [100, 400], water_level: [400, 900] },
        nile_perch:{ name: "Nile Perch", desc: "Large predatory fish native to Lake Nile. Fast growth rate. High commercial value in African markets.",        ds18b20: [24, 30], ph: [65, 85], tds: [200, 600], water_level: [400, 900] },
        mullet:    { name: "Mullet",     desc: "Coastal fish that adapts to fresh and brackish water. Widely consumed in Egypt. Easy to raise in ponds.",      ds18b20: [20, 28], ph: [65, 85], tds: [200, 700], water_level: [400, 900] },
        crayfish:  { name: "Crayfish",   desc: "Freshwater crustacean. Growing export market. Sensitive to ammonia buildup — needs clean water.",              ds18b20: [18, 24], ph: [65, 80], tds: [200, 600], water_level: [400, 900] },
        frog:      { name: "Frog",       desc: "Amphibian with medicinal and culinary value. Needs both water and land areas. Very sensitive to pollution.",   ds18b20: [20, 26], ph: [60, 75], tds: [100, 300], water_level: [400, 900] },
        // ── New 15 aquaculture ──
        eel:       { name: "Eel",        desc: "Nocturnal bottom fish with high market value. Tolerates low oxygen. Needs hiding spots and tight tank lids.", ds18b20: [22, 28], ph: [60, 80], tds: [100, 500], water_level: [400, 900] },
        seabream:  { name: "Seabream",   desc: "Marine/brackish fish farmed in coastal Egypt. Needs carefully managed salinity and clean water.",              ds18b20: [18, 26], ph: [75, 85], tds: [500, 1500], water_level: [400, 900] },
        seabass:   { name: "Seabass",    desc: "High-value marine fish. Needs well-oxygenated, clean brackish/marine water. Popular in Egyptian aquafarms.", ds18b20: [18, 26], ph: [75, 85], tds: [500, 1500], water_level: [400, 900] },
        clam:      { name: "Clam",       desc: "Filter-feeding bivalve. Very sensitive to turbidity and pollutants. Needs pristine water and stable pH.",      ds18b20: [15, 25], ph: [78, 88], tds: [300, 800], turbidity: [0, 100], water_level: [400, 900] },
        oyster:    { name: "Oyster",     desc: "Filter-feeding bivalve. Improves water quality naturally. High economic value. pH and salinity critical.",     ds18b20: [15, 25], ph: [78, 88], tds: [300, 800], turbidity: [0, 100], water_level: [400, 900] },
        goldfish:  { name: "Goldfish",   desc: "Ornamental fish. Produces high ammonia — needs good filtration and aeration. Easy starter aquaculture.",       ds18b20: [18, 24], ph: [65, 75], tds: [100, 400], water_level: [400, 900] },
        koi:       { name: "Koi",        desc: "Ornamental carp with very high market value. Needs high water clarity and stable parameters.",                ds18b20: [18, 26], ph: [68, 78], tds: [100, 500], turbidity: [0, 150], water_level: [400, 900] },
        salmon:    { name: "Salmon",     desc: "Cold-water premium fish. Needs very cold, oxygen-rich water. Suitable for high-altitude Egyptian projects.",  ds18b20: [6, 14], ph: [65, 78], tds: [100, 400], water_level: [400, 900] },
        snakehead: { name: "Snakehead",  desc: "Air-breathing predatory fish. Very hardy and fast-growing. Good for low-tech aquaculture setups.",             ds18b20: [24, 32], ph: [60, 80], tds: [100, 600], water_level: [400, 900] },
        turtle:    { name: "Turtle",     desc: "Semi-aquatic reptile with medicinal and ornamental value. Needs both basking area and clean water zone.",      ds18b20: [24, 30], ph: [65, 80], tds: [100, 400], water_level: [400, 900] },
        mussel:    { name: "Mussel",     desc: "Marine bivalve. Filter feeder that purifies water. Needs stable salinity and turbidity monitoring.",           ds18b20: [14, 22], ph: [78, 88], tds: [400, 1000], turbidity: [0, 120], water_level: [400, 900] },
        abalone:   { name: "Abalone",    desc: "High-value marine gastropod. Needs pristine water, stable temperature, and algae-based diet.",                ds18b20: [12, 18], ph: [78, 84], tds: [300, 800], water_level: [400, 900] },
        lobster:   { name: "Lobster",    desc: "High-value marine crustacean. Needs cold, oxygen-rich, clean salt water. Premium export product.",            ds18b20: [12, 22], ph: [78, 86], tds: [500, 1500], water_level: [400, 900] },
        spirulina: { name: "Spirulina",  desc: "Microalgae crop. Needs alkaline water and warm temps. Very high nutritional and commercial value.",            ds18b20: [28, 35], ph: [85, 105], tds: [2000, 5000], water_level: [400, 900] },
        daphnia:   { name: "Daphnia",    desc: "Water flea — live fish food. Grows fast in warm water with organic nutrients. Easy to culture indoors.",       ds18b20: [18, 26], ph: [68, 82], tds: [150, 500], water_level: [400, 900] },
      },
      hybrid: {
        // ── Original 6 ──
        tilapia_lettuce:    { name: "Tilapia + Lettuce",    desc: "Classic aquaponics pair. Fish waste fertilizes lettuce directly. Low maintenance and very efficient.",            ds18b20: [25, 28], dht22: [18, 24], ph: [65, 75], water_level: [400, 900], soil_moisture: [500, 800] },
        tilapia_tomato:     { name: "Tilapia + Tomato",     desc: "High-yield combo. Tilapia produce nitrates that boost tomato growth. Needs strong lighting for tomatoes.",        ds18b20: [26, 30], dht22: [20, 28], ph: [65, 80], water_level: [400, 900], soil_moisture: [400, 700] },
        carp_basil:         { name: "Carp + Basil",         desc: "Cost-effective pairing. Carp tolerate variable conditions and basil thrives on the nutrient-rich water.",         ds18b20: [22, 28], dht22: [18, 28], ph: [65, 80], water_level: [400, 900], soil_moisture: [400, 700] },
        shrimp_spinach:     { name: "Shrimp + Spinach",     desc: "Cool-system pairing. Spinach prefers cooler air and shrimp like clean water. Monitor ammonia closely.",           ds18b20: [24, 28], dht22: [14, 20], ph: [70, 78], water_level: [400, 900], soil_moisture: [500, 780] },
        catfish_pepper:     { name: "Catfish + Pepper",     desc: "Warm robust combo. Catfish tolerate nutrient fluctuations well. Pepper needs bright light overhead.",             ds18b20: [24, 28], dht22: [20, 28], ph: [62, 78], water_level: [400, 900], soil_moisture: [400, 650] },
        nile_perch_beans:   { name: "Nile Perch + Beans",   desc: "African-native pairing. Nile perch produce high nutrient load. Beans fix nitrogen and absorb fish waste well.",   ds18b20: [24, 30], dht22: [18, 28], ph: [65, 82], water_level: [400, 900], soil_moisture: [400, 700] },
        // ── New 15 hybrid ──
        tilapia_cucumber:   { name: "Tilapia + Cucumber",   desc: "Warm and productive combo. Cucumbers absorb nutrients fast. Needs good grow lighting.",                          ds18b20: [25, 30], dht22: [20, 28], ph: [65, 78], water_level: [400, 900], soil_moisture: [450, 750] },
        tilapia_strawberry: { name: "Tilapia + Strawberry", desc: "High-value aquaponics. Strawberries love NFT channels with fish water. Keep pH 6.0-6.5 for best fruit.",         ds18b20: [24, 28], dht22: [16, 22], ph: [60, 65], water_level: [400, 900], soil_moisture: [350, 650] },
        carp_mint:          { name: "Carp + Mint",          desc: "Aromatic and profitable. Mint thrives in aquaponic channels. Carp are very tolerant of fluctuations.",            ds18b20: [20, 28], dht22: [15, 25], ph: [65, 80], water_level: [400, 900], soil_moisture: [500, 800] },
        catfish_spinach:    { name: "Catfish + Spinach",    desc: "Easy beginner combo. Catfish tolerate varied conditions and spinach needs low light — perfect indoors.",          ds18b20: [22, 28], dht22: [10, 20], ph: [60, 78], water_level: [400, 900], soil_moisture: [500, 750] },
        bass_lettuce:       { name: "Bass + Lettuce",       desc: "Clean water combo. Bass need high water quality which also keeps lettuce healthy and crisp.",                     ds18b20: [18, 24], dht22: [15, 22], ph: [65, 75], water_level: [400, 900], soil_moisture: [500, 800] },
        trout_watercress:   { name: "Trout + Watercress",   desc: "Cold-system pairing. Watercress is perfectly adapted to cold, flowing fish water. Very nutritious crop.",         ds18b20: [10, 16], dht22: [10, 18], ph: [65, 78], water_level: [400, 900], soil_moisture: [600, 900] },
        shrimp_herbs:       { name: "Shrimp + Herbs",       desc: "Premium combo. Shrimp water is rich in nutrients ideal for basil, mint, and coriander hydroponic channels.",      ds18b20: [24, 30], dht22: [18, 28], ph: [70, 80], water_level: [400, 900], soil_moisture: [400, 700] },
        mullet_parsley:     { name: "Mullet + Parsley",     desc: "Egyptian-native pairing. Mullet are widely available and parsley has strong local market demand.",                ds18b20: [20, 28], dht22: [12, 22], ph: [65, 80], water_level: [400, 900], soil_moisture: [450, 750] },
        catfish_okra:       { name: "Catfish + Okra",       desc: "Warm Egyptian system. Okra absorbs high nutrient loads from catfish and grows fast in heat.",                    ds18b20: [24, 30], dht22: [22, 32], ph: [62, 78], water_level: [400, 900], soil_moisture: [300, 600] },
        tilapia_eggplant:   { name: "Tilapia + Eggplant",  desc: "Warm productive combo. Eggplant needs high nutrients that tilapia water provides naturally.",                     ds18b20: [26, 30], dht22: [20, 30], ph: [65, 78], water_level: [400, 900], soil_moisture: [400, 700] },
        carp_coriander:     { name: "Carp + Coriander",    desc: "Budget-friendly herb system. Carp are very cheap to source in Egypt and coriander sells fast at markets.",        ds18b20: [20, 26], dht22: [12, 22], ph: [65, 80], water_level: [400, 900], soil_moisture: [400, 700] },
        catfish_beans:      { name: "Catfish + Beans",     desc: "Nitrogen-rich combo. Beans fix extra nitrogen alongside fish waste — very high-productivity system.",             ds18b20: [22, 28], dht22: [18, 28], ph: [62, 80], water_level: [400, 900], soil_moisture: [400, 700] },
        nile_perch_tomato:  { name: "Nile Perch + Tomato", desc: "High-output commercial system. Nile perch produce large nutrient loads ideal for heavy-feeding tomatoes.",       ds18b20: [25, 30], dht22: [20, 28], ph: [65, 80], water_level: [400, 900], soil_moisture: [400, 700] },
        bass_strawberry:    { name: "Bass + Strawberry",   desc: "Premium aquaponics. Both need clean, slightly acidic water. Very high combined market value.",                    ds18b20: [18, 22], dht22: [15, 22], ph: [60, 68], water_level: [400, 900], soil_moisture: [350, 650] },
        tilapia_corn:       { name: "Tilapia + Corn",      desc: "High-biomass system. Corn absorbs nutrients aggressively — great for high-density tilapia tanks.",               ds18b20: [26, 30], dht22: [18, 30], ph: [65, 80], water_level: [400, 900], soil_moisture: [400, 700] },
      },
    };

    // ─── CODE GENERATOR ───────────────────────────────────────────────────────────
    function generateCode(mcu, system, speciesKey, sensors, actuators, actParams={}) {
      const m = MCU[mcu] || MCU.uno;
      const spName = (speciesKey && SPECIES[system]?.[speciesKey]?.name) || "General";
      const relays = MCU_RELAY[mcu] || MCU_RELAY.uno;
      const digs = MCU_DIG[mcu] || MCU_DIG.uno;
      const aPins = m.analog;

      let ai = 0, di = 0, ri = 0;
      const pinMap = {};
      const sKeys = Object.keys(sensors);
      sKeys.forEach(k => {
        const s = SENSORS[k]; if (!s) return;
        if (s.type === "analog") { pinMap[k] = { pin: aPins[ai] || "A0" }; ai++; }
        if (s.type === "digital") { pinMap[k] = { pin: digs[di] || "D2" }; di++; }
        if (s.type === "interrupt") { pinMap[k] = { pin: m.intPin || "D2" }; }
        if (s.type === "I2C") { pinMap[k] = { pin: "I2C" }; }
      });
      const aKeys = Object.keys(actuators);
      const actPin = {};
      aKeys.forEach(k => { actPin[k] = relays[ri] || "D9"; ri++; });

      const libs = [...new Set(sKeys.map(k => SENSORS[k]?.lib).filter(Boolean))];
      const sysLabel = system === "greenhouse" ? "Greenhouse" : system === "aquaculture" ? "Aquaculture" : "Hybrid";

      let code = "";

      // ── Header banner ──────────────────────────────────────────────────────────
      code += "/*\n";
      code += " * ╔══════════════════════════════════════════════════╗\n";
      code += " * ║         FALLA7 CONTROL SYSTEM                   ║\n";
      code += " * ╠══════════════════════════════════════════════════╣\n";
      code += " * ║  MCU    : " + (m.label + " (" + m.chip + ")").padEnd(39) + "║\n";
      code += " * ║  System : " + sysLabel.padEnd(39) + "║\n";
      code += " * ║  Species: " + spName.padEnd(39) + "║\n";
      code += " * ║  Capstone Challenge 2025-2026                   ║\n";
      code += " * ╚══════════════════════════════════════════════════╝\n";
      code += " */\n\n";

      // ── Libraries ──────────────────────────────────────────────────────────────
      if (libs.length) {
        code += "// Libraries — install via: Arduino IDE → Tools → Manage Libraries\n";
        code += libs.join("\n") + "\n\n";
      }

      // ── Setpoint defines ───────────────────────────────────────────────────────
      code += "// Setpoints — adjust these to match your species needs\n";
      sKeys.forEach(k => {
        const v = sensors[k]; if (!v) return;
        const up = k.toUpperCase();
        const isDHT = k === "dht22" || k === "dht11";
        if (isDHT) {
          if (v.useTemp !== false) { code += "#define " + up + "_TEMP_MIN  " + v.min + "\n"; code += "#define " + up + "_TEMP_MAX  " + v.max + "\n"; }
          if (v.useHum !== false)  { code += "#define " + up + "_HUM_MIN   " + (v.humMin ?? 40) + "\n"; code += "#define " + up + "_HUM_MAX   " + (v.humMax ?? 80) + "\n"; }
        } else {
          code += "#define " + up + "_MIN  " + v.min + "\n";
          code += "#define " + up + "_MAX  " + v.max + "\n";
        }
      });
      code += "\n";

      // ── Relay pin defines ──────────────────────────────────────────────────────
      code += "// Relay pins — connect relay IN wire to these Arduino pins\n";
      aKeys.forEach(k => {
        code += "#define RELAY_" + k.toUpperCase().padEnd(10) + " " + actPin[k] + "  // " + (ACTUATORS[k]?.label || k) + "\n";
      });
      code += "\n";

      // ── Flow ISR (if needed) ───────────────────────────────────────────────────
      if (sensors.flow) {
        code += "volatile int flowPulses = 0;\n";
        code += "void IRAM_ATTR flowISR() { flowPulses++; }\n\n";
      }

      // ── setup() ────────────────────────────────────────────────────────────────
      code += "void setup() {\n";
      code += "  " + m.serial + "\n";
      code += "  Serial.println(\"Falla7 Starting...\");\n";
      aKeys.forEach(k => {
        code += "  pinMode(RELAY_" + k.toUpperCase() + ", OUTPUT);\n";
        code += "  digitalWrite(RELAY_" + k.toUpperCase() + ", HIGH); // HIGH = OFF (active-low relay)\n";
      });
      if (sensors.flow) {
        code += "  pinMode(" + (m.intPin || "D2") + ", INPUT_PULLUP);\n";
        code += "  attachInterrupt(digitalPinToInterrupt(" + (m.intPin || "D2") + "), flowISR, RISING);\n";
      }
      if (sensors.mq135) {
        code += "  Serial.println(\"Waiting 20s for MQ-135 warm-up...\");\n";
        code += "  delay(20000); // MQ-135 needs heat-up time\n";
      }
      code += "  Serial.println(\"Ready.\");\n";
      code += "}\n\n";

      // ── Timing variable ────────────────────────────────────────────────────────
      code += "unsigned long lastLog = 0;\n\n";

      // ── loop() ─────────────────────────────────────────────────────────────────
      code += "void loop() {\n\n";

      // ── Read sensors ───────────────────────────────────────────────────────────
      code += "  // --- READ SENSORS ---\n\n";

      sKeys.forEach(k => {
        const p = pinMap[k] || {}; const pin = p.pin || "A0";
        if (k === "dht22") {
          code += "  DHT dht22(" + pin + ", DHT22);\n";
          code += "  float temp = dht22.readTemperature(); // °C\n";
          code += "  float hum  = dht22.readHumidity();   // %\n\n";
        }
        if (k === "dht11") {
          code += "  DHT dht11(" + pin + ", DHT11);\n";
          code += "  float temp = dht11.readTemperature(); // °C\n";
          code += "  float hum  = dht11.readHumidity();   // %\n\n";
        }
        if (k === "ds18b20") {
          code += "  OneWire ow(" + pin + ");\n";
          code += "  DallasTemperature ds(&ow);\n";
          code += "  ds.requestTemperatures();\n";
          code += "  float wtemp = ds.getTempCByIndex(0); // water temp °C\n\n";
        }
        if (k === "water_level") {
          code += "  int waterLvl = analogRead(" + pin + "); // 0 (dry) – 1023 (full)\n\n";
        }
        if (k === "soil_moisture") {
          code += "  int soilMoist = analogRead(" + pin + "); // 0 (wet) – 1023 (dry)\n\n";
        }
        if (k === "cap_soil") {
          code += "  int capSoil = analogRead(" + pin + "); // capacitive: lower = wetter\n\n";
        }
        if (k === "ldr") {
          code += "  // LDR voltage divider: Pin1 → " + pin + " & " + m.voltage + " via 10kΩ, Pin2 → GND\n";
          code += "  int light = analogRead(" + pin + "); // 0 = dark, 1023 = bright (10kΩ pull-down)\n\n";
        }
        if (k === "bh1750") {
          code += "  BH1750 lmeter;\n";
          code += "  Wire.begin();\n";
          code += "  lmeter.begin();\n";
          code += "  float lux = lmeter.readLightLevel(); // lux\n\n";
        }
        if (k === "tds") {
          code += "  int tdsVal = analogRead(" + pin + "); // ppm (needs calibration)\n\n";
        }
        if (k === "ph") {
          code += "  float phVolt = analogRead(" + pin + ") * (5.0 / 1023.0);\n";
          code += "  float phVal  = 7.0 + ((2.5 - phVolt) / 0.18); // pH 0–14\n\n";
        }
        if (k === "turbidity") {
          code += "  int turbidity = analogRead(" + pin + "); // lower = cleaner\n\n";
        }
        if (k === "flow") {
          code += "  float flowRate = (flowPulses / 7.5); // L/min\n";
          code += "  flowPulses = 0;\n\n";
        }
        if (k === "mq135") {
          code += "  int airQ = analogRead(" + pin + "); // lower = more pollution\n\n";
        }
      });

      // ── Feedback control (flexible — driven by actParams) ─────────────────────
      code += "  // --- FEEDBACK CONTROL ---\n\n";

      // Maps sensor key to {variable, prefix, isHi(max), isLo(min)} 
      const sensorMeta = {
        dht22:        { varHi: "temp",      varLo: "temp",     defHi: "DHT22_TEMP_MAX",     defLo: "DHT22_TEMP_MIN",     desc: "Air Temp" },
        dht11:        { varHi: "temp",      varLo: "temp",     defHi: "DHT11_TEMP_MAX",     defLo: "DHT11_TEMP_MIN",     desc: "Air Temp" },
        dht22_hum:    { varHi: "hum",       varLo: "hum",      defHi: "DHT22_HUM_MAX",      defLo: "DHT22_HUM_MIN",      desc: "Humidity" },
        dht11_hum:    { varHi: "hum",       varLo: "hum",      defHi: "DHT11_HUM_MAX",      defLo: "DHT11_HUM_MIN",      desc: "Humidity" },
        ds18b20:      { varHi: "wtemp",     varLo: "wtemp",    defHi: "DS18B20_TEMP_MAX",   defLo: "DS18B20_TEMP_MIN",   desc: "Water Temp" },
        water_level:  { varHi: "waterLvl",  varLo: "waterLvl", defHi: "WATER_LEVEL_MAX",    defLo: "WATER_LEVEL_MIN",    desc: "Water Level" },
        soil_moisture:{ varHi: "soilMoist", varLo: "soilMoist",defHi: "SOIL_MOISTURE_MAX",  defLo: "SOIL_MOISTURE_MIN",  desc: "Soil Moisture" },
        cap_soil:     { varHi: "capSoil",   varLo: "capSoil",  defHi: "CAP_SOIL_MAX",       defLo: "CAP_SOIL_MIN",       desc: "Cap Soil" },
        ldr:          { varHi: "light",     varLo: "light",    defHi: "LDR_MAX",            defLo: "LDR_MIN",            desc: "Light" },
        bh1750:       { varHi: "lux",       varLo: "lux",      defHi: "BH1750_MAX",         defLo: "BH1750_MIN",         desc: "Light (lux)" },
        tds:          { varHi: "tdsVal",    varLo: "tdsVal",   defHi: "TDS_MAX",            defLo: "TDS_MIN",            desc: "TDS" },
        ph:           { varHi: "phVal",     varLo: "phVal",    defHi: "PH_MAX",             defLo: "PH_MIN",             desc: "pH" },
        turbidity:    { varHi: "turbidity", varLo: "turbidity",defHi: "TURBIDITY_MAX",      defLo: "TURBIDITY_MIN",      desc: "Turbidity" },
        mq135:        { varHi: "airQ",      varLo: "airQ",     defHi: "MQ135_MAX",          defLo: "MQ135_MIN",          desc: "Air Quality" },
        flow:         { varHi: "flowRate",  varLo: "flowRate", defHi: "FLOW_MAX",           defLo: "FLOW_MIN",           desc: "Flow Rate" },
      };

      const actLabels = {
        fan: "Fan", pump: "Pump", lamp: "Grow Lamp", thermal: "Thermal Lamp", ptc: "PTC Heater", aerator: "Aerator"
      };

      aKeys.forEach(k => {
        const r = "RELAY_" + k.toUpperCase();
        const lbl = actLabels[k] || k;
        const extra = k === "ptc" ? " // 12V — ensure relay rated for 12V!" : "";

        // Support array of triggers (OR logic) or legacy single object
        const rawParam = actParams[k];
        const triggers = Array.isArray(rawParam) ? rawParam
          : (rawParam && rawParam.sensor ? [rawParam]
          : pickActDefault(k, sensors));

        const condParts = [];
        const descParts = [];
        triggers.forEach(({ sensor: sk, cond }) => {
          const meta = sensorMeta[sk];
          if (!meta) return;
          condParts.push(cond === "hi" ? meta.varHi + " > " + meta.defHi : meta.varLo + " < " + meta.defLo);
          descParts.push(meta.desc + (cond === "hi" ? " > MAX" : " < MIN"));
        });

        if (condParts.length === 0) {
          code += "  // " + lbl + ": no sensor linked — always OFF\n";
          code += "  digitalWrite(" + r + ", HIGH);" + extra + "\n\n";
        } else if (condParts.length === 1) {
          code += "  // " + lbl + ": ON when " + descParts[0] + "\n";
          code += "  digitalWrite(" + r + ", (" + condParts[0] + ") ? LOW : HIGH);" + extra + "\n\n";
        } else {
          code += "  // " + lbl + ": ON when " + descParts.join(" OR ") + "\n";
          code += "  bool " + k + "On = (" + condParts.join(")\n              || (") + ");\n";
          code += "  digitalWrite(" + r + ", " + k + "On ? LOW : HIGH);" + extra + "\n\n";
        }
      });

      // ── Serial logging ─────────────────────────────────────────────────────────
      code += "  // --- LOG TO SERIAL MONITOR (every 5 min) ---\n";
      code += "  if (millis() - lastLog >= 300000UL) {\n";
      code += "    lastLog = millis();\n";
      const logParts = [];
      if (sensors.dht22 || sensors.dht11) { logParts.push('"Temp=" + String(temp)'); logParts.push('"Hum=" + String(hum)'); }
      if (sensors.ds18b20) logParts.push('"WTemp=" + String(wtemp)');
      if (sensors.water_level) logParts.push('"WLvl=" + String(waterLvl)');
      if (sensors.soil_moisture) logParts.push('"Soil=" + String(soilMoist)');
      if (sensors.cap_soil) logParts.push('"CSoil=" + String(capSoil)');
      if (sensors.ldr) logParts.push('"Light=" + String(light)');
      if (sensors.bh1750) logParts.push('"Lux=" + String(lux)');
      if (sensors.tds) logParts.push('"TDS=" + String(tdsVal)');
      if (sensors.ph) logParts.push('"pH=" + String(phVal)');
      if (sensors.turbidity) logParts.push('"Turb=" + String(turbidity)');
      if (sensors.flow) logParts.push('"Flow=" + String(flowRate)');
      if (sensors.mq135) logParts.push('"Air=" + String(airQ)');
      if (logParts.length) {
        code += "    Serial.println(\n";
        logParts.forEach((p, i) => {
          code += "      " + p + (i < logParts.length - 1 ? ' + " | " +' : "") + "\n";
        });
        code += "    );\n";
      }
      code += "  }\n\n";
      code += "  delay(1000);\n";
      code += "}\n";

      return code;
    }

    function generateWiring(mcu, sensors, actuators, actParams={}) {
      const m = MCU[mcu] || MCU.uno;
      const relays = MCU_RELAY[mcu] || MCU_RELAY.uno;
      const aPins = m.analog;
      const digs = MCU_DIG[mcu] || MCU_DIG.uno;
      let ai = 0, di = 0, ri = 0;
      let out = "";
      out += "=================================================\n";
      out += "  FALLA7 WIRING GUIDE\n";
      out += "  MCU: " + m.label + " | Voltage: " + m.voltage + " | System: " + (mcu === "greenhouse" ? "Greenhouse" : mcu === "aquaculture" ? "Aquaculture" : "Hybrid") + "\n";
      out += "=================================================\n\n";
      out += "── COMPONENTS NEEDED ────────────────────────────\n";
      out += "- 1x " + m.label + "\n";
      Object.keys(sensors).forEach(k => { out += "- 1x " + (SENSORS[k]?.label || k) + "\n"; });
      Object.keys(actuators).forEach(k => { out += "- 1x " + (ACTUATORS[k]?.label || k) + " + 1-ch relay module\n"; });
      out += "- Breadboard, jumper wires, USB cable\n";
      out += "- External 5V power supply for relays\n\n";
      out += "── SENSOR WIRING ────────────────────────────────\n";
      Object.keys(sensors).forEach(k => {
        const s = SENSORS[k]; if (!s) return;
        let pin = "";
        if (s.type === "analog") { pin = aPins[ai] || "A0"; ai++; }
        if (s.type === "digital") { pin = digs[di] || "D2"; di++; }
        if (s.type === "interrupt") { pin = m.intPin || "D2"; }
        out += s.label + ":\n";
        out += "  " + sWiring(mcu, s.type, s.type === "analog" ? ai - 1 : di - 1) + "\n";
        if (k === "cap_soil") out += "  WARNING: Use 3.3V only - do NOT connect to 5V!\n";
        if (k === "mq135") out += "  WARNING: Needs 20-second warm-up before readings\n";
        out += "\n";
      });
      out += "── ACTUATOR / RELAY WIRING ──────────────────────\n";
      Object.keys(actuators).forEach(k => {
        out += (ACTUATORS[k]?.label || k) + ":\n";
        out += "  Relay IN (signal) → " + (relays[ri] || "D9") + "\n";
        out += "  Relay VCC → 5V, GND → GND (use external supply)\n";
        out += "  Device → Relay COM + NO terminals\n";
        out += "  Note: LOW = ON, HIGH = OFF (active-low relay)\n\n";
        ri++;
      });
      out += "── GENERAL TIPS ─────────────────────────────────\n";
      out += "- Always share GND between MCU and relay module\n";
      out += "- Never connect 12V devices directly to MCU pins\n";
      out += "- Keep sensor wires away from relay/motor wires\n";
      if (mcu === "esp32" || mcu === "esp8266") out += "- 3.3V board: only use 3.3V-compatible sensors!\n";
      out += "- Test each component separately before combining\n";
      return out;
    }

    // ─── ORTHOGONAL PATH HELPER FOR CLEAN CIRCUIT DIAGRAM ─────────────────────────
    const orthoPath = (x1, y1, x2, y2) => {
      const midX = (x1 + x2) / 2;
      return "M " + x1 + " " + y1 + " H " + midX + " V " + y2 + " H " + x2;
    };

    // ─── AI SYSTEM PROMPT ─────────────────────────────────────────────────────────
    const SYS_PROMPT =
      "You are Falla7 Assistant, an AI helper for Egyptian Grade 11 students doing the Capstone Challenge: " +
      "'Engineering the Living System: Feedback Control System for Aquaculture or Greenhouse Agriculture.' " +
      "Help with MCU selection, sensor/actuator wiring, Arduino C++ code, closed-loop control concepts. " +
      "Be encouraging, simple, age-appropriate. Note safety: 3.3V vs 5V, water+electricity, relay wiring. " +
      "Challenge rules: recycled materials, at least 3 sensors, at least 2 actuators, closed-loop feedback.";

    // ─── MAIN APP ─────────────────────────────────────────────────────────────────
    function App() {
      const [step, setStep] = useState(0);
      const [mcu, setMcu] = useState("");
      const [system, setSystem] = useState("");
      const [spKey, setSpKey] = useState("");
      const [sensors, setSensors] = useState({});
      const [actuators, setActuators] = useState({});
      const [actParams, setActParams] = useState({}); // {actKey: [{sensor,cond},...]} OR logic
      const [genCode, setGenCode] = useState("");
      const [prevCode, setPrevCode] = useState("");
      const [wiring, setWiring] = useState("");
      const [codeTab, setCodeTab] = useState("code");
      const [diffMode, setDiffMode] = useState(false);
      const [shopFilter, setShopFilter] = useState("all");

      const [copied, setCopied] = useState(false);
      const [mainTab, setMainTab] = useState("gen");
      const [sSearch, setSSearch] = useState("");
      const [aSearch, setASearch] = useState("");
      const [spSearch, setSpSearch] = useState("");

      const [chatMsgs, setChatMsgs] = useState([
        { role: "assistant", content: "Hi! I'm your Falla7 AI Assistant.\n\nUse the Code Generator tab to build your Arduino code step by step — or ask me anything about sensors, wiring, microcontrollers, or your Capstone project!" }
      ]);
      const [chatIn, setChatIn] = useState("");
      const [chatLoad, setChatLoad] = useState(false);

      const [floatOpen, setFloatOpen] = useState(false);
      const [floatMsgs, setFloatMsgs] = useState([]);
      const [floatIn, setFloatIn] = useState("");
      const [floatLoad, setFloatLoad] = useState(false);

      // ── Feature states ──────────────────────────────────────────────────────────
      const [darkMode, setDarkMode] = useState(true);
      const [compareA, setCompareA] = useState("dht22");
      const [compareB, setCompareB] = useState("dht11");
      const [learnItem, setLearnItem] = useState(null);
      const [learnType, setLearnType] = useState("sensor");
      const [customPrices, setCustomPrices] = useState({
        mcu: { ...COSTS.mcu },
        sensor: { ...COSTS.sensor },
        actuator: { ...COSTS.actuator },
        relay: COSTS.relay,
        misc: 150,
      });
      const setActuatorPrice = (k, val) => {
        const n = parseInt(val) || 0;
        setCustomPrices(prev => ({ ...prev, actuator: { ...prev.actuator, [k]: n } }));
      };
      const setRelayPrice = (val) => {
        const n = parseInt(val) || 0;
        setCustomPrices(prev => ({ ...prev, relay: n }));
      };
      const [troubleQ, setTroubleQ] = useState(null);
      const [toolModal, setToolModal] = useState(null);
      const [toolCopied, setToolCopied] = useState(false);
      const [serialRunning, setSerialRunning] = useState(false);
      const [menuOpen, setMenuOpen] = useState(false);
      const [serialLines, setSerialLines] = useState([]);
      const serialTimerRef = useRef(null);
      // AI-added components (LCD, OLED, buzzer, etc.) not in standard lists
      const [aiComponents, setAiComponents] = useState([]);

      const chatEndRef = useRef(null);
      const floatEndRef = useRef(null);

      useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);
      useEffect(() => { floatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [floatMsgs]);

      const applySpecies = (k) => {
        setSpKey(k);
        const db = SPECIES[system]?.[k];
        if (!db) return;
        const ns = {};
        Object.entries(db).forEach(([sk, sv]) => {
          if (sk !== "name" && sk !== "desc" && SENSORS[sk]) ns[sk] = { min: sv[0], max: sv[1] };
        });
        setSensors(ns);
      };

      const toggleSensor = (k) => setSensors(prev => {
        if (prev[k]) { const n = { ...prev }; delete n[k]; return n; }
        const isDHT = k === "dht22" || k === "dht11";
        return { ...prev, [k]: {
          min: SENSORS[k].defMin, max: SENSORS[k].defMax,
          ...(isDHT ? { humMin: 40, humMax: 80, useTemp: true, useHum: true } : {})
        }};
      });

      const toggleActuator = (k) => {
        setActuators(prev => {
          if (prev[k]) { const n = { ...prev }; delete n[k]; return n; }
          return { ...prev, [k]: true };
        });
        setActParams(prev => {
          if (actuators[k]) { const n = { ...prev }; delete n[k]; return n; }
          // Auto-assign all matching defaults as array (OR logic)
          const defs = pickActDefault(k, sensors);
          return { ...prev, [k]: defs };
        });
      };
      // Multi-trigger helpers ── actParams[k] is [{sensor,cond}, ...]
      const addActTrigger = (k) => setActParams(prev => {
        const cur = Array.isArray(prev[k]) ? prev[k] : (prev[k] ? [prev[k]] : [{ sensor: "manual", cond: "hi" }]);
        return { ...prev, [k]: [...cur, { sensor: "manual", cond: "hi" }] };
      });
      const removeActTrigger = (k, idx) => setActParams(prev => {
        const cur = Array.isArray(prev[k]) ? prev[k] : [prev[k]];
        if (cur.length <= 1) return prev;
        return { ...prev, [k]: cur.filter((_, i) => i !== idx) };
      });
      const updateActTrigger = (k, idx, field, value) => setActParams(prev => {
        const cur = Array.isArray(prev[k]) ? prev[k] : (prev[k] ? [prev[k]] : [{ sensor: "manual", cond: "hi" }]);
        return { ...prev, [k]: cur.map((t, i) => i === idx ? { ...t, [field]: value } : t) };
      });

      const doGenerate = () => {
        setGenCode(generateCode(mcu, system, spKey, sensors, actuators, actParams));
        setPrevCode("");
        setDiffMode(false);
        setWiring(generateWiring(mcu, sensors, actuators, actParams));
        setAiComponents([]);
        setStep(6);
      };

      // ── Serial Simulator ────────────────────────────────────────────────────────
      // Refs so serial interval always reads current state (no stale closure)
      const sensorsRef = useRef(sensors);
      const aiComponentsRef = useRef(aiComponents);
      useEffect(() => { sensorsRef.current = sensors; }, [sensors]);
      useEffect(() => { aiComponentsRef.current = aiComponents; }, [aiComponents]);

      const startSerial = () => {
        setSerialLines([]);
        setSerialRunning(true);
        let tick = 0;
        serialTimerRef.current = setInterval(() => {
          tick++;
          const s = sensorsRef.current;
          const ai = aiComponentsRef.current;
          const parts = [];
          const dhtKey = s.dht22 ? "dht22" : s.dht11 ? "dht11" : null;
          if (dhtKey) {
            if (s[dhtKey].useTemp !== false) parts.push("Temp(C)=" + (22 + Math.random() * 6).toFixed(1));
            if (s[dhtKey].useHum !== false) parts.push("Hum(%)=" + (55 + Math.random() * 20).toFixed(1));
          }
          if (s.ds18b20) parts.push("WaterTemp(C)=" + (26 + Math.random() * 4).toFixed(1));
          if (s.water_level) parts.push("WaterLvl=" + Math.floor(400 + Math.random() * 400));
          if (s.soil_moisture) parts.push("Soil=" + Math.floor(300 + Math.random() * 400));
          if (s.cap_soil) parts.push("CapSoil=" + Math.floor(1500 + Math.random() * 1000));
          if (s.bh1750) parts.push("Lux=" + Math.floor(5000 + Math.random() * 20000));
          if (s.ldr) parts.push("Light=" + Math.floor(300 + Math.random() * 600));
          if (s.tds) parts.push("TDS(ppm)=" + Math.floor(200 + Math.random() * 400));
          if (s.ph) parts.push("pH=" + (6.5 + Math.random() * 1.5).toFixed(2));
          if (s.turbidity) parts.push("Turbidity=" + Math.floor(50 + Math.random() * 200));
          if (s.mq135) parts.push("AirQ=" + Math.floor(100 + Math.random() * 200));
          if (s.flow) parts.push("Flow(L/m)=" + (1 + Math.random() * 3).toFixed(2));
          // AI-added components simulation
          ai.forEach(c => {
            const lbl = c.label.replace(/\s+/g, "");
            if (lbl.includes("LCD") || lbl.includes("OLED")) parts.push("Display=ON");
            else if (lbl.includes("Buzzer") || lbl.includes("buzzer")) parts.push("Buzzer=" + (Math.random() > 0.8 ? "ALARM" : "OFF"));
            else if (lbl.includes("Servo") || lbl.includes("servo")) parts.push("Servo=" + Math.floor(Math.random() * 181) + "deg");
            else if (lbl.includes("RTC")) parts.push("RTC=" + new Date().toTimeString().slice(0,8));
            else parts.push(lbl.slice(0,8) + "=" + (Math.random() * 100).toFixed(1));
          });
          if (!parts.length) parts.push("No sensors selected");
          const line = "[" + String(tick).padStart(4, "0") + "s] " + parts.join(" | ");
          setSerialLines(prev => [...prev.slice(-49), line]);
        }, 2000);
      };
      const stopSerial = () => { setSerialRunning(false); clearInterval(serialTimerRef.current); };
      useEffect(() => () => clearInterval(serialTimerRef.current), []);

      // ── Tool modal copy ──────────────────────────────────────────────────────────
      const openTool = (title, content, filename) => setToolModal({ title, content, filename });
      const copyToolContent = () => {
        if (!toolModal) return;
        navigator.clipboard.writeText(toolModal.content).then(() => {
          setToolCopied(true);
          setTimeout(() => setToolCopied(false), 2000);
        });
      };

      // ── Theme colors ────────────────────────────────────────────────────────────
      const TH = darkMode ? {
        bg: "#060a06", bg2: "#0a110a", bg3: "#0f180f", bd: "#1a301a", bd2: "#264d26",
        g: "#4caf50", g2: "#81c784", g3: "#2d7a2d", g4: "#163616", txt: "#dcedc8", mut: "#4a6e4a"
      } : {
        bg: "#f4faf4", bg2: "#ffffff", bg3: "#edf7ee", bd: "#c3e6c5", bd2: "#7bc87f",
        g: "#2e7d32", g2: "#1b5e20", g3: "#388e3c", g4: "#d0ead1", txt: "#0d1f0d", mut: "#5a7a5a"
      };

      // Renders **bold**, *italic*, numbered lists, bullet lines into real HTML nodes
      const renderMd = (text) => {
        if (!text) return null;
        return text.split("\n").map((line, i) => {
          // Render inline bold/italic on a line
          const renderInline = (str) => {
            const parts = [];
            const rx = /\*\*(.+?)\*\*|\*(.+?)\*/g;
            let last = 0, m;
            while ((m = rx.exec(str)) !== null) {
              if (m.index > last) parts.push(str.slice(last, m.index));
              if (m[1] !== undefined) parts.push(React.createElement("strong", { key: m.index }, m[1]));
              else parts.push(React.createElement("em", { key: m.index }, m[2]));
              last = m.index + m[0].length;
            }
            if (last < str.length) parts.push(str.slice(last));
            return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : parts;
          };

          const trimmed = line.trim();
          if (!trimmed) return React.createElement("div", { key: i, style: { height: 6 } });
          // Numbered list
          const numM = trimmed.match(/^(\d+)\. (.+)/);
          if (numM) return React.createElement("div", { key: i, style: { display: "flex", gap: 6, marginBottom: 3 } },
            React.createElement("span", { style: { fontWeight: 700, minWidth: 16, color: "inherit", opacity: 0.7 } }, numM[1] + "."),
            React.createElement("span", null, renderInline(numM[2]))
          );
          // Bullet list
          if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
            const txt = trimmed.slice(2);
            return React.createElement("div", { key: i, style: { display: "flex", gap: 6, marginBottom: 3 } },
              React.createElement("span", { style: { opacity: 0.5, minWidth: 10 } }, "•"),
              React.createElement("span", null, renderInline(txt))
            );
          }
          return React.createElement("div", { key: i, style: { marginBottom: 2 } }, renderInline(trimmed));
        });
      };

      const doCopy = () => {
        navigator.clipboard.writeText(codeTab === "wiring" ? wiring : genCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      };

      const callAI = async (messages, sysp, maxT) => {
        const PROXY_URL = (window.FALLA7_CONFIG && window.FALLA7_CONFIG.AI_PROXY_URL) || "/api/ai";

        // Gemini requires alternating user/model roles — merge consecutive same-role messages
        const rawContents = messages.map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: String(m.content || "") }]
        }));
        const contents = [];
        for (const msg of rawContents) {
          if (contents.length > 0 && contents[contents.length - 1].role === msg.role) {
            contents[contents.length - 1].parts[0].text += "\n" + msg.parts[0].text;
          } else {
            contents.push(msg);
          }
        }
        // Must start with user role
        if (contents.length > 0 && contents[0].role === "model") {
          contents.unshift({ role: "user", parts: [{ text: "Hello" }] });
        }

        const res = await fetch(PROXY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: sysp }] },
            contents,
            generationConfig: {
              maxOutputTokens: maxT || 1000,
              temperature: 0.7,
              topP: 0.95
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
            ]
          })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "AI request failed (HTTP " + res.status + ")");
        }

        const d = await res.json();
        const candidate = d.candidates?.[0];
        if (!candidate) throw new Error("No response from AI — try rephrasing.");
        if (candidate.finishReason === "SAFETY") throw new Error("Response blocked by safety filter — try rephrasing.");

        const text = candidate.content?.parts?.map(p => p.text || "").join("") || "";
        if (!text.trim()) throw new Error("Empty response — try again.");
        return text;
      };

      const sendChat = async () => {
        if (!chatIn.trim() || chatLoad) return;
        const msg = chatIn.trim();
        setChatIn("");
        const next = [...chatMsgs, { role: "user", content: msg }];
        setChatMsgs(next);
        setChatLoad(true);
        try {
          const reply = await callAI(next.map(m => ({ role: m.role, content: m.content })), SYS_PROMPT, 1000);
          setChatMsgs(p => [...p, { role: "assistant", content: reply }]);
        } catch (e) {
          setChatMsgs(p => [...p, { role: "assistant", content: "Connection error — " + (e.message || "please try again.") }]);
        }
        setChatLoad(false);
      };

      const sendFloat = async () => {
        if (!floatIn.trim() || floatLoad) return;
        const msg = floatIn.trim();
        setFloatIn("");
        const userMsg = { role: "user", content: msg };
        const next = [...floatMsgs, userMsg];
        setFloatMsgs(next);
        setFloatLoad(true);

        const floatSys =
          "You are a Falla7 Arduino code editor for Grade 11 Egyptian STEM students.\n\n" +
          "CURRENT SETUP:\n" +
          "- MCU: " + mcu + "\n" +
          "- Sensors: " + (Object.keys(sensors).join(", ") || "none") + "\n" +
          "- Actuators: " + (Object.keys(actuators).join(", ") || "none") + "\n" +
          "- AI-added components: " + (aiComponents.length ? aiComponents.map(c=>c.label+"@"+c.pin).join(", ") : "none") + "\n\n" +
          "CURRENT CODE:\n```cpp\n" + genCode + "\n```\n\n" +
          "CURRENT WIRING:\n" + wiring + "\n\n" +
          "=== OUTPUT ALL 3 BLOCKS ===\n\n" +
          "BLOCK 1 (always): Full updated .ino — NO truncation, NO \'...\':\n" +
          "UPDATED_CODE_START\n<every single line of code>\nUPDATED_CODE_END\n\n" +
          "BLOCK 2 (always): Full updated wiring guide:\n" +
          "UPDATED_WIRING_START\n<complete wiring>\nUPDATED_WIRING_END\n\n" +
          "BLOCK 3 (always): List ALL extra hardware components present in the updated code that are NOT in the original sensor/actuator lists. Include previously AI-added ones still present. If removed, omit. If nothing extra, output [].\n" +
          "CRITICAL CLASSIFICATION RULES:\n" +
          "- Actuators (heaters, pumps, fans, motors, valves) ALWAYS need a relay — set type=\'relay\' and note the relay pin\n" +
          "- Sensors (LCD displays, OLED, buzzers, LEDs, servos, RTC) connect directly — set type correctly (I2C/digital/analog/SPI)\n" +
          "- PTC heater, solenoid valve, motor = ACTUATOR, must use relay. Never wire them directly to Arduino\n" +
          "- LCD/OLED = output display, connect via I2C (SDA/SCL) or direct digital pins\n" +
          "- Buzzer = direct digital pin, type=digital\n" +
          "UPDATED_COMPONENTS_START\n" +
          "[{\"label\":\"LCD 16x2 I2C\",\"pin\":\"SDA/SCL\",\"type\":\"I2C\",\"icon\":\"LCD\",\"role\":\"display\"},{\"label\":\"PTC Heater\",\"pin\":\"D8 via Relay\",\"type\":\"relay\",\"icon\":\"PTC\",\"role\":\"actuator\"}]\n" +
          "UPDATED_COMPONENTS_END\n" +
          "Fields: label(string), pin(string), type(analog|digital|I2C|SPI|relay|power), icon(2-6 chars), role(sensor|display|actuator|alarm|output)\n" +
          "IMPORTANT CLASSIFICATION RULES:\n" +
          "- Heaters (PTC, IR, wire), pumps, fans, motors, solenoid valves, peltier = role:actuator, type:relay (ALWAYS needs relay module, show pin as Dx via Relay)\n" +
          "- Temperature sensors, humidity sensors, soil sensors, light sensors, gas/air quality sensors, water sensors = role:sensor\n" +
          "- LCD, OLED, TFT displays = role:display\n" +
          "- Buzzers, piezo alarms = role:alarm\n" +
          "- LEDs, RGB LEDs = role:output\n" +
          "- Servos, stepper motors = role:actuator, type:digital\n" +
          "NEVER put a heater, pump, fan, or motor on the sensor side. ALWAYS include relay for actuators.\n\n" +
          "BLOCK 4 (only if sensors/actuators changed): If you added or removed any sensors or actuators in the code, list the final active ones:\n" +
          "UPDATED_SELECTIONS_START\n{\"sensors\":[\"dht22\",\"ph\"],\"actuators\":[\"fan\",\"pump\"]}\nUPDATED_SELECTIONS_END\n\n" +
          "After blocks: 2-4 plain-English sentences explaining the change.";

        try {
          const reply = await callAI(next.map(m => ({ role: m.role, content: m.content })), floatSys, 8000);

          const cM = reply.match(/UPDATED_CODE_START\s*(?:```(?:cpp|ino|arduino)?\s*)?([\s\S]*?)(?:```\s*)?UPDATED_CODE_END/);
          const wM = reply.match(/UPDATED_WIRING_START\s*([\s\S]*?)\s*UPDATED_WIRING_END/);
          const compM = reply.match(/UPDATED_COMPONENTS_START\s*([\s\S]*?)\s*UPDATED_COMPONENTS_END/);

          const updatedTabs = [];

          if (compM) {
            try {
              const parsed = JSON.parse(compM[1].trim());
              if (Array.isArray(parsed) && parsed.length > 0) {
                // Merge with existing — don't wipe previous AI-added components
                setAiComponents(prev => {
                  const merged = [...prev];
                  parsed.forEach(c => {
                    if (!merged.some(x => x.label === c.label)) merged.push(c);
                  });
                  return merged;
                });
                updatedTabs.push("Components");
              }
            } catch (_) {}
          }

          if (cM) {
            const newCode = cM[1].trim();
            if (newCode.length > 20) {
              setPrevCode(genCode);
              setGenCode(newCode);
              setDiffMode(true);
              setCodeTab("code");
              updatedTabs.push("Code", "Line Explainer");
            }
          }

          if (wM) {
            const newWiring = wM[1].trim();
            if (newWiring.length > 10) {
              setWiring(newWiring);
              updatedTabs.push("Wiring Guide");
            }
          } else if (cM) {
            // AI gave code but no wiring block — regenerate wiring from current state
            setWiring(generateWiring(mcu, sensors, actuators, actParams));
          }

          // Parse UPDATED_SELECTIONS — update sensors/actuators state if AI changed them
          const selM = reply.match(/UPDATED_SELECTIONS_START\s*([\s\S]*?)\s*UPDATED_SELECTIONS_END/);
          if (selM) {
            try {
              const sel = JSON.parse(selM[1].trim());
              if (sel.sensors && Array.isArray(sel.sensors)) {
                const newSensors = {};
                sel.sensors.forEach(k => { if (SENSORS[k]) newSensors[k] = sensors[k] || true; });
                setSensors(newSensors);
              }
              if (sel.actuators && Array.isArray(sel.actuators)) {
                const newActs = {};
                sel.actuators.forEach(k => { if (ACTUATORS[k]) newActs[k] = true; });
                setActuators(newActs);
              }
              updatedTabs.push("Pin Diagram", "Circuit", "Breadboard");
            } catch (_) {}
          }

          let disp = reply
            .replace(/UPDATED_CODE_START[\s\S]*?UPDATED_CODE_END/g, "")
            .replace(/UPDATED_WIRING_START[\s\S]*?UPDATED_WIRING_END/g, "")
            .replace(/UPDATED_COMPONENTS_START[\s\S]*?UPDATED_COMPONENTS_END/g, "")
            .replace(/UPDATED_SELECTIONS_START[\s\S]*?UPDATED_SELECTIONS_END/g, "")
            .replace(/```[\s\S]*?```/g, "")
            .trim();

          if (updatedTabs.length > 0) {
            disp = (disp ? disp + "\n\n" : "") +
              "\u2705 Updated: " + updatedTabs.join(" \u00b7 ") +
              "\n\ud83d\udcd0 Pin Diagram \u00b7 Circuit \u00b7 Breadboard \u00b7 Compat \u00b7 Shopping List \u00b7 Serial \u2014 all refreshed.";
          } else {
            disp = disp || "I couldn\'t find anything to update \u2014 could you clarify what you\'d like changed?";
          }

          setFloatMsgs(p => [...p, { role: "assistant", content: disp }]);
        } catch (e) {
          setFloatMsgs(p => [...p, { role: "assistant", content: "Connection error \u2014 " + (e.message || "please try again.") }]);
        }
        setFloatLoad(false);
      };

      // All sensors and actuators available for all systems
      const avSensors = Object.entries(SENSORS);
      const avActuators = Object.entries(ACTUATORS);
      const avSpecies = system ? Object.entries(SPECIES[system] || {}) : [];
      const STEPS = ["MCU", "System", "Species", "Sensors", "Actuators", "Done"];
      const sCount = Object.keys(sensors).reduce((acc, k) => {
        if ((k === "dht22" || k === "dht11") && sensors[k]) {
          return acc + (sensors[k].useTemp !== false ? 1 : 0) + (sensors[k].useHum !== false ? 1 : 0);
        }
        return acc + 1;
      }, 0);
      const aCount = Object.keys(actuators).length;

      const G = TH.g, G2 = TH.g2, G3 = TH.g3, G4 = TH.g4;
      const BG = TH.bg, BG2 = TH.bg2, BG3 = TH.bg3;
      const BD = TH.bd, BD2 = TH.bd2;
      const TXT = TH.txt, MUT = TH.mut;

      // ── Animation helpers
      const useReveal = (thr) => {
        const ref = useRef(null);
        const [vis, setVis] = useState(false);
        useEffect(() => {
          const el = ref.current; if (!el) return;
          const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setVis(true); obs.disconnect(); }
          }, { threshold: thr || 0.08 });
          obs.observe(el); return () => obs.disconnect();
        }, []);
        return [ref, vis];
      };
      const [statsRef, statsVis] = useReveal(0.08);
      const [featRef, featVis] = useReveal(0.06);
      const [chalRef, chalVis] = useReveal(0.08);
      const [contRef, contVis] = useReveal(0.04);
      const [tabKey, setTabKey] = useState(0);
      const _pTab = useRef("gen");
      const _pStep = useRef(0);
      useEffect(() => {
        if (mainTab !== _pTab.current || step !== _pStep.current) {
          setTabKey(k => k + 1); _pTab.current = mainTab; _pStep.current = step;
        }
      }, [mainTab, step]);
      const trackMouse = (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - .5) * 14;
        const y = ((e.clientY - r.top) / r.height - .5) * 10;
        e.currentTarget.style.transform = "translateY(-3px) translate(" + x + "px," + y + "px) scale(1.02)";
      };
      const untrackMouse = (e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.transition = "transform .5s cubic-bezier(.34,1.56,.64,1)";
        setTimeout(() => { try { e.currentTarget.style.transition = ""; } catch (_) { } }, 550);
      };
      const addRipple = (e) => {
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();
        const d = Math.max(r.width, r.height) * 2;
        const rpl = document.createElement("div");
        rpl.className = "rpl";
        rpl.style.cssText = "width:" + d + "px;height:" + d + "px;left:" + (e.clientX - r.left - d / 2) + "px;top:" + (e.clientY - r.top - d / 2) + "px";
        el.appendChild(rpl);
        setTimeout(() => rpl.remove(), 560);
      };
      const rootRef = useRef(null);
      useEffect(() => {
        const el = rootRef.current;
        if (!el) return;
        el.style.setProperty("--bg", TH.bg);
        el.style.setProperty("--bg2", TH.bg2);
        el.style.setProperty("--bg3", TH.bg3);
        el.style.setProperty("--bd", TH.bd);
        el.style.setProperty("--bd2", TH.bd2);
        el.style.setProperty("--g", TH.g);
        el.style.setProperty("--g2", TH.g2);
        el.style.setProperty("--g3", TH.g3);
        el.style.setProperty("--g4", TH.g4);
        el.style.setProperty("--txt", TH.txt);
        el.style.setProperty("--mut", TH.mut);
      });

      // ── SCROLL REVEAL ─────────────────────────────────────────────────────────
      useEffect(() => {
        const obs = new IntersectionObserver(entries => {
          entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } });
        }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });
        document.querySelectorAll(".reveal, .reveal-left, .reveal-scale").forEach(el => obs.observe(el));
        return () => obs.disconnect();
      });

      // ── HEADER SCROLL SHADOW ──────────────────────────────────────────────────
      useEffect(() => {
        const fn = () => { const h = document.querySelector(".app-header"); if (h) h.classList.toggle("scrolled", window.scrollY > 8); };
        window.addEventListener("scroll", fn, { passive: true });
        return () => window.removeEventListener("scroll", fn);
      }, []);

      // ── MAGNETIC + RADIAL GLOW ON BUTTONS ────────────────────────────────────
      useEffect(() => {
        const move = e => {
          const b = e.currentTarget, r = b.getBoundingClientRect();
          const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
          b.style.transform = "translate(" + x * .2 + "px," + y * .2 + "px) scale(1.04)";
          b.style.setProperty("--bx", ((e.clientX - r.left) / r.width * 100) + "%");
          b.style.setProperty("--by", ((e.clientY - r.top) / r.height * 100) + "%");
        };
        const leave = e => { e.currentTarget.style.transform = ""; };
        const btns = document.querySelectorAll(".pbtn,.gbtn");
        btns.forEach(b => { b.addEventListener("mousemove", move); b.addEventListener("mouseleave", leave); });
        return () => btns.forEach(b => { b.removeEventListener("mousemove", move); b.removeEventListener("mouseleave", leave); });
      });

      // ── RIPPLE ON CLICK ──────────────────────────────────────────────────────
      useEffect(() => {
        const rip = e => {
          const b = e.currentTarget, r = b.getBoundingClientRect();
          const sz = Math.max(r.width, r.height);
          const sp = document.createElement("span");
          sp.className = "rip";
          sp.style.cssText = "width:" + sz + "px;height:" + sz + "px;left:" + (e.clientX - r.left - sz / 2) + "px;top:" + (e.clientY - r.top - sz / 2) + "px;";
          b.appendChild(sp);
          sp.addEventListener("animationend", () => sp.remove());
        };
        const btns = document.querySelectorAll(".pbtn,.gbtn");
        btns.forEach(b => { b.classList.add("ripple-wrap"); b.addEventListener("click", rip); });
        return () => btns.forEach(b => b.removeEventListener("click", rip));
      });

      // ── 3D TILT ON CARDS ─────────────────────────────────────────────────────
      useEffect(() => {
        const move = e => {
          const c = e.currentTarget, r = c.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
          c.style.transform = "perspective(680px) rotateY(" + (x * 9) + "deg) rotateX(" + (-y * 6) + "deg) translateY(-6px) scale(1.02)";
        };
        const leave = e => { e.currentTarget.style.transform = ""; };
        document.querySelectorAll(".stat-card,.sel-card").forEach(c => {
          c.classList.add("tilt"); c.addEventListener("mousemove", move); c.addEventListener("mouseleave", leave);
        });
        return () => document.querySelectorAll(".stat-card,.sel-card").forEach(c => {
          c.removeEventListener("mousemove", move); c.removeEventListener("mouseleave", leave);
        });
      });

      return (
        <div ref={rootRef} style={{ fontFamily: "'Outfit',sans-serif", minHeight: "100vh", background: BG, color: TXT, display: "flex", flexDirection: "column", position: "relative" }}>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700;800&display=swap" rel="stylesheet" />
          <link href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap" rel="stylesheet" />
          <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        button{color:inherit}
        html{font-size:19px}
        body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}

        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700;800&display=swap');

        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(76,175,80,.4);border-radius:99px}
        ::-webkit-scrollbar-thumb:hover{background:rgba(76,175,80,.7)}

        /* ══ KEYFRAMES ════════════════════════════════════════════════════════ */
        @keyframes blink{0%,100%{opacity:.2}50%{opacity:1}}
        @keyframes pulseDot{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.8);opacity:.35}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeLeft{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeRight{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:translateX(0)}}
        @keyframes scaleUp{from{opacity:0;transform:scale(.82) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(.88) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes springIn{0%{opacity:0;transform:scale(.6) translateY(20px)}60%{transform:scale(1.06) translateY(-4px)}80%{transform:scale(.97) translateY(1px)}100%{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes shimmer{0%{background-position:-400% center}100%{background-position:400% center}}
        @keyframes march{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
        @keyframes floatSlow{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-6px) rotate(1deg)}}
        @keyframes glow{0%,100%{box-shadow:0 0 16px rgba(76,175,80,.12),0 0 32px rgba(76,175,80,.02)}50%{box-shadow:0 0 48px rgba(76,175,80,.45),0 0 96px rgba(76,175,80,.12)}}
        @keyframes glowText{0%,100%{text-shadow:0 0 0px transparent}50%{text-shadow:0 0 24px rgba(76,175,80,.6),0 0 48px rgba(76,175,80,.25)}}
        @keyframes borderPulse{0%,100%{border-color:rgba(76,175,80,.18)}50%{border-color:rgba(76,175,80,.65)}}
        @keyframes scanLine{0%{top:-4%}100%{top:104%}}
        @keyframes tagPop{0%{opacity:0;transform:scale(.65) translateY(8px)}70%{transform:scale(1.06) translateY(-1px)}100%{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes popIn{0%{opacity:0;transform:scale(.5) translateY(18px)}65%{transform:scale(1.09) translateY(-3px)}82%{transform:scale(.96) translateY(1px)}100%{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes navIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ripple{0%{transform:scale(0);opacity:.4}100%{transform:scale(4);opacity:0}}
        @keyframes countUp{from{opacity:0;transform:scale(.4) translateY(24px)}65%{transform:scale(1.12) translateY(-4px)}100%{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes lineGrow{from{width:0;opacity:0}to{width:100%;opacity:1}}
        @keyframes lineGrowV{from{height:0;opacity:0}to{height:100%;opacity:1}}
        @keyframes rotateIn{from{opacity:0;transform:rotate(-12deg) scale(.8)}to{opacity:1;transform:rotate(0deg) scale(1)}}
        @keyframes wiggle{0%,100%{transform:rotate(0deg)}20%{transform:rotate(-8deg)}40%{transform:rotate(7deg)}60%{transform:rotate(-5deg)}80%{transform:rotate(3deg)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
        @keyframes morphBg{0%,100%{border-radius:24px}33%{border-radius:28px 18px 26px 20px}66%{border-radius:18px 26px 20px 28px}}
        @keyframes tiltCard{from{transform:perspective(800px) rotateX(0deg) rotateY(0deg)}to{transform:perspective(800px) rotateX(0deg) rotateY(0deg)}}
        @keyframes spotlight{0%{opacity:0;transform:scale(.8)}100%{opacity:1;transform:scale(1)}}
        @keyframes statReveal{0%{opacity:0;clip-path:inset(0 100% 0 0)}100%{opacity:1;clip-path:inset(0 0% 0 0)}}
        @keyframes badgeSlide{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
        @keyframes particleFloat{0%{transform:translateY(0) translateX(0) scale(1);opacity:.6}50%{transform:translateY(-40px) translateX(10px) scale(1.2);opacity:.3}100%{transform:translateY(-80px) translateX(-5px) scale(.8);opacity:0}}
        @keyframes gradientShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
        @keyframes glowPulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.15)}}
        @keyframes borderDance{0%{border-color:rgba(76,175,80,.15)}25%{border-color:rgba(76,175,80,.45)}50%{border-color:rgba(102,187,106,.35)}75%{border-color:rgba(76,175,80,.25)}100%{border-color:rgba(76,175,80,.15)}}
        @keyframes textReveal{from{opacity:0;clip-path:inset(0 100% 0 0)}to{opacity:1;clip-path:inset(0 0% 0 0)}}
        @keyframes hoverGlow{0%{box-shadow:0 0 0 0 rgba(76,175,80,0)}100%{box-shadow:0 0 28px 8px rgba(76,175,80,.18)}}
        @keyframes iconBounce{0%,100%{transform:translateY(0) rotate(0deg)}30%{transform:translateY(-6px) rotate(-8deg)}60%{transform:translateY(-3px) rotate(4deg)}}
        @keyframes slideInLeft{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideInRight{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
        @keyframes zoomFadeIn{from{opacity:0;transform:scale(1.08)}to{opacity:1;transform:scale(1)}}
        @keyframes typewriter{from{width:0}to{width:100%}}
        @keyframes cursorBlink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes rotateGlow{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        @keyframes cardEntrance{0%{opacity:0;transform:translateY(32px) scale(.94)}60%{transform:translateY(-4px) scale(1.02)}100%{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes numberFlip{0%{opacity:0;transform:rotateX(-90deg) translateY(20px)}60%{transform:rotateX(8deg) translateY(-3px)}100%{opacity:1;transform:rotateX(0) translateY(0)}}

        /* ══ TRANSITION UTILITIES ═════════════════════════════════════════════ */
        .t-fast{transition:all .15s cubic-bezier(.4,0,.2,1)}
        .t-smooth{transition:all .28s cubic-bezier(.4,0,.2,1)}
        .t-spring{transition:all .4s cubic-bezier(.34,1.56,.64,1)}
        .t-bounce{transition:all .5s cubic-bezier(.34,1.8,.64,1)}

        /* ══ SCROLL REVEAL ════════════════════════════════════════════════════ */
        .reveal{opacity:0;transform:translateY(24px);transition:opacity .6s cubic-bezier(.4,0,.2,1),transform .6s cubic-bezier(.4,0,.2,1)}
        .reveal.visible{opacity:1;transform:translateY(0)}
        .reveal-left{opacity:0;transform:translateX(-24px);transition:opacity .55s cubic-bezier(.4,0,.2,1),transform .55s cubic-bezier(.4,0,.2,1)}
        .reveal-left.visible{opacity:1;transform:translateX(0)}
        .reveal-scale{opacity:0;transform:scale(.9);transition:opacity .5s cubic-bezier(.4,0,.2,1),transform .5s cubic-bezier(.34,1.56,.64,1)}
        .reveal-scale.visible{opacity:1;transform:scale(1)}

        /* ══ BUTTONS ══════════════════════════════════════════════════════════ */
        .pbtn{
          background:linear-gradient(135deg,#1a5c1a 0%,#2d8f2d 40%,#4caf50 70%,#38a038 100%);
          background-size:300% 300%;animation:march 5s ease infinite;
          border:none;color:#fff;padding:13px 30px;border-radius:12px;
          font-family:'Outfit',sans-serif;font-weight:700;font-size:16px;
          cursor:pointer;transition:transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .3s ease;
          position:relative;overflow:hidden;letter-spacing:.3px;
          box-shadow:0 4px 20px rgba(76,175,80,.35),inset 0 1px 0 rgba(255,255,255,.25);
        }
        .pbtn::before{
          content:'';position:absolute;inset:0;
          background:radial-gradient(circle at var(--bx,50%) var(--by,50%),rgba(255,255,255,.25),transparent 60%);
          opacity:0;transition:opacity .3s;
        }
        .pbtn::after{
          content:'';position:absolute;top:0;left:-130%;
          width:55%;height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);
          transform:skewX(-22deg);transition:left .65s cubic-bezier(.4,0,.2,1);
        }
        .pbtn:hover{transform:translateY(-4px) scale(1.03);box-shadow:0 16px 44px rgba(76,175,80,.6),inset 0 1px 0 rgba(255,255,255,.3)}
        .pbtn:hover::before{opacity:1}
        .pbtn:hover::after{left:165%}
        .pbtn:active{transform:translateY(-1px) scale(.99);transition-duration:.1s}
        .pbtn:disabled{opacity:.3;cursor:not-allowed;transform:none;animation:none}

        .gbtn{
          background:rgba(76,175,80,.07);border:1px solid rgba(76,175,80,.3);
          color:var(--g);padding:12px 22px;border-radius:12px;
          font-family:'Outfit',sans-serif;font-weight:600;cursor:pointer;
          transition:all .28s cubic-bezier(.34,1.56,.64,1);
          font-size:15px;letter-spacing:.2px;position:relative;overflow:hidden;
        }
        .gbtn::before{
          content:'';position:absolute;inset:0;
          background:radial-gradient(circle at var(--bx,50%) var(--by,50%),rgba(76,175,80,.18),transparent 65%);
          opacity:0;transition:opacity .25s;
        }
        .gbtn:hover{background:rgba(76,175,80,.14);border-color:var(--g2);color:var(--txt);transform:translateY(-3px) scale(1.03);box-shadow:0 10px 32px rgba(76,175,80,.25)}
        .gbtn:hover::before{opacity:1}
        .gbtn:active{transform:translateY(0) scale(1)}

        .skbtn{
          background:transparent;border:1px solid rgba(76,175,80,.25);
          color:var(--mut);padding:8px 16px;border-radius:10px;
          font-family:'Outfit',sans-serif;font-weight:500;
          cursor:pointer;font-size:12px;transition:all .2s cubic-bezier(.34,1.56,.64,1);
        }
        .skbtn:hover{border-color:var(--g);color:var(--g);background:rgba(76,175,80,.06);transform:translateY(-2px) scale(1.02)}

        /* Ripple effect */
        .ripple-wrap{position:relative;overflow:hidden}
        .ripple-wrap .rip{
          position:absolute;border-radius:50%;
          background:rgba(76,175,80,.25);
          pointer-events:none;
          animation:ripple .6s ease-out forwards;
          transform:scale(0);
        }

        /* ══ NAV TABS ══════════════════════════════════════════════════════════ */
        .tbtn{
          background:none;border:none;cursor:pointer;
          padding:9px 14px;font-family:'Outfit',sans-serif;
          font-weight:600;font-size:14px;
          color:var(--mut);position:relative;letter-spacing:.2px;white-space:nowrap;
          transition:color .2s ease;
        }
        .tbtn::before{
          content:'';position:absolute;bottom:-1px;left:50%;right:50%;
          height:2px;background:var(--g);border-radius:2px 2px 0 0;
          transition:left .3s cubic-bezier(.34,1.56,.64,1),right .3s cubic-bezier(.34,1.56,.64,1),box-shadow .3s;
        }
        .tbtn::after{
          content:'';position:absolute;inset:6px;border-radius:8px;
          background:rgba(76,175,80,.0);
          transition:background .2s;
        }
        .tbtn:hover{color:var(--g2)}
        .tbtn:hover::before{left:8%;right:8%}
        .tbtn:hover::after{background:rgba(76,175,80,.07)}
        .tbtn-active{color:var(--g) !important;animation:glowText 3s ease-in-out infinite}
        .tbtn-active::before{left:0 !important;right:0 !important;box-shadow:0 0 8px rgba(76,175,80,.6)}
        .tbtn-active::after{background:rgba(76,175,80,.09) !important}

        /* ══ BADGE ═════════════════════════════════════════════════════════════ */
        .badge{
          background:rgba(76,175,80,.1);border:1px solid rgba(76,175,80,.22);
          color:var(--g);padding:4px 12px;border-radius:20px;
          font-size:12px;font-weight:700;display:inline-block;
          font-family:'JetBrains Mono',monospace;letter-spacing:.5px;
          transition:all .2s cubic-bezier(.34,1.56,.64,1);
        }
        .badge:hover{background:rgba(76,175,80,.2);transform:scale(1.06)}

        /* ══ INPUTS ════════════════════════════════════════════════════════════ */
        .ri{width:72px;background:var(--bg);border:1px solid var(--bd2);color:var(--txt);padding:6px 9px;border-radius:9px;font-family:'JetBrains Mono',monospace;font-size:12px;outline:none;transition:all .22s cubic-bezier(.4,0,.2,1)}
        .ri:focus{border-color:var(--g);box-shadow:0 0 0 3px rgba(76,175,80,.14);transform:scale(1.02)}
        .si{width:100%;background:var(--bg);border:1px solid var(--bd2);color:var(--txt);padding:11px 15px;border-radius:11px;font-family:'Outfit',sans-serif;font-size:13px;outline:none;transition:all .22s cubic-bezier(.4,0,.2,1)}
        .si:focus{border-color:var(--g);box-shadow:0 0 0 3px rgba(76,175,80,.1)}
        .ci{flex:1;background:var(--bg);border:1px solid var(--bd2);color:var(--txt);padding:11px 15px;border-radius:11px;font-family:'Outfit',sans-serif;font-size:13px;outline:none;transition:all .22s cubic-bezier(.4,0,.2,1)}
        .ci:focus{border-color:var(--g);box-shadow:0 0 0 3px rgba(76,175,80,.1)}

        /* ══ CHAT BUBBLES ══════════════════════════════════════════════════════ */
        .bai{
          background:var(--bg3);border:1px solid var(--bd);
          border-radius:16px 16px 16px 3px;padding:13px 16px;max-width:86%;
          font-size:13px;line-height:1.7;white-space:pre-wrap;color:var(--txt);
          animation:springIn .35s cubic-bezier(.34,1.56,.64,1);
          box-shadow:0 3px 16px rgba(0,0,0,.1);font-family:'Outfit',sans-serif;
        }
        .bau{
          background:linear-gradient(135deg,#173d17,#256325);
          border:1px solid rgba(76,175,80,.25);
          border-radius:16px 16px 3px 16px;padding:13px 16px;max-width:80%;
          font-size:13px;line-height:1.65;align-self:flex-end;color:#e8f5e9;
          animation:springIn .3s cubic-bezier(.34,1.56,.64,1);
          box-shadow:0 4px 22px rgba(76,175,80,.22);font-family:'Outfit',sans-serif;
        }

        /* ══ FLOATING BOT ══════════════════════════════════════════════════════ */
        .fbot{position:fixed;bottom:24px;right:24px;z-index:999;display:flex;flex-direction:column;align-items:flex-end;gap:12px;pointer-events:none}
        .fbot>*{pointer-events:all}
        .fbot-btn{
          width:56px;height:56px;border-radius:50%;
          background:linear-gradient(135deg,#0d3d0d,#4caf50);
          border:1px solid rgba(76,175,80,.4);color:#fff;
          font-family:'JetBrains Mono',monospace;font-weight:800;font-size:9px;
          cursor:pointer;animation:glow 3s ease-in-out infinite;
          box-shadow:0 6px 28px rgba(76,175,80,.4);
          transition:transform .35s cubic-bezier(.34,1.8,.64,1),box-shadow .3s;
          white-space:pre-line;line-height:1.3;
        }
        .fbot-btn:hover{transform:scale(1.14) rotate(-7deg);box-shadow:0 14px 44px rgba(76,175,80,.65)}
        .fbot-win{
          width:360px;background:var(--bg2);border:1px solid var(--bd2);
          border-radius:20px;overflow:hidden;max-height:500px;
          display:flex;flex-direction:column;
          box-shadow:0 28px 72px rgba(0,0,0,.35),0 0 0 1px rgba(76,175,80,.06);
          animation:springIn .3s cubic-bezier(.34,1.56,.64,1);
        }
        .fbot-msgs{overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;flex:1}
        .fbot-u{background:linear-gradient(135deg,#173d17,#256325);border-radius:13px 13px 3px 13px;padding:9px 13px;max-width:88%;align-self:flex-end;font-size:12px;line-height:1.5;white-space:pre-wrap;color:#e8f5e9;animation:springIn .28s cubic-bezier(.34,1.56,.64,1);font-family:'Outfit',sans-serif}
        .fbot-a{background:var(--bg3);border:1px solid var(--bd);border-radius:13px 13px 13px 3px;padding:9px 13px;max-width:92%;font-size:12px;line-height:1.5;white-space:pre-wrap;color:var(--txt);animation:springIn .28s cubic-bezier(.34,1.56,.64,1);font-family:'Outfit',sans-serif}

        /* ══ HEADER ════════════════════════════════════════════════════════════ */
        .app-header{
          padding:0 20px;height:64px;
          display:flex;align-items:center;justify-content:space-between;
          flex-shrink:0;gap:8px;position:sticky;top:0;z-index:100;
          background:var(--bg2);backdrop-filter:blur(28px) saturate(1.5);
          border-bottom:1px solid var(--bd);
          transition:background .3s,border-color .3s,box-shadow .3s;
          animation:fadeDown .35s ease both;
        }
        .app-header.scrolled{box-shadow:0 4px 32px rgba(0,0,0,.22)}

        /* ══ LOGO ══════════════════════════════════════════════════════════════ */
        .logo-icon{
          width:40px;height:40px;border-radius:11px;
          background:linear-gradient(135deg,#0d3d0d,#3d9c3d);
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
          box-shadow:0 3px 16px rgba(76,175,80,.35),inset 0 1px 0 rgba(255,255,255,.2);
          transition:transform .35s cubic-bezier(.34,1.8,.64,1),box-shadow .3s;
          position:relative;overflow:hidden;cursor:pointer;
        }
        .logo-icon::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.22) 0%,transparent 55%)}
        .logo-icon:hover{transform:rotate(-9deg) scale(1.12);box-shadow:0 8px 32px rgba(76,175,80,.6)}
        .logo-icon:active{transform:rotate(-6deg) scale(.96)}

        /* ══ CREDIT BAR ════════════════════════════════════════════════════════ */
        .credit-bar{
          background:linear-gradient(90deg,transparent 0%,rgba(76,175,80,.08) 30%,rgba(76,175,80,.08) 70%,transparent 100%);
          border-bottom:1px solid rgba(76,175,80,.12);
          padding:9px 48px;display:flex;align-items:center;justify-content:center;gap:16px;
          flex-shrink:0;position:sticky;top:60px;z-index:99;
          transition:all .3s;
          animation:fadeDown .4s .3s both;
        }

        /* ══ PAGE ENTER ════════════════════════════════════════════════════════ */
        .page-enter{animation:fadeUp .4s cubic-bezier(.4,0,.2,1)}

        /* ══ ENHANCED CARD EFFECTS ══════════════════════════════════════════════ */
        .stat-card::before{
          content:'';position:absolute;inset:0;border-radius:inherit;
          background:linear-gradient(135deg,rgba(76,175,80,.06) 0%,transparent 60%);
          opacity:0;transition:opacity .35s;pointer-events:none;
        }
        .stat-card:hover::before{opacity:1}
        .sel-card::before{
          content:'';position:absolute;inset:0;border-radius:inherit;
          background:linear-gradient(135deg,rgba(76,175,80,.08) 0%,transparent 60%);
          opacity:0;transition:opacity .3s;pointer-events:none;
        }
        .sel-card:hover::before{opacity:1}
        .pbtn{position:relative;overflow:hidden}
        .pbtn::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.15),transparent);opacity:0;transition:opacity .25s}
        .pbtn:hover::after{opacity:1}
        .spec-pill{
          display:inline-flex;align-items:center;gap:6px;
          font-size:12px;font-family:'JetBrains Mono',monospace;font-weight:700;
          padding:6px 16px;border-radius:100px;letter-spacing:.5px;
          transition:all .3s cubic-bezier(.34,1.56,.64,1);cursor:default;
        }
        .spec-pill:hover{transform:translateY(-3px) scale(1.06);box-shadow:0 8px 20px rgba(76,175,80,.25)}
        .challenge-tag{
          display:inline-flex;align-items:center;gap:6px;
          transition:all .25s cubic-bezier(.34,1.56,.64,1);
        }
        .challenge-tag:hover{transform:translateY(-2px) scale(1.04)}

        /* ══ MODAL ══════════════════════════════════════════════════════════════ */
        .modal-overlay{animation:fadeIn .18s ease}
        .modal-box{animation:springIn .3s cubic-bezier(.34,1.56,.64,1)}

        /* ══ SELECTION CARD ════════════════════════════════════════════════════ */
        .sel-card{border-radius:14px;padding:16px;cursor:pointer;transition:transform .28s cubic-bezier(.34,1.56,.64,1),box-shadow .28s;position:relative;overflow:hidden}
        .sel-card:hover{transform:translateY(-4px) scale(1.02);box-shadow:0 20px 56px rgba(0,0,0,.28)}
        .sel-card:active{transform:translateY(-1px) scale(1.01)}

        /* ══ SECTION LABEL ═════════════════════════════════════════════════════ */
        .sec-lbl{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:800;
          letter-spacing:4px;color:var(--g);text-transform:uppercase;margin-bottom:16px;
          display:flex;align-items:center;gap:12px}
        .sec-lbl::before{content:'';display:block;width:24px;height:1.5px;background:var(--g);flex-shrink:0}
        .sec-lbl::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(76,175,80,.4),transparent);animation:lineGrow .8s .2s both}

        /* ══ STAT CARD ══════════════════════════════════════════════════════════ */
        .stat-card{
          border-radius:22px;padding:28px 30px;
          transition:transform .35s cubic-bezier(.34,1.56,.64,1),box-shadow .35s,border-color .35s;
          position:relative;overflow:hidden;
          background:var(--bg3);border:1px solid var(--bd);
          animation:scaleUp .5s both;cursor:default;
        }
        .stat-card::after{
          content:'';position:absolute;bottom:-50px;left:50%;transform:translateX(-50%);
          width:80px;height:80px;border-radius:50%;
          background:radial-gradient(circle,rgba(76,175,80,.3),transparent 70%);
          filter:blur(16px);opacity:0;
          transition:opacity .4s,bottom .4s;
        }
        .stat-card:hover{transform:translateY(-8px) scale(1.03);border-color:rgba(76,175,80,.4);box-shadow:0 24px 64px rgba(0,0,0,.15),0 0 0 1px rgba(76,175,80,.12),0 0 40px rgba(76,175,80,.05)}
        .stat-card:hover::after{opacity:1;bottom:-20px}

        /* ══ STEP CIRCLE ════════════════════════════════════════════════════════ */
        .step-circle{
          width:50px;height:50px;border-radius:50%;
          background:rgba(76,175,80,.07);border:2px solid rgba(76,175,80,.2);
          display:flex;align-items:center;justify-content:center;
          margin:0 auto 16px;font-family:'JetBrains Mono',monospace;
          font-size:13px;font-weight:800;color:var(--g);
          transition:all .35s cubic-bezier(.34,1.8,.64,1);
        }
        .step-circle:hover{background:var(--g);color:#000;border-color:var(--g);transform:scale(1.2) rotate(5deg);box-shadow:0 0 0 6px rgba(76,175,80,.12),0 0 32px rgba(76,175,80,.45)}

        /* ══ PROGRESS STEPS ═════════════════════════════════════════════════════ */
        .prog-step{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;cursor:pointer;transition:all .28s cubic-bezier(.34,1.56,.64,1)}
        .prog-step:hover{transform:scale(1.2);box-shadow:0 0 12px rgba(76,175,80,.4)}

        /* ══ CHALLENGE BANNER ═══════════════════════════════════════════════════ */
        .challenge-banner{
          position:relative;overflow:hidden;border-radius:0;
          background:rgba(76,175,80,.05);border:none;
          border-top:1px solid rgba(76,175,80,.18);border-bottom:1px solid rgba(76,175,80,.18);
          padding:44px clamp(24px,7vw,100px);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:24px;
          animation:borderPulse 4s ease-in-out infinite;
        }
        .challenge-banner::before{
          content:'';position:absolute;top:0;left:0;right:0;height:1px;
          background:linear-gradient(90deg,transparent,rgba(76,175,80,.95),transparent);
          animation:shimmer 3.5s ease-in-out infinite;background-size:400% auto;
        }
        .challenge-banner::after{
          content:'';position:absolute;top:-40px;right:-40px;
          width:180px;height:180px;border-radius:50%;
          background:radial-gradient(circle,rgba(76,175,80,.08),transparent 70%);
          pointer-events:none;
        }

        /* ══ FEAT CARD ══════════════════════════════════════════════════════════ */
        .feat-card{
          border-radius:20px;padding:28px 26px;cursor:pointer;
          position:relative;overflow:hidden;
          background:var(--bg3);border:1px solid var(--bd);
          transition:transform .35s cubic-bezier(.34,1.56,.64,1),box-shadow .35s,border-color .35s,background .3s;
        }
        .feat-card::before{
          content:'';position:absolute;top:0;left:0;right:0;height:1px;
          background:linear-gradient(90deg,transparent,rgba(76,175,80,.5),transparent);
          transform:scaleX(0);transform-origin:left;
          transition:transform .4s cubic-bezier(.4,0,.2,1);
        }
        .feat-card:hover{transform:translateY(-7px) scale(1.02);border-color:rgba(76,175,80,.3);background:rgba(76,175,80,.055);box-shadow:0 16px 44px rgba(0,0,0,.1),0 0 0 1px rgba(76,175,80,.14),0 0 30px rgba(76,175,80,.04)}
        .feat-card:hover::before{transform:scaleX(1)}
        .feat-icon-wrap{width:50px;height:50px;border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;background:rgba(76,175,80,.1);border:1px solid rgba(76,175,80,.2);transition:all .35s cubic-bezier(.34,1.56,.64,1)}
        .feat-card:hover .feat-icon-wrap{background:rgba(76,175,80,.22);transform:scale(1.1) rotate(-5deg);box-shadow:0 0 18px rgba(76,175,80,.28)}

        /* ══ TILT CARD (3D hover) ════════════════════════════════════════════════ */
        .tilt{
          transform-style:preserve-3d;
          transition:transform .12s ease-out;
          will-change:transform;
        }

        /* ══ HOW STEP ═══════════════════════════════════════════════════════════ */
        .how-step{text-align:center;padding:0 12px;position:relative;z-index:1}
        .how-step:nth-child(1){animation:fadeUp .5s .00s both}
        .how-step:nth-child(2){animation:fadeUp .5s .08s both}
        .how-step:nth-child(3){animation:fadeUp .5s .16s both}
        .how-step:nth-child(4){animation:fadeUp .5s .24s both}
        .how-step:nth-child(5){animation:fadeUp .5s .32s both}

        /* ══ FEAT ROW (homepage list item) ══════════════════════════════════════ */
        .feat-row{
          display:flex;align-items:flex-start;gap:12px;
          padding:13px 14px;border-radius:12px;
          background:rgba(76,175,80,.0);border:1px solid transparent;
          transition:background .22s,border-color .22s,transform .22s cubic-bezier(.34,1.56,.64,1);
        }
        .feat-row:hover{background:rgba(76,175,80,.07);border-color:rgba(76,175,80,.22);transform:translateX(4px)}
        .feat-row:active{transform:translateX(2px) scale(.99)}

        strong{color:var(--g)}

        /* ══ BLEED — full-width sections that escape page-pad ═══════════════════ */
        .bleed{margin-left:-52px;margin-right:-52px}
        @media(max-width:1024px){.bleed{margin-left:-36px;margin-right:-36px}}
        @media(max-width:768px){.bleed{margin-left:-20px;margin-right:-20px}}
        @media(max-width:600px){.bleed{margin-left:-16px;margin-right:-16px}}
        @media(max-width:480px){.bleed{margin-left:-12px;margin-right:-12px}}
        @media(max-width:360px){.bleed{margin-left:-10px;margin-right:-10px}}

        /* ══ GRIDS ═══════════════════════════════════════════════════════════════ */
        .grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
        .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
        .grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
        .grid-5{display:grid;grid-template-columns:repeat(5,1fr);gap:0;position:relative}
        .grid-compare{display:grid;grid-template-columns:140px 1fr 1fr}
        .page-pad{padding:32px 52px 52px}
        .header-nav{display:flex;align-items:center;gap:10px}

        /* ══ HAMBURGER / MOBILE NAV ═══════════════════════════════════════════════ */
        .desktop-nav{display:flex;align-items:center;gap:10px}
        .mobile-nav-right{display:none;align-items:center;gap:8px}
        .hamburger{
          display:flex;flex-direction:column;justify-content:center;align-items:center;
          width:38px;height:38px;gap:5px;cursor:pointer;
          background:rgba(76,175,80,.1);border:1px solid rgba(76,175,80,.25);border-radius:10px;
          transition:all .2s;flex-shrink:0;padding:0;
        }
        .hamburger:hover{background:rgba(76,175,80,.2)}
        .ham-line{
          display:block;width:18px;height:2px;border-radius:2px;
          background:currentColor;transition:transform .25s,opacity .25s;
        }
        .ham-line.open:first-child{transform:translateY(7px) rotate(45deg)}
        .ham-line.mid.open{opacity:0;transform:scaleX(0)}
        .ham-line.open:last-child{transform:translateY(-7px) rotate(-45deg)}
        .mobile-menu{
          position:sticky;top:64px;z-index:99;
          display:flex;flex-direction:column;
          background:var(--bg2);border-bottom:1px solid var(--bd);
          box-shadow:0 8px 32px rgba(0,0,0,.18);
          animation:fadeDown .2s ease both;
        }
        .mobile-menu-item{
          display:flex;align-items:center;gap:12px;
          padding:14px 20px;font-size:15px;font-weight:600;
          color:var(--txt);background:transparent;border:none;border-bottom:1px solid var(--bd);
          cursor:pointer;text-align:left;font-family:'Outfit',sans-serif;letter-spacing:-.2px;
          transition:background .15s;
        }
        .mobile-menu-item:hover{background:rgba(76,175,80,.07)}
        .mobile-menu-item.active{color:var(--g);background:rgba(76,175,80,.06)}
        .mobile-menu-item:last-child{border-bottom:none}

        /* ══ RESPONSIVE ═══════════════════════════════════════════════════════════ */

        /* ── Code sub-tabs: scrollable on small screens ── */
        .code-tabs-bar{
          display:flex;gap:0;border-bottom:1px solid var(--bd);
          overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;
          flex-shrink:0;
        }
        .code-tabs-bar::-webkit-scrollbar{display:none}
        .code-tabs-bar .tbtn{flex-shrink:0}

        /* ── Sensor/actuator cards wrap nicely ── */
        .sensor-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}
        .mcu-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}

        /* ── Step progress bar ── */
        .step-bar{display:flex;align-items:center;gap:0;overflow-x:auto;scrollbar-width:none}
        .step-bar::-webkit-scrollbar{display:none}

        /* Tablet — 1024px */
        @media(max-width:1024px){
          .page-pad{padding:28px 36px 40px}
          .grid-4{grid-template-columns:repeat(2,1fr)}
          .sensor-grid{grid-template-columns:repeat(auto-fill,minmax(180px,1fr))}
        }

        /* Tablet portrait — 768px: hamburger on */
        @media(max-width:768px){
          .desktop-nav{display:none}
          .mobile-nav-right{display:flex}
          .mobile-menu{top:56px}
          .grid-4{grid-template-columns:repeat(2,1fr)}
          .grid-3{grid-template-columns:repeat(2,1fr)}
          .grid-5{grid-template-columns:repeat(3,1fr);gap:8px}
          .grid-5 .step-connector{display:none}
          .grid-compare{grid-template-columns:90px 1fr 1fr;font-size:11px}
          .page-pad{padding:20px 20px 28px}
          .header-divider{display:none}
          .tbtn{padding:7px 10px;font-size:12px}
          .fbot-win{width:calc(100vw - 28px);max-width:360px}
          .challenge-banner{padding:28px 20px}
          .app-header{padding:0 16px;height:56px}
          .credit-bar{font-size:10px;gap:8px}
          .sensor-grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr))}
          .mcu-grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr))}
        }

        /* Mobile — 600px */
        @media(max-width:600px){
          .page-pad{padding:16px 14px 24px}
          .grid-4{grid-template-columns:repeat(2,1fr);gap:10px}
          .grid-3{grid-template-columns:1fr}
          .grid-2{grid-template-columns:1fr}
          .grid-5{grid-template-columns:repeat(2,1fr);gap:8px}
          .grid-compare{grid-template-columns:70px 1fr 1fr;font-size:10px}
          .tbtn{padding:6px 8px;font-size:11px;letter-spacing:0}
          .fbot{bottom:12px;right:12px}
          .fbot-win{width:calc(100vw - 24px);max-height:70vh}
          .bai,.bau{max-width:95%}
          .stat-card{padding:16px 12px}
          .feat-row{padding:10px 10px}
          .app-header{padding:0 12px;height:52px}
          .credit-bar{padding:4px 12px;gap:6px;font-size:9px}
          .challenge-banner{padding:20px 16px;flex-direction:column;align-items:flex-start}
          .sensor-grid{grid-template-columns:1fr 1fr}
          .mcu-grid{grid-template-columns:1fr 1fr}
          .code-tabs-bar .tbtn{font-size:10px;padding:5px 8px}
        }

        /* Small mobile — 480px */
        @media(max-width:480px){
          .grid-4{grid-template-columns:repeat(2,1fr);gap:8px}
          .grid-3{grid-template-columns:1fr}
          .grid-2{grid-template-columns:1fr}
          .grid-5{grid-template-columns:repeat(2,1fr);gap:6px}
          .tbtn{padding:5px 7px;font-size:11px}
          .stat-card{padding:14px 10px}
          .page-pad{padding:14px 12px 20px}
          .ri{width:54px;font-size:12px}
          .sensor-grid{grid-template-columns:1fr 1fr;gap:8px}
          .mcu-grid{grid-template-columns:1fr 1fr}
          .fbot{bottom:10px;right:10px}
          .fbot-win{width:calc(100vw - 20px);border-radius:14px}
          .credit-dua{display:none}
        }

        /* Very small — 360px */
        @media(max-width:360px){
          .tbtn{padding:5px 6px;font-size:10px;letter-spacing:0}
          .stat-card{padding:12px 8px}
          .page-pad{padding:12px 10px 16px}
          .grid-4{grid-template-columns:1fr 1fr;gap:6px}
          .app-header{padding:0 10px}
          .ri{width:48px;padding:5px 6px;font-size:11px}
          .credit-sep,.credit-dua{display:none}
          .sensor-grid{grid-template-columns:1fr}
          .mcu-grid{grid-template-columns:1fr 1fr}
          .fbot-win{border-radius:12px}
          .code-tabs-bar .tbtn{font-size:9px;padding:5px 6px}
        }
      `}</style>

          {/* ── HEADER ─────────────────────────────────────────────────────────── */}
          <div className="app-header">
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", cursor: "pointer", flexShrink: 0, gap: 10 }} onClick={() => { setStep(0); setMainTab("gen"); setMenuOpen(false); }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-1.5px", fontFamily: "'Outfit',sans-serif", color: darkMode ? "#6fcf74" : "#1b5e20", lineHeight: 1 }}>Falla7</div>
                <div style={{ fontSize: 8, color: "rgba(76,175,80,.55)", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "3px", fontWeight: 700, marginTop: 2, textTransform: "uppercase" }}>Capstone Toolkit</div>
              </div>
            </div>

            {/* Desktop nav */}
            <div className="header-nav desktop-nav">
              <div style={{ display: "flex", gap: 2, flexWrap: "nowrap" }}>
                {[["gen", "Code Gen"], ["chat", "AI Chat"], ["trouble", "Debug"], ["tools", "Tools"], ["compare", "Compare"], ["learn", "Learn"], ["resources", "Resources"]].map(([t, lbl], i) => (
                  <button key={t} className={"tbtn" + (mainTab === t ? " tbtn-active" : "")}
                    onClick={() => setMainTab(t)}
                    style={{ padding: "8px 14px", fontSize: 13, fontWeight: 600, letterSpacing: "-.2px" }}>
                    {lbl}
                  </button>
                ))}
              </div>
              <button onClick={() => setDarkMode(d => !d)}
                style={{ background: "rgba(76,175,80,.1)", border: "1px solid rgba(76,175,80,.25)", borderRadius: 10, padding: "7px 14px", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: darkMode ? "#6fcf74" : "#1b5e20", fontWeight: 800, flexShrink: 0, letterSpacing: "1px", transition: "all .2s" }}>
                {darkMode ? "LIGHT" : "DARK"}
              </button>
            </div>

            {/* Mobile right: dark toggle + hamburger */}
            <div className="mobile-nav-right">
              <button onClick={() => setDarkMode(d => !d)}
                style={{ background: "rgba(76,175,80,.1)", border: "1px solid rgba(76,175,80,.25)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: darkMode ? "#6fcf74" : "#1b5e20", fontWeight: 800, letterSpacing: "1px" }}>
                {darkMode ? "☀" : "🌙"}
              </button>
              <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
                <span className={"ham-line" + (menuOpen ? " open" : "")} />
                <span className={"ham-line mid" + (menuOpen ? " open" : "")} />
                <span className={"ham-line" + (menuOpen ? " open" : "")} />
              </button>
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {menuOpen && (
            <div className="mobile-menu">
              {[["gen", "Code Gen"], ["chat", "AI Chat"], ["trouble", "Debug"], ["tools", "Tools"], ["compare", "Compare"], ["learn", "Learn"], ["resources", "Resources"]].map(([t, lbl]) => (
                <button key={t} className={"mobile-menu-item" + (mainTab === t ? " active" : "")}
                  onClick={() => { setMainTab(t); setMenuOpen(false); }}>
                  {lbl}
                  {mainTab === t && <span style={{ marginLeft: "auto", color: G, fontSize: 14 }}>●</span>}
                </button>
              ))}
            </div>
          )}

          {/* ── DEVELOPER CREDIT BAR ────────────────────────────────────────────── */}
          <div className="credit-bar">
            <div style={{
              width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
              background: darkMode ? "#00e676" : "#2e7d32",
              boxShadow: darkMode ? "0 0 8px rgba(0,230,118,.9)" : "0 0 5px rgba(46,125,50,.7)",
              animation: "pulseDot 2.5s ease-in-out infinite"
            }} />
            <span style={{ fontSize: 11, color: MUT, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "1.5px" }}>BUILT BY</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: TXT, fontFamily: "'Outfit',sans-serif", letterSpacing: "-.3px" }}>Khaled Mohammed</span>
            <span style={{ color: MUT, fontSize: 14, fontWeight: 300, padding: "0 2px" }}>|</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: G, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "1.5px" }}>STEM ALEX S27</span>
            <span className="credit-sep" style={{ color: MUT, fontSize: 14, fontWeight: 300, padding: "0 2px" }}>|</span>
            <span className="credit-dua" style={{ fontSize: 14, color: TXT, fontFamily: "serif", fontStyle: "italic" }}>دعواتكم</span>
          </div>

          {/* ── BODY ────────────────────────────────────────────────────────────── */}
          <div className="app-body" style={{ display: "flex", flex: 1, overflow: "hidden" }}>

            {/* ══ CODE GENERATOR ══════════════════════════════════════════════════ */}
            <div style={{ flex: mainTab === "gen" ? 1 : 0, display: mainTab === "gen" ? "flex" : "none", flexDirection: "column", overflow: "auto" }}>
              <div className="page-pad" style={{ maxWidth: step === 0 ? "100%" : 1280, margin: "0 auto", width: "100%", padding: step === 0 ? "0" : undefined }}>

                {/* Progress bar */}
                {step > 0 && step < 6 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 24, flexWrap: "wrap" }}>
                    {STEPS.map((s, i) => (
                      <div key={s} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: i < step ? G : i === step ? G4 : "transparent", border: "1.5px solid " + (i <= step ? G : BD), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: i <= step ? TXT : MUT, cursor: i < step ? "pointer" : "default", transition: "all .2s" }}
                          onClick={() => { if (i < step) setStep(i); }}>
                          {i < step ? "v" : i + 1}
                        </div>
                        <span style={{ fontSize: 12, color: i === step ? G2 : i < step ? G : MUT, fontWeight: i === step ? 700 : 400 }}>{s}</span>
                        {i < STEPS.length - 1 && <div style={{ width: 16, height: 1, background: BD, margin: "0 2px" }} />}
                      </div>
                    ))}
                  </div>
                )}

                {/* STEP 0: Welcome */}
                {step === 0 && (
                  <div style={{}} key={tabKey} className="page-enter">

                    {/* ══ HERO ══════════════════════════════════════════════ */}
                    {/* FULL-SCREEN HERO — centered layout, bleeds out of page-pad */}
                    <div className="bleed" style={{
                      position: "relative", marginBottom: 0,
                      overflow: "hidden", minHeight: "100vh",
                      display: "flex", flexDirection: "column", justifyContent: "center",
                      background: darkMode
                        ? "linear-gradient(160deg,#020704 0%,#030d05 55%,#060f07 100%)"
                        : "linear-gradient(160deg,#e4f5e6 0%,#f2faf2 55%,#ffffff 100%)"
                    }}>

                      {/* Grid texture */}
                      <div style={{
                        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
                        backgroundImage: "linear-gradient(" + (darkMode ? "rgba(76,175,80,.035)" : "rgba(76,175,80,.07)") + " 1px,transparent 1px),linear-gradient(90deg," + (darkMode ? "rgba(76,175,80,.035)" : "rgba(76,175,80,.07)") + " 1px,transparent 1px)",
                        backgroundSize: "56px 56px"
                      }} />

                      {/* Central radial glow */}
                      <div style={{
                        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                        width: "100%", height: "100%", pointerEvents: "none", zIndex: 0,
                        background: darkMode
                          ? "radial-gradient(ellipse 80% 60% at 50% 50%,rgba(76,175,80,.11) 0%,transparent 70%)"
                          : "radial-gradient(ellipse 80% 60% at 50% 50%,rgba(76,175,80,.09) 0%,transparent 70%)"
                      }} />

                      {/* Vertical grid lines — full height decorative */}
                      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                        <div key={i} style={{
                          position: "absolute", top: 0, bottom: 0, width: 1, left: (i * 14 + 1) + "%",
                          pointerEvents: "none", zIndex: 0,
                          background: "linear-gradient(180deg,transparent 0%,rgba(76,175,80," + (darkMode ? .025 : .04) + ") 25%,rgba(76,175,80," + (darkMode ? .05 : .08) + ") 55%,rgba(76,175,80," + (darkMode ? .025 : .04) + ") 80%,transparent 100%)"
                        }} />
                      ))}

                      {/* Pulsing rings */}
                      {[600, 420, 280].map((sz, ri) => (
                        <div key={ri} style={{
                          position: "absolute", top: "42%", left: "50%",
                          transform: "translate(-50%,-50%)", width: sz, height: sz, borderRadius: "50%",
                          border: "1px solid " + (darkMode ? "rgba(76,175,80,.045)" : "rgba(76,175,80,.07)"),
                          pointerEvents: "none", zIndex: 0,
                          animation: "glow " + (5 + ri * 1.8) + "s " + (ri * 1.2) + "s ease-in-out infinite"
                        }} />
                      ))}

                      {/* Floating particles — 20 dots */}
                      {[...Array(20)].map((_, i) => (
                        <div key={i} style={{
                          position: "absolute", pointerEvents: "none", zIndex: 1,
                          width: [3, 4, 3, 5, 2, 4, 3, 5, 2, 4, 3, 5, 4, 3, 2, 5, 3, 4, 2, 4][i],
                          height: [3, 4, 3, 5, 2, 4, 3, 5, 2, 4, 3, 5, 4, 3, 2, 5, 3, 4, 2, 4][i],
                          borderRadius: "50%",
                          background: darkMode ? "rgba(76,175,80,.45)" : "rgba(76,175,80,.35)",
                          left: [4, 11, 20, 31, 42, 53, 63, 74, 84, 92, 7, 17, 37, 49, 61, 71, 81, 27, 57, 88][i] + "%",
                          top: [8, 52, 18, 72, 6, 42, 28, 68, 14, 58, 82, 33, 88, 23, 63, 48, 38, 78, 4, 92][i] + "%",
                          animation: "particleFloat " + (3.0 + i * .48) + "s " + (i * .32) + "s ease-in-out infinite",
                          boxShadow: "0 0 " + (4 + i * 1.1) + "px rgba(76,175,80,.32)"
                        }} />
                      ))}

                      {/* Scan line */}
                      <div style={{
                        position: "absolute", left: 0, right: 0, height: 2, pointerEvents: "none", zIndex: 1,
                        background: darkMode
                          ? "linear-gradient(90deg,transparent 0%,rgba(76,175,80,.0) 20%,rgba(76,175,80,.3) 50%,rgba(129,199,132,.2) 65%,transparent 100%)"
                          : "linear-gradient(90deg,transparent 0%,rgba(76,175,80,.0) 20%,rgba(76,175,80,.2) 50%,rgba(76,175,80,.12) 65%,transparent 100%)",
                        animation: "scanLine 11s linear infinite"
                      }} />

                      {/* ── CENTERED content ── */}
                      <div style={{
                        position: "relative", zIndex: 2,
                        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
                        padding: "clamp(48px,10vh,140px) clamp(16px,8vw,120px) clamp(40px,8vh,100px)"
                      }}>

                        {/* Live badge */}
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 32,
                          background: darkMode ? "rgba(76,175,80,.07)" : "rgba(76,175,80,.11)",
                          border: "1px solid " + (darkMode ? "rgba(76,175,80,.22)" : "rgba(76,175,80,.3)"),
                          borderRadius: 100, padding: "8px 22px",
                          animation: "fadeUp .45s .05s both",
                          boxShadow: darkMode ? "0 0 24px rgba(76,175,80,.07)" : "none"
                        }}>
                          <div style={{
                            width: 7, height: 7, borderRadius: "50%", background: "#4caf50",
                            boxShadow: "0 0 12px rgba(76,175,80,.95)", animation: "pulseDot 2s ease-in-out infinite", flexShrink: 0
                          }} />
                          <span style={{
                            fontSize: 11, fontFamily: "'JetBrains Mono',monospace",
                            color: darkMode ? "rgba(76,175,80,.95)" : "#1b5e20", letterSpacing: "3px", fontWeight: 800
                          }}>
                            CAPSTONE CHALLENGE 2025–2026
                          </span>
                        </div>

                        {/* GIANT title */}
                        <div style={{ marginBottom: 28, animation: "fadeUp .6s .1s both" }}>
                          <div style={{
                            fontSize: "clamp(88px,14vw,190px)", fontWeight: 900, lineHeight: .85,
                            letterSpacing: "-7px", fontFamily: "'Outfit',sans-serif",
                            color: darkMode ? "#4caf50" : "#185e18",
                            animation: "glowText 5s 1s ease-in-out infinite",
                            textShadow: darkMode ? "0 0 60px rgba(76,175,80,.18),0 0 120px rgba(76,175,80,.08)" : "none"
                          }}>Falla7</div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 16 }}>
                            <div style={{ height: 1, width: 52, background: darkMode ? "rgba(76,175,80,.35)" : "rgba(76,175,80,.4)", borderRadius: 2, animation: "lineGrow .9s .5s both" }} />
                            <span style={{
                              fontSize: 11, letterSpacing: "5.5px", fontFamily: "'JetBrains Mono',monospace",
                              fontWeight: 700, color: darkMode ? "rgba(76,175,80,.42)" : "rgba(27,94,32,.38)", textTransform: "uppercase",
                              animation: "fadeUp .6s .5s both"
                            }}>
                              CAPSTONE ENGINEERING TOOLKIT
                            </span>
                            <div style={{ height: 1, width: 52, background: darkMode ? "rgba(76,175,80,.35)" : "rgba(76,175,80,.4)", borderRadius: 2, animation: "lineGrow .9s .5s both" }} />
                          </div>
                        </div>

                        {/* Subtitle */}
                        <p style={{
                          fontSize: "clamp(16px,1.9vw,22px)", lineHeight: 1.75, maxWidth: 660, textAlign: "center",
                          color: darkMode ? "rgba(200,230,200,.62)" : "rgba(15,50,15,.58)",
                          fontFamily: "'Outfit',sans-serif", fontWeight: 400, marginBottom: 44,
                          animation: "fadeUp .55s .2s both"
                        }}>
                          Pick your board. Pick your sensors. Get <strong style={{ color: darkMode ? "#81c784" : "#2e7d32" }}>production-ready Arduino code</strong>, full wiring diagrams, AI explanations, and a real <strong style={{ color: darkMode ? "#81c784" : "#2e7d32" }}>EGP budget</strong> — all in under 3 minutes.
                        </p>

                        {/* CTAs */}
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginBottom: 48, animation: "fadeUp .55s .3s both" }}>
                          <button className="pbtn" style={{
                            fontSize: 18, padding: "18px 60px", borderRadius: 16, letterSpacing: ".2px",
                            boxShadow: "0 8px 32px rgba(76,175,80,.35)", transition: "transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .3s"
                          }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px) scale(1.04)"; e.currentTarget.style.boxShadow = "0 16px 44px rgba(76,175,80,.45)"; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 32px rgba(76,175,80,.35)"; }}
                            onClick={() => setStep(1)}>
                            Start Building
                          </button>
                          <button className="gbtn" style={{
                            fontSize: 17, padding: "18px 40px", borderRadius: 16,
                            transition: "transform .3s cubic-bezier(.34,1.56,.64,1)"
                          }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px) scale(1.04)"; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
                            onClick={() => setMainTab("chat")}>
                            Ask AI
                          </button>
                        </div>

                        {/* Spec pills */}
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 72, animation: "fadeUp .5s .38s both" }}>
                          {["5 MCU Boards", "13 Sensors", "6 Actuators", "133 Species", "AI-Powered", "EGP Budget"].map((s, i) => (
                            <span key={s} className="spec-pill" style={{
                              color: darkMode ? "rgba(76,175,80,.9)" : "#2e7d32",
                              background: darkMode ? "rgba(76,175,80,.09)" : "rgba(76,175,80,.1)",
                              border: "1px solid " + (darkMode ? "rgba(76,175,80,.2)" : "rgba(76,175,80,.28)"),
                              fontSize: 13, padding: "7px 18px", borderRadius: 100,
                              animation: "tagPop .45s " + (i * .07) + "s both"
                            }}>{s}</span>
                          ))}
                        </div>

                        {/* Stats row — 4 horizontal cards */}
                        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", width: "100%", maxWidth: 920, animation: "fadeUp .55s .46s both" }}>
                          {[
                            ["5", "Boards", "Uno · Mega · Nano · ESP32 · ESP8266", "#4caf50", "rgba(76,175,80,.09)"],
                            ["13", "Sensors", "DHT · pH · TDS · Flow · BH1750 & more", "#66bb6a", "rgba(102,187,106,.09)"],
                            ["6", "Actuators", "Fan · Pump · Lamp · Heater · PTC · Aerator", "#81c784", "rgba(129,199,132,.07)"],
                            ["133", "Species", "Tilapia · Tomato · Saffron & 130 more", "#a5d6a7", "rgba(165,214,167,.06)"],
                          ].map(([num, lbl, sub, col, bg], i) => (
                            <div key={lbl} className="stat-card"
                              style={{
                                background: darkMode ? bg : "rgba(255,255,255,.82)",
                                border: "1px solid " + (darkMode ? "rgba(76,175,80,.14)" : "rgba(76,175,80,.22)"),
                                borderRadius: 22, padding: "26px 30px", flex: "1 1 180px", minWidth: 160,
                                display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
                                backdropFilter: "blur(16px)",
                                animation: "cardEntrance .6s " + (i * .13 + .5) + "s both",
                                transition: "transform .35s cubic-bezier(.34,1.56,.64,1),box-shadow .3s",
                                boxShadow: darkMode ? "0 8px 32px rgba(0,0,0,.32)" : "0 8px 28px rgba(76,175,80,.1)"
                              }}
                              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-8px) scale(1.04)"; e.currentTarget.style.boxShadow = darkMode ? "0 20px 48px rgba(0,0,0,.45)" : "0 20px 40px rgba(76,175,80,.18)"; }}
                              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = darkMode ? "0 8px 32px rgba(0,0,0,.32)" : "0 8px 28px rgba(76,175,80,.1)"; }}>
                              <div style={{
                                fontSize: "clamp(48px,5vw,66px)", fontWeight: 900, lineHeight: 1,
                                fontFamily: "'Outfit',sans-serif", color: col, marginBottom: 10,
                                animation: "numberFlip .75s " + (i * .13 + .55) + "s both",
                                textShadow: darkMode ? "0 0 28px " + col + "55" : "none"
                              }}>{num}</div>
                              <div style={{ fontSize: 16, fontWeight: 800, color: TXT, marginBottom: 5, fontFamily: "'Outfit',sans-serif" }}>{lbl}</div>
                              <div style={{ fontSize: 11, color: MUT, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.55 }}>{sub}</div>
                            </div>
                          ))}
                        </div>

                        {/* Scroll hint arrow */}
                        <div style={{ marginTop: 56, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, animation: "fadeUp .45s .9s both" }}>
                          <span style={{
                            fontSize: 10, fontFamily: "'JetBrains Mono',monospace",
                            color: darkMode ? "rgba(76,175,80,.35)" : "rgba(46,125,50,.4)", letterSpacing: "2.5px", fontWeight: 700
                          }}>SCROLL</span>
                          <div style={{ display: "flex", flexDirection: "column", gap: 3, animation: "float 2.2s ease-in-out infinite" }}>
                            {[0, 1, 2].map(ii => (
                              <div key={ii} style={{
                                width: 1, height: 10, background: "linear-gradient(to bottom,rgba(76,175,80," + (darkMode ? .5 : .4) + "),transparent)",
                                margin: "0 auto", opacity: 1 - (ii * .25)
                              }} />
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>



                    {/* ══ FEATURES — bleeds full-width, big cards ═════════════════════ */}
                    <div ref={featRef} className="bleed" style={{
                      padding: "clamp(44px,8vh,80px) clamp(16px,6vw,100px) clamp(44px,8vh,90px)",
                      background: darkMode
                        ? "linear-gradient(180deg,#030903 0%,#020602 100%)"
                        : "linear-gradient(180deg,#f4faf4 0%,#edf7ee 100%)",
                      borderTop: "1px solid " + (darkMode ? "rgba(76,175,80,.09)" : "rgba(76,175,80,.14)"),
                      borderBottom: "1px solid " + (darkMode ? "rgba(76,175,80,.09)" : "rgba(76,175,80,.14)")
                    }}>

                      {/* Section header — centered */}
                      <div style={{ textAlign: "center", marginBottom: 60 }}>
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 18,
                          opacity: featVis ? 1 : 0, transform: featVis ? "none" : "translateY(-8px)",
                          transition: "all .45s .05s cubic-bezier(.4,0,.2,1)"
                        }}>
                          <div style={{ height: 1, width: 40, background: "linear-gradient(90deg,transparent,rgba(76,175,80,.5))", borderRadius: 1 }} />
                          <span style={{
                            fontSize: 11, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800,
                            letterSpacing: "3px", color: G
                          }}>WHAT'S INSIDE</span>
                          <div style={{ height: 1, width: 40, background: "linear-gradient(90deg,rgba(76,175,80,.5),transparent)", borderRadius: 1 }} />
                        </div>
                        <h2 style={{
                          fontSize: "clamp(30px,4.5vw,54px)", fontWeight: 900, color: TXT, marginBottom: 14,
                          letterSpacing: "-1.5px", lineHeight: 1.1,
                          opacity: featVis ? 1 : 0, transition: "opacity .5s .18s",
                          textShadow: darkMode ? "0 0 40px rgba(76,175,80,.08)" : "none"
                        }}>
                          Everything you need to build.
                        </h2>
                        <p style={{
                          fontSize: 17, color: darkMode ? "rgba(165,214,167,.58)" : MUT, maxWidth: 500, margin: "0 auto",
                          lineHeight: 1.7, opacity: featVis ? 1 : 0, transition: "opacity .5s .28s"
                        }}>
                          11 powerful tools — from first sensor pick to final code upload.
                        </p>
                      </div>

                      {/* Feature cards — 5 columns × 2 rows */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(280px,100%),1fr))", gap: 20, maxWidth: 1500, margin: "0 auto" }}>
                        {[
                          { tag: "GEN", title: "Code Generator", desc: "Full production-ready Arduino sketch with relay logic, calibrated setpoints, and correct library calls for all 5 boards.", col: "#4caf50", navTab: "gen", showOpen: false },
                          { tag: "WIR", title: "Wiring Guide", desc: "Auto-generated pin assignment tables, interactive SVG circuit diagram, and breadboard layout specific to your exact selection.", col: "#66bb6a", navTab: "gen", showOpen: false },
                          { tag: "EXP", title: "Line Explainer", desc: "Every single line of your generated code explained in plain English — no more guessing what any line does.", col: "#ffa726", navTab: "gen", showOpen: false },
                          { tag: "AI", title: "AI Assistant", desc: "Claude AI embedded — answers questions, explains concepts, edits your code live, and debugs wiring in real time.", col: "#42a5f5", navTab: "chat", showOpen: true },
                          { tag: "SER", title: "Serial Monitor", desc: "Simulate your sensor readings live in the browser — no hardware needed. Test logic before connecting anything.", col: "#9ccc65", navTab: "gen", showOpen: false },
                          { tag: "CHK", title: "Compat Checker", desc: "Automatically flags dangerous 5V sensors wired to 3.3V ESP boards before they get fried. Safety-first.", col: "#ff7043", navTab: "gen", showOpen: false },
                          { tag: "UPL", title: "Upload Guide", desc: "Step-by-step for every board: COM port, CH340 driver, board package install, and 8 common upload error decoders.", col: "#ec407a", navTab: "gen", showOpen: false },
                          { tag: "BUY", title: "Shopping List", desc: "Full BOM with real EGP prices, editable per your local market, with direct links to Egyptian electronics stores.", col: "#ab47bc", navTab: "tools", showOpen: true },
                          { tag: "DBG", title: "Debug Center", desc: "23 categorized problems, 5 copy-paste diagnostic sketches, and an error-message quick-fix table. Fix in minutes.", col: "#ef5350", navTab: "trouble", showOpen: true },
                          { tag: "CMP", title: "Sensor Compare", desc: "Side-by-side accuracy, voltage, price, protocol, pros & cons for all 13 sensors — pick the right one before buying.", col: "#26c6da", navTab: "compare", showOpen: true },
                          { tag: "LRN", title: "Learn & Resources", desc: "Deep dives into every sensor and MCU: how they work, datasheets, wiring tips, and curated links to the best Arduino tutorials.", col: "#7c4dff", navTab: "learn", showOpen: true },
                        ].map(({ tag, title, desc, col, navTab, showOpen }, i) => (
                          <div key={title}
                            onClick={() => setMainTab(navTab)}
                            style={{
                              borderRadius: 22, padding: "32px 28px", position: "relative", overflow: "hidden",
                              cursor: "pointer", background: darkMode ? "rgba(255,255,255,.022)" : "rgba(255,255,255,.88)",
                              border: "1px solid " + (darkMode ? "rgba(255,255,255,.062)" : "rgba(0,0,0,.075)"),
                              opacity: featVis ? 1 : 0, transform: featVis ? "none" : "translateY(28px)",
                              transition: "opacity .42s " + (i * .06 + .08) + "s, transform .42s " + (i * .06 + .08) + "s cubic-bezier(.34,1.56,.64,1), background .22s, border-color .22s, box-shadow .28s",
                              backdropFilter: "blur(10px)"
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = darkMode ? col + "1a" : col + "14";
                              e.currentTarget.style.borderColor = col + "55";
                              e.currentTarget.style.transform = "translateY(-10px) scale(1.025)";
                              e.currentTarget.style.boxShadow = "0 24px 56px " + col + "1e, 0 0 0 1px " + col + "33";
                              const arr = e.currentTarget.querySelector(".feat-arrow");
                              if (arr) { arr.style.opacity = "1"; arr.style.transform = "translateX(4px)"; }
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = darkMode ? "rgba(255,255,255,.022)" : "rgba(255,255,255,.88)";
                              e.currentTarget.style.borderColor = darkMode ? "rgba(255,255,255,.062)" : "rgba(0,0,0,.075)";
                              e.currentTarget.style.transform = "";
                              e.currentTarget.style.boxShadow = "";
                              const arr = e.currentTarget.querySelector(".feat-arrow");
                              if (arr) { arr.style.opacity = "0.35"; arr.style.transform = ""; }
                            }}>

                            {/* Top accent bar */}
                            <div style={{
                              position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: "22px 22px 0 0",
                              background: "linear-gradient(90deg,transparent 0%," + col + " 40%," + col + "88 70%,transparent 100%)", opacity: .55
                            }} />

                            {/* Corner glow */}
                            <div style={{
                              position: "absolute", top: -30, right: -30, width: 120, height: 120,
                              borderRadius: "50%", background: "radial-gradient(circle," + col + "15 0%,transparent 70%)",
                              pointerEvents: "none", zIndex: 0
                            }} />

                            {/* Icon + tag row */}
                            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, position: "relative", zIndex: 1 }}>
                              <div style={{
                                background: col + "25", border: "1px solid " + col + "44", borderRadius: 9,
                                padding: "5px 14px", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 900,
                                color: col, letterSpacing: "1.2px"
                              }}>{tag}</div>
                            </div>

                            {/* Title */}
                            <div style={{
                              fontSize: 20, fontWeight: 800, color: TXT, marginBottom: 10,
                              fontFamily: "'Outfit',sans-serif", lineHeight: 1.2, position: "relative", zIndex: 1
                            }}>{title}</div>

                            {/* Description */}
                            <div style={{
                              fontSize: 14, color: darkMode ? "rgba(165,214,167,.62)" : MUT,
                              lineHeight: 1.72, fontFamily: "'Outfit',sans-serif", position: "relative", zIndex: 1, marginBottom: showOpen ? 16 : 0
                            }}>{desc}</div>

                            {/* Arrow — only for standalone tabs */}
                            {showOpen && (
                              <div className="feat-arrow" style={{
                                fontSize: 15, color: col, opacity: .35,
                                transition: "opacity .22s, transform .25s cubic-bezier(.34,1.56,.64,1)",
                                position: "relative", zIndex: 1, fontWeight: 700
                              }}>Open →</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ══ CHALLENGE + CTA BANNER ═══════════════════════════════════ */}
                    <div ref={chalRef} className="challenge-banner bleed"
                      style={{
                        borderRadius: 0,
                        opacity: chalVis ? 1 : 0, transform: chalVis ? "none" : "translateY(18px)",
                        transition: "all .5s cubic-bezier(.34,1.56,.64,1)"
                      }}>
                      <div>
                        <div className="sec-lbl" style={{ marginBottom: 14 }}>CHALLENGE REQUIREMENTS — ALL COVERED</div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          {["3+ Sensors", "2+ Actuators", "Closed-Loop Feedback", "Greenhouse / Aquaculture", "Prototype Ready"].map(t => (
                            <span key={t} style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              background: darkMode ? "rgba(76,175,80,.09)" : "rgba(76,175,80,.11)",
                              border: "1px solid rgba(76,175,80,.22)", borderRadius: 100, padding: "8px 18px",
                              fontSize: 13, color: darkMode ? "rgba(255,255,255,.82)" : "#1b5e20", fontWeight: 600
                            }}>
                              <span style={{ color: "#4caf50", fontWeight: 900, fontSize: 15 }}>✓</span>{t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                        <button className="pbtn" style={{ fontSize: 16, padding: "16px 44px", borderRadius: 14, whiteSpace: "nowrap" }} onClick={() => setStep(1)}>
                          Build My Project →
                        </button>
                        <span style={{ fontSize: 11, color: darkMode ? "rgba(76,175,80,.42)" : "rgba(46,125,50,.5)", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, letterSpacing: ".5px" }}>5 STEPS · ~3 MIN</span>
                      </div>
                    </div>

                    {/* ══ CONTACT ══════════════════════════════════════════════════ */}
                    <div ref={contRef} style={{ marginTop: 36, paddingBottom: 52, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                      {[
                        ["Request a Feature", "https://forms.gle/oM82q6gPFh96Nq9V9"],
                        ["Request a Species", "https://forms.gle/oM82q6gPFh96Nq9V9"],
                        ["Report a Bug", "https://forms.gle/oM82q6gPFh96Nq9V9"],
                        ["Send Feedback", "https://forms.gle/oM82q6gPFh96Nq9V9"],
                        ["WhatsApp Support", "https://wa.me/201065682294"],
                        ["LinkedIn", "https://www.linkedin.com/in/khaled-elseify"],
                      ].map(([lbl, url], i) => (
                        <a key={lbl} href={url} target="_blank" rel="noreferrer"
                          style={{
                            fontSize: 12, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
                            color: darkMode ? "rgba(76,175,80,.7)" : "rgba(30,100,30,.78)",
                            border: "1px solid " + (darkMode ? "rgba(76,175,80,.18)" : "rgba(46,125,50,.24)"),
                            borderRadius: 100, padding: "9px 22px", textDecoration: "none",
                            display: "inline-block", letterSpacing: ".3px",
                            background: darkMode ? "rgba(76,175,80,.04)" : "rgba(255,255,255,.85)",
                            backdropFilter: "blur(8px)",
                            transition: "transform .28s cubic-bezier(.34,1.56,.64,1),background .2s,border-color .2s,color .2s,box-shadow .25s",
                            animation: "popIn .45s " + (i * .07) + "s both"
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(76,175,80,.14)"; e.currentTarget.style.borderColor = G; e.currentTarget.style.color = G; e.currentTarget.style.transform = "translateY(-4px) scale(1.06)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(76,175,80,.2)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = darkMode ? "rgba(76,175,80,.04)" : "rgba(255,255,255,.85)"; e.currentTarget.style.borderColor = darkMode ? "rgba(76,175,80,.18)" : "rgba(46,125,50,.24)"; e.currentTarget.style.color = darkMode ? "rgba(76,175,80,.7)" : "rgba(30,100,30,.78)"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                          {lbl}
                        </a>
                      ))}
                    </div>

                  </div>
                )}

                {/* STEP 1: MCU */}
                {step === 1 && (
                  <div>
                    <h2 style={{ fontSize: "clamp(24px,2.8vw,30px)", fontWeight: 900, marginBottom: 6 }}>Step 1 — Choose Your Microcontroller</h2>
                    <p style={{ color: darkMode ? "rgba(165,214,167,.7)" : MUT, fontSize: 17, marginBottom: 20, lineHeight: 1.65 }}>Arduino Uno is recommended for beginners.</p>
                    <div className="grid-2" style={{ gap: 10 }}>
                      {Object.entries(MCU).map(([k, v]) => (
                        <div key={k} style={{ position: "relative" }}>
                          <button onClick={() => setMcu(k)}
                            style={{ background: mcu === k ? G4 : BG3, border: "2px solid " + (mcu === k ? G : BD), borderRadius: 12, padding: "16px", cursor: "pointer", textAlign: "left", transition: "all .2s", width: "100%" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
                              <span className="badge">{v.icon}</span>
                              <span style={{ fontWeight: 700, fontSize: 16, color: TXT }}>{v.label}</span>
                              {/* Editable MCU price */}
                              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3, background: BG, border: "1px solid " + (mcu === k ? BD2 : BD), borderRadius: 7, padding: "3px 8px" }}
                                onClick={e => e.stopPropagation()}>
                                <input
                                  type="number" min="0"
                                  value={customPrices.mcu[k] ?? COSTS.mcu[k] ?? 0}
                                  onChange={e => setCustomPrices(prev => ({ ...prev, mcu: { ...prev.mcu, [k]: parseInt(e.target.value) || 0 } }))}
                                  style={{ width: 56, background: "transparent", border: "none", outline: "none", color: mcu === k ? G2 : G, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, fontSize: 12, textAlign: "right" }}
                                />
                                <span style={{ fontSize: 10, color: MUT }}>EGP</span>
                              </div>
                            </div>
                            <div style={{ fontSize: 13, color: darkMode ? "rgba(165,214,167,.75)" : MUT, fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>{v.chip} · {v.voltage}</div>
                            <div style={{ fontSize: 13, color: G2, marginBottom: 8 }}>{v.i2c}</div>
                            <div style={{ fontSize: 13, color: mcu === k ? G2 : darkMode ? "rgba(165,214,167,.72)" : MUT, lineHeight: 1.65, borderTop: "1px solid " + BD, paddingTop: 10 }}>{v.note}</div>
                          </button>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: MUT, marginTop: 8, marginBottom: 4 }}>
                      Click any price field to edit — prices may vary by store or region.
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                      <button className="gbtn" onClick={() => setStep(0)}> Back</button>
                      <button className="pbtn" disabled={!mcu} onClick={() => setStep(2)}> Next</button>
                    </div>
                  </div>
                )}

                {/* STEP 2: System */}
                {step === 2 && (
                  <div>
                    <h2 style={{ fontSize: "clamp(24px,2.8vw,30px)", fontWeight: 900, marginBottom: 6 }}>Step 2 — Choose System Type</h2>
                    <p style={{ color: darkMode ? "rgba(165,214,167,.7)" : MUT, fontSize: 17, marginBottom: 20, lineHeight: 1.65 }}>This filters sensors and species to match your project.</p>
                    <div className="grid-3" style={{ gap: 12 }}>
                      {[["greenhouse", "GH", "Greenhouse", "Temperature, humidity, light & soil control for plants. Monitor air conditions and grow perfect crops."],
                      ["aquaculture", "AQ", "Aquaculture", "Water quality, temperature & oxygen control for fish. Keep your aquatic species healthy and thriving."],
                      ["hybrid", "HB", "Hybrid (Aquaponics)", "Combines both systems. Fish waste feeds plants, plants clean the water. A true closed-loop ecosystem!"]
                      ].map(([k, abbr, lbl, desc]) => (
                        <button key={k} onClick={() => { setSystem(k); setSensors({}); setActuators({}); setSpKey(""); }}
                          style={{ background: system === k ? G4 : BG3, border: "2px solid " + (system === k ? G : BD), borderRadius: 14, padding: "20px", cursor: "pointer", textAlign: "left", transition: "all .2s" }}>
                          <div style={{ marginBottom: 10 }}>
                            <span className="badge" style={{ fontSize: 13, padding: "4px 12px" }}>{abbr}</span>
                          </div>
                          <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 8, color: TXT }}>{lbl}</div>
                          <div style={{ fontSize: 14, color: darkMode ? "rgba(165,214,167,.72)" : MUT, lineHeight: 1.6 }}>{desc}</div>
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                      <button className="gbtn" onClick={() => setStep(1)}> Back</button>
                      <button className="pbtn" disabled={!system} onClick={() => setStep(3)}> Next</button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Species */}
                {step === 3 && (
                  <div>
                    <h2 style={{ fontSize: "clamp(24px,2.8vw,30px)", fontWeight: 900, marginBottom: 6 }}>Step 3 — Choose Species (Optional)</h2>
                    <p style={{ color: darkMode ? "rgba(165,214,167,.7)" : MUT, fontSize: 17, marginBottom: 20, lineHeight: 1.65 }}>Pre-fills sensor setpoints based on ideal conditions. You can adjust them in the next step.</p>
                    <input className="si" placeholder="Search species..." value={spSearch} onChange={e => setSpSearch(e.target.value)} style={{ marginBottom: 12 }} />
                    <div className="grid-2" style={{ marginBottom: 14 }}>
                      {avSpecies.filter(([, v]) => !spSearch || v.name.toLowerCase().includes(spSearch.toLowerCase())).map(([k, v]) => (
                        <button key={k} onClick={() => applySpecies(k)}
                          style={{ background: spKey === k ? G4 : BG3, border: "1.5px solid " + (spKey === k ? G : BD), borderRadius: 10, padding: "13px 15px", cursor: "pointer", textAlign: "left", transition: "all .2s" }}>
                          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 5, color: spKey === k ? G2 : TXT }}>{v.name}</div>
                          <div style={{ fontSize: 13, color: darkMode ? "rgba(165,214,167,.68)" : MUT, lineHeight: 1.55, marginBottom: 6 }}>{v.desc}</div>
                          <div style={{ fontSize: 10, color: spKey === k ? G : MUT, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.4 }}>
                            {Object.entries(v).filter(([sk]) => sk !== "name" && sk !== "desc" && SENSORS[sk]).slice(0, 2).map(([sk, sv]) => sk + ": " + sv[0] + "–" + sv[1]).join("  |  ")}
                          </div>
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button className="gbtn" onClick={() => setStep(2)}>Back</button>
                      <button className="skbtn" onClick={() => setStep(4)}>Skip</button>
                      <button className="pbtn" onClick={() => setStep(4)}>Next</button>
                    </div>
                    <div className="bleed" style={{
                      marginTop: 20, background: BG3, borderTop: "1px solid " + BD, borderBottom: "1px solid " + BD,
                      padding: "20px clamp(16px,7vw,80px)",
                      display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: G2, marginBottom: 3 }}>Can't find your species?</div>
                        <div style={{ fontSize: 13, color: MUT }}>Submit a request and we'll add it to the database.</div>
                      </div>
                      <a href="https://forms.gle/oM82q6gPFh96Nq9V9" target="_blank" rel="noreferrer"
                        style={{ background: "linear-gradient(135deg," + G3 + "," + G + ")", color: "#fff", padding: "11px 24px", borderRadius: 10, fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14, textDecoration: "none", whiteSpace: "nowrap" }}>
                        Submit Request
                      </a>
                    </div>
                  </div>
                )}

                {/* STEP 4: Sensors */}
                {step === 4 && (
                  <div>
                    <h2 style={{ fontSize: "clamp(24px,2.8vw,30px)", fontWeight: 900, marginBottom: 6 }}>Step 4 — Choose Sensors</h2>
                    <p style={{ color: darkMode ? "rgba(165,214,167,.7)" : MUT, fontSize: 17, marginBottom: 8, lineHeight: 1.65 }}>Select at least 3 and set min/max setpoints.</p>
                    <div className="badge" style={{ marginBottom: 12 }}>Challenge: only 1 of Temp / pH / TDS allowed</div>
                    {spKey && <p style={{ fontSize: 12, color: G2, marginBottom: 12 }}>Ranges pre-filled for {SPECIES[system]?.[spKey]?.name} — adjust if needed.</p>}
                    <input className="si" placeholder="Search sensors..." value={sSearch} onChange={e => setSSearch(e.target.value)} style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 11, color: MUT, marginBottom: 10 }}>
                      Click any price field to edit. Prices may vary by store.
                    </div>
                    {avSensors.filter(([k, v]) => !sSearch || v.label.toLowerCase().includes(sSearch.toLowerCase()) || v.icon.toLowerCase().includes(sSearch.toLowerCase())).map(([k, v]) => {
                      const sel = !!sensors[k];
                      return (
                        <div key={k} style={{ background: sel ? G4 : BG3, border: "1.5px solid " + (sel ? G : BD), borderRadius: 11, padding: "13px 15px", marginBottom: 8, transition: "all .2s" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }} onClick={() => toggleSensor(k)}>
                            <div style={{ width: 19, height: 19, borderRadius: 5, border: "1.5px solid " + (sel ? G : MUT), background: sel ? G : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>{sel && "v"}</div>
                            <span className="badge">{v.icon}</span>
                            <span style={{ fontWeight: 700, fontSize: 15, flex: 1, color: TXT }}>{v.label}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 3, background: BG, border: "1px solid " + (sel ? BD2 : BD), borderRadius: 7, padding: "3px 8px" }}
                              onClick={e => e.stopPropagation()}>
                              <input
                                type="number" min="0"
                                value={customPrices.sensor[k] ?? COSTS.sensor[k] ?? 0}
                                onChange={e => setCustomPrices(prev => ({ ...prev, sensor: { ...prev.sensor, [k]: parseInt(e.target.value) || 0 } }))}
                                style={{ width: 52, background: "transparent", border: "none", outline: "none", color: sel ? G2 : G, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 11, textAlign: "right" }}
                              />
                              <span style={{ fontSize: 10, color: MUT }}>EGP</span>
                            </div>
                            <span style={{ fontSize: 11, color: darkMode ? "rgba(165,214,167,.6)" : MUT, fontFamily: "'JetBrains Mono',monospace" }}>{v.type}</span>
                          </div>
                          {sel && (() => {
                            const isDHT = k === "dht22" || k === "dht11";
                            return (
                              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid " + BD, display: "flex", flexDirection: "column", gap: 8 }}>
                                {isDHT ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {/* Temperature row */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                      <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
                                        <input type="checkbox" checked={sensors[k].useTemp !== false}
                                          onChange={e => setSensors(p => ({ ...p, [k]: { ...p[k], useTemp: e.target.checked } }))}
                                          style={{ accentColor: G, width: 14, height: 14 }} />
                                        <span style={{ fontSize: 12, color: "#ff7043", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>Temp (°C)</span>
                                      </label>
                                      <span style={{ fontSize: 11, color: MUT }}>Min:</span>
                                      <input type="number" className="ri" value={sensors[k].min} disabled={sensors[k].useTemp === false}
                                        onChange={e => setSensors(p => ({ ...p, [k]: { ...p[k], min: +e.target.value } }))} />
                                      <span style={{ fontSize: 11, color: MUT }}>Max:</span>
                                      <input type="number" className="ri" value={sensors[k].max} disabled={sensors[k].useTemp === false}
                                        onChange={e => setSensors(p => ({ ...p, [k]: { ...p[k], max: +e.target.value } }))} />
                                      {sensors[k].useTemp !== false && <span style={{ fontSize: 10, color: G, fontFamily: "monospace" }}>+1 parameter toward 3</span>}
                                    </div>
                                    {/* Humidity row */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                      <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
                                        <input type="checkbox" checked={sensors[k].useHum !== false}
                                          onChange={e => setSensors(p => ({ ...p, [k]: { ...p[k], useHum: e.target.checked } }))}
                                          style={{ accentColor: G, width: 14, height: 14 }} />
                                        <span style={{ fontSize: 12, color: "#29b6f6", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>Humidity (%)</span>
                                      </label>
                                      <span style={{ fontSize: 11, color: MUT }}>Min:</span>
                                      <input type="number" className="ri" value={sensors[k].humMin ?? 40} disabled={sensors[k].useHum === false}
                                        onChange={e => setSensors(p => ({ ...p, [k]: { ...p[k], humMin: +e.target.value } }))} />
                                      <span style={{ fontSize: 11, color: MUT }}>Max:</span>
                                      <input type="number" className="ri" value={sensors[k].humMax ?? 80} disabled={sensors[k].useHum === false}
                                        onChange={e => setSensors(p => ({ ...p, [k]: { ...p[k], humMax: +e.target.value } }))} />
                                      {sensors[k].useHum !== false && <span style={{ fontSize: 10, color: G, fontFamily: "monospace" }}>+1 parameter toward 3</span>}
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 12, color: darkMode ? "rgba(165,214,167,.7)" : MUT }}>Min:</span>
                                    <input type="number" className="ri" value={sensors[k].min} onChange={e => setSensors(p => ({ ...p, [k]: { ...p[k], min: +e.target.value } }))} />
                                    <span style={{ fontSize: 12, color: darkMode ? "rgba(165,214,167,.7)" : MUT }}>Max:</span>
                                    <input type="number" className="ri" value={sensors[k].max} onChange={e => setSensors(p => ({ ...p, [k]: { ...p[k], max: +e.target.value } }))} />
                                  </div>
                                )}
                                <div style={{ fontSize: 11, color: darkMode ? "rgba(165,214,167,.65)" : MUT }}>{sWiring(mcu, v.type, 0)}</div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                    <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                      <button className="gbtn" onClick={() => setStep(3)}> Back</button>
                      <button className="pbtn" disabled={sCount < 3} onClick={() => setStep(5)}>
                        {"Next (" + sCount + " parameter" + (sCount !== 1 ? "s" : "") + " selected" + (sCount < 3 ? " — need " + (3 - sCount) + " more" : " ✓") + ")"}
                      </button>
                    </div>
                    {/* Running budget so far */}
                    {(mcu || sCount > 0) && (() => {
                      const mcuC = customPrices.mcu[mcu] || COSTS.mcu[mcu] || 0;
                      const senC = Object.keys(sensors).reduce((s, k) => s + (customPrices.sensor[k] || COSTS.sensor[k] || 0), 0);
                      const sofar = mcuC + senC;
                      return (
                        <div style={{ marginTop: 12, background: BG3, border: "1.5px solid " + BD2, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                            {mcu && <div><div style={{ fontSize: 9, color: MUT, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.5px" }}>MCU</div><div style={{ fontSize: 13, fontWeight: 800, color: G }}>{mcuC} EGP</div></div>}
                            {sCount > 0 && <div><div style={{ fontSize: 9, color: MUT, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.5px" }}>SENSORS ({sCount})</div><div style={{ fontSize: 13, fontWeight: 800, color: G }}>{senC} EGP</div></div>}
                            <div><div style={{ fontSize: 9, color: MUT, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.5px" }}>ACTUATORS + TOTAL</div><div style={{ fontSize: 10, color: MUT }}>estimated in Step 5</div></div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 9, color: MUT, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "1px" }}>SO FAR</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: G, fontFamily: "'JetBrains Mono',monospace" }}>{sofar} EGP</div>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="bleed" style={{
                      marginTop: 20, background: BG3, borderTop: "1px solid " + BD, borderBottom: "1px solid " + BD,
                      padding: "20px clamp(16px,7vw,80px)",
                      display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: G2, marginBottom: 3 }}>Can't find your sensor?</div>
                        <div style={{ fontSize: 13, color: MUT }}>Submit a request and we'll add it to the list.</div>
                      </div>
                      <a href="https://forms.gle/oM82q6gPFh96Nq9V9" target="_blank" rel="noreferrer"
                        style={{ background: "linear-gradient(135deg," + G3 + "," + G + ")", color: "#fff", padding: "11px 24px", borderRadius: 10, fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14, textDecoration: "none", whiteSpace: "nowrap" }}>
                        Submit Request
                      </a>
                    </div>
                  </div>
                )}

                {/* STEP 5: Actuators */}
                {step === 5 && (
                  <div>
                    <h2 style={{ fontSize: "clamp(24px,2.8vw,30px)", fontWeight: 900, marginBottom: 6 }}>Step 5 — Choose Actuators</h2>
                    <p style={{ color: darkMode ? "rgba(165,214,167,.7)" : MUT, fontSize: 17, marginBottom: 20, lineHeight: 1.65 }}>Select at least 2. All use relay modules (LOW=ON, HIGH=OFF).</p>
                    <input className="si" placeholder="Search actuators..." value={aSearch} onChange={e => setASearch(e.target.value)} style={{ marginBottom: 12 }} />
                    {avActuators.filter(([k, v]) => !aSearch || v.label.toLowerCase().includes(aSearch.toLowerCase()) || v.icon.toLowerCase().includes(aSearch.toLowerCase())).map(([k, v]) => {
                      const sel = !!actuators[k];
                      const price = customPrices.actuator[k] ?? COSTS.actuator[k] ?? 0;
                      const relayP = customPrices.relay ?? COSTS.relay;
                      const param = actParams[k] || pickActDefault(k, sensors);
                      // Build all possible sensor options for dropdown
                      const sensorOptions = [
                        { value: "dht22",         label: "DHT22 — Temp" },
                        { value: "dht22_hum",     label: "DHT22 — Humidity" },
                        { value: "dht11",         label: "DHT11 — Temp" },
                        { value: "dht11_hum",     label: "DHT11 — Humidity" },
                        { value: "ds18b20",       label: "DS18B20 — Water Temp" },
                        { value: "water_level",   label: "Water Level" },
                        { value: "soil_moisture", label: "Soil Moisture" },
                        { value: "cap_soil",      label: "Cap Soil Sensor" },
                        { value: "bh1750",        label: "BH1750 — Light (lux)" },
                        { value: "ldr",           label: "LDR — Light" },
                        { value: "tds",           label: "TDS" },
                        { value: "ph",            label: "pH" },
                        { value: "turbidity",     label: "Turbidity" },
                        { value: "mq135",         label: "MQ-135 Air Quality" },
                        { value: "flow",          label: "Flow Rate" },
                        { value: "manual",        label: "Manual / No sensor" },
                      ];
                      const condOptions = [
                        { value: "hi", label: "reading > MAX (too HIGH)" },
                        { value: "lo", label: "reading < MIN (too LOW)" },
                      ];
                      return (
                        <div key={k} style={{ background: sel ? G4 : BG3, border: "1.5px solid " + (sel ? G : BD), borderRadius: 11, padding: "13px 15px", marginBottom: 8, transition: "all .2s" }}>
                          {/* Row 1: checkbox + label + price */}
                          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => toggleActuator(k)}>
                            <div style={{ width: 19, height: 19, borderRadius: 5, border: "1.5px solid " + (sel ? G : MUT), background: sel ? G : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>{sel && "v"}</div>
                            <span className="badge">{v.icon}</span>
                            <span style={{ fontWeight: 700, fontSize: 15, flex: 1, color: TXT }}>{v.label}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                              <div style={{ display: "flex", alignItems: "center", gap: 4, background: BG2, border: "1px solid " + BD2, borderRadius: 8, padding: "4px 8px" }}>
                                <span style={{ fontSize: 10, color: MUT, fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap" }}>device</span>
                                <input type="number" min="0" value={price} onChange={e => setActuatorPrice(k, e.target.value)}
                                  style={{ width: 62, background: "transparent", border: "none", outline: "none", color: G, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, fontSize: 13, textAlign: "right" }} />
                                <span style={{ fontSize: 10, color: MUT }}>EGP</span>
                              </div>
                              <span style={{ fontSize: 10, color: MUT }}>+</span>
                              <div style={{ display: "flex", alignItems: "center", gap: 4, background: BG2, border: "1px solid " + BD2, borderRadius: 8, padding: "4px 8px" }}>
                                <span style={{ fontSize: 10, color: MUT, fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap" }}>relay</span>
                                <input type="number" min="0" value={relayP} onChange={e => setRelayPrice(e.target.value)}
                                  style={{ width: 44, background: "transparent", border: "none", outline: "none", color: G2, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 12, textAlign: "right" }} />
                                <span style={{ fontSize: 10, color: MUT }}>EGP</span>
                              </div>
                              <div style={{ background: sel ? G3 : BG, border: "1px solid " + (sel ? G : BD), borderRadius: 7, padding: "3px 8px", fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, fontSize: 12, color: sel ? "#fff" : MUT, whiteSpace: "nowrap" }}>
                                {price + relayP} EGP
                              </div>
                            </div>
                          </div>
                          {/* Row 2: multi-trigger selector (OR logic) */}
                          {sel && (() => {
                            const rawP = actParams[k];
                            const triggers = Array.isArray(rawP) ? rawP : (rawP && rawP.sensor ? [rawP] : pickActDefault(k, sensors));
                            return (
                              <div style={{ marginTop: 10, padding: "10px 12px", background: BG2, borderRadius: 8, border: "1px solid " + BD2 }} onClick={e => e.stopPropagation()}>
                                {/* Header row */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: triggers.length ? 10 : 0 }}>
                                  <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: G, fontWeight: 700, letterSpacing: "1px" }}>
                                    TRIGGERS {triggers.length > 1 ? <span style={{ color: "#29b6f6", fontWeight: 400 }}>(OR — any activates)</span> : ""}
                                  </span>
                                  <button onClick={() => addActTrigger(k)}
                                    style={{ background: G3, border: "none", color: "#fff", borderRadius: 6, padding: "3px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.5px" }}>
                                    + Add
                                  </button>
                                </div>
                                {/* Trigger rows */}
                                {triggers.map((t, idx) => {
                                  const isSel = Object.keys(sensors).some(sk => sk === (t.sensor||"").replace("_hum","")) || t.sensor === "manual";
                                  return (
                                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: idx < triggers.length - 1 ? 7 : 0, flexWrap: "wrap" }}>
                                      {/* IF / OR badge */}
                                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 800, color: idx === 0 ? G : "#29b6f6", width: 22, flexShrink: 0 }}>
                                        {idx === 0 ? "IF" : "OR"}
                                      </span>
                                      {/* Sensor dropdown */}
                                      <select value={t.sensor || "manual"}
                                        onChange={e => updateActTrigger(k, idx, "sensor", e.target.value)}
                                        style={{ background: BG3, border: "1px solid " + (isSel ? BD2 : "#ff7043"), color: TXT, borderRadius: 7, padding: "5px 9px", fontSize: 12, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, cursor: "pointer", flex: 1, minWidth: 145 }}>
                                        {sensorOptions.map(o => {
                                          const linked = Object.keys(sensors).some(sk => sk === o.value || (o.value.endsWith("_hum") && sk === o.value.replace("_hum","")));
                                          return <option key={o.value} value={o.value}>{linked ? "✓ " : "  "}{o.label}</option>;
                                        })}
                                      </select>
                                      {/* Condition dropdown */}
                                      <select value={t.cond || "hi"}
                                        onChange={e => updateActTrigger(k, idx, "cond", e.target.value)}
                                        style={{ background: BG3, border: "1px solid " + BD2, color: t.cond === "hi" ? "#ff7043" : "#29b6f6", borderRadius: 7, padding: "5px 8px", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, cursor: "pointer", minWidth: 95 }}>
                                        <option value="hi">&gt; MAX</option>
                                        <option value="lo">&lt; MIN</option>
                                      </select>
                                      {/* Warning if sensor not in step 4 */}
                                      {!isSel && (
                                        <span style={{ fontSize: 10, color: "#ff7043", fontFamily: "'JetBrains Mono',monospace" }}>⚠</span>
                                      )}
                                      {/* Remove button — only when >1 trigger */}
                                      {triggers.length > 1 && (
                                        <button onClick={() => removeActTrigger(k, idx)}
                                          style={{ background: "none", border: "1px solid " + BD2, color: MUT, borderRadius: 5, width: 24, height: 24, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                          ✕
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                    {/* Relay price global note */}
                    <div style={{ fontSize: 11, color: MUT, marginBottom: 12, marginTop: 4 }}>
                      Relay price is shared — editing it updates all actuators. Click any price field to edit.
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                      <button className="gbtn" onClick={() => setStep(4)}> Back</button>
                      <button className="pbtn" disabled={aCount < 2} onClick={doGenerate}>
                        {"Generate Code (" + aCount + " actuators)"}
                      </button>
                    </div>

                    {/* Cost Estimator */}
                    {(mcu || sCount > 0 || aCount > 0) && (() => {
                      const mcuCost = customPrices.mcu[mcu] || 0;
                      const sensorCost = Object.keys(sensors).reduce((s, k) => s + (customPrices.sensor[k] || COSTS.sensor[k] || 0), 0);
                      const actCost = Object.keys(actuators).reduce((s, k) => s + (customPrices.actuator[k] ?? COSTS.actuator[k] ?? 0) + (customPrices.relay ?? COSTS.relay), 0);
                      const miscCost = customPrices.misc;
                      const total = mcuCost + sensorCost + actCost + miscCost;
                      return (
                        <div style={{ marginTop: 14, background: BG3, border: "1px solid " + BD2, borderRadius: 12, padding: "16px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: G, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "1px" }}>ESTIMATED BUDGET (EGP)</div>
                            <button style={{ fontSize: 10, color: MUT, background: "none", border: "1px solid " + BD, borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace" }}
                              onClick={() => setCustomPrices({ mcu: { ...COSTS.mcu }, sensor: { ...COSTS.sensor }, actuator: { ...COSTS.actuator }, relay: COSTS.relay, misc: 150 })}>
                              Reset to defaults
                            </button>
                          </div>
                          <div className="grid-3" style={{ gap: 8, marginBottom: 10 }}>
                            {[["MCU", mcuCost], ["Sensors", sensorCost], ["Actuators+Relays", actCost]].map(([lbl, cost]) => (
                              <div key={lbl} style={{ background: BG2, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                                <div style={{ fontSize: 17, fontWeight: 800, color: G, fontFamily: "'JetBrains Mono',monospace" }}>{cost}</div>
                                <div style={{ fontSize: 10, color: MUT, marginTop: 2 }}>{lbl}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, padding: "8px 12px", background: BG2, borderRadius: 8, border: "1px solid " + BD }}>
                            <span style={{ fontSize: 11, color: MUT, flex: 1 }}>Misc / Wires / Breadboard</span>
                            <input type="number" min="0" value={customPrices.misc}
                              onChange={e => setCustomPrices(prev => ({ ...prev, misc: parseInt(e.target.value) || 0 }))}
                              style={{ width: 70, background: "transparent", border: "none", outline: "none", color: G, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, fontSize: 14, textAlign: "right" }} />
                            <span style={{ fontSize: 11, color: MUT }}>EGP</span>
                          </div>
                          <div style={{ borderTop: "1px solid " + BD, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: MUT }}>Total estimated cost</span>
                            <span style={{ fontSize: 20, fontWeight: 800, color: G, fontFamily: "'JetBrains Mono',monospace" }}>{total} EGP</span>
                          </div>
                          <div style={{ fontSize: 10, color: MUT, marginTop: 6 }}>Prices sourced from makerselectronics.com, ram-e-shop.com, and store.fut-electronics.com (Egypt, 2026). Click any price to edit.</div>
                        </div>
                      );
                    })()}
                    <div className="bleed" style={{
                      marginTop: 20, background: BG3, borderTop: "1px solid " + BD, borderBottom: "1px solid " + BD,
                      padding: "20px clamp(16px,7vw,80px)",
                      display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: G2, marginBottom: 3 }}>Can't find your actuator?</div>
                        <div style={{ fontSize: 13, color: MUT }}>Submit a request and we'll add it to the list.</div>
                      </div>
                      <a href="https://forms.gle/oM82q6gPFh96Nq9V9" target="_blank" rel="noreferrer"
                        style={{ background: "linear-gradient(135deg," + G3 + "," + G + ")", color: "#fff", padding: "11px 24px", borderRadius: 10, fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14, textDecoration: "none", whiteSpace: "nowrap" }}>
                        Submit Request
                      </a>
                    </div>
                  </div>
                )}

                {/* STEP 6: Output */}
                {step === 6 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <h2 style={{ fontSize: "clamp(24px,2.8vw,30px)", fontWeight: 900, marginBottom: 4 }}>Your Code is Ready</h2>
                        <p style={{ fontSize: 12, color: MUT }}>Copy to Arduino IDE. Use the green AI button to modify.</p>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>

                        <button className="gbtn" style={{ fontSize: 12 }} onClick={() => { setStep(1); setMcu(""); setSystem(""); setSpKey(""); setSensors({}); setActuators({}); }}>Start Over</button>
                        <button className="pbtn" style={{ fontSize: 12 }} onClick={doCopy}>{copied ? "Copied!" : "Copy " + (codeTab === "wiring" ? "Wiring" : "Code")}</button>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 0, borderBottom: "1px solid " + BD, flexWrap: "wrap" }}>
                      {[["code", "Code (.ino)"], ["explain", "Line Explainer"], ["wiring", "Wiring Guide"], ["circuit", "Circuit"], ["diagram", "Pin Diagram"], ["breadboard", "Breadboard"], ["compat", "Compatibility"], ["serial", "Serial Monitor"], ["upload", "Upload Guide"], ["shop", "Shopping List"]].map(([t, lbl]) => (
                        <button key={t} className="tbtn" style={{flexShrink:0}} onClick={() => { setCodeTab(t); if (t === "serial") startSerial(); else stopSerial(); }}
                          style={{ color: codeTab === t ? G : MUT, borderBottom: codeTab === t ? "2px solid " + G : "2px solid transparent", fontSize: 12 }}>
                          {lbl}
                        </button>
                      ))}
                    </div>

                    {/* Code / Diff / Wiring views */}
                    {(codeTab === "code" || codeTab === "wiring") && (
                      <div style={{ background: darkMode ? "#020e02" : "#1a2e1a", border: "1px solid " + BD, borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>

                        {/* ── AI Diff Toolbar ─────────────────────────────────── */}
                        {codeTab === "code" && prevCode && (() => {
                          const parts = diffLines(prevCode, genCode);
                          const added = parts.filter(p => p.added).reduce((s, p) => s + p.count, 0);
                          const removed = parts.filter(p => p.removed).reduce((s, p) => s + p.count, 0);
                          return (
                            <div style={{ padding: "10px 16px", background: BG3, borderBottom: "1px solid " + BD, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                              <span style={{ fontSize: 11, color: MUT, fontWeight: 700, flexShrink: 0 }}>AI modified the code:</span>
                              <span style={{ fontSize: 11, color: "#4caf50", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>+{added} lines</span>
                              <span style={{ fontSize: 11, color: "#ef5350", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>−{removed} lines</span>
                              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                                <button style={{
                                  padding: "4px 12px", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
                                  background: !diffMode ? G : "transparent",
                                  color: !diffMode ? BG : MUT,
                                  border: "1px solid " + (!diffMode ? G : BD), borderRadius: 6, cursor: "pointer"
                                }}
                                  onClick={() => setDiffMode(false)}>Final Code</button>
                                <button style={{
                                  padding: "4px 12px", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
                                  background: diffMode ? G : "transparent",
                                  color: diffMode ? BG : MUT,
                                  border: "1px solid " + (diffMode ? G : BD), borderRadius: 6, cursor: "pointer"
                                }}
                                  onClick={() => setDiffMode(true)}>Diff View</button>
                              </div>
                            </div>
                          );
                        })()}

                        <div style={{ padding: 16, overflow: "auto", maxHeight: 520 }}>
                          {codeTab === "code" && prevCode ? (
                            diffMode ? (
                              <pre style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                                {diffLines(prevCode, genCode).map((part, pi) => {
                                  if (!part.added && !part.removed) {
                                    return <span key={pi} style={{ color: "#5a7a5a" }}>{part.value}</span>;
                                  }
                                  const bg = part.added ? "#0d2e10" : "#2e0d0d";
                                  const color = part.added ? "#69d87a" : "#f47a7a";
                                  const prefix = part.added ? "+" : "−";
                                  return part.value.split("\n").filter((ln, li, arr) => li < arr.length - 1 || ln !== "").map((ln, li) => (
                                    <div key={pi + "-" + li} style={{ background: bg, color, display: "block", padding: "0 8px", marginBottom: 1, borderLeft: "3px solid " + (part.added ? "#4caf50" : "#ef5350") }}>
                                      <span style={{ opacity: 0.5, userSelect: "none", marginRight: 8, fontSize: 10 }}>{prefix}</span>{ln}
                                    </div>
                                  ));
                                })}
                              </pre>
                            ) : (
                              <pre style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.6, color: "#a5d6a7", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                                {genCode}
                              </pre>
                            )
                          ) : (
                            <pre style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.6, color: "#a5d6a7", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                              {codeTab === "code" ? genCode : wiring}
                            </pre>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Pin Diagram */}
                    {codeTab === "diagram" && (() => {
                      const m = MCU[mcu] || MCU.uno;
                      const sKeys = Object.keys(sensors);
                      const aKeys = Object.keys(actuators);
                      const relays = MCU_RELAY[mcu] || MCU_RELAY.uno;
                      let analogIdx = 0, digIdx = 0, relayIdx = 0;
                      const pinRows = [];
                      sKeys.forEach(k => {
                        const sv = SENSORS[k];
                        let pin = "?";
                        if (sv.type === "analog" || sv.type === "ldr2pin") pin = m.analog[analogIdx++] || "A?";
                        else if (sv.type === "digital" || sv.type === "interrupt") pin = (MCU_DIG[mcu] || MCU_DIG.uno)[digIdx++] || "D?";
                        else if (sv.type === "I2C") pin = m.i2c;
                        pinRows.push({ label: sv.label, icon: sv.icon, pin, type: sv.type === "ldr2pin" ? "analog" : sv.type, color: "#4caf50" });
                      });
                      aKeys.forEach(k => {
                        const av = ACTUATORS[k];
                        const pin = relays[relayIdx++] || "D?";
                        pinRows.push({ label: av.label + " (Relay)", icon: av.icon, pin, type: "relay", color: "#ff7043" });
                      });
                      // AI-added extra components (LCD, OLED, buzzer etc.) — only those NOT already in standard sensor/actuator lists
                      const standardLabels = new Set([
                        ...sKeys.map(k => SENSORS[k]?.label).filter(Boolean),
                        ...aKeys.map(k => ACTUATORS[k]?.label).filter(Boolean)
                      ]);
                      aiComponents.forEach(c => {
                        const alreadyShown = pinRows.some(r => r.label === c.label) || standardLabels.has(c.label);
                        if (!alreadyShown) {
                          pinRows.push({ label: c.label, icon: c.icon || c.label.slice(0,5).toUpperCase(), pin: c.pin, type: c.type, color: "#7c4dff" });
                        }
                      });
                      return (
                        <div style={{ background: BG2, border: "1px solid " + BD, borderTop: "none", borderRadius: "0 0 12px 12px", padding: 20 }}>
                          <div style={{ fontSize: 11, color: MUT, fontFamily: "'JetBrains Mono',monospace", marginBottom: 14, letterSpacing: "1px" }}>
                            {m.label} — {m.chip} — {m.voltage}
                          </div>
                          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                            {/* MCU visual */}
                            <div style={{ background: BG3, border: "2px solid " + BD2, borderRadius: 12, padding: "16px 20px", minWidth: 160, textAlign: "center" }}>
                              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: G, fontWeight: 800, marginBottom: 4 }}>{MCU[mcu]?.icon}</div>
                              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{m.label}</div>
                              <div style={{ fontSize: 10, color: MUT }}>{m.chip}</div>
                              <div style={{ fontSize: 10, color: MUT }}>{m.voltage}</div>
                              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid " + BD }}>
                                <div style={{ fontSize: 9, color: MUT, fontFamily: "'JetBrains Mono',monospace" }}>{m.i2c}</div>
                              </div>
                            </div>
                            {/* Pin table */}
                            <div style={{ flex: 1, minWidth: 0, overflowX: "auto" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 70px", gap: 0, borderRadius: 10, overflow: "hidden", border: "1px solid " + BD, minWidth: 280 }}>
                                <div style={{ padding: "8px 12px", background: BG3, fontSize: 10, color: MUT, fontFamily: "'JetBrains Mono',monospace", borderBottom: "1px solid " + BD }}>PIN</div>
                                <div style={{ padding: "8px 12px", background: BG3, fontSize: 10, color: MUT, fontFamily: "'JetBrains Mono',monospace", borderBottom: "1px solid " + BD, borderLeft: "1px solid " + BD }}>COMPONENT</div>
                                <div style={{ padding: "8px 12px", background: BG3, fontSize: 10, color: MUT, fontFamily: "'JetBrains Mono',monospace", borderBottom: "1px solid " + BD, borderLeft: "1px solid " + BD }}>TYPE</div>
                                {pinRows.map((row, i) => [
                                  <div key={i + "p"} style={{ padding: "9px 12px", fontSize: 12, fontWeight: 800, color: row.color, fontFamily: "'JetBrains Mono',monospace", borderBottom: "1px solid " + BD, background: i % 2 === 0 ? BG2 : BG3 }}>{row.pin}</div>,
                                  <div key={i + "l"} style={{ padding: "9px 12px", fontSize: 12, color: TXT, borderBottom: "1px solid " + BD, borderLeft: "1px solid " + BD, background: i % 2 === 0 ? BG2 : BG3 }}>
                                    <span className="badge" style={{ marginRight: 6, fontSize: 9 }}>{row.icon}</span>{row.label}
                                  </div>,
                                  <div key={i + "t"} style={{ padding: "9px 12px", fontSize: 10, color: MUT, borderBottom: "1px solid " + BD, borderLeft: "1px solid " + BD, background: i % 2 === 0 ? BG2 : BG3, fontFamily: "'JetBrains Mono',monospace" }}>{row.type}</div>,
                                ])}
                                {[["VCC", "All sensors", m.voltage], ["GND", "All sensors/relays", "ground"], ["VCC", "All relays", "5V"]].map(([p, l, t], i) => [
                                  <div key={"x" + i + "p"} style={{ padding: "9px 12px", fontSize: 12, fontWeight: 800, color: "#ffa726", fontFamily: "'JetBrains Mono',monospace", borderBottom: "1px solid " + BD, background: BG2 }}>{p}</div>,
                                  <div key={"x" + i + "l"} style={{ padding: "9px 12px", fontSize: 12, color: MUT, borderBottom: "1px solid " + BD, borderLeft: "1px solid " + BD, background: BG2 }}>{l}</div>,
                                  <div key={"x" + i + "t"} style={{ padding: "9px 12px", fontSize: 10, color: "#ffa726", borderBottom: "1px solid " + BD, borderLeft: "1px solid " + BD, background: BG2, fontFamily: "'JetBrains Mono',monospace" }}>{t}</div>,
                                ])}
                              </div>
                            </div>
                          </div>
                          <div style={{ marginTop: 12, fontSize: 11, color: MUT, lineHeight: 1.7 }}>
                            Relay wiring: Connect device to COM + NO terminals. Relay IN signal = LOW to turn ON, HIGH to turn OFF.
                            All sensor GND pins → Arduino GND. All VCC → {m.voltage} unless otherwise noted.
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── Circuit Diagram (Redesigned for Clarity) ── */}
                    {codeTab === "circuit" && (() => {
                      const m = MCU[mcu] || MCU.uno;
                      const sKeys = Object.keys(sensors);
                      const aKeys = Object.keys(actuators);
                      const analogPins = m.analog || ["A0", "A1", "A2", "A3"];
                      const relayPins = MCU_RELAY[mcu] || MCU_RELAY.uno;
                      const digPins = MCU_DIG[mcu] || MCU_DIG.uno;
                      let aIdx = 0, dIdx = 0, rIdx = 0;

                      const sRows = sKeys.map(k => {
                        const sv = SENSORS[k]; if (!sv) return null;
                        let pin = (sv.type === "analog" || sv.type === "ldr2pin") ? (analogPins[aIdx++] || "A?") :
                          sv.type === "I2C" ? (m.i2c || "SDA/SCL") :
                            sv.type === "interrupt" ? (m.intPin || "D2") :
                              (digPins[dIdx++] || "D?");
                        return { k, sv, pin };
                      }).filter(Boolean);
                      // Only show truly new AI-added components (not standard sensors/actuators)
                      const stdSensorLabels = new Set(sKeys.map(k => SENSORS[k]?.label).filter(Boolean));
                      const stdActLabels = new Set(aKeys.map(k => ACTUATORS[k]?.label).filter(Boolean));
                      const aiRows = aiComponents.filter(c =>
                        !stdSensorLabels.has(c.label) && !stdActLabels.has(c.label)
                      ).map(c => ({
                        k: c.label, sv: { label: c.label, icon: c.icon || "AI", type: c.type, role: c.role || (
                          // Auto-classify by type if role missing
                          (c.type === "relay" || c.label.toLowerCase().includes("heater") || c.label.toLowerCase().includes("pump") || c.label.toLowerCase().includes("fan") || c.label.toLowerCase().includes("motor") || c.label.toLowerCase().includes("valve"))
                            ? "actuator" : "sensor"
                        )}, pin: c.pin
                      }));

                      const aRows = aKeys.map(k => {
                        const av = ACTUATORS[k]; if (!av) return null;
                        return { k, av, pin: relayPins[rIdx++] || "D?" };
                      }).filter(Boolean);

                      /* layout constants */
                      const ROW_H = 60, PAD_TOP = 100;
                      const aiSensorRows = aiRows.filter(r => r.sv.role !== "actuator");
                      const aiActRows = aiRows.filter(r => r.sv.role === "actuator");
                      const totalSideRows = Math.max(sRows.length + aiSensorRows.length, aRows.length + aiActRows.length);
                      const MCU_H = Math.max(180, totalSideRows * ROW_H + 40);
                      const SVG_H = MCU_H + PAD_TOP + 80;
                      const SVG_W = 820;
                      const MCU_X = 330, MCU_W = 160;
                      const S_X = 20, A_X = 640;
                      const BLK_W = 140, BLK_H = 40;

                      /* Power bus coords */
                      const VCC_BUS_Y = 60;
                      const GND_BUS_Y = SVG_H - 40;

                      /* wire colors */
                      const wireColor = (type) => type === "I2C" ? "#ce93d8" : type === "analog" ? "#29b6f6" : type === "interrupt" ? "#ffb74d" : "#66bb6a";

                      return (
                        <div style={{ background: BG2, border: "1px solid " + BD, borderTop: "none", borderRadius: "0 0 12px 12px", padding: "0 0 20px 0" }}>
                          <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid " + BD, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                            <div>
                              <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: G, letterSpacing: "2px", fontWeight: 700, marginBottom: 2 }}>CIRCUIT DIAGRAM</div>
                              <div style={{ fontSize: 12, color: MUT }}>Organized orthogonal routing with common VCC and GND buses.</div>
                            </div>
                            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                              {[["#29b6f6", "Signal"], ["#e53935", "VCC Bus"], ["#4caf50", "GND Bus"], ["#ff7043", "Relay"], ["#ce93d8", "I2C"]].map(([c, l]) => (
                                <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                  <div style={{ width: 18, height: 3, background: c, borderRadius: 2 }} />
                                  <span style={{ fontSize: 10, color: MUT, fontFamily: "'JetBrains Mono',monospace" }}>{l}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div style={{ overflowX: "auto", overflowY: "visible", padding: "20px 20px 20px" }}>
                            <svg viewBox={"0 0 " + SVG_W + " " + SVG_H} style={{ width: "100%", minWidth: 600, display: "block", fontFamily: "'JetBrains Mono',monospace" }}>

                              {/* ── VCC Bus ── */}
                              <line x1={S_X} y1={VCC_BUS_Y} x2={A_X + BLK_W} y2={VCC_BUS_Y} stroke="#e53935" strokeWidth="3" strokeLinecap="round" />
                              <text x={S_X + 10} y={VCC_BUS_Y - 8} fontSize="10" fontWeight="800" fill="#e53935">VCC BUS ({m.voltage})</text>
                              <text x={A_X + BLK_W - 10} y={VCC_BUS_Y - 8} textAnchor="end" fontSize="10" fontWeight="800" fill="#e53935">EXTERNAL 5V (RELAYS)</text>

                              {/* ── GND Bus ── */}
                              <line x1={S_X} y1={GND_BUS_Y} x2={A_X + BLK_W} y2={GND_BUS_Y} stroke="#4caf50" strokeWidth="3" strokeLinecap="round" />
                              <text x={S_X + 10} y={GND_BUS_Y + 14} fontSize="10" fontWeight="800" fill="#4caf50">GND BUS (COMMON)</text>

                              {/* ── MCU block ── */}
                              <rect x={MCU_X} y={PAD_TOP} width={MCU_W} height={MCU_H} rx="12"
                                fill={darkMode ? "#071407" : "#e8f5e9"} stroke="#4caf50" strokeWidth="2.5" />
                              <text x={MCU_X + MCU_W / 2} y={PAD_TOP + 24} textAnchor="middle" fontSize="14" fontWeight="800" fill="#4caf50">{m.icon || mcu.toUpperCase()}</text>
                              <text x={MCU_X + MCU_W / 2} y={PAD_TOP + 40} textAnchor="middle" fontSize="10" fill={darkMode ? "#81c784" : "#2e7d32"}>{m.chip}</text>

                              {/* MCU Power to Buses */}
                              <path d={orthoPath(MCU_X + MCU_W / 2 - 20, PAD_TOP, MCU_X + MCU_W / 2 - 20, VCC_BUS_Y)} fill="none" stroke="#e53935" strokeWidth="1.5" />
                              <circle cx={MCU_X + MCU_W / 2 - 20} cy={VCC_BUS_Y} r="4" fill="#e53935" />
                              <text x={MCU_X + MCU_W / 2 - 15} y={PAD_TOP - 8} fontSize="9" fill="#e53935" fontWeight="700">VCC</text>

                              <path d={orthoPath(MCU_X + MCU_W / 2 + 20, PAD_TOP + MCU_H, MCU_X + MCU_W / 2 + 20, GND_BUS_Y)} fill="none" stroke="#4caf50" strokeWidth="1.5" />
                              <circle cx={MCU_X + MCU_W / 2 + 20} cy={GND_BUS_Y} r="4" fill="#4caf50" />
                              <text x={MCU_X + MCU_W / 2 + 25} y={PAD_TOP + MCU_H + 14} fontSize="9" fill="#4caf50" fontWeight="700">GND</text>

                              <text x={S_X + BLK_W / 2} y={PAD_TOP - 14} textAnchor="middle" fontSize="10" fontWeight="800" fill={MUT} letterSpacing="2">SENSORS</text>
                              {aRows.length > 0 && <text x={A_X + BLK_W / 2} y={PAD_TOP - 14} textAnchor="middle" fontSize="10" fontWeight="800" fill={MUT} letterSpacing="2">ACTUATORS</text>}

                              {/* ── sensor rows ── */}
                              {sRows.map(({ k, sv, pin }, i) => {
                                const by = PAD_TOP + 40 + i * ROW_H;
                                const wc = wireColor(sv.type);
                                const mcuPinY = PAD_TOP + 50 + i * ROW_H;
                                return (
                                  <g key={k}>
                                    <rect x={S_X} y={by} width={BLK_W} height={BLK_H} rx="7" fill={darkMode ? "#071a07" : "#f1f8e9"} stroke={wc} strokeWidth="1.8" />
                                    <text x={S_X + 10} y={by + 15} fontSize="9" fontWeight="800" fill={wc}>SENSOR</text>
                                    <text x={S_X + 10} y={by + 28} fontSize="11" fontWeight="700" fill={darkMode ? "#c8e6c9" : "#1b5e20"}>
                                      {sv.label.length > 16 ? sv.label.slice(0, 15) + "…" : sv.label}
                                    </text>
                                    {/* signal wire to MCU */}
                                    <path d={orthoPath(S_X + BLK_W, by + BLK_H / 2, MCU_X, mcuPinY)} fill="none" stroke={wc} strokeWidth="2" strokeDasharray={sv.type === "I2C" ? "6,3" : "none"} />
                                    <rect x={MCU_X - 38} y={mcuPinY - 10} width="36" height="20" rx="4" fill={darkMode ? "#0a1a0a" : "#e8f5e9"} stroke={wc} strokeWidth="1" />
                                    <text x={MCU_X - 20} y={mcuPinY + 4} textAnchor="middle" fontSize="9" fontWeight="800" fill={wc}>{pin}</text>

                                    {/* Power lines */}
                                    <path d={"M " + (S_X + BLK_W - 20) + " " + by + " V " + VCC_BUS_Y} fill="none" stroke="#e53935" strokeWidth="1.2" />
                                    <circle cx={S_X + BLK_W - 20} cy={VCC_BUS_Y} r="3" fill="#e53935" />

                                    <path d={"M " + (S_X + BLK_W - 40) + " " + (by + BLK_H) + " V " + GND_BUS_Y} fill="none" stroke="#4caf50" strokeWidth="1.2" />
                                    <circle cx={S_X + BLK_W - 40} cy={GND_BUS_Y} r="3" fill="#4caf50" />
                                  </g>
                                );
                              })}

                              {/* ── actuator rows ── */}
                              {aRows.map(({ k, av, pin }, i) => {
                                const by = PAD_TOP + 40 + i * ROW_H;
                                const mcuPinY = PAD_TOP + 50 + i * ROW_H;
                                const relX = A_X - 80;
                                return (
                                  <g key={k}>
                                    {/* relay block */}
                                    <rect x={relX} y={by} width={64} height={BLK_H} rx="7" fill={darkMode ? "#1a0800" : "#fff3e0"} stroke="#ff7043" strokeWidth="1.8" />
                                    <text x={relX + 32} y={by + 15} textAnchor="middle" fontSize="9" fontWeight="800" fill="#ff7043">RELAY</text>
                                    <text x={relX + 32} y={by + 28} textAnchor="middle" fontSize="9" fill={darkMode ? "#ffcc80" : "#e65100"}>IN→OUT</text>

                                    {/* actuator block */}
                                    <rect x={A_X} y={by} width={BLK_W} height={BLK_H} rx="7" fill={darkMode ? "#1a0800" : "#fff8e1"} stroke="#ff7043" strokeWidth="1.8" />
                                    <text x={A_X + 10} y={by + 15} fontSize="9" fontWeight="800" fill="#ff7043">ACTUATOR</text>
                                    <text x={A_X + 10} y={by + 28} fontSize="11" fontWeight="700" fill={darkMode ? "#ffcc80" : "#bf360c"}>
                                      {av.label.length > 16 ? av.label.slice(0, 15) + "…" : av.label}
                                    </text>

                                    {/* routing */}
                                    <line x1={relX + 64} y1={by + BLK_H / 2} x2={A_X} y2={by + BLK_H / 2} stroke="#ff7043" strokeWidth="2" />
                                    <path d={orthoPath(MCU_X + MCU_W, mcuPinY, relX, by + BLK_H / 2)} fill="none" stroke="#ff7043" strokeWidth="2" />

                                    <rect x={MCU_X + MCU_W + 2} y={mcuPinY - 10} width="36" height="20" rx="4" fill={darkMode ? "#1a0800" : "#fff3e0"} stroke="#ff7043" strokeWidth="1" />
                                    <text x={MCU_X + MCU_W + 20} y={mcuPinY + 4} textAnchor="middle" fontSize="9" fontWeight="800" fill="#ff7043">{pin}</text>

                                    {/* Power routing for relay */}
                                    <path d={"M " + (relX + 20) + " " + by + " V " + VCC_BUS_Y} fill="none" stroke="#e53935" strokeWidth="1.2" strokeDasharray="4,2" />
                                    <circle cx={relX + 20} cy={VCC_BUS_Y} r="3" fill="#e53935" />

                                    <path d={"M " + (relX + 40) + " " + (by + BLK_H) + " V " + GND_BUS_Y} fill="none" stroke="#4caf50" strokeWidth="1.2" />
                                    <circle cx={relX + 40} cy={GND_BUS_Y} r="3" fill="#4caf50" />
                                  </g>
                                );
                              })}

                              {/* ── AI-added components (sensor/display side = left, actuator side = right) ── */}
                              {aiRows.map(({ k, sv, pin }, i) => {
                                const isAct = sv.role === "actuator";
                                // Index within each side's AI rows
                                const sideIdx = isAct
                                  ? aiRows.filter((r, ri) => r.sv.role === "actuator" && ri < i).length
                                  : aiRows.filter((r, ri) => r.sv.role !== "actuator" && ri < i).length;
                                const by = PAD_TOP + 40 + ((isAct ? aRows.length : sRows.length) + sideIdx) * ROW_H;
                                const mcuPinY = PAD_TOP + 50 + ((isAct ? aRows.length : sRows.length) + sideIdx) * ROW_H;
                                const xBase = isAct ? A_X : S_X;
                                const relX = A_X - 80;
                                return (
                                  <g key={"ai-" + k}>
                                    {isAct ? (
                                      <>
                                        <rect x={relX} y={by} width={64} height={BLK_H} rx="7" fill={darkMode ? "#1a0800" : "#fff3e0"} stroke="#ff7043" strokeWidth="1.8" />
                                        <text x={relX + 32} y={by + 15} textAnchor="middle" fontSize="9" fontWeight="800" fill="#ff7043">RELAY</text>
                                        <text x={relX + 32} y={by + 28} textAnchor="middle" fontSize="9" fill={darkMode ? "#ffcc80" : "#e65100"}>IN-OUT</text>
                                        <rect x={A_X} y={by} width={BLK_W} height={BLK_H} rx="7" fill={darkMode ? "#0d0a1a" : "#ede7f6"} stroke="#7c4dff" strokeWidth="1.8" />
                                        <text x={A_X + 10} y={by + 15} fontSize="9" fontWeight="800" fill="#7c4dff">AI ADDED</text>
                                        <text x={A_X + 10} y={by + 28} fontSize="11" fontWeight="700" fill={darkMode ? "#ce93d8" : "#4a148c"}>{sv.label.length > 16 ? sv.label.slice(0,15) + "…" : sv.label}</text>
                                        <line x1={relX + 64} y1={by + BLK_H / 2} x2={A_X} y2={by + BLK_H / 2} stroke="#ff7043" strokeWidth="2" />
                                        <path d={orthoPath(MCU_X + MCU_W, mcuPinY, relX, by + BLK_H / 2)} fill="none" stroke="#7c4dff" strokeWidth="2" />
                                        <rect x={MCU_X + MCU_W + 2} y={mcuPinY - 10} width="36" height="20" rx="4" fill={darkMode ? "#0d0a1a" : "#ede7f6"} stroke="#7c4dff" strokeWidth="1" />
                                        <text x={MCU_X + MCU_W + 20} y={mcuPinY + 4} textAnchor="middle" fontSize="9" fontWeight="800" fill="#7c4dff">{pin}</text>
                                      </>
                                    ) : (
                                      <>
                                        <rect x={S_X} y={by} width={BLK_W} height={BLK_H} rx="7" fill={darkMode ? "#0d0a1a" : "#ede7f6"} stroke="#7c4dff" strokeWidth="1.8" />
                                        <text x={S_X + 10} y={by + 15} fontSize="9" fontWeight="800" fill="#7c4dff">AI ADDED</text>
                                        <text x={S_X + 10} y={by + 28} fontSize="11" fontWeight="700" fill={darkMode ? "#ce93d8" : "#4a148c"}>{sv.label.length > 16 ? sv.label.slice(0,15) + "…" : sv.label}</text>
                                        <path d={orthoPath(S_X + BLK_W, by + BLK_H / 2, MCU_X, mcuPinY)} fill="none" stroke="#7c4dff" strokeWidth="2" strokeDasharray={sv.type === "I2C" ? "6,3" : "none"} />
                                        <rect x={MCU_X - 38} y={mcuPinY - 10} width="36" height="20" rx="4" fill={darkMode ? "#0d0a1a" : "#ede7f6"} stroke="#7c4dff" strokeWidth="1" />
                                        <text x={MCU_X - 20} y={mcuPinY + 4} textAnchor="middle" fontSize="9" fontWeight="800" fill="#7c4dff">{pin}</text>
                                        <path d={"M " + (S_X + BLK_W - 20) + " " + by + " V " + VCC_BUS_Y} fill="none" stroke="#e53935" strokeWidth="1.2" />
                                        <circle cx={S_X + BLK_W - 20} cy={VCC_BUS_Y} r="3" fill="#e53935" />
                                        <path d={"M " + (S_X + BLK_W - 40) + " " + (by + BLK_H) + " V " + GND_BUS_Y} fill="none" stroke="#4caf50" strokeWidth="1.2" />
                                        <circle cx={S_X + BLK_W - 40} cy={GND_BUS_Y} r="3" fill="#4caf50" />
                                      </>
                                    )}
                                  </g>
                                );
                              })}
                            </svg>
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── Breadboard Layout (Redesigned) ── */}
                    {codeTab === "breadboard" && (() => {
                      const m = MCU[mcu] || MCU.uno;
                      const sKeys = Object.keys(sensors);
                      const aKeys = Object.keys(actuators);
                      const analogPins = m.analog || ["A0", "A1", "A2", "A3"];
                      const relayPins = MCU_RELAY[mcu] || MCU_RELAY.uno;
                      const digPins = MCU_DIG[mcu] || MCU_DIG.uno;
                      let aIdx = 0, dIdx = 0, rIdx = 0;

                      const allItems = [
                        ...sKeys.map(k => {
                          const sv = SENSORS[k]; if (!sv) return null;
                          let pin = sv.type === "analog" ? (analogPins[aIdx++] || "A?") :
                            sv.type === "I2C" ? (m.i2c || "SDA/SCL") :
                              sv.type === "interrupt" ? (m.intPin || "D2") :
                                (digPins[dIdx++] || "D?");
                          return { k, label: sv.label, icon: sv.icon, pin, kind: "sensor", type: sv.type };
                        }),
                        ...aKeys.map(k => {
                          const av = ACTUATORS[k]; if (!av) return null;
                          return { k, label: av.label, icon: av.icon, pin: relayPins[rIdx++] || "D?", kind: "actuator", type: "relay" };
                        }),
                        // AI-added extra components (deduplicated against standard lists)
                        ...aiComponents.filter(c => {
                          const stdSLabels = sKeys.map(k => SENSORS[k]?.label).filter(Boolean);
                          const stdALabels = aKeys.map(k => ACTUATORS[k]?.label).filter(Boolean);
                          return !stdSLabels.includes(c.label) && !stdALabels.includes(c.label);
                        }).map(c => {
                          const isAiAct = c.role === "actuator" || c.type === "relay" ||
                            ["heater","pump","fan","motor","valve","peltier"].some(w => c.label.toLowerCase().includes(w));
                          return { k: c.label, label: c.label, icon: c.icon || c.label.slice(0,5).toUpperCase(), pin: c.pin, kind: isAiAct ? "ai-actuator" : "ai", type: c.type, role: c.role };
                        }),
                      ].filter(Boolean);

                      const COLS = 42, ROWS_HALF = 5, CW = 14;
                      const BB_W = COLS * CW + 40;
                      const BB_H = (ROWS_HALF * 2 * CW) + 80;
                      const ROW_COLORS = ["#29b6f6", "#80cbc4", "#ffd54f", "#ff7043", "#ce93d8", "#ef9a9a", "#a5d6a7"];

                      return (
                        <div style={{ background: BG2, border: "1px solid " + BD, borderTop: "none", borderRadius: "0 0 12px 12px", padding: "20px" }}>
                          <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: G, letterSpacing: "2px", fontWeight: 700, marginBottom: 4 }}>BREADBOARD LAYOUT</div>
                            <div style={{ fontSize: 12, color: MUT }}>Standard half-size breadboard layout. Red = VCC, Blue/Black = GND. Center trench isolates top and bottom rows.</div>
                          </div>

                          <div style={{ background: darkMode ? "#050f05" : "#f0f4f0", border: "1px solid " + BD, borderRadius: 12, padding: "20px", marginBottom: 20, overflowX: "auto" }}>
                            <svg viewBox={"0 0 " + (BB_W + 100) + " " + BB_H} style={{ width: "100%", minWidth: 500, display: "block", fontFamily: "'JetBrains Mono',monospace" }}>

                              {/* Breadboard Base */}
                              <rect x="20" y="0" width={BB_W} height={BB_H} rx="8" fill={darkMode ? "#151515" : "#fefefe"} stroke={darkMode ? "#333" : "#ccc"} strokeWidth="2" />

                              {/* Top Power Rails */}
                              <line x1="30" y1="16" x2={BB_W + 10} y2="16" stroke="#e53935" strokeWidth="2" />
                              <line x1="30" y1="32" x2={BB_W + 10} y2="32" stroke="#1e88e5" strokeWidth="2" />
                              <text x="10" y="20" fontSize="12" fill="#e53935" fontWeight="800">+</text>
                              <text x="10" y="36" fontSize="12" fill="#1e88e5" fontWeight="800">−</text>

                              {/* Center Trench */}
                              <rect x="20" y={BB_H / 2 - 8} width={BB_W} height="16" fill={darkMode ? "#0a0a0a" : "#e0e0e0"} />

                              {/* Bottom Power Rails */}
                              <line x1="30" y1={BB_H - 32} x2={BB_W + 10} y2={BB_H - 32} stroke="#1e88e5" strokeWidth="2" />
                              <line x1="30" y1={BB_H - 16} x2={BB_W + 10} y2={BB_H - 16} stroke="#e53935" strokeWidth="2" />
                              <text x="10" y={BB_H - 28} fontSize="12" fill="#1e88e5" fontWeight="800">−</text>
                              <text x="10" y={BB_H - 12} fontSize="12" fill="#e53935" fontWeight="800">+</text>

                              {/* Grid rendering (Top Half: A-E, Bottom Half: F-J) */}
                              {Array.from({ length: COLS }).map((_, ci) => {
                                const compIdx = Math.floor(ci / 3);
                                const isUsed = compIdx < allItems.length && ci % 3 < 2;
                                const highlight = isUsed ? ROW_COLORS[compIdx % ROW_COLORS.length] : (darkMode ? "#2a2a2a" : "#e0e0e0");

                                // Top holes
                                const topHoles = Array.from({ length: ROWS_HALF }).map((_, ri) => (
                                  <rect key={"t-" + ci + "-" + ri} x={36 + ci * CW} y={50 + ri * CW} width={CW - 4} height={CW - 4} rx="2" fill={darkMode ? "#000" : "#fff"} stroke={highlight} strokeWidth={isUsed ? "1.5" : "1"} />
                                ));
                                // Bottom holes
                                const botHoles = Array.from({ length: ROWS_HALF }).map((_, ri) => (
                                  <rect key={"b-" + ci + "-" + ri} x={36 + ci * CW} y={BB_H / 2 + 10 + ri * CW} width={CW - 4} height={CW - 4} rx="2" fill={darkMode ? "#000" : "#fff"} stroke={highlight} strokeWidth={isUsed ? "1.5" : "1"} />
                                ));

                                // Labels for components
                                let label = null;
                                if (isUsed && ci % 3 === 0) {
                                  const item = allItems[compIdx];
                                  label = (
                                    <text key={"l-" + ci} x={36 + ci * CW + CW / 2} y="44" textAnchor="middle" fontSize="8" fontWeight="800" fill={highlight} transform={"rotate(-30, " + (36 + ci * CW + CW) + ", 44)"}>
                                      {item.icon || item.k.toUpperCase()}
                                    </text>
                                  );
                                }

                                return <g key={"col-" + ci}>{topHoles}{botHoles}{label}</g>;
                              })}
                            </svg>
                          </div>

                          {/* placement steps */}
                          <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: G, fontWeight: 700, letterSpacing: "1.5px", marginBottom: 12 }}>PLACEMENT STEPS</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ background: BG3, border: "1px solid " + BD, borderRadius: 10, padding: "13px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#2d7a2d,#4caf50)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0 }}>1</div>
                              <div>
                                <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: G, fontWeight: 800, marginBottom: 3 }}>Power & Ground Rails</div>
                                <div style={{ fontSize: 12, color: TXT, marginBottom: 2 }}>Connect {m.voltage} → (+) Red line &nbsp;·&nbsp; GND → (−) Blue line</div>
                              </div>
                            </div>
                            {allItems.map((item, i) => {
                              const isAct = item.kind === "actuator" || item.kind === "ai-actuator";
                              const isAI = item.kind === "ai" || item.kind === "ai-actuator";
                              const accent = isAct ? "#ff7043" : isAI ? "#7c4dff" : "#4caf50";
                              const bg = isAct ? (darkMode ? "#1a0800" : "#fff8e1") : isAI ? (darkMode ? "#0d0a1a" : "#ede7f6") : (darkMode ? "#071a07" : "#f1f8e9");
                              return (
                                <div key={item.k} style={{ background: bg, border: "1px solid " + BD, borderLeft: "3px solid " + accent, borderRadius: 10, padding: "13px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{i + 2}</div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: accent, fontWeight: 800, marginBottom: 4 }}>
                                      [COLUMN {i * 3 + 1}] — {item.label}{item.kind === "actuator" ? " — via Relay" : item.kind === "ai-actuator" ? " — AI Added (via Relay)" : isAI ? " — AI Added" : ""}
                                    </div>
                                    {isAct ? (
                                      <div>
                                        <div style={{ fontSize: 12, color: TXT, marginBottom: 3, display: "flex", flexWrap: "wrap", gap: "0 16px" }}>
                                          <span>Relay IN → <strong style={{ color: "#ff7043" }}>{item.pin}</strong></span>
                                          <span>Relay VCC → <strong style={{ color: "#e53935" }}>5V ext</strong></span>
                                          <span>Relay GND → <strong style={{ color: "#1e88e5" }}>GND</strong></span>
                                        </div>
                                        <div style={{ fontSize: 11, color: MUT }}>Logic: LOW=ON, HIGH=OFF</div>
                                      </div>
                                    ) : (
                                      <div>
                                        <div style={{ fontSize: 12, color: TXT, marginBottom: 3, display: "flex", flexWrap: "wrap", gap: "0 16px" }}>
                                          <span>Signal → <strong style={{ color: "#29b6f6" }}>{item.pin}</strong></span>
                                          <span>VCC → <strong style={{ color: "#e53935" }}>{m.voltage}</strong></span>
                                          <span>GND → <strong style={{ color: "#1e88e5" }}>GND rail</strong></span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <span style={{ flexShrink: 0, fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, color: accent, border: "1px solid " + accent, borderRadius: 4, padding: "2px 7px", alignSelf: "center" }}>
                                    {item.type.toUpperCase()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Line Explainer */}
                    {/* ══ COMPATIBILITY CHECKER TAB ══════════════════════════════════ */}
                    {codeTab === "compat" && (() => {
                      const is33V = mcu === "esp32" || mcu === "esp8266";
                      const mcuVoltage = is33V ? "3.3V" : "5V";

                      // Voltage compat per sensor key
                      const SENSOR_VOLTAGE = {
                        dht22: "3.3-5V", dht11: "3.3-5V", ds18b20: "3.3-5V",
                        water_level: "3.3-5V", soil_moisture: "5V only", cap_soil: "3.3-5V",
                        ldr: "3.3-5V", bh1750: "3.3-5V", tds: "3.3-5V",
                        ph: "5V only", turbidity: "3.3-5V", flow: "3.3-5V", mq135: "5V only",
                      };

                      // Issues: { label, type:"danger"|"warning"|"info", msg }
                      const issues = [];

                      const sKeys = Object.keys(sensors);
                      const aKeys = Object.keys(actuators);

                      // Per-sensor checks
                      sKeys.forEach(k => {
                        const sv = SENSORS[k]; if (!sv) return;
                        const sv_volt = SENSOR_VOLTAGE[k] || "3.3-5V";
                        if (is33V && sv_volt === "5V only") {
                          issues.push({
                            label: sv.label, type: "danger",
                            msg: "Requires 5V — will NOT work on " + (MCU[mcu] || {}).label + " (3.3V). Use a logic level converter or choose a different sensor."
                          });
                        }
                      });

                      // Analog pin count check
                      const analogSensors = sKeys.filter(k => SENSORS[k] && SENSORS[k].type === "analog");
                      const availAnalog = (MCU[mcu] || {}).analog || [];
                      if (analogSensors.length > availAnalog.length) {
                        issues.push({
                          label: "Too Many Analog Sensors", type: "danger",
                          msg: "You have " + analogSensors.length + " analog sensors but " + (MCU[mcu] || { label: mcu }).label + " only has " + availAnalog.length + " analog pins (" + availAnalog.join(", ") + "). Remove " + (analogSensors.length - availAnalog.length) + " analog sensor(s)."
                        });
                      }

                      // Relay / actuator count check
                      const relayPins = MCU_RELAY[mcu] || MCU_RELAY.uno;
                      if (aKeys.length > relayPins.length) {
                        issues.push({
                          label: "Too Many Actuators", type: "danger",
                          msg: "You have " + aKeys.length + " actuators but only " + relayPins.length + " relay pins available. Reduce to " + relayPins.length + " actuators."
                        });
                      }

                      // Relay warning for 3.3V boards
                      if (is33V && aKeys.length > 0) {
                        issues.push({
                          label: "Relay Modules", type: "warning",
                          msg: "Relay modules need 5V on VCC and JD-VCC. Use an external 5V supply for relay power — do NOT power them from the 3.3V board directly."
                        });
                      }

                      // I2C conflict
                      const i2cSensors = sKeys.filter(k => SENSORS[k] && SENSORS[k].type === "I2C");
                      if (i2cSensors.length > 1 && i2cSensors.includes("bh1750")) {
                        issues.push({
                          label: "I2C Address Conflict (BH1750)", type: "warning",
                          msg: "Multiple I2C sensors detected. BH1750 default address is 0x23. If another I2C sensor shares this address, use ADDR pin to switch BH1750 to 0x5C."
                        });
                      }

                      // Interrupt pin check
                      const intSensors = sKeys.filter(k => SENSORS[k] && SENSORS[k].type === "interrupt");
                      if (intSensors.length > 1) {
                        issues.push({
                          label: "Multiple Interrupt Sensors", type: "warning",
                          msg: "You have " + intSensors.length + " interrupt sensors. " + (MCU[mcu] || {}).label + " has limited interrupt pins. Assign each to a separate interrupt-capable pin (D2, D3 on Uno/Nano)."
                        });
                      }

                      // pH sensor on 3.3V
                      if (is33V && sKeys.includes("ph")) {
                        issues.push({
                          label: "pH Sensor", type: "danger",
                          msg: "These sensors require 5V to operate. They will give incorrect or no readings on a 3.3V board without a level shifter circuit."
                        });
                      }

                      // MQ135 preheat warning
                      if (sKeys.includes("mq135")) {
                        issues.push({
                          label: "MQ-135 Preheat Required", type: "warning",
                          msg: "MQ-135 requires 24-48h burn-in when new before readings stabilize. Always power it on first. Reading immediately will give wildly inaccurate values."
                        });
                      }

                      // Build per-component rows
                      const rows = [];
                      if (mcu) {
                        const mv = MCU[mcu] || {};
                        rows.push({ label: mv.label || mcu, kind: "MCU", voltage: mcuVoltage, status: "ok" });
                      }
                      sKeys.forEach(k => {
                        const sv = SENSORS[k]; if (!sv) return;
                        const sv_volt = SENSOR_VOLTAGE[k] || "3.3-5V";
                        const ok = !is33V || sv_volt !== "5V only";
                        rows.push({ label: sv.label, kind: "Sensor", voltage: sv_volt, status: ok ? "ok" : "danger" });
                      });
                      aKeys.forEach(k => {
                        const av = ACTUATORS[k]; if (!av) return;
                        rows.push({ label: av.label, kind: "Actuator+Relay", voltage: "5V (relay)", status: "ok" });
                      });
                      // AI-added extra components (deduplicated)
                      const compatStdLabels = new Set([
                        ...sKeys.map(k => SENSORS[k]?.label).filter(Boolean),
                        ...aKeys.map(k => ACTUATORS[k]?.label).filter(Boolean)
                      ]);
                      aiComponents.filter(c => !compatStdLabels.has(c.label)).forEach(c => {
                        const isAiActuator = c.role === "actuator" || c.type === "relay" ||
                          ["heater","pump","fan","motor","valve","peltier"].some(w => c.label.toLowerCase().includes(w));
                        rows.push({ label: c.label + (isAiActuator ? " (via Relay)" : ""), kind: "AI Added", voltage: "check datasheet", status: (c.type === "I2C" || c.type === "SPI") && is33V ? "warning" : "ok" });
                      });

                      const dangers = issues.filter(i => i.type === "danger").length;
                      const warnings2 = issues.filter(i => i.type === "warning").length;
                      const safe = rows.length - dangers;

                      return (
                        <div style={{ background: BG2, border: "1px solid " + BD, borderTop: "none", borderRadius: "0 0 12px 12px", padding: "24px" }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: TXT, marginBottom: 4 }}>Compatibility Checker</div>
                          <div style={{ fontSize: 12, color: MUT, marginBottom: 20 }}>Instantly checks if your selected sensors and MCU are voltage-compatible — preventing component damage before you build.</div>

                          {/* Stats row */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                            {[
                              { label: "Safe", val: safe, color: "#4caf50", bg: darkMode ? "#0a2a0a" : "#e8f5e9", border: "#4caf50" },
                              { label: "Warnings", val: warnings2, color: "#ff9800", bg: darkMode ? "#2a1800" : "#fff3e0", border: "#ff9800" },
                              { label: "Dangers", val: dangers, color: "#f44336", bg: darkMode ? "#2a0a0a" : "#ffebee", border: "#f44336" },
                            ].map(s => (
                              <div key={s.label} style={{ background: s.bg, border: "1px solid " + s.border, borderRadius: 10, padding: "16px 12px", textAlign: "center" }}>
                                <div style={{ fontSize: 36, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
                                <div style={{ fontSize: 11, color: s.color, fontWeight: 700, marginTop: 4, letterSpacing: "1px", fontFamily: "'JetBrains Mono',monospace" }}>{s.label}</div>
                              </div>
                            ))}
                          </div>

                          {/* Issues */}
                          {issues.length > 0 && (
                            <div style={{ marginBottom: 20 }}>
                              <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: MUT, letterSpacing: "2px", fontWeight: 700, marginBottom: 10 }}>ISSUES FOUND</div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {issues.map((iss, i) => {
                                  const bdr = iss.type === "danger" ? "#f44336" : "#ff9800";
                                  const bg2 = iss.type === "danger"
                                    ? (darkMode ? "#1a0505" : "#fff5f5")
                                    : (darkMode ? "#1a1000" : "#fffbf0");
                                  const tc = iss.type === "danger" ? "#f44336" : "#ff9800";
                                  return (
                                    <div key={i} style={{ background: bg2, border: "1px solid " + bdr, borderRadius: 8, padding: "12px 16px" }}>
                                      <div style={{ fontSize: 13, fontWeight: 800, color: tc, marginBottom: 4 }}>{iss.label}</div>
                                      <div style={{ fontSize: 12, color: darkMode ? "#e0e0e0" : "#333", lineHeight: 1.6 }}>{iss.msg}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {issues.length === 0 && rows.length > 0 && (
                            <div style={{ background: darkMode ? "#0a2a0a" : "#e8f5e9", border: "1px solid #4caf50", borderRadius: 8, padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 18, color: "#4caf50", fontWeight: 900 }}>v</span>
                              <span style={{ fontSize: 13, color: darkMode ? "#81c784" : "#2e7d32", fontWeight: 600 }}>All selected components are voltage-compatible with your MCU. Safe to build!</span>
                            </div>
                          )}

                          {rows.length === 0 && (
                            <div style={{ textAlign: "center", padding: "32px 0", color: MUT, fontSize: 13 }}>Select an MCU and components in the Code Generator steps to run the compatibility check.</div>
                          )}

                          {/* Full component table */}
                          {rows.length > 0 && (
                            <div>
                              <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: MUT, letterSpacing: "2px", fontWeight: 700, marginBottom: 10 }}>FULL COMPONENT CHECK</div>
                              <div style={{ border: "1px solid " + BD, borderRadius: 8, overflow: "hidden" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 90px 80px", background: BG3 }}>
                                  {["Component", "Type", "Voltage", "Status"].map(h => (
                                    <div key={h} style={{
                                      padding: "9px 14px", fontSize: 10, color: MUT, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, letterSpacing: "1px",
                                      borderRight: h !== "Status" ? "1px solid " + BD : "none", borderBottom: "1px solid " + BD
                                    }}>{h}</div>
                                  ))}
                                </div>
                                {rows.map((r, i) => {
                                  const statusColor = r.status === "ok" ? "#4caf50" : "#f44336";
                                  const statusLabel = r.status === "ok" ? "OK" : "Danger";
                                  const kindColor = r.kind === "MCU" ? "#ff9800" : r.kind === "Sensor" ? "#4caf50" : "#29b6f6";
                                  return (
                                    <div key={i} style={{
                                      display: "grid", gridTemplateColumns: "1fr 100px 90px 80px",
                                      background: i % 2 === 0 ? (darkMode ? "#080d08" : "#fafafa") : (darkMode ? "#0b120b" : "#f5f9f5"),
                                      borderBottom: i < rows.length - 1 ? "1px solid " + BD : "none"
                                    }}>
                                      <div style={{ padding: "10px 14px", fontSize: 12, color: TXT, fontWeight: 600, borderRight: "1px solid " + BD }}>{r.label}</div>
                                      <div style={{ padding: "10px 14px", borderRight: "1px solid " + BD, display: "flex", alignItems: "center" }}>
                                        <span style={{ background: kindColor + "22", border: "1px solid " + kindColor + "66", color: kindColor, fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "2px 8px", fontFamily: "'JetBrains Mono',monospace" }}>{r.kind}</span>
                                      </div>
                                      <div style={{ padding: "10px 14px", fontSize: 12, color: MUT, borderRight: "1px solid " + BD, fontFamily: "'JetBrains Mono',monospace" }}>{r.voltage}</div>
                                      <div style={{ padding: "10px 14px", fontSize: 12, fontWeight: 800, color: statusColor, fontFamily: "'JetBrains Mono',monospace" }}>{statusLabel}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* ══ SHOPPING LIST TAB ═══════════════════════════════════════════ */}
                    {codeTab === "shop" && (() => {
                      // Direct verified product URLs — Makers Electronics (February 2026)
                      const MAKERS_URLS = {
                        uno: "https://makerselectronics.com/product/arduino-uno-rev3/",
                        mega: "https://makerselectronics.com/product/arduino-mega-2560/",
                        nano: "https://makerselectronics.com/product/arduino-nano-atmega328pb-u/",
                        esp32: "https://makerselectronics.com/product/esp32-development-board-wifi-and-bl/",
                        esp8266: "https://makerselectronics.com/product/esp8266-nodemcu-wifi-programming-development-kit-30-pin-with-cp2102/",
                        dht22: "https://makerselectronics.com/product/dht22-digital-temperature-and-humidity-sensor/",
                        dht11: "https://makerselectronics.com/product/dht11-board/",
                        ds18b20: "https://makerselectronics.com/product/ds18b20-waterproof-temperature-senso/",
                        water_level: "https://makerselectronics.com/product/water-level-detection-sensor/",
                        soil_moisture: "https://makerselectronics.com/product/soil-moisture-sensor/",
                        cap_soil: "https://makerselectronics.com/product/capacitive-soil-moisture-sensor-v1-2/",
                        ldr: "https://makerselectronics.com/product/gl12528-photoresistor-sensor-ldr-1-20m%cf%89-12mm/",
                        bh1750: "https://makerselectronics.com/product-category/sensors/",
                        tds: "https://makerselectronics.com/product/tds-sensor-with-board-module-v1-0/",
                        ph: "https://makerselectronics.com/product/analog-ph-meter-sensor/",
                        turbidity: "https://makerselectronics.com/product/turbidity-sensor-with-board-module/",
                        flow: "https://makerselectronics.com/product/water-flow-sensor-yf-s201c/",
                        mq135: "https://makerselectronics.com/product/mq-135-air-quality-gas-sensor-module/",
                        fan: "https://makerselectronics.com/product/dc-fan-12v-0-35a-120x120x38mm/",
                        pump: "https://makerselectronics.com/product/horizontal-submersible-water-pump-5v/",
                        lamp: "https://makerselectronics.com/product-category/classic-control-components/",
                        thermal: "https://makerselectronics.com/product-category/classic-control-components/",
                        ptc: "https://store.fut-electronics.com/products/ptc-heater-plate-with-aluminum-shell-12v-120-c",
                        aerator: "https://makerselectronics.com/product-category/classic-control-components/",
                        relay: "https://makerselectronics.com/product/relay-module-1-channel-5v-active-high/",
                        misc: "https://makerselectronics.com/product-category/breadboards-pcb-boards/breadboard/",
                      };

                      // Build shopping items from current selections
                      const items = [];

                      // MCU
                      if (mcu) {
                        const mv = MCU[mcu] || {};
                        items.push({
                          key: "mcu-" + mcu, cat: "MCU", label: mv.label || mcu,
                          price: customPrices.mcu[mcu] ?? COSTS.mcu[mcu] ?? 0,
                          url: MAKERS_URLS[mcu] || "https://makerselectronics.com/products/"
                        });
                      }

                      // Sensors
                      Object.keys(sensors).forEach(k => {
                        const sv = SENSORS[k]; if (!sv) return;
                        items.push({
                          key: "s-" + k, cat: "Sensor", label: sv.label,
                          price: customPrices.sensor[k] ?? COSTS.sensor[k] ?? 0,
                          url: MAKERS_URLS[k] || "https://makerselectronics.com/product-category/sensors/"
                        });
                      });

                      // Actuators + relay
                      Object.keys(actuators).forEach(k => {
                        const av = ACTUATORS[k]; if (!av) return;
                        items.push({
                          key: "a-" + k, cat: "Actuator", label: av.label,
                          price: customPrices.actuator[k] ?? COSTS.actuator[k] ?? 0,
                          url: MAKERS_URLS[k] || "https://makerselectronics.com/product-category/classic-control-components/"
                        });
                        items.push({
                          key: "r-" + k, cat: "Relay", label: "1-Channel Relay Module (for " + av.label + ")",
                          price: customPrices.relay ?? COSTS.relay,
                          url: MAKERS_URLS.relay
                        });
                      });

                      // Misc
                      items.push({
                        key: "misc", cat: "Misc", label: "Wires / Breadboard / Resistors",
                        price: customPrices.misc ?? COSTS.misc,
                        url: MAKERS_URLS.misc
                      });

                      // AI-added extra components (no price, labeled separately)
                      const aiItems = aiComponents.filter(c => {
                        const stdLabels = [
                          ...Object.keys(sensors).map(k => SENSORS[k]?.label),
                          ...Object.keys(actuators).map(k => ACTUATORS[k]?.label)
                        ].filter(Boolean);
                        return !stdLabels.includes(c.label);
                      });

                      const filtered = shopFilter === "all" ? items : items.filter(i => i.cat === shopFilter);
                      const total = items.reduce((s, i) => s + i.price, 0);
                      const cats = ["all", "MCU", "Sensor", "Actuator", "Relay", "Misc"];

                      const CAT_COLOR = { MCU: "#ff9800", Sensor: "#4caf50", Actuator: "#29b6f6", Relay: "#ce93d8", Misc: "#78909c" };

                      return (
                        <div style={{ background: BG2, border: "1px solid " + BD, borderTop: "none", borderRadius: "0 0 12px 12px" }}>
                          {/* Budget header */}
                          <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid " + BD }}>
                            <div style={{ fontSize: 22, fontWeight: 900, color: TXT, marginBottom: 2 }}>Shopping List</div>
                            <div style={{ fontSize: 12, color: MUT, marginBottom: 16 }}>Direct links to buy every component from Makers Electronics. Prices verified February 2026. For RAM E-Shop and FUT Electronics, see the Resources tab.</div>
                            <div style={{ background: BG3, border: "1px solid " + BD, borderRadius: 10, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                              <div>
                                <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: MUT, letterSpacing: "2px", marginBottom: 4, fontWeight: 700 }}>TOTAL ESTIMATED BUDGET</div>
                                <div style={{ fontSize: 32, fontWeight: 900, color: G, letterSpacing: "-1px" }}>{total.toLocaleString()} <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0 }}>EGP</span></div>
                                <div style={{ fontSize: 11, color: MUT, marginTop: 2 }}>Prices from Egyptian stores (2026) · Click to edit in Tools tab</div>
                              </div>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                <a href="https://makerselectronics.com/products/" target="_blank" rel="noreferrer"
                                  style={{
                                    display: "inline-block", padding: "7px 18px", fontSize: 11, fontWeight: 700,
                                    border: "1px solid " + G, borderRadius: 20, color: G, textDecoration: "none",
                                    background: "transparent", fontFamily: "'JetBrains Mono',monospace", transition: "all .15s"
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.background = G + "22"; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                                  makerselectronics.com
                                </a>
                                <span style={{ fontSize: 10, color: MUT, fontFamily: "'JetBrains Mono',monospace" }}>Prices: February 2026</span>
                              </div>
                            </div>
                          </div>

                          {/* Category filter */}
                          <div style={{ padding: "12px 24px", borderBottom: "1px solid " + BD, display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {cats.map(cat => {
                              const active = shopFilter === cat;
                              const col = cat === "all" ? G : (CAT_COLOR[cat] || G);
                              return (
                                <button key={cat} onClick={() => setShopFilter(cat)}
                                  style={{
                                    padding: "5px 14px", fontSize: 11, fontWeight: 700, borderRadius: 20, cursor: "pointer",
                                    fontFamily: "'JetBrains Mono',monospace",
                                    background: active ? col : "transparent",
                                    color: active ? BG : MUT,
                                    border: "1px solid " + (active ? col : BD),
                                    transition: "all .15s"
                                  }}>
                                  {cat}
                                </button>
                              );
                            })}
                          </div>

                          {/* Item list */}
                          {items.length === 0 ? (
                            <div style={{ padding: "40px 24px", textAlign: "center", color: MUT, fontSize: 13 }}>
                              Select an MCU and components in the Code Generator steps to build your shopping list.
                            </div>
                          ) : (
                            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                              {filtered.map(item => {
                                const col = CAT_COLOR[item.cat] || G;
                                return (
                                  <div key={item.key} style={{ background: BG3, border: "1px solid " + BD, borderRadius: 10, padding: "14px 18px" }}>
                                    {/* Top row: badge + name + price */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                      <span style={{
                                        background: col + "22", border: "1px solid " + col + "66", color: col,
                                        fontSize: 9, fontWeight: 800, borderRadius: 20, padding: "3px 9px",
                                        fontFamily: "'JetBrains Mono',monospace", flexShrink: 0
                                      }}>
                                        {item.cat}
                                      </span>
                                      <span style={{ fontSize: 14, fontWeight: 700, color: TXT, flex: 1 }}>{item.label}</span>
                                      <span style={{ fontSize: 14, fontWeight: 900, color: G, fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>
                                        {item.price.toLocaleString()} EGP
                                      </span>
                                    </div>
                                    {/* Store button — direct verified link */}
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                      <a href={item.url} target="_blank" rel="noreferrer"
                                        style={{
                                          display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", fontSize: 12, fontWeight: 700,
                                          border: "1px solid " + G, borderRadius: 6, color: BG, textDecoration: "none",
                                          background: G, transition: "all .15s"
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
                                        onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
                                        Buy on Makers Electronics
                                      </a>
                                      {item.key === "a-ptc" && (
                                        <span style={{ fontSize: 10, color: MUT, fontFamily: "'JetBrains Mono',monospace" }}>via FUT Electronics</span>
                                      )}
                                      {(item.key === "a-lamp" || item.key === "a-thermal" || item.key === "a-aerator" || item.key === "misc" || item.key === "s-bh1750") && (
                                        <span style={{ fontSize: 10, color: "#ff9800", fontFamily: "'JetBrains Mono',monospace" }}>browse category</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}

                              {/* Total row */}
                              {shopFilter === "all" && (
                                <div style={{ background: darkMode ? "#0a2a0a" : "#e8f5e9", border: "1px solid " + G + "44", borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontSize: 13, fontWeight: 800, color: G, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "1px" }}>TOTAL (standard components)</span>
                                  <span style={{ fontSize: 18, fontWeight: 900, color: G, fontFamily: "'JetBrains Mono',monospace" }}>{total.toLocaleString()} EGP</span>
                                </div>
                              )}

                              {/* AI Added components — no price, just a note */}
                              {aiItems.length > 0 && shopFilter === "all" && (
                                <div>
                                  <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "#7c4dff", letterSpacing: "2px", fontWeight: 800, marginTop: 8, marginBottom: 8, padding: "0 4px" }}>
                                    AI ADDED — verify price locally before buying
                                  </div>
                                  {aiItems.map(c => (
                                    <div key={c.label} style={{ background: darkMode ? "#0d0a1a" : "#ede7f6", border: "1px solid #7c4dff55", borderRadius: 10, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                      <span style={{ background: "#7c4dff22", border: "1px solid #7c4dff88", color: "#7c4dff", fontSize: 9, fontWeight: 800, borderRadius: 20, padding: "3px 9px", fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>
                                        AI ADDED
                                      </span>
                                      <span style={{ fontSize: 14, fontWeight: 700, color: TXT, flex: 1 }}>{c.label}</span>
                                      <span style={{ fontSize: 11, color: "#7c4dff", fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>
                                        {c.type === "I2C" ? "I2C — " + c.pin : c.pin} · check local price
                                      </span>
                                    </div>
                                  ))}
                                  <div style={{ fontSize: 11, color: MUT, padding: "4px 4px 8px", lineHeight: 1.6 }}>
                                    These components were added via AI Edit. Prices not included in total — check RAM E-Shop, Makers Electronics, or local market.
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {codeTab === "explain" && (() => {
                      const explain = (line) => {
                        const t = line.trim();
                        if (!t || t === "{" || t === "}") return null;
                        if (t.startsWith("/*") || t.startsWith(" * ╔") || t.startsWith(" * ║") || t.startsWith(" * ╠") || t.startsWith(" * ╚") || t.startsWith(" */") || t === " *") return null;
                        if (t.startsWith("// ---")) return { tag: "SECTION", text: t.replace(/\/\/ -+\s*/, "").replace(/-+/g, "").trim() };
                        if (t.startsWith("#include <DHT")) return { tag: "LIBRARY", text: "Loads the DHT library — this gives your code the ability to talk to DHT11/DHT22 sensors using a special digital protocol." };
                        if (t.startsWith("#include <OneWire")) return { tag: "LIBRARY", text: "Loads the OneWire library — allows one data wire to carry signals from multiple DS18B20 sensors." };
                        if (t.startsWith("#include <Dallas")) return { tag: "LIBRARY", text: "Loads the DallasTemperature library — simplifies reading the DS18B20 waterproof temperature sensor." };
                        if (t.startsWith("#include <BH1750")) return { tag: "LIBRARY", text: "Loads the BH1750 library — lets you read precise light levels in lux (standard light unit) from the BH1750 I2C sensor." };
                        if (t.startsWith("#include <Wire")) return { tag: "LIBRARY", text: "Loads the Wire library — enables I2C communication. I2C uses only 2 wires (SDA + SCL) to connect multiple sensors to the Arduino." };
                        if (t.startsWith("#include")) return { tag: "LIBRARY", text: "Loads an external code library. Libraries are pre-written code that give your Arduino new abilities without you writing everything from scratch." };
                        if (t.startsWith("#define") && t.includes("_MIN")) {
                          const parts = t.split(/\s+/);
                          return { tag: "SETPOINT", text: parts[1] + " = " + parts[2] + " — This is the MINIMUM target. If a sensor reads below this, the Arduino turns on a heater, lamp, or pump to bring the value back up." };
                        }
                        if (t.startsWith("#define") && t.includes("_MAX")) {
                          const parts = t.split(/\s+/);
                          return { tag: "SETPOINT", text: parts[1] + " = " + parts[2] + " — This is the MAXIMUM target. If a sensor reads above this, the Arduino turns on a fan, drain, or cooler to bring the value back down." };
                        }
                        if (t.startsWith("#define RELAY_")) {
                          const parts = t.split(/\s+/);
                          return { tag: "PIN", text: "Pin " + parts[2] + " controls the " + (parts[3] ? parts.slice(3).join(" ") : "relay") + ". A relay is an electrically-controlled switch — the Arduino sends a signal to this pin to turn the device on or off." };
                        }
                        if (t.startsWith("volatile int flowPulses")) return { tag: "INTERRUPT", text: "'volatile' tells the compiler this variable can change at any moment (from the interrupt). flowPulses counts how many times water passed through the flow sensor." };
                        if (t.includes("flowISR()")) return { tag: "INTERRUPT", text: "This is an Interrupt Service Routine (ISR). Every time a water pulse is detected, the Arduino instantly pauses what it is doing and runs this function to add 1 to flowPulses." };
                        if (t === "void setup() {") return { tag: "FUNCTION", text: "setup() is a special Arduino function that runs ONCE when you power on or reset the board. Use it to configure pins, start communication, and prepare your hardware." };
                        if (t.startsWith("Serial.begin")) return { tag: "SERIAL", text: "Opens the serial port so the Arduino can send text to your computer. The number (" + t.match(/\d+/)?.[0] + ") is the baud rate — both Arduino and Serial Monitor must use the same number." };
                        if (t.startsWith("Serial.println")) return { tag: "SERIAL", text: "Sends a message to the Serial Monitor on your computer. Open it in Arduino IDE → Tools → Serial Monitor. Great for debugging and checking if the system is working." };
                        if (t.startsWith("pinMode") && t.includes("OUTPUT")) return { tag: "PIN", text: "Sets a pin as OUTPUT, meaning the Arduino can send electricity OUT through it to control a relay or LED. You must call pinMode before using digitalWrite." };
                        if (t.includes("digitalWrite") && t.includes("HIGH") && !t.includes("if") && !t.includes("?")) return { tag: "RELAY", text: "Sends HIGH voltage to the relay pin. For active-low relays (most common), HIGH = device is OFF. This ensures all devices start turned OFF when the system boots." };
                        if (t.startsWith("pinMode") && t.includes("INPUT_PULLUP")) return { tag: "PIN", text: "Sets a pin as INPUT with the internal pull-up resistor enabled. The pull-up keeps the pin at HIGH by default, so noise doesn't cause false readings from the flow sensor." };
                        if (t.includes("attachInterrupt")) return { tag: "INTERRUPT", text: "Registers the flow sensor ISR. From now on, every time the flow sensor pin rises from LOW to HIGH (a pulse), the Arduino automatically calls flowISR() — even in the middle of other code." };
                        if (t.includes("delay(20000)")) return { tag: "TIMING", text: "Waits 20 seconds (20,000 ms). The MQ-135 gas sensor has a heating element inside. It needs time to reach operating temperature before its readings are accurate." };
                        if (t === "void loop() {") return { tag: "FUNCTION", text: "loop() is the heart of Arduino — it runs FOREVER after setup() finishes. Everything inside repeats about once per second. This is what makes feedback control possible: the system constantly checks and reacts." };
                        if (t.startsWith("unsigned long lastLog")) return { tag: "TIMING", text: "unsigned long stores very large numbers — needed because millis() can count up to ~50 days in milliseconds. lastLog stores the last time we sent a log to the Serial Monitor." };
                        if (t.startsWith("DHT ")) return { tag: "SENSOR", text: "Creates a DHT sensor object linked to the data pin. Think of it as 'opening a connection' to the sensor so you can read from it." };
                        if (t.includes("readTemperature()")) return { tag: "SENSOR", text: "Asks the DHT sensor for the current air temperature in Celsius. The result is stored as a float (decimal number) in the 'temp' variable." };
                        if (t.includes("readHumidity()")) return { tag: "SENSOR", text: "Asks the DHT sensor for the current relative humidity (0–100%). 100% means air is fully saturated with water vapour." };
                        if (t.startsWith("OneWire ow(")) return { tag: "SENSOR", text: "Creates a OneWire communication bus on the specified pin. The DS18B20 uses a clever protocol where you can chain many sensors on a single wire." };
                        if (t.startsWith("DallasTemperature ds(")) return { tag: "SENSOR", text: "Creates a DallasTemperature object that uses the OneWire bus to talk to the DS18B20 sensor." };
                        if (t.includes("requestTemperatures()")) return { tag: "SENSOR", text: "Sends a command telling the DS18B20 to start measuring temperature. The sensor needs a brief moment to calculate the value before you can read it." };
                        if (t.includes("getTempCByIndex(0)")) return { tag: "SENSOR", text: "Reads the temperature result in Celsius from the first sensor (index 0). If you had multiple DS18B20s on one wire, you'd use index 1, 2, etc." };
                        if (t.includes("analogRead") && t.includes("waterLvl")) return { tag: "SENSOR", text: "Reads the water level sensor. analogRead() converts a voltage (0 to " + (MCU[mcu]?.voltage || "5V") + ") into a number from 0 to 1023. Higher number = more water detected." };
                        if (t.includes("analogRead") && t.includes("soilMoist")) return { tag: "SENSOR", text: "Reads the resistive soil moisture sensor. Wet soil conducts electricity better, giving a LOWER reading. Dry soil gives a HIGHER reading (~800–1023). Counterintuitive but correct." };
                        if (t.includes("analogRead") && t.includes("capSoil")) return { tag: "SENSOR", text: "Reads the capacitive soil sensor. It measures how much the soil changes an electric field — no metal probes in soil means no corrosion. Lower value = wetter. Runs on 3.3V only." };
                        if (t.includes("analogRead") && t.includes("light")) return { tag: "SENSOR", text: "Reads the LDR (Light Dependent Resistor). Its resistance drops when light hits it, causing higher voltage and a higher number from analogRead. 0 = total darkness, ~1000 = bright sunlight." };
                        if (t.startsWith("BH1750 lmeter")) return { tag: "SENSOR", text: "Creates the BH1750 light sensor object. The BH1750 gives you real lux values over I2C — far more accurate than a raw LDR reading." };
                        if (t.includes("Wire.begin()")) return { tag: "SENSOR", text: "Starts the I2C bus. I2C uses just two wires (SDA for data, SCL for clock) to communicate with multiple sensors. The clock keeps both devices in sync." };
                        if (t.includes("lmeter.begin()")) return { tag: "SENSOR", text: "Initialises the BH1750 sensor — tells it to start measuring and configures its sensitivity mode." };
                        if (t.includes("readLightLevel()")) return { tag: "SENSOR", text: "Reads the current light intensity in lux from the BH1750. Lux is a calibrated unit: 1 lux = 1 candle from 1 metre away. Full sunlight is ~100,000 lux." };
                        if (t.includes("analogRead") && t.includes("tdsVal")) return { tag: "SENSOR", text: "Reads the TDS (Total Dissolved Solids) sensor. TDS tells you how many minerals/nutrients are dissolved in the water — critical for fish health and plant nutrition. Unit: ppm (parts per million)." };
                        if (t.includes("phVolt")) return { tag: "SENSOR", text: "Converts the raw ADC reading to voltage. The pH sensor outputs a voltage proportional to acidity. We need voltage first, then convert to pH using a formula calibrated from buffer solutions." };
                        if (t.includes("phVal")) return { tag: "SENSOR", text: "Converts voltage to pH using the calibration formula. pH 7 = neutral water. pH < 7 = acidic (bad for most fish above pH 6). pH > 7 = alkaline. Most aquaculture targets pH 6.5–8.5." };
                        if (t.includes("analogRead") && t.includes("turbidity")) return { tag: "SENSOR", text: "Reads the turbidity sensor. Turbidity = cloudiness of water from particles, algae, or waste. Lower reading = cleaner water. High turbidity blocks light and harms gill function in fish." };
                        if (t.includes("flowRate")) return { tag: "SENSOR", text: "Calculates flow rate in litres per minute. The YF-S201C produces 7.5 pulses per litre per minute, so dividing pulse count by 7.5 gives L/min. Used to detect pipe leaks or irrigation problems." };
                        if (t.includes("flowPulses = 0")) return { tag: "SENSOR", text: "Resets the pulse counter to zero after calculating flow rate, so the next loop measurement starts fresh." };
                        if (t.includes("analogRead") && t.includes("airQ")) return { tag: "SENSOR", text: "Reads the MQ-135 air quality sensor. It detects CO₂, NH₃ (ammonia from fish waste), benzene, smoke, and other gases. Lower reading = more pollution detected. Needs 20s warm-up." };
                        if (t.includes("digitalWrite") && t.includes("? LOW : HIGH")) return { tag: "CONTROL", text: "This is the feedback control decision. If the condition is TRUE → LOW (relay ON, device activates). If FALSE → HIGH (relay OFF, device stops). This is the core of closed-loop control: sense → compare → act." };
                        if (t.includes("// Fan:")) return { tag: "CONTROL", text: "Fan control logic: when temperature exceeds the maximum setpoint, the fan turns on to cool the environment. When temperature drops back below the max, the fan stops. This is negative feedback." };
                        if (t.includes("// Pump:")) return { tag: "CONTROL", text: "Pump control logic: turns on when moisture or water level is too low, delivering water until the sensor value rises above the minimum threshold." };
                        if (t.includes("// Grow lamp:")) return { tag: "CONTROL", text: "Grow lamp control: supplements natural light when it drops below the plant's minimum requirement — essential for maintaining photoperiod in cloudy weather or indoors." };
                        if (t.includes("// Thermal lamp:")) return { tag: "CONTROL", text: "Thermal lamp control: activates when temperature falls below the minimum, warming the air or water until it reaches the target range." };
                        if (t.includes("// PTC heater:")) return { tag: "CONTROL", text: "PTC heater control: turns on when water temperature is too cold. PTC heaters are self-regulating — they automatically limit their own temperature, making them safer than wire heaters." };
                        if (t.includes("// Aerator:")) return { tag: "CONTROL", text: "Aerator control: runs the air pump when water quality is out of range. Aeration adds dissolved oxygen and circulates water, preventing dead zones where fish can suffocate." };
                        if (t.includes("millis() - lastLog")) return { tag: "TIMING", text: "Non-blocking timing — instead of using delay() (which freezes everything), millis() checks how much time has passed. When 300,000 ms (5 minutes) have elapsed, it logs and resets the timer." };
                        if (t.includes("lastLog = millis()")) return { tag: "TIMING", text: "Saves the current time so the next 5-minute countdown starts from now." };
                        if (t.includes("Serial.println(") && t.includes("String(")) return { tag: "SERIAL", text: "Builds a formatted log message and sends it to the Serial Monitor. String() converts numbers to text so they can be concatenated with labels. Each | separates sensor readings." };
                        if (t.startsWith("delay(1000)")) return { tag: "TIMING", text: "Pauses the loop for 1 second (1000 ms) before the next measurement cycle. This means sensors are checked and actuators are updated approximately once per second — fast enough for a greenhouse/aquaculture system." };
                        // ── AI-added component patterns ──────────────────────────────────
                        if (t.includes("tone(") && !t.startsWith("//")) return { tag: "CONTROL", text: "Activates the buzzer at the specified frequency (Hz) using PWM. tone(pin, frequency) makes the buzzer produce a sound — great for alarms. 1000Hz = a clear beep." };
                        if (t.includes("noTone(") && !t.startsWith("//")) return { tag: "CONTROL", text: "Stops the buzzer sound by disabling the PWM signal. Always call noTone() when the alarm condition clears, otherwise the buzzer keeps beeping." };
                        if (t.includes("alarmCondition") && !t.startsWith("//")) return { tag: "CONTROL", text: "Checks if any sensor reading is outside safe limits. If true, the alarm system activates. Combining multiple sensor conditions with || means any out-of-range reading triggers the alarm." };
                        if (t.startsWith("LiquidCrystal") || t.includes("lcd(")) return { tag: "SENSOR", text: "Creates the LCD display object and defines which Arduino pins it is connected to. This links your code to the physical display." };
                        if (t.includes("lcd.begin(")) return { tag: "SENSOR", text: "Initialises the LCD with its size (columns × rows). lcd.begin(16,2) means 16 characters wide and 2 lines tall — the most common LCD size." };
                        if (t.includes("lcd.print(")) return { tag: "SERIAL", text: "Sends text or a number to the LCD screen. Whatever is inside the quotes (or the variable name) appears on the display at the current cursor position." };
                        if (t.includes("lcd.setCursor(")) return { tag: "SERIAL", text: "Moves the LCD cursor to a specific position. First number = column (0 = leftmost), second = row (0 = top line, 1 = bottom line). Text printed after this goes to that position." };
                        if (t.includes("lcd.clear(")) return { tag: "SERIAL", text: "Clears all text from the LCD screen. Useful before writing new values so old readings don't overlap with new ones." };
                        if (t.includes("#include <LiquidCrystal")) return { tag: "LIBRARY", text: "Loads the LiquidCrystal library — gives Arduino built-in functions to control 16x2 and 20x4 LCD displays using the HD44780 standard protocol." };
                        if (t.includes("#include <LiquidCrystal_I2C")) return { tag: "LIBRARY", text: "Loads the LiquidCrystal_I2C library — lets you control an LCD using just 2 wires (SDA + SCL) instead of 6, thanks to the I2C backpack module." };
                        if (t.includes("#include <Adafruit_SSD1306") || t.includes("#include <U8glib")) return { tag: "LIBRARY", text: "Loads the OLED display library — enables drawing text and graphics on a small 128x64 pixel organic LED screen over I2C or SPI." };
                        if (t.includes("#include <Servo")) return { tag: "LIBRARY", text: "Loads the Servo library — lets you control servo motors. A servo can rotate to a specific angle (0–180°) — useful for automated valves, feeders, or vents." };
                        if (t.includes("servo.attach(") || t.includes(".attach(")) return { tag: "PIN", text: "Attaches the servo to a specific PWM pin. After this, you can send angle commands and the servo motor will physically rotate to that position." };
                        if (t.includes(".write(") && !t.includes("lcd") && !t.includes("Serial")) return { tag: "CONTROL", text: "Moves the servo to the specified angle (0–180 degrees). 0° = fully closed, 90° = halfway, 180° = fully open — useful for automated valves or feeders." };
                        if (t.includes("#include <RTC") || t.includes("#include <DS1307") || t.includes("#include <DS3231")) return { tag: "LIBRARY", text: "Loads the Real-Time Clock library — lets the Arduino know the exact date and time even when powered off, since the RTC module has its own battery." };
                        if (t.includes("BUZZER_PIN") && t.startsWith("#define")) { const parts = t.split(/\s+/); return { tag: "PIN", text: "Pin " + parts[2] + " is connected to the buzzer. The buzzer will produce sound when this pin receives a PWM signal from the tone() function." }; }
                        if (t.startsWith("//")) return null;
                        if (t.startsWith("float ") || t.startsWith("int ") || t.startsWith("bool ")) return { tag: "VAR", text: "Declares a variable to store a sensor value. float = decimal number (e.g. 23.5°C), int = whole number (e.g. 750 from analogRead)." };
                        return null;
                      };

                      const tagColors = {
                        SECTION: { bg: darkMode ? "#1a3a1a" : "#c8e6c9", color: G2, label: "SECTION" },
                        LIBRARY: { bg: darkMode ? "#1a2a3a" : "#bbdefb", color: "#1565c0", label: "LIBRARY" },
                        SETPOINT: { bg: darkMode ? "#2a1a0a" : "#fff3e0", color: "#e65100", label: "SETPOINT" },
                        PIN: { bg: darkMode ? "#0a1a2a" : "#e3f2fd", color: "#0277bd", label: "PIN" },
                        INTERRUPT: { bg: darkMode ? "#2a0a2a" : "#fce4ec", color: "#880e4f", label: "INTERRUPT" },
                        FUNCTION: { bg: darkMode ? "#1a1a0a" : "#f9fbe7", color: "#558b2f", label: "FUNCTION" },
                        SERIAL: { bg: darkMode ? "#0a2a1a" : "#e8f5e9", color: "#2e7d32", label: "SERIAL" },
                        RELAY: { bg: darkMode ? "#2a1a0a" : "#fff8e1", color: "#f57f17", label: "RELAY" },
                        SENSOR: { bg: darkMode ? "#0a2a2a" : "#e0f7fa", color: "#006064", label: "SENSOR" },
                        CONTROL: { bg: darkMode ? "#2a0a0a" : "#fce4ec", color: "#b71c1c", label: "CONTROL" },
                        TIMING: { bg: darkMode ? "#1a1a2a" : "#ede7f6", color: "#4527a0", label: "TIMING" },
                        VAR: { bg: darkMode ? "#111a11" : "#f1f8e9", color: "#33691e", label: "VAR" },
                      };

                      return (
                        <div style={{ border: "1px solid " + BD, borderTop: "none", borderRadius: "0 0 12px 12px", overflow: "auto", maxHeight: 580 }}>
                          <div style={{ padding: "12px 16px", background: darkMode ? "#0a1f0a" : "#e8f5e9", borderBottom: "1px solid " + BD, fontSize: 12, color: MUT, lineHeight: 1.6 }}>
                            Each line of your code is explained below in plain English. Hover or read each label to understand exactly what that line does — no prior electronics experience needed.
                          </div>
                          {genCode.split("\n").map((line, i) => {
                            const trimmed = line.trim();
                            const expl = explain(line);
                            const isComment = trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*") || trimmed === " *" || trimmed.startsWith(" * ║") || trimmed.startsWith(" * ╔") || trimmed.startsWith(" * ╠") || trimmed.startsWith(" * ╚") || trimmed === " */";
                            const isDefine = trimmed.startsWith("#define") || trimmed.startsWith("#include");
                            const isKeyword = /^(void|int|float|bool|if|else|while|for|return|const|long|unsigned|volatile)\b/.test(trimmed);
                            const codeColor = isComment ? (darkMode ? "#4a7a4a" : "#607d4a") : isDefine ? "#e65100" : isKeyword ? (darkMode ? "#81c784" : "#1b5e20") : (darkMode ? "#a5d6a7" : "#1a3a1a");
                            const rowBg = i % 2 === 0 ? (darkMode ? "#020e02" : "#f0f7f0") : (darkMode ? "#041004" : "#e8f5e9");
                            const tc = expl ? tagColors[expl.tag] || tagColors.VAR : null;

                            return (
                              <div key={i} style={{ background: rowBg, borderBottom: "1px solid " + (darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)") }}>
                                <div style={{ display: "flex", alignItems: "flex-start" }}>
                                  <div style={{ width: 34, flexShrink: 0, padding: "5px 0 5px 10px", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: MUT, userSelect: "none", borderRight: "1px solid " + (darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.10)"), textAlign: "right", paddingRight: 6, background: darkMode ? "#010901" : "#dcedc8" }}>{i + 1}</div>
                                  <div style={{ padding: "5px 10px", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: codeColor, flex: 1, fontStyle: isComment ? "italic" : "normal" }}>
                                    {line || " "}
                                  </div>
                                </div>
                                {expl && expl.tag !== "SECTION" && (
                                  <div style={{ display: "flex", gap: 10, padding: "6px 10px 8px 44px", background: tc.bg, borderTop: "1px solid " + (darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)") }}>
                                    <span style={{ flexShrink: 0, fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, color: tc.color, background: "transparent", border: "1px solid " + tc.color, borderRadius: 4, padding: "2px 6px", alignSelf: "flex-start", marginTop: 1 }}>{expl.tag}</span>
                                    <span style={{ fontSize: 12, color: darkMode ? "#d0e8d0" : "#1a3a1a", lineHeight: 1.6 }}>{expl.text}</span>
                                  </div>
                                )}
                                {expl && expl.tag === "SECTION" && (
                                  <div style={{ padding: "4px 10px 6px 44px", background: darkMode ? "#0d1f0d" : "#c8e6c9" }}>
                                    <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, color: G, letterSpacing: "1.5px" }}>{expl.text}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}


                    {/* ── Upload Guide Tab ─────────────────────────────────────── */}
                    {codeTab === "upload" && (() => {
                      const mcuInfo = {
                        uno: { name: "Arduino Uno", driver: "CH340 or FTDI (usually auto-installed)", port: "COMx (Windows) / /dev/ttyUSB0 (Linux) / /dev/cu.usbmodem (Mac)", board: "Arduino AVR Boards → Arduino Uno", speed: 9600, bootloader: null, extra: null, driverUrl: "https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers" },
                        mega: { name: "Arduino Mega 2560", driver: "CH340 or FTDI (usually auto-installed)", port: "COMx / /dev/ttyUSB0", board: "Arduino AVR Boards → Arduino Mega or Mega 2560", speed: 9600, bootloader: null, extra: null, driverUrl: "https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers" },
                        nano: { name: "Arduino Nano", driver: "CH340 — must install manually for Chinese clones", port: "COMx / /dev/ttyUSB0", board: "Arduino AVR Boards → Arduino Nano", speed: 9600, bootloader: "Old Bootloader", extra: "CRITICAL: Chinese Nano clones use the OLD bootloader. In Arduino IDE go to Tools → Processor → ATmega328P (Old Bootloader). Using the wrong setting gives 'avrdude: stk500_recv()' errors.", driverUrl: "https://www.wch-ic.com/downloads/CH341SER_EXE.html" },
                        esp32: { name: "ESP32", driver: "CP2102 or CH340 — install CH340 manually if not detected", port: "COMx / /dev/ttyUSB0 / /dev/cu.SLAB_USBtoUART", board: "esp32 by Espressif (Board Manager)", speed: 115200, bootloader: null, extra: "Board package install: In Arduino IDE open File → Preferences → add this URL to 'Additional Board URLs': https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json — then go to Tools → Board → Boards Manager → search 'esp32' → install. Some ESP32 boards require holding BOOT button during upload.", driverUrl: "https://www.wch-ic.com/downloads/CH341SER_EXE.html" },
                        esp8266: { name: "ESP8266 NodeMCU", driver: "CP2102 or CH340 — install CH340 manually", port: "COMx / /dev/ttyUSB0", board: "esp8266 by ESP8266 Community (Board Manager)", speed: 115200, bootloader: null, extra: "Board package install: In Arduino IDE open File → Preferences → add this URL: https://arduino.esp8266.com/stable/package_esp8266com_index.json — then Tools → Board → Boards Manager → search 'esp8266' → install 'esp8266 by ESP8266 Community'.", driverUrl: "https://www.wch-ic.com/downloads/CH341SER_EXE.html" },
                      };
                      const info = mcuInfo[mcu] || mcuInfo.uno;

                      const steps = [
                        {
                          n: "01", title: "Install Arduino IDE",
                          body: "Download Arduino IDE 2.x from arduino.cc/en/software — it's free. Install it with default settings. On Windows, allow it to install USB drivers when prompted.",
                          tag: "SETUP", warn: null,
                        },
                        {
                          n: "02", title: "Install CH340 Driver",
                          body: "Most Chinese boards (Nano clones, NodeMCU, cheap ESP32) use the CH340/CH341 USB chip. Windows 10/11 sometimes auto-installs it — but if your board isn't detected, download and install the driver manually.",
                          tag: "DRIVER", warn: info.driver.includes("manually") ? "CH340 MANUAL INSTALL REQUIRED for your " + info.name : null,
                          link: info.driverUrl, linkText: "Download CH340 Driver",
                        },
                        {
                          n: "03", title: "Select Your Board",
                          body: 'In Arduino IDE: go to Tools → Board → ' + info.board + '. If you don\'t see it in the list, you need to install the board package first (see the note below).',
                          tag: "BOARD", warn: (mcu === "esp32" || mcu === "esp8266") ? "BOARD PACKAGE REQUIRED — " + info.name + " is not included in Arduino IDE by default. Read the note below carefully." : null,
                          extra: info.extra,
                        },
                        {
                          n: "04", title: "Select COM Port",
                          body: "Plug your board into USB. In Arduino IDE: go to Tools → Port and select the port that appeared after plugging in. On Windows it looks like COM3 or COM7. On Mac/Linux it looks like /dev/cu.usbmodem or /dev/ttyUSB0. If no port appears, your driver is not installed correctly.",
                          tag: "PORT", warn: null,
                          tip: "Tip: unplug your board, note which ports are listed, then plug it back in — the new one that appears is your board's port.",
                        },
                        ...(mcu === "nano" ? [{
                          n: "05", title: "Set Processor to Old Bootloader",
                          body: "Go to Tools → Processor → ATmega328P (Old Bootloader). This is the single most common upload failure for Nano users in Egypt. Chinese Nano clones ship with the old bootloader. Skipping this step causes: avrdude: stk500_recv(): programmer is not responding.",
                          tag: "BOOTLOADER", warn: "CRITICAL FOR NANO — do not skip this step.",
                        }] : []),
                        {
                          n: mcu === "nano" ? "06" : "05", title: "Paste and Verify Your Code",
                          body: "Copy your generated code from the Code tab. Open Arduino IDE, delete the default empty sketch, and paste your code. Click the checkmark button (Verify/Compile) first — it should say 'Compilation complete' at the bottom with no red errors.",
                          tag: "COMPILE", warn: null,
                          tip: "If you see red errors about missing libraries, go to the next step first.",
                        },
                        {
                          n: mcu === "nano" ? "07" : "06", title: "Install Required Libraries",
                          body: "Go to Tools → Manage Libraries. Search for and install each library your sketch needs. Common ones: 'DHT sensor library' by Adafruit, 'OneWire' by Paul Stoffregen, 'DallasTemperature' by Miles Burton, 'BH1750' by Christopher Laws. Install one at a time and accept 'Install all' when prompted for dependencies.",
                          tag: "LIBRARIES", warn: null,
                        },
                        {
                          n: mcu === "nano" ? "08" : "07", title: "Upload to Your Board",
                          body: "Click the right-arrow Upload button. The IDE will compile and then transfer the code. You'll see orange upload progress dots at the bottom. A successful upload ends with 'Done uploading.' in green. Open Tools → Serial Monitor and set the baud rate to " + info.speed + " to see sensor readings.",
                          tag: "UPLOAD", warn: mcu === "esp32" ? "ESP32 TIP: if upload hangs at 'Connecting...', hold the BOOT button on your ESP32 while the upload starts, then release it." : null,
                        },
                      ];

                      const errTable = [
                        ["avrdude: stk500_recv() programmer not responding", "Wrong bootloader (Nano) or wrong COM port. For Nano: Tools → Processor → Old Bootloader. Also try a different USB cable (some cables are power-only)."],
                        ["avrdude: ser_open(): can't open device", "Wrong COM port selected, or port is in use by another program. Close Serial Monitor if open. Unplug and replug the board."],
                        ["Couldn't find a Board on the selected port", "Board not detected. Check USB cable, check drivers, check COM port selection."],
                        ["Connecting... _______ (ESP32 hangs)", "Hold the BOOT/FLASH button on ESP32 while clicking Upload. Release after upload starts."],
                        ["'DHT.h' no such file or directory", "Library not installed. Go to Tools → Manage Libraries → search DHT → install 'DHT sensor library' by Adafruit."],
                        ["'DallasTemperature.h' no such file", "Install 'DallasTemperature' by Miles Burton + 'OneWire' by Paul Stoffregen from Library Manager."],
                        ["Board not found / not in list", "Board package not installed. For ESP32/ESP8266: add the board URL in File → Preferences and install via Boards Manager."],
                        ["Compilation error: exit status 1", "Syntax error in code. Read the red error message — it tells you the exact line. Check for missing semicolons or unmatched braces."],
                      ];

                      return (
                        <div style={{ padding: "20px 0", animation: "fadeUp .3s ease" }}>

                          {/* MCU Banner */}
                          <div style={{ background: "rgba(76,175,80,.07)", border: "1px solid rgba(76,175,80,.2)", borderRadius: 16, padding: "18px 22px", marginBottom: 24, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(76,175,80,.12)", border: "1px solid rgba(76,175,80,.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <span style={{ fontSize: 20 }}>~</span>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: "rgba(76,175,80,.7)", letterSpacing: "2px", fontWeight: 800, marginBottom: 4 }}>UPLOAD GUIDE FOR YOUR BOARD</div>
                              <div style={{ fontSize: 16, fontWeight: 800, color: darkMode ? "#dcedc8" : "#0d1f0d" }}>{info.name}</div>
                              <div style={{ fontSize: 11, color: darkMode ? "rgba(255,255,255,.45)" : "rgba(0,0,0,.5)", marginTop: 3 }}>Baud rate: {info.speed} · Port: {info.port}</div>
                            </div>
                          </div>

                          {/* Steps */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
                            {steps.map((s, i) => (
                              <div key={s.n} style={{ background: darkMode ? "rgba(255,255,255,.025)" : "rgba(0,0,0,.025)", border: "1px solid " + (darkMode ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.08)"), borderRadius: 16, padding: "18px 20px", position: "relative", overflow: "hidden", animationDelay: (i * .05) + "s", animation: "fadeUp .4s both" }}>
                                {/* Left accent bar */}
                                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "linear-gradient(to bottom,rgba(76,175,80,.8),rgba(76,175,80,.2))", borderRadius: "16px 0 0 16px" }} />
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                                  {/* Step number */}
                                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(76,175,80,.1)", border: "1.5px solid rgba(76,175,80,.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 800, color: "#4caf50" }}>{s.n}</div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                                      <span style={{ fontSize: 14, fontWeight: 700, color: darkMode ? "rgba(255,255,255,.92)" : "rgba(0,0,0,.85)", fontFamily: "'Outfit',sans-serif" }}>{s.title}</span>
                                      <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, color: "rgba(76,175,80,.6)", letterSpacing: "2px", background: "rgba(76,175,80,.08)", border: "1px solid rgba(76,175,80,.15)", borderRadius: 20, padding: "2px 9px" }}>{s.tag}</span>
                                    </div>
                                    <div style={{ fontSize: 12.5, color: darkMode ? "rgba(255,255,255,.55)" : "rgba(0,0,0,.55)", lineHeight: 1.75 }}>{s.body}</div>
                                    {s.tip && <div style={{ marginTop: 10, fontSize: 11, color: "rgba(76,175,80,.7)", fontFamily: "'JetBrains Mono',monospace", background: "rgba(76,175,80,.06)", border: "1px solid rgba(76,175,80,.12)", borderRadius: 8, padding: "7px 11px", lineHeight: 1.6 }}>{s.tip}</div>}
                                    {s.warn && <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: darkMode ? "#ffcc02" : "#7a5500", background: darkMode ? "rgba(255,200,0,.07)" : "rgba(255,200,0,.12)", border: "1px solid rgba(255,200,0,.25)", borderRadius: 8, padding: "8px 12px", lineHeight: 1.6 }}>"WARNING: " + s.warn}</div>}
                                    {s.extra && <div style={{ marginTop: 10, fontSize: 11.5, color: darkMode ? "rgba(255,255,255,.5)" : "rgba(0,0,0,.5)", background: darkMode ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.04)", border: "1px dashed " + (darkMode ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.12)"), borderRadius: 10, padding: "10px 14px", lineHeight: 1.75 }}>{s.extra}</div>}
                                    {s.link && <a href={s.link} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#4caf50", border: "1px solid rgba(76,175,80,.25)", borderRadius: 20, padding: "5px 14px", textDecoration: "none", background: "rgba(76,175,80,.06)", transition: "all .2s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(76,175,80,.12)"; e.currentTarget.style.borderColor = "rgba(76,175,80,.5)" }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(76,175,80,.06)"; e.currentTarget.style.borderColor = "rgba(76,175,80,.25)" }}>{s.linkText} →</a>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Error Decoder Table */}
                          <div style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, letterSpacing: "3px", color: "rgba(76,175,80,.8)", marginBottom: 14 }}>COMMON UPLOAD ERRORS — WHAT THEY MEAN</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {errTable.map(([err, fix]) => (
                                <div key={err} style={{ background: darkMode ? "rgba(255,255,255,.02)" : "rgba(0,0,0,.02)", border: "1px solid " + (darkMode ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.07)"), borderRadius: 12, padding: "13px 16px", display: "flex", gap: 16, flexWrap: "wrap" }}>
                                  <div style={{ flex: "0 0 auto", maxWidth: 280, fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, fontWeight: 600, color: darkMode ? "rgba(255,120,120,.8)" : "rgba(180,0,0,.7)", background: darkMode ? "rgba(255,80,80,.07)" : "rgba(200,0,0,.05)", border: "1px solid " + (darkMode ? "rgba(255,80,80,.15)" : "rgba(200,0,0,.12)"), borderRadius: 8, padding: "6px 10px", lineHeight: 1.5, wordBreak: "break-all" }}>{err}</div>
                                  <div style={{ flex: 1, fontSize: 12, color: darkMode ? "rgba(255,255,255,.55)" : "rgba(0,0,0,.55)", lineHeight: 1.7, minWidth: 200 }}>{fix}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>
                      );
                    })()}

                    {/* Inline Serial Monitor */}
                    {codeTab === "serial" && (
                      <div style={{ border: "1px solid " + BD, borderTop: "none", borderRadius: "0 0 12px 12px", overflow: "hidden" }}>
                        <div style={{ padding: "10px 14px", background: BG3, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", borderBottom: "1px solid " + BD }}>
                          <div style={{ fontSize: 11, color: MUT }}>
                            {Object.keys(sensors).length > 0
                              ? "Simulating " + Object.keys(sensors).reduce((a, k) => a + ((k==="dht22"||k==="dht11") ? (sensors[k].useTemp!==false?1:0)+(sensors[k].useHum!==false?1:0) : 1), 0) + " parameter(s) — updates every 2s"
                              : "No sensors configured yet — go back to Step 4"}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button className="gbtn" style={{ fontSize: 11, padding: "6px 12px" }} onClick={() => setSerialLines([])}>Clear</button>
                            {serialRunning
                              ? <button className="pbtn" style={{ fontSize: 11, padding: "6px 12px", background: "linear-gradient(135deg,#7a2d2d,#c62828)" }} onClick={stopSerial}>Stop</button>
                              : <button className="pbtn" style={{ fontSize: 11, padding: "6px 12px" }} onClick={startSerial}>Start</button>}
                          </div>
                        </div>
                        <div style={{ background: "#020802", padding: "10px 14px", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, lineHeight: 1.9, minHeight: 200, maxHeight: 400, overflow: "auto" }}>
                          {serialLines.length === 0 ? (
                            <div style={{ color: "#2d5a2d", textAlign: "center", paddingTop: 40 }}>
                              {serialRunning ? "Waiting for first reading..." : "Press Start to begin simulation"}
                            </div>
                          ) : serialLines.map((line, i) => {
                            const isLatest = i === serialLines.length - 1;
                            return (
                              <div key={i} style={{ color: isLatest ? "#81c784" : "#4a7a4a", borderBottom: "1px solid #0a1a0a", paddingBottom: 1 }}>
                                <span style={{ color: "#2d6a2d" }}>{line.slice(0, 8)}</span>
                                <span style={{ color: isLatest ? "#a5d6a7" : "#4a7a4a" }}>{line.slice(8)}</span>
                              </div>
                            );
                          })}
                          {serialRunning && <span style={{ color: G, animation: "blink 1s ease-in-out infinite", fontWeight: 800 }}>|</span>}
                        </div>
                        <div style={{ padding: "8px 14px", background: BG3, borderTop: "1px solid " + BD, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {Object.keys(sensors).length > 0 ? Object.keys(sensors).map(k => (
                            <span key={k} className="badge" style={{ fontSize: 10 }}>{SENSORS[k]?.icon || k}</span>
                          )) : <span style={{ fontSize: 11, color: MUT }}>No sensors</span>}
                        </div>
                      </div>
                    )}
                    {/* Upload Guide shortcut */}
                    <div style={{ background: "rgba(76,175,80,.06)", border: "1px solid rgba(76,175,80,.18)", borderRadius: 12, padding: "12px 16px", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: G, marginBottom: 3 }}>Never uploaded to Arduino before?</div>
                        <div style={{ fontSize: 11, color: darkMode ? "rgba(255,255,255,.45)" : "rgba(0,0,0,.45)", lineHeight: 1.6 }}>Step-by-step guide for your {MCU[mcu]?.name || "board"}: COM port, CH340 driver, board package{mcu === "nano" ? ", Old Bootloader setting" : mcu === "esp32" || mcu === "esp8266" ? ", board package install" : ""} & error decoder.</div>
                      </div>
                      <button className="gbtn" style={{ fontSize: 11, padding: "8px 16px", borderRadius: 10, whiteSpace: "nowrap", flexShrink: 0 }} onClick={() => setCodeTab("upload")}>
                        Open Upload Guide →
                      </button>
                    </div>

                    <div style={{ background: BG3, border: "1px solid " + BD, borderRadius: 10, padding: "13px 15px", marginTop: 12 }}>
                      <div style={{ fontWeight: 700, color: G, marginBottom: 8, fontSize: 13 }}>Libraries to Install (Arduino IDE → Tools → Manage Libraries)</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {["OneWire", "DallasTemperature", "DHT sensor library", "BH1750", "Wire",
                          ...(mcu === "esp32" ? ["ESP32 board (Board Manager)"] : mcu === "esp8266" ? ["ESP8266 board (Board Manager)"] : [])
                        ].map(lib => <span key={lib} className="badge" style={{ background: BG }}>{lib}</span>)}
                      </div>
                    </div>

                    {/* Contact & Request Card */}
                    <div className="bleed" style={{
                      background: BG3, borderTop: "1px solid " + BD, borderBottom: "1px solid " + BD,
                      marginTop: 16, padding: "24px clamp(16px,7vw,80px)"
                    }}>
                      <div style={{ fontWeight: 700, color: G, marginBottom: 16, fontSize: 15 }}>Need Help or Missing Something?</div>
                      <div className="grid-3" style={{ gap: 12 }}>
                        <a href="https://forms.gle/oM82q6gPFh96Nq9V9" target="_blank" rel="noreferrer"
                          style={{ background: BG2, border: "1px solid " + BD2, borderRadius: 9, padding: "11px 13px", textDecoration: "none", display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700, color: G, letterSpacing: "1px" }}>REQUEST</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: TXT }}>Missing species, sensor, or actuator?</span>
                          <span style={{ fontSize: 11, color: MUT }}>Submit a request to add it</span>
                        </a>
                        <a href="https://wa.me/201065682294" target="_blank" rel="noreferrer"
                          style={{ background: BG2, border: "1px solid " + BD2, borderRadius: 9, padding: "11px 13px", textDecoration: "none", display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700, color: G, letterSpacing: "1px" }}>WHATSAPP</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: TXT }}>01065682294</span>
                          <span style={{ fontSize: 11, color: MUT }}>Inquiries & project help</span>
                        </a>
                        <a href="https://www.linkedin.com/in/khaled-elseify" target="_blank" rel="noreferrer"
                          style={{ background: BG2, border: "1px solid " + BD2, borderRadius: 9, padding: "11px 13px", textDecoration: "none", display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700, color: G, letterSpacing: "1px" }}>LINKEDIN</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: TXT }}>Khaled Elseify</span>
                          <span style={{ fontSize: 11, color: MUT }}>Connect professionally</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* ══ AI ASSISTANT TAB ════════════════════════════════════════════════ */}
            <div style={{ flex: mainTab === "chat" ? 1 : 0, display: mainTab === "chat" ? "flex" : "none", flexDirection: "column", borderLeft: "1px solid " + BD }}>
              <div style={{ padding: "13px 16px", borderBottom: "1px solid " + BD, background: BG2, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg," + G4 + "," + G3 + ")", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, fontSize: 10, color: "#fff", letterSpacing: "-.5px" }}>AI</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Falla7 AI Assistant</div>
                  <div style={{ fontSize: 11, color: G }}>Online — Ask me anything</div>
                </div>
              </div>
              <div style={{ flex: 1, overflow: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
                {chatMsgs.map((msg, i) => (
                  <div key={i} className={msg.role === "user" ? "bau" : "bai"} style={{ lineHeight: 1.65 }}>
                    {msg.role === "assistant" ? renderMd(msg.content) : msg.content}
                  </div>
                ))}
                {chatLoad && (
                  <div className="bai" style={{ display: "flex", gap: 5, alignItems: "center", padding: "12px 14px" }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: G, animation: "blink 1.2s " + (i * 0.2) + "s ease-in-out infinite" }} />
                    ))}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div style={{ padding: "12px 14px", borderTop: "1px solid " + BD, background: BG2 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {["Arduino Uno vs ESP32?", "How to wire a relay?", "Best sensors for tilapia?", "Explain closed-loop control", "What libraries do I need?"].map(q => (
                    <button key={q} onClick={() => setChatIn(q)}
                      style={{ background: BG3, border: "1px solid " + BD, color: G2, padding: "5px 10px", borderRadius: 16, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                      {q}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="ci" placeholder="Ask about wiring, sensors, code..." value={chatIn}
                    onChange={e => setChatIn(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} />
                  <button className="pbtn" style={{ padding: "11px 16px" }} onClick={sendChat} disabled={chatLoad}>Send</button>
                </div>
              </div>
            </div>

            {/* ══ COMPARE TAB ════════════════════════════════════════════════════ */}
            <div style={{ flex: mainTab === "compare" ? 1 : 0, display: mainTab === "compare" ? "flex" : "none", flexDirection: "column", overflow: "auto", borderLeft: "1px solid " + BD }}>
              <div style={{ padding: "clamp(12px,3vw,20px) clamp(12px,4vw,28px)", maxWidth: 900, margin: "0 auto", width: "100%" }}>
                <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>Sensor Comparison</h2>
                <p style={{ color: MUT, fontSize: 13, marginBottom: 20 }}>Compare any two sensors side-by-side to pick the best one for your project.</p>
                <div className="grid-2" style={{ gap: 12, marginBottom: 24 }}>
                  {[["A", compareA, setCompareA], ["B", compareB, setCompareB]].map(([slot, val, setter]) => (
                    <div key={slot}>
                      <div style={{ fontSize: 11, color: G, fontFamily: "'JetBrains Mono',monospace", marginBottom: 8, fontWeight: 700 }}>SENSOR {slot}</div>
                      <select value={val} onChange={e => setter(e.target.value)}
                        style={{ width: "100%", background: BG3, border: "1.5px solid " + BD2, color: TXT, padding: "10px 12px", borderRadius: 9, fontFamily: "'Outfit',sans-serif", fontSize: 13, outline: "none", cursor: "pointer" }}>
                        {Object.entries(SENSOR_COMPARE).map(([k, v]) => (
                          <option key={k} value={k} style={{ background: BG2 }}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                {(() => {
                  const a = SENSOR_COMPARE[compareA], b = SENSOR_COMPARE[compareB];
                  const rows = [["Name", "name"], ["Accuracy", "accuracy"], ["Range", "range"], ["Price (EGP)", "price"], ["Voltage", "voltage"], ["Protocol", "protocol"], ["Pros", "pros"], ["Cons", "cons"]];
                  return (
                    <div style={{ background: BG3, border: "1px solid " + BD, borderRadius: 14, overflow: "hidden" }}>
                      <div className="grid-compare" style={{ display: "grid" }}>
                        <div style={{ background: BG2, padding: "12px 16px", borderBottom: "1px solid " + BD, fontSize: 11, color: MUT, fontFamily: "'JetBrains Mono',monospace" }}>FIELD</div>
                        {[a, b].map((s, i) => (
                          <div key={i} style={{ background: BG2, padding: "12px 16px", borderBottom: "1px solid " + BD, borderLeft: "1px solid " + BD, fontWeight: 800, fontSize: 14, color: G }}>
                            {s.name}
                          </div>
                        ))}
                        {rows.map(([label, field]) => (
                          [
                            <div key={label + "l"} style={{ padding: "11px 16px", borderBottom: "1px solid " + BD, fontSize: 12, color: MUT, fontWeight: 600 }}>{label}</div>,
                            <div key={label + "a"} style={{ padding: "11px 16px", borderBottom: "1px solid " + BD, borderLeft: "1px solid " + BD, fontSize: 12, color: field === "price" ? G : TXT, fontWeight: field === "price" ? "800" : "400" }}>
                              {field === "price" ? a[field] + " EGP" : a[field]}
                            </div>,
                            <div key={label + "b"} style={{ padding: "11px 16px", borderBottom: "1px solid " + BD, borderLeft: "1px solid " + BD, fontSize: 12, color: field === "price" ? G : TXT, fontWeight: field === "price" ? "800" : "400" }}>
                              {field === "price" ? b[field] + " EGP" : b[field]}
                            </div>
                          ]
                        ))}
                      </div>
                      <div style={{ padding: "14px 16px", background: BG2, display: "flex", gap: 12, justifyContent: "flex-end" }}>
                        <span style={{ fontSize: 11, color: MUT }}>Recommendation:</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: G }}>
                          {a.price <= b.price ? a.name + " is cheaper" : b.name + " is cheaper"} &nbsp;|&nbsp;
                          {a.accuracy.length <= b.accuracy.length ? a.name : b.name} may be more precise — check your use case
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* ══ TROUBLESHOOT TAB ═══════════════════════════════════════════════ */}
            <div style={{ flex: mainTab === "trouble" ? 1 : 0, display: mainTab === "trouble" ? "flex" : "none", flexDirection: "column", overflow: "auto", borderLeft: "1px solid " + BD }}>
              <div style={{ padding: "clamp(12px,3vw,24px) clamp(12px,4vw,32px)", maxWidth: 960, margin: "0 auto", width: "100%" }}>

                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: G, letterSpacing: "3px", fontWeight: 800, marginBottom: 8 }}>FALLA7 DEBUG CENTER</div>
                  <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6, color: TXT }}>Troubleshooting Guide</h2>
                  <p style={{ color: darkMode ? "rgba(165,214,167,.65)" : MUT, fontSize: 15, lineHeight: 1.6 }}>{TROUBLE.length} problems covered across {[...new Set(TROUBLE.map(t => t.cat))].length} categories — click any problem to see step-by-step fixes.</p>
                </div>

                {/* Category filter */}
                {(() => {
                  const cats = [...new Set(TROUBLE.map(t => t.cat))];
                  const [activeCat, setActiveCat] = React.useState("ALL");
                  const [showCodes, setShowCodes] = React.useState(null);
                  const filtered = activeCat === "ALL" ? TROUBLE : TROUBLE.filter(t => t.cat === activeCat);
                  const catColors = { "UPLOAD & IDE": "#4caf50", "SENSOR ISSUES": "#66bb6a", "RELAY & ACTUATORS": "#ff7043", "MCU PROBLEMS": "#ffa726", "CODE ISSUES": "#42a5f5" };

                  return (
                    <>
                      {/* Category tabs */}
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
                        {["ALL", ...cats].map(cat => (
                          <button key={cat} onClick={() => setActiveCat(cat)}
                            style={{
                              padding: "7px 16px", borderRadius: 100, fontFamily: "'JetBrains Mono',monospace",
                              fontSize: 11, fontWeight: 800, letterSpacing: "1px", cursor: "pointer",
                              border: "1.5px solid " + (activeCat === cat ? (catColors[cat] || G) : BD),
                              background: activeCat === cat ? (catColors[cat] || G) + "22" : "transparent",
                              color: activeCat === cat ? (catColors[cat] || G) : MUT,
                              transition: "all .2s cubic-bezier(.34,1.56,.64,1)"
                            }}>
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Problem count badge */}
                      <div style={{ fontSize: 12, color: MUT, fontFamily: "'JetBrains Mono',monospace", marginBottom: 16 }}>
                        Showing {filtered.length} of {TROUBLE.length} problems
                      </div>

                      {/* Accordion items */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
                        {filtered.map((item, i) => {
                          const idx = TROUBLE.indexOf(item);
                          const col = catColors[item.cat] || G;
                          return (
                            <div key={i} style={{
                              background: BG3, border: "1.5px solid " + (troubleQ === idx ? col : BD), borderRadius: 14, overflow: "hidden", transition: "all .25s cubic-bezier(.34,1.56,.64,1)",
                              boxShadow: troubleQ === idx ? "0 4px 24px " + col + "22" : "none"
                            }}>
                              <div onClick={() => setTroubleQ(troubleQ === idx ? null : idx)}
                                style={{ padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                                  <div style={{ width: 4, height: 36, borderRadius: 2, background: col, flexShrink: 0 }} />
                                  <div>
                                    <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: col, fontWeight: 800, letterSpacing: "1.5px", marginBottom: 3 }}>{item.cat}</div>
                                    <div style={{ fontWeight: 700, fontSize: 15, color: troubleQ === idx ? col : TXT, lineHeight: 1.3 }}>{item.q}</div>
                                  </div>
                                </div>
                                <div style={{
                                  width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                                  background: troubleQ === idx ? col + "22" : "transparent",
                                  border: "1.5px solid " + (troubleQ === idx ? col : BD),
                                  fontFamily: "'JetBrains Mono',monospace", fontSize: 16, color: col, fontWeight: 800, flexShrink: 0,
                                  transition: "all .25s"
                                }}>
                                  {troubleQ === idx ? "−" : "+"}
                                </div>
                              </div>
                              {troubleQ === idx && (
                                <div style={{ padding: "0 20px 20px", borderTop: "1px solid " + BD, animation: "fadeUp .25s ease both" }}>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                                    {item.steps.map((s, j) => (
                                      <div key={j} style={{
                                        display: "flex", gap: 14, alignItems: "flex-start",
                                        background: darkMode ? "rgba(255,255,255,.025)" : "rgba(0,0,0,.025)",
                                        borderRadius: 10, padding: "10px 14px", border: "1px solid " + BD
                                      }}>
                                        <div style={{
                                          width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg," + col + "88," + col + ")", flexShrink: 0,
                                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#fff", marginTop: 1
                                        }}>{j + 1}</div>
                                        <div style={{ fontSize: 14, color: TXT, lineHeight: 1.65, paddingTop: 3 }}>{s}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Quick Diagnostic Codes */}
                      <div style={{ marginBottom: 32 }}>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: G, letterSpacing: "3px", fontWeight: 800, marginBottom: 16 }}>QUICK DIAGNOSTIC SKETCHES</div>
                        <p style={{ fontSize: 14, color: darkMode ? "rgba(165,214,167,.65)" : MUT, marginBottom: 16, lineHeight: 1.6 }}>
                          Paste these into Arduino IDE to test components independently. Diagnose before adding to your full project.
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
                          {[
                            { key: "i2c_scan", label: "I2C Scanner", icon: "I2C", desc: "Finds all I2C devices and their addresses", color: "#4caf50" },
                            { key: "analog_test", label: "Analog Pin Tester", icon: "ADC", desc: "Reads all analog pins — check sensor signal", color: "#66bb6a" },
                            { key: "relay_test", label: "Relay Cycler", icon: "RLY", desc: "Clicks relay ON/OFF every 2 seconds", color: "#ff7043" },
                            { key: "dht_test", label: "DHT22/DHT11 Tester", icon: "DHT", desc: "Tests DHT sensor with full error reporting", color: "#81c784" },
                            { key: "esp32_adc", label: "ESP32 ADC Tester", icon: "ESP", desc: "Reads GPIO34 with voltage conversion", color: "#ffa726" },
                          ].map(({ key, label, icon, desc, color }) => (
                            <div key={key}
                              style={{
                                background: BG3, border: "1.5px solid " + (showCodes === key ? color : BD), borderRadius: 14, padding: "16px",
                                cursor: "pointer", transition: "all .25s cubic-bezier(.34,1.56,.64,1)",
                                boxShadow: showCodes === key ? "0 4px 20px " + color + "22" : "none"
                              }}
                              onClick={() => setShowCodes(showCodes === key ? null : key)}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                <div style={{
                                  background: color + "22", border: "1px solid " + color + "55", borderRadius: 8, padding: "4px 10px",
                                  fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 800, color: color
                                }}>{icon}</div>
                                <span style={{ fontWeight: 700, fontSize: 14, color: TXT }}>{label}</span>
                              </div>
                              <div style={{ fontSize: 12, color: darkMode ? "rgba(165,214,167,.6)" : MUT, lineHeight: 1.5, marginBottom: 10 }}>{desc}</div>
                              <div style={{ fontSize: 11, color: color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
                                {showCodes === key ? "▲ Hide code" : "▼ Show code"}
                              </div>
                              {showCodes === key && (
                                <div style={{ marginTop: 12, animation: "fadeUp .2s ease both" }}>
                                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                                    <button className="gbtn" style={{ fontSize: 11, padding: "5px 12px" }}
                                      onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(QUICK_CODES[key]); }}>
                                      Copy Code
                                    </button>
                                  </div>
                                  <pre style={{
                                    fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: darkMode ? "#a5d6a7" : "#1a3a1a",
                                    lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0,
                                    background: darkMode ? "#020c02" : "#f0faf0", borderRadius: 8, padding: "12px 14px",
                                    border: "1px solid " + BD, maxHeight: 280, overflow: "auto"
                                  }}>
                                    {QUICK_CODES[key]}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Common error messages table */}
                      <div style={{ marginBottom: 28 }}>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: G, letterSpacing: "3px", fontWeight: 800, marginBottom: 16 }}>COMMON ERROR MESSAGES → QUICK FIX</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {[
                            ["avrdude: stk500_recv() programmer not responding", "Wrong bootloader (Nano). Tools → Processor → Old Bootloader"],
                            ["'DHT' was not declared in this scope", "Install 'DHT sensor library' by Adafruit in Library Manager"],
                            ["'DallasTemperature' was not declared", "Install both 'DallasTemperature' AND 'OneWire' libraries"],
                            ["Connecting...___ (ESP32 hangs)", "Hold BOOT button on ESP32 while uploading, release when dots appear"],
                            ["No such file or directory #include", "Library not installed — open Library Manager and install the missing library"],
                            ["Serial port ... not found", "Wrong COM port selected or CH340 driver not installed"],
                            ["Board at COMx is not available", "Arduino disconnected or wrong driver — try a different USB cable"],
                            ["expected ';' before ... ", "Syntax error in code — check for missing semicolons on the line above the error"],
                            ["'[variable]' was not declared in this scope", "Variable used before it was defined — move declaration to top of sketch"],
                            ["Low memory warning — Low stability expected", "Too many variables — remove unused strings, reduce array sizes"],
                          ].map(([err, fix], i) => (
                            <div key={i} style={{
                              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0,
                              background: i % 2 === 0 ? BG3 : BG2, borderRadius: 10, overflow: "hidden", border: "1px solid " + BD
                            }}>
                              <div style={{ padding: "10px 14px", borderRight: "1px solid " + BD }}>
                                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#ef9a9a", lineHeight: 1.5 }}>{err}</div>
                              </div>
                              <div style={{ padding: "10px 14px" }}>
                                <div style={{ fontSize: 13, color: TXT, lineHeight: 1.5 }}>{fix}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom CTA */}
                      <div style={{
                        background: BG3, border: "1px solid " + BD2, borderRadius: 14, padding: "20px 24px", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap",
                        background: darkMode ? "rgba(76,175,80,.04)" : "rgba(76,175,80,.06)"
                      }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: G2, marginBottom: 4 }}>Still stuck? Get direct help.</div>
                          <div style={{ fontSize: 13, color: darkMode ? "rgba(165,214,167,.65)" : MUT, lineHeight: 1.6 }}>The AI Assistant can debug your specific code and wiring. Or message Khaled directly on WhatsApp.</div>
                        </div>
                        <button className="pbtn" style={{ fontSize: 14 }} onClick={() => setMainTab("chat")}>Open AI Assistant</button>
                        <a href="https://wa.me/201065682294" target="_blank" rel="noreferrer"
                          style={{ background: BG2, border: "1px solid " + BD2, color: G2, padding: "12px 20px", borderRadius: 10, fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14, textDecoration: "none", whiteSpace: "nowrap" }}>
                          💬 WhatsApp Help
                        </a>
                      </div>
                    </>
                  );
                })()}

              </div>
            </div>

            {/* ══ SERIAL SIM TAB ═════════════════════════════════════════════════ */}
            <div style={{ flex: mainTab === "serial" ? 1 : 0, display: mainTab === "serial" ? "flex" : "none", flexDirection: "column", borderLeft: "1px solid " + BD }}>
              <div style={{ padding: "20px 28px 12px", borderBottom: "1px solid " + BD, background: BG2, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 2 }}>Serial Monitor Simulator</h2>
                  <p style={{ color: MUT, fontSize: 12 }}>
                    {Object.keys(sensors).length > 0
                      ? "Simulating " + Object.keys(sensors).length + " sensor(s) from your current config"
                      : "Build your project in Code Generator first to simulate real sensors"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="gbtn" style={{ fontSize: 12 }} onClick={() => setSerialLines([])}>Clear</button>
                  {serialRunning
                    ? <button className="pbtn" style={{ fontSize: 12, background: "linear-gradient(135deg,#7a2d2d,#c62828)" }} onClick={stopSerial}>Stop</button>
                    : <button className="pbtn" style={{ fontSize: 12 }} onClick={startSerial}>Start Simulation</button>}
                </div>
              </div>
              <div style={{ flex: 1, overflow: "auto", background: "#020802", padding: "12px 16px", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, lineHeight: 1.8 }}>
                {serialLines.length === 0 ? (
                  <div style={{ color: "#2d5a2d", textAlign: "center", marginTop: 60, fontSize: 13 }}>
                    {serialRunning ? "Waiting for first reading..." : "Press Start Simulation to begin"}
                    <br />
                    <span style={{ fontSize: 11, display: "block", marginTop: 8, color: "#1e3a1e" }}>
                      {Object.keys(sensors).length === 0 ? "Go to Code Generator and select sensors first" : ""}
                    </span>
                  </div>
                ) : serialLines.map((line, i) => {
                  const isLatest = i === serialLines.length - 1;
                  return (
                    <div key={i} style={{ color: isLatest ? "#81c784" : "#4a7a4a", borderBottom: "1px solid #0a1a0a", paddingBottom: 2 }}>
                      <span style={{ color: "#2d6a2d" }}>{line.slice(0, 8)}</span>
                      <span style={{ color: isLatest ? "#a5d6a7" : "#4a7a4a" }}>{line.slice(8)}</span>
                    </div>
                  );
                })}
                {serialRunning && (
                  <div style={{ color: G, display: "flex", gap: 4, alignItems: "center", marginTop: 4 }}>
                    <span style={{ animation: "blink 1s ease-in-out infinite", fontWeight: 800 }}>|</span>
                    <span style={{ fontSize: 10, color: MUT }}>live</span>
                  </div>
                )}
              </div>
              <div style={{ padding: "10px 16px", borderTop: "1px solid " + BD, background: BG2, display: "flex", gap: 16, flexWrap: "wrap" }}>
                {Object.keys(sensors).length > 0 ? Object.keys(sensors).map(k => (
                  <span key={k} className="badge" style={{ fontSize: 10 }}>{SENSORS[k]?.icon || k}</span>
                )) : <span style={{ fontSize: 11, color: MUT }}>No sensors configured yet</span>}
              </div>
            </div>

            {/* ══ TOOLS TAB (Report + BOM + Save/Load) ══════════════════════════ */}
            <div style={{ flex: mainTab === "tools" ? 1 : 0, display: mainTab === "tools" ? "flex" : "none", flexDirection: "column", overflow: "auto", borderLeft: "1px solid " + BD }}>
              <div style={{ padding: "clamp(12px,3vw,20px) clamp(12px,4vw,28px)", maxWidth: 900, margin: "0 auto", width: "100%" }}>
                <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>Project Tools</h2>
                <p style={{ color: MUT, fontSize: 13, marginBottom: 24 }}>Generate reports and export your bill of materials for your Capstone project.</p>

                {/* Report + BOM row */}
                <div className="grid-2" style={{ gap: 14, marginBottom: 24 }}>

                  {/* Report Generator */}
                  <div style={{ background: BG3, border: "1px solid " + BD, borderRadius: 14, padding: "20px" }}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: G, letterSpacing: "1.5px", marginBottom: 10, fontWeight: 700 }}>REPORT TEMPLATE</div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Project Report Generator</div>
                    <div style={{ fontSize: 12, color: MUT, lineHeight: 1.6, marginBottom: 14 }}>
                      Generates a filled Capstone report template with your selected MCU, sensors, species, and system type pre-inserted. Just fill in your observations.
                    </div>
                    {mcu && system ? (
                      <div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, background: BG2, border: "1px solid " + BD, borderRadius: 8, padding: "10px 12px", marginBottom: 12, maxHeight: 140, overflow: "auto", color: "#81c784", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {generateReport(mcu, system, spKey, sensors, actuators).slice(0, 300) + "..."}
                        </div>
                        <button className="pbtn" style={{ fontSize: 12, width: "100%" }} onClick={() => {
                          const txt = generateReport(mcu, system, spKey, sensors, actuators);
                          openTool("Project Report Template", txt, "capstone_report_template.txt");
                        }}>View &amp; Copy Report Template</button>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: MUT, textAlign: "center", padding: "16px 0" }}>
                        Complete at least Steps 1–2 in Code Generator first
                        <br />
                        <button className="skbtn" style={{ marginTop: 10, fontSize: 11 }} onClick={() => { setMainTab("gen"); setStep(1); }}>Go to Generator</button>
                      </div>
                    )}
                  </div>

                  {/* BOM */}
                  <div style={{ background: BG3, border: "1px solid " + BD, borderRadius: 14, padding: "20px" }}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: G, letterSpacing: "1.5px", marginBottom: 10, fontWeight: 700 }}>BILL OF MATERIALS</div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>BOM Export (CSV)</div>
                    <div style={{ fontSize: 12, color: MUT, lineHeight: 1.6, marginBottom: 14 }}>
                      Exports a complete parts list with quantities, estimated EGP prices, and where to buy in Egypt.
                    </div>
                    {mcu ? (
                      <div>
                        <div style={{ background: BG2, border: "1px solid " + BD, borderRadius: 8, overflow: "auto", marginBottom: 12 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 0, minWidth: 260 }}>
                            <div style={{ padding: "7px 10px", fontSize: 10, color: MUT, fontFamily: "'JetBrains Mono',monospace", borderBottom: "1px solid " + BD }}>COMPONENT</div>
                            <div style={{ padding: "7px 10px", fontSize: 10, color: MUT, fontFamily: "'JetBrains Mono',monospace", borderBottom: "1px solid " + BD, borderLeft: "1px solid " + BD }}>QTY</div>
                            <div style={{ padding: "7px 10px", fontSize: 10, color: MUT, fontFamily: "'JetBrains Mono',monospace", borderBottom: "1px solid " + BD, borderLeft: "1px solid " + BD }}>EGP</div>
                            {mcu && [
                              [MCU[mcu]?.label || mcu, 1, customPrices.mcu[mcu] ?? COSTS.mcu[mcu] ?? 0],
                              ...Object.keys(sensors).map(k => [SENSORS[k]?.label || k, 1, customPrices.sensor[k] ?? COSTS.sensor[k] ?? 0]),
                              ...Object.keys(actuators).flatMap(k => [[ACTUATORS[k]?.label || k, 1, customPrices.actuator[k] ?? COSTS.actuator[k] ?? 0], ["Relay Module", 1, customPrices.relay ?? COSTS.relay]]),
                              ["Misc / Wires / Breadboard", 1, customPrices.misc ?? COSTS.misc],
                            ].map(([name, qty, price], i) => [
                              <div key={i + "n"} style={{ padding: "6px 10px", fontSize: 11, color: TXT, borderBottom: "1px solid " + BD }}>{name}</div>,
                              <div key={i + "q"} style={{ padding: "6px 10px", fontSize: 11, color: MUT, borderBottom: "1px solid " + BD, borderLeft: "1px solid " + BD, textAlign: "center" }}>{qty}</div>,
                              <div key={i + "p"} style={{ padding: "6px 10px", fontSize: 11, color: G, borderBottom: "1px solid " + BD, borderLeft: "1px solid " + BD, textAlign: "right", fontFamily: "'JetBrains Mono',monospace" }}>{price}</div>,
                            ])}
                          </div>
                        </div>
                        <button className="pbtn" style={{ fontSize: 12, width: "100%" }} onClick={() => {
                          const rows = [["Component", "Qty", "Price EGP", "Where to Buy"]];
                          if (mcu) rows.push([MCU[mcu]?.label || mcu, 1, customPrices.mcu[mcu] ?? COSTS.mcu[mcu] ?? 0, "makerselectronics.com / ram-e-shop.com / fut-electronics.com"]);
                          Object.keys(sensors).forEach(k => rows.push([SENSORS[k]?.label || k, 1, customPrices.sensor[k] ?? COSTS.sensor[k] ?? 0, "makerselectronics.com / ram-e-shop.com / fut-electronics.com"]));
                          Object.keys(actuators).forEach(k => { rows.push([ACTUATORS[k]?.label || k, 1, customPrices.actuator[k] ?? COSTS.actuator[k] ?? 0, "makerselectronics.com / ram-e-shop.com"]); rows.push(["Relay Module", 1, customPrices.relay ?? COSTS.relay, "ram-e-shop.com / makerselectronics.com"]); });
                          rows.push(["Misc Wires/Breadboard", 1, customPrices.misc ?? COSTS.misc, "makerselectronics.com / ram-e-shop.com"]);
                          const csv = rows.map(r => r.join(",")).join("\n");
                          openTool("Bill of Materials (CSV)", csv, "falla7_bom.csv");
                        }}>View &amp; Copy BOM (CSV)</button>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: MUT, textAlign: "center", padding: "16px 0" }}>
                        Select your MCU in Code Generator first
                        <br />
                        <button className="skbtn" style={{ marginTop: 10, fontSize: 11 }} onClick={() => { setMainTab("gen"); setStep(1); }}>Go to Generator</button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>{/* end body flex */}

          {/* ══ LEARN TAB ═══════════════════════════════════════════════════════ */}
          {mainTab === "learn" && (() => {
            const sKeys = Object.keys(sensors);
            const aKeys = Object.keys(actuators);
            const m = MCU[mcu] || {};

            const LESSONS = {
              sensor: {
                dht22: { title: "DHT22 — Temp & Humidity", how: "Inside the DHT22 is a capacitive humidity sensor and a thermistor. Humidity changes how much charge the capacitor holds; temperature changes the thermistor resistance. A tiny onboard chip converts both into a single digital signal.", fact: "Takes one reading every 2 seconds. Requesting faster will return stale data.", links: [{ l: "Random Nerd Tutorials — DHT22", u: "https://randomnerdtutorials.com/esp32-dht11-dht22-temperature-humidity-sensor-arduino-ide/" }, { l: "Datasheet (Aosong)", u: "https://www.sparkfun.com/datasheets/Sensors/Temperature/DHT22.pdf" }, { l: "Adafruit DHT Guide", u: "https://learn.adafruit.com/dht" }] },
                dht11: { title: "DHT11 — Basic Temp & Humidity", how: "Same concept as DHT22 but uses a resistive humidity element — cheaper and less accurate (±5% humidity vs ±2%). Only outputs whole integers for humidity.", fact: "DHT11 maxes out at 80% humidity accuracy. For a real farming project, use DHT22.", links: [{ l: "Arduino Project Hub — DHT11", u: "https://projecthub.arduino.cc/arcaegecengiz/using-dht11-b7e5e7" }, { l: "Datasheet", u: "https://www.mouser.com/datasheet/2/758/DHT11-Technical-Data-Sheet-Translated-Version-1143054.pdf" }, { l: "How-to Tutorial", u: "https://randomnerdtutorials.com/esp32-dht11-dht22-temperature-humidity-sensor-arduino-ide/" }] },
                ds18b20: { title: "DS18B20 — Waterproof Temp", how: "Uses a thermistor calibrated digitally. Communicates via 1-Wire protocol — a unique 64-bit address lets you chain dozens of sensors on a single data pin. Waterproof stainless probe is ideal for tanks.", fact: "Accurate to ±0.5°C from -10°C to +85°C. Requires a 4.7kΩ pull-up resistor on the data line.", links: [{ l: "Random Nerd — DS18B20 Guide", u: "https://randomnerdtutorials.com/esp32-ds18b20-temperature-arduino-ide/" }, { l: "Datasheet (Dallas/Maxim)", u: "https://datasheets.maximintegrated.com/en/ds/DS18B20.pdf" }, { l: "Multiple sensors on one pin", u: "https://randomnerdtutorials.com/esp32-multiple-ds18b20-temperature-sensors/" }] },
                water_level: { title: "Water Level Sensor", how: "Parallel copper traces act as a resistor network. Submerged water bridges the gaps, reducing resistance and raising output voltage. More water = higher voltage output.", fact: "Electrolysis corrodes the traces within weeks. Power the sensor only during readings using a digital output pin as its VCC.", links: [{ l: "Arduino Water Level Tutorial", u: "https://projecthub.arduino.cc/shehabshobier/water-level-sensor-with-arduino-9b63d6" }, { l: "Avoid corrosion tip", u: "https://randomnerdtutorials.com/guide-for-water-level-sensor-with-arduino/" }, { l: "Alternative: Ultrasonic HC-SR04", u: "https://randomnerdtutorials.com/complete-guide-for-ultrasonic-sensor-hc-sr04/" }] },
                soil_moisture: { title: "Soil Moisture (Resistive)", how: "Two metal probes pass current through soil. Wet soil conducts better (lower resistance → higher output). Simple but the probes electrolyze and corrode within weeks in damp soil.", fact: "Use this only for short-term demos. For real installations, use the capacitive version (Cap Soil v1.2).", links: [{ l: "Random Nerd — Soil Moisture Guide", u: "https://randomnerdtutorials.com/esp32-esp8266-soil-moisture-sensor/" }, { l: "Resistive vs Capacitive comparison", u: "https://makersportal.com/blog/2020/5/26/capacitive-soil-moisture-calibration-with-arduino" }, { l: "Circuit tutorial", u: "https://projecthub.arduino.cc/Dhruv_Mittal/soil-moisture-sensor-with-arduino-uno-a7a5d1" }] },
                cap_soil: { title: "Capacitive Soil v1.2", how: "Measures the dielectric constant of soil using an RC oscillator — no metal contacts in the soil. The coating is corrosion-proof. Output voltage drops as soil moisture increases.", fact: "Requires calibration: read value in dry air (max), saturated soil (min). Map those to 0–100%.", links: [{ l: "Calibration guide", u: "https://makersportal.com/blog/2020/5/26/capacitive-soil-moisture-calibration-with-arduino" }, { l: "MakerFabs product page", u: "https://www.makerfabs.com/capacitive-soil-moisture-sensor-v1.2.html" }, { l: "ESP32 wiring tutorial", u: "https://randomnerdtutorials.com/esp32-esp8266-soil-moisture-sensor/" }] },
                ldr: { title: "LDR — Light Dependent Resistor", how: "Cadmium sulfide film drops in resistance as photons free electrons. In bright light ~1kΩ; in darkness ~1MΩ. Used in a voltage divider: fixed resistor (10kΩ) + LDR → analog pin.", fact: "Response time is 10–20ms. Fine for day/night switching but not for fast light-flicker detection.", links: [{ l: "LDR voltage divider circuit", u: "https://randomnerdtutorials.com/photoresistor-ldr-with-arduino/" }, { l: "Electronics Tutorials — LDR", u: "https://www.electronics-tutorials.ws/io/io_4.html" }, { l: "Arduino Project Hub", u: "https://projecthub.arduino.cc/tmekinyan/automatic-light-control-using-ldr-and-arduino-0cce01" }] },
                bh1750: { title: "BH1750 — Digital Light Sensor", how: "A photodiode converts photons to current; an internal 16-bit ADC produces a lux value over I2C. Two address options (ADDR pin HIGH/LOW) allow two sensors on one bus.", fact: "Range: 1–65535 lux. Full sunlight ~100,000 lux. Plant growth needs 10,000–50,000 lux.", links: [{ l: "Random Nerd — BH1750 Guide", u: "https://randomnerdtutorials.com/esp32-bh1750-ambient-light-sensor/" }, { l: "Datasheet", u: "https://www.mouser.com/datasheet/2/348/bh1750fvi-e-186247.pdf" }, { l: "Arduino Library (claws/BH1750)", u: "https://github.com/claws/BH1750" }] },
                tds: { title: "TDS — Total Dissolved Solids", how: "AC current between two electrodes measures conductivity. More dissolved minerals = more ions = higher conductance = higher TDS in ppm. Temperature compensation is needed for accuracy.", fact: "Pure water: 0 ppm. Tap water: 150–400 ppm. Hydroponic nutrients: 500–2000 ppm by crop.", links: [{ l: "Random Nerd — TDS Sensor", u: "https://randomnerdtutorials.com/esp32-tds-water-quality-sensor-arduino/" }, { l: "DFRobot TDS tutorial", u: "https://wiki.dfrobot.com/Gravity__Analog_TDS_Sensor___Meter_For_Arduino_SKU__SEN0244" }, { l: "Calibration guide", u: "https://www.dfrobot.com/blog-1041.html" }] },
                ph: { title: "Analog pH Meter", how: "A glass membrane electrode develops a voltage proportional to H⁺ ion concentration. The module amplifies and shifts this signal into 0–5V for your ADC. Needs 2-point calibration with buffer solutions.", fact: "pH probes must be stored wet in pH 4 or 7 buffer — never dry. A dry electrode is permanently ruined.", links: [{ l: "Arduino pH meter tutorial", u: "https://randomnerdtutorials.com/esp32-ph-sensor-arduino/" }, { l: "Calibration procedure", u: "https://create.arduino.cc/projecthub/m_karim02/how-to-interface-ph-sensor-with-arduino-uno-a08756" }, { l: "SEN0161 DFRobot guide", u: "https://wiki.dfrobot.com/pH_meter_V1.1_SKU__SEN0161" }] },
                turbidity: { title: "Turbidity Sensor", how: "An IR LED shines through water; a phototransistor measures transmitted light. Particles scatter the beam — more particles = less light received = higher turbidity output voltage.", fact: "Drinking water: below 1 NTU. Fish tanks above 25 NTU impair gill function in sensitive species.", links: [{ l: "DFRobot Turbidity tutorial", u: "https://wiki.dfrobot.com/Turbidity_sensor_SKU__SEN0189" }, { l: "Arduino turbidity guide", u: "https://projecthub.arduino.cc/abir_jamal/turbidity-sensor-with-arduino-lcd-display-0b0e5d" }, { l: "NTU standards reference", u: "https://www.usgs.gov/special-topics/water-science-school/science/turbidity-and-water" }] },
                flow: { title: "Flow Sensor YF-S201C", how: "A turbine spins inside the pipe as water flows. A Hall-effect sensor detects each magnet pass on the turbine and sends a pulse. Count pulses per second to compute L/min.", fact: "Calibration: 7.5 pulses per second = 1 L/min. Must be wired to an interrupt pin so zero pulses are missed.", links: [{ l: "Random Nerd — Flow Sensor", u: "https://randomnerdtutorials.com/esp32-yf-s201-water-flow-sensor-arduino/" }, { l: "Interrupt pin tutorial", u: "https://www.arduino.cc/reference/en/language/functions/external-interrupts/attachinterrupt/" }, { l: "YF-S201 datasheet", u: "https://www.hobbytronics.co.uk/datasheets/YF-S201.pdf" }] },
                mq135: { title: "MQ-135 — Air Quality", how: "A SnO₂ ceramic element changes resistance when target gases (CO₂, NH₃, benzene) adsorb on its surface. A built-in heater keeps it at ~300°C operating temperature constantly.", fact: "Requires 24–48 hour burn-in when new. Also requires cross-sensitivity calibration — it reacts to multiple gases.", links: [{ l: "MQ135 Arduino tutorial", u: "https://projecthub.arduino.cc/m_karim02/how-to-use-mq-135-gas-sensor-with-arduino-uno-a24a79" }, { l: "Datasheet", u: "https://www.olimex.com/Products/Components/Sensors/SNS-MQ135/resources/SNS-MQ135.pdf" }, { l: "Calibration method", u: "https://hackaday.io/project/3475-mq2-and-mq135-gas-sensor-calibration" }] },
              },
              actuator: {
                fan: { title: "Fan — Cooling / Ventilation", how: "A DC brushless motor spins blades to move air. Your MCU drives a relay coil (5V signal) which closes a high-current switch for the fan's AC or DC supply. LOW = relay ON in most modules.", fact: "A 12V PC fan run at 5V operates quietly at reduced speed — good for noise-sensitive builds.", links: [{ l: "Relay module wiring guide", u: "https://randomnerdtutorials.com/esp32-relay-module-ac-appliances/" }, { l: "5V relay tutorial", u: "https://projecthub.arduino.cc/reanimationxp/how-to-use-a-relay-with-arduino-4abf76" }, { l: "Selecting the right fan", u: "https://www.electronics-tutorials.ws/sequential/seq_4.html" }] },
                pump: { title: "5V Water Pump", how: "A centrifugal impeller or peristaltic roller pushes water through tubing. Controlled via relay. Centrifugal types require priming (fill with water) before first run.", fact: "Never run dry — the impeller overheats and burns out within seconds. Always ensure water is present before switching on.", links: [{ l: "Pump relay wiring", u: "https://randomnerdtutorials.com/esp32-relay-module-ac-appliances/" }, { l: "Peristaltic vs centrifugal", u: "https://www.sciencedirect.com/topics/engineering/peristaltic-pump" }, { l: "Arduino water pump project", u: "https://projecthub.arduino.cc/graybeard888/arduino-controlled-water-pump-35ea24" }] },
                lamp: { title: "Grow Light / Lamp", how: "LED grow lights output specific wavelengths: red (660nm) for flowering, blue (450nm) for vegetative growth. Fluorescent full-spectrum also works. Controlled via relay.", fact: "Plants need dark periods — most crops need 16h light / 8h dark. Continuous light stresses most species.", links: [{ l: "Grow light Arduino control", u: "https://projecthub.arduino.cc/harshsingh9230/arduino-based-plant-grow-light-controller-4cf28f" }, { l: "LED grow light science", u: "https://www.sciencedirect.com/science/article/pii/S2214317316301263" }, { l: "Relay module guide", u: "https://randomnerdtutorials.com/esp32-relay-module-ac-appliances/" }] },
                thermal: { title: "Thermal Lamp (Heat Lamp)", how: "A high-resistance filament or ceramic element converts electrical energy to infrared heat. Ceramic emitters produce heat but no visible light — good for night use. Relay-controlled.", fact: "Ceramic heat emitters are far safer than incandescent — the surface temperature is self-limited.", links: [{ l: "Thermostat relay project", u: "https://projecthub.arduino.cc/aadithyan/arduino-thermostat-using-lm35-and-relay-for-fan-control-f1b1b8" }, { l: "PID temperature control", u: "https://randomnerdtutorials.com/esp32-ds18b20-temperature-arduino-ide/" }, { l: "Relay wiring guide", u: "https://randomnerdtutorials.com/esp32-relay-module-ac-appliances/" }] },
                ptc: { title: "PTC Heater (12V)", how: "A ceramic barium titanate element increases resistance as temperature rises — automatically limiting current and capping temperature. Cannot overheat or cause fire. Relay-controlled.", fact: "PTC = Positive Temperature Coefficient. Self-regulates at its Curie temperature, making it inherently safe.", links: [{ l: "PTC heater Wikipedia", u: "https://en.wikipedia.org/wiki/PTC_heater" }, { l: "12V PTC heater wiring", u: "https://projecthub.arduino.cc/aadithyan/arduino-thermostat-using-lm35-and-relay-for-fan-control-f1b1b8" }, { l: "Relay module tutorial", u: "https://randomnerdtutorials.com/esp32-relay-module-ac-appliances/" }] },
                aerator: { title: "Air Pump / Aerator", how: "A diaphragm or piston pump pushes air through airline tubing to a diffuser stone. Rising bubbles agitate the surface, letting O₂ dissolve. Fish need ≥5 mg/L dissolved oxygen.", fact: "Aeration also expels CO₂. In aquaponics, run the aerator at night only so plants can use CO₂ by day.", links: [{ l: "Aquaponics oxygen management", u: "https://www.sciencedirect.com/topics/agricultural-and-biological-sciences/aquaponics" }, { l: "Arduino aquaponics controller", u: "https://projecthub.arduino.cc/mircemk/diy-iot-aquaponics-system-with-esp8266-and-blynk-e0b8c1" }, { l: "Dissolved oxygen in aquaculture", u: "https://www.fao.org/3/i2125e/i2125e01.pdf" }] },
              },
              mcu: {
                uno: { title: "Arduino Uno", how: "ATmega328P at 16MHz, 5V logic. 14 digital pins, 6 analog inputs (10-bit ADC, 0–5V). USB via ATmega16U2 chip. Huge library ecosystem and community.", fact: "Only 2KB RAM and 32KB flash. Every variable and String allocation must fit.", links: [{ l: "Official Arduino Uno docs", u: "https://docs.arduino.cc/hardware/uno-rev3/" }, { l: "Arduino Language Reference", u: "https://www.arduino.cc/reference/en/" }, { l: "Getting started guide", u: "https://docs.arduino.cc/learn/starting-guide/getting-started-arduino/" }] },
                mega: { title: "Arduino Mega 2560", how: "ATmega2560 at 16MHz. 54 digital pins, 16 analog inputs, 256KB flash, 8KB RAM. Four hardware serial ports. Best for complex multi-sensor projects.", fact: "Pin 2 and 3 are hardware interrupts (like Uno), but also pins 18–21.", links: [{ l: "Mega 2560 official docs", u: "https://docs.arduino.cc/hardware/mega-2560/" }, { l: "Mega vs Uno comparison", u: "https://projecthub.arduino.cc/SurtrTech/arduino-mega-2560-vs-uno-bf5c29" }, { l: "Language Reference", u: "https://www.arduino.cc/reference/en/" }] },
                nano: { title: "Arduino Nano", how: "Electrically identical to Uno (ATmega328P, 5V, same pins) in a 18×45mm DIP package. Fits directly on a breadboard. Mini-USB port. Old bootloader versions need CH340 driver.", fact: "If your code runs on Uno, it runs on Nano unchanged. Just select Nano in the IDE board menu.", links: [{ l: "Nano official docs", u: "https://docs.arduino.cc/hardware/nano/" }, { l: "CH340 driver download", u: "https://sparks.gogo.co.nz/ch340.html" }, { l: "Nano breadboard tutorial", u: "https://projecthub.arduino.cc/mbanzi/getting-started-with-arduino-nano-9de003" }] },
                esp32: { title: "ESP32", how: "Dual-core Xtensa LX6 at 240MHz, 3.3V logic. 4MB flash, 520KB SRAM. Built-in WiFi 802.11 b/g/n and BT 4.2. 12-bit ADC (4096 levels vs Arduino's 1024). 34 GPIO. Touch-sensing pins.", fact: "The ADC is non-linear below 0.15V and above 3.1V. Use attenuation settings for full-range analog reads.", links: [{ l: "Random Nerd ESP32 Guides", u: "https://randomnerdtutorials.com/getting-started-with-esp32/" }, { l: "ESP32 official docs", u: "https://docs.espressif.com/projects/esp-idf/en/latest/esp32/" }, { l: "ESP32 pinout reference", u: "https://randomnerdtutorials.com/esp32-pinout-reference-gpios/" }] },
                esp8266: { title: "ESP8266 (NodeMCU)", how: "Tensilica L106 at 80MHz, 3.3V logic, 1MB flash. Built-in WiFi. Only 1 analog input (0–1V range only — not 3.3V!). GPIO max current: 12mA per pin.", fact: "The A0 pin only accepts 0–1V, not 3.3V. Using a voltage divider is mandatory for 3.3V sensors.", links: [{ l: "Random Nerd ESP8266 Guides", u: "https://randomnerdtutorials.com/getting-started-with-esp8266-wifi-transceiver-review/" }, { l: "NodeMCU pinout", u: "https://randomnerdtutorials.com/esp8266-pinout-reference-gpios/" }, { l: "ESP8266 vs ESP32", u: "https://randomnerdtutorials.com/esp32-vs-esp8266/" }] },
              },
            };

            return (
              <div style={{ flex: 1, overflow: "auto", borderLeft: "1px solid " + BD }}>
                <div className="page-pad" style={{ maxWidth: 960, margin: "0 auto", width: "100%" }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Learn</h2>
                  <p style={{ fontSize: 13, color: MUT, marginBottom: 24 }}>Component deep-dives — how each sensor and actuator works physically, with key facts and external references. Circuit and breadboard diagrams live in the Code Generator under the Circuit and Breadboard tabs.</p>

                  {/* ─── CONCEPT EXPLAINER ───────────────────────────── */}
                  <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: G, letterSpacing: "2px", fontWeight: 700, marginBottom: 12 }}>CONCEPT EXPLAINER — TAP A COMPONENT</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    {[["sensor", "Sensors"], ["actuator", "Actuators"], ["mcu", "MCUs"]].map(([t, lbl]) => (
                      <button key={t} onClick={() => { setLearnType(t); setLearnItem(null); }}
                        className={learnType === t ? "pbtn" : "gbtn"} style={{ fontSize: 11, padding: "6px 14px" }}>{lbl}</button>
                    ))}
                  </div>
                  <div className="grid-3" style={{ gap: 10, marginBottom: 16 }}>
                    {Object.entries(LESSONS[learnType] || {}).map(([k, v]) => (
                      <button key={k} onClick={() => setLearnItem(learnItem === k ? null : k)}
                        style={{ background: learnItem === k ? G4 : BG3, border: "1.5px solid " + (learnItem === k ? G : BD), borderRadius: 12, padding: "14px", cursor: "pointer", textAlign: "left", transition: "all .2s" }}>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 800, color: G, marginBottom: 6 }}>
                          {learnType === "sensor" ? (SENSORS[k] || {}).icon : learnType === "actuator" ? (ACTUATORS[k] || {}).icon : k.toUpperCase()}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: TXT, lineHeight: 1.3 }}>{v.title}</div>
                      </button>
                    ))}
                  </div>
                  {learnItem && (LESSONS[learnType] || {})[learnItem] && (() => {
                    const lesson = LESSONS[learnType][learnItem];
                    return (
                      <div style={{ background: BG2, border: "1px solid " + BD2, borderRadius: 14, padding: "20px", marginBottom: 8 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: G2, marginBottom: 14 }}>{lesson.title}</div>
                        <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: G, letterSpacing: "1.5px", marginBottom: 6, fontWeight: 700 }}>HOW IT WORKS PHYSICALLY</div>
                        <p style={{ fontSize: 13, color: TXT, lineHeight: 1.7, marginBottom: 16 }}>{lesson.how}</p>
                        <div style={{ background: darkMode ? "#0a2a0a" : "#e8f5e9", border: "1px solid " + BD2, borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
                          <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: G, letterSpacing: "1.5px", fontWeight: 700, marginBottom: 4 }}>KEY FACT</div>
                          <p style={{ fontSize: 12, color: darkMode ? "#a5d6a7" : "#1b5e20", lineHeight: 1.6 }}>{lesson.fact}</p>
                        </div>
                        <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: G, letterSpacing: "1.5px", fontWeight: 700, marginBottom: 8 }}>EXTERNAL LINKS — GO DEEPER</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {lesson.links.map(({ l, u }) => (
                            <a key={u} href={u} target="_blank" rel="noreferrer"
                              style={{ display: "flex", alignItems: "center", gap: 10, background: BG3, border: "1px solid " + BD, borderRadius: 8, padding: "10px 13px", textDecoration: "none", transition: "border-color .2s" }}
                              onMouseEnter={e => e.currentTarget.style.borderColor = G}
                              onMouseLeave={e => e.currentTarget.style.borderColor = BD}>
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: G, flexShrink: 0 }} />
                              <span style={{ fontSize: 12, color: G2, fontWeight: 600 }}>{l}</span>
                              <span style={{ fontSize: 10, color: MUT, marginLeft: "auto", fontFamily: "'JetBrains Mono',monospace" }}>^</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })()}

          {/* ══ RESOURCES TAB ════════════════════════════════════════════════════ */}
          {mainTab === "resources" && (
            <div style={{ flex: 1, overflow: "auto", borderLeft: "1px solid " + BD }}>
              <div className="page-pad" style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Resources</h2>
                <p style={{ fontSize: 13, color: MUT, marginBottom: 28 }}>Everything you need to go further — learning materials, component shops, and references.</p>

                {/* Egyptian Shops */}
                <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: G, letterSpacing: "2px", fontWeight: 700, marginBottom: 12 }}>WHERE TO BUY IN EGYPT</div>
                <div className="grid-3" style={{ gap: 12, marginBottom: 28 }}>
                  {[
                    { name: "Makers Electronics", url: "https://makerselectronics.com", desc: "Largest Arduino & sensor stock in Egypt. Uno, sensors, relays, motors, ESP boards.", note: "Ships nationwide" },
                    { name: "RAM E-Shop", url: "https://ram-e-shop.com", desc: "Good selection of MCUs, shields, and electronic modules. Competitive prices on ESP boards.", note: "Cairo pickup + shipping" },
                    { name: "FUT Electronics", url: "https://store.fut-electronics.com", desc: "Professional components, breadboards, tools, and wires. Good for bulk sensor orders.", note: "Ships nationwide" },
                    { name: "Souq Al-Atabah", url: "#", desc: "Physical market in Cairo. Bargain prices on resistors, wires, LEDs, and basic components. No online ordering.", note: "Cairo — in person only" },
                    { name: "Amazon Egypt", url: "https://amazon.eg", desc: "Growing electronics selection. Useful for breadboards, jumper wires, and common sensors.", note: "Fast Prime shipping" },
                    { name: "AliExpress", url: "https://aliexpress.com", desc: "Cheapest prices globally but 2–4 week shipping. Good for bulk orders planned in advance.", note: "2–4 week delivery" },
                  ].map(shop => (
                    <a key={shop.name} href={shop.url} target="_blank" rel="noreferrer"
                      style={{ background: BG3, border: "1px solid " + BD, borderRadius: 14, padding: "18px", textDecoration: "none", display: "block", transition: "border-color .2s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = G}
                      onMouseLeave={e => e.currentTarget.style.borderColor = BD}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: G2, marginBottom: 6 }}>{shop.name}</div>
                      <div style={{ fontSize: 11, color: TXT, lineHeight: 1.6, marginBottom: 8 }}>{shop.desc}</div>
                      <div style={{ fontSize: 10, color: G, fontFamily: "'JetBrains Mono',monospace" }}>{shop.note}</div>
                    </a>
                  ))}
                </div>

                {/* Learning Resources */}
                <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: G, letterSpacing: "2px", fontWeight: 700, marginBottom: 12 }}>LEARN ELECTRONICS & ARDUINO</div>
                <div className="grid-2" style={{ gap: 12, marginBottom: 28 }}>
                  {[
                    { name: "Arduino Official Docs", url: "https://docs.arduino.cc", desc: "The authoritative reference for every Arduino function, library, and board. Start with the Language Reference.", tag: "FREE · OFFICIAL" },
                    { name: "Arduino Project Hub", url: "https://projecthub.arduino.cc", desc: "Thousands of real projects with full code and wiring diagrams. Great for inspiration.", tag: "FREE · PROJECTS" },
                    { name: "Tinkercad Circuits", url: "https://tinkercad.com/circuits", desc: "Simulate Arduino circuits in your browser before building. Drag components, write code, see it run — no hardware needed.", tag: "FREE · SIMULATOR" },
                    { name: "Random Nerd Tutorials", url: "https://randomnerdtutorials.com", desc: "The best ESP32 and ESP8266 tutorials online. Every sensor and protocol covered with full code examples.", tag: "FREE · ESP32/8266" },
                    { name: "Adafruit Learning System", url: "https://learn.adafruit.com", desc: "High-quality beginner to advanced tutorials on sensors, displays, motors, and IoT.", tag: "FREE · BEGINNER" },
                    { name: "Electronics Tutorials", url: "https://electronics-tutorials.ws", desc: "Deep dives into voltage dividers, transistors, op-amps, and digital logic — the physics behind your sensors.", tag: "FREE · THEORY" },
                  ].map(r => (
                    <a key={r.name} href={r.url} target="_blank" rel="noreferrer"
                      style={{ background: BG3, border: "1px solid " + BD, borderRadius: 12, padding: "16px", textDecoration: "none", display: "flex", flexDirection: "column", gap: 6, transition: "border-color .2s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = G}
                      onMouseLeave={e => e.currentTarget.style.borderColor = BD}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: G2 }}>{r.name}</div>
                        <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: G, background: "rgba(76,175,80,.1)", border: "1px solid rgba(76,175,80,.2)", borderRadius: 20, padding: "2px 8px", whiteSpace: "nowrap" }}>{r.tag}</span>
                      </div>
                      <div style={{ fontSize: 12, color: TXT, lineHeight: 1.6 }}>{r.desc}</div>
                    </a>
                  ))}
                </div>

                {/* YouTube */}
                <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: G, letterSpacing: "2px", fontWeight: 700, marginBottom: 12 }}>RECOMMENDED YOUTUBE CHANNELS</div>
                <div className="grid-3" style={{ gap: 10, marginBottom: 28 }}>
                  {[
                    ["Paul McWhorter", "Absolute best Arduino series for beginners. 100+ videos going from zero to advanced sensors.", "English"],
                    ["DroneBot Workshop", "Excellent ESP32, sensors, and motor tutorials. Professional quality with great explanations.", "English"],
                    ["أكاديمية حسوب", "Arabic programming and electronics content. Great for Arabic-speaking students.", "عربي"],
                    ["Andreas Spiess", "Advanced IoT and ESP projects. Watch after you master the basics.", "English"],
                    ["Elegoo Official", "Tutorials matching popular Arduino starter kits. Good if you have an Elegoo kit.", "English"],
                    ["بالعربي Arduino", "Arduino tutorials in Arabic covering common sensors and projects.", "عربي"],
                  ].map(([name, desc, lang]) => (
                    <div key={name} style={{ background: BG3, border: "1px solid " + BD, borderRadius: 12, padding: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: TXT }}>{name}</div>
                        <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: lang === "عربي" ? "#ff7043" : G, background: "rgba(76,175,80,.08)", border: "1px solid " + BD2, borderRadius: 20, padding: "2px 8px" }}>{lang}</span>
                      </div>
                      <div style={{ fontSize: 11, color: MUT, lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  ))}
                </div>

                {/* Capstone tips */}
                <div style={{ background: BG3, border: "1px solid " + BD2, borderRadius: 14, padding: "20px 24px" }}>
                  <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: G, letterSpacing: "2px", fontWeight: 700, marginBottom: 14 }}>CAPSTONE PROJECT TIPS</div>
                  <div className="grid-2" style={{ gap: 10 }}>
                    {[
                      ["Start with 1 sensor", "Get one sensor working perfectly before adding more. Debug one thing at a time."],
                      ["Test each actuator alone", "Wire one relay and one actuator first. Confirm they work before adding the second."],
                      ["Use Serial Monitor", "Print every sensor value to the Serial Monitor. If you can't see it, you can't debug it."],
                      ["Document everything", "Take photos of each wiring stage. Your report needs evidence of the build process."],
                      ["Recycle smartly", "Use plastic bottles as sensor housings. Old phone chargers for 5V power. PVC pipes as frames."],
                      ["Budget early", "Use the Budget Tracker tab in Falla7 to estimate costs before buying anything."],
                    ].map(([title, tip]) => (
                      <div key={title} style={{ background: BG2, borderRadius: 10, padding: "12px 14px", borderLeft: "3px solid " + G }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: G2, marginBottom: 4 }}>{title}</div>
                        <div style={{ fontSize: 11, color: MUT, lineHeight: 1.6 }}>{tip}</div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}



          {/* ══ FLOATING AI CODE EDITOR (step 6 only) ══════════════════════════ */}
          {/* ── TOOL MODAL ──────────────────────────────────────────────────────── */}
          {toolModal && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
              onClick={e => { if (e.target === e.currentTarget) setToolModal(null); }}>
              <div style={{ background: BG2, border: "1px solid " + BD2, borderRadius: 16, width: "100%", maxWidth: 720, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Header */}
                <div style={{ padding: "14px 18px", borderBottom: "1px solid " + BD, display: "flex", alignItems: "center", justifyContent: "space-between", background: BG3 }}>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: G, fontWeight: 700, letterSpacing: "1px", marginBottom: 2 }}>TOOL OUTPUT</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: TXT }}>{toolModal.title}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: MUT, fontFamily: "'JetBrains Mono',monospace" }}>{toolModal.filename}</span>
                    <button className="pbtn" style={{ fontSize: 11, padding: "7px 14px" }} onClick={copyToolContent}>
                      {toolCopied ? "Copied!" : "Copy All"}
                    </button>
                    <button className="gbtn" style={{ fontSize: 11, padding: "7px 14px" }} onClick={() => setToolModal(null)}>Close</button>
                  </div>
                </div>
                {/* Instruction banner */}
                <div style={{ padding: "8px 18px", background: darkMode ? "#0a1a0a" : "#e8f5e9", borderBottom: "1px solid " + BD, fontSize: 11, color: MUT }}>
                  Click "Copy All" to copy this content, then paste it into a text editor or spreadsheet and save with the filename shown above.
                </div>
                {/* Content */}
                <div style={{ flex: 1, overflow: "auto", padding: "14px 18px" }}>
                  <pre style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: darkMode ? "#a5d6a7" : "#1a3a1a", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                    {toolModal.content}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="fbot">
              {floatOpen && (
                <div className="fbot-win">
                  <div style={{ padding: "11px 14px", borderBottom: "1px solid " + BD, background: BG2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>AI Code Editor</div>
                      <div style={{ fontSize: 10, color: G, fontFamily: "'JetBrains Mono',monospace" }}>Modify your code with AI</div>
                    </div>
                    <button onClick={() => setFloatOpen(false)} style={{ background: "none", border: "none", color: MUT, fontSize: 14, cursor: "pointer" }}>x</button>
                  </div>
                  <div className="fbot-msgs">
                    {floatMsgs.length === 0 && (
                      <div style={{ textAlign: "center", padding: "14px 8px", color: MUT, fontSize: 11, lineHeight: 1.7 }}>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, marginBottom: 8, color: BD2 }}>Your code is loaded. Try:</div>
                        {["Add a buzzer alarm", "Change pump pin to 8", "Add LCD display", "Add WiFi logging (ESP32)"].map(s => (
                          <div key={s} onClick={() => setFloatIn(s)}
                            style={{ background: BG3, border: "1px solid " + BD, borderRadius: 7, padding: "5px 9px", marginBottom: 5, cursor: "pointer", fontSize: 11, color: G2, textAlign: "left" }}>
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                    {floatMsgs.map((m, i) => (
                      <div key={i} className={m.role === "user" ? "fbot-u" : "fbot-a"}>{m.role === "assistant" ? renderMd(m.content) : m.content}</div>
                    ))}
                    {floatLoad && (
                      <div className="fbot-a" style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        {[0, 1, 2].map(i => (
                          <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: G, animation: "blink 1.2s " + (i * 0.2) + "s ease-in-out infinite" }} />
                        ))}
                      </div>
                    )}
                    <div ref={floatEndRef} />
                  </div>
                  <div style={{ padding: "9px 11px", borderTop: "1px solid " + BD, background: BG2, display: "flex", gap: 7 }}>
                    <input value={floatIn} onChange={e => setFloatIn(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendFloat()}
                      placeholder="e.g. Add a buzzer alarm..."
                      style={{ flex: 1, background: BG3, border: "1px solid " + BD2, color: TXT, padding: "8px 11px", borderRadius: 8, fontFamily: "'Outfit',sans-serif", fontSize: 12, outline: "none" }} />
                    <button onClick={sendFloat} disabled={floatLoad}
                      style={{ background: "linear-gradient(135deg," + G3 + "," + G + ")", border: "none", color: "#fff", padding: "8px 13px", borderRadius: 8, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                      GO
                    </button>
                  </div>
                </div>
              )}
              <button className="fbot-btn" onClick={() => setFloatOpen(o => !o)}>
                {floatOpen ? "CLOSE" : "AI\nEDIT"}
              </button>
            </div>
          )}

        </div>
      );
    }


    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
