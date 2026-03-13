# 🌱 Falla7 - Capstone Engineering Toolkit

> **فلاح** (Farmer) - Arduino code generator + AI assistant + wiring diagrams  
> for **STEM Egypt Capstone 2025-2026**  
> *By Khaled Mohammed - STEM ALEX S27*

---

## 📁 Project Structure

```
falla7/
├── index.html        # Main entry point - open this in a browser
├── css/
│   └── styles.css    # Base global styles (scrollbar, body reset)
├── js/
│   ├── config.js     # API keys & app configuration  ⚠ edit this
│   └── app.js        # Full React application (JSX, Babel transpiled)
├── assets/           # Static assets (images, icons - currently empty)
└── README.md         # This file
```

---

## 🚀 How to Run

### Option 1 - Open Locally (Quick)
Just open `index.html` in any modern browser.  
> ⚠ Some browsers block local file CORS for external scripts.  
> Use **Option 2** if the page doesn't load.

### Option 2 - Local Dev Server (Recommended)
```bash
# Python (no install needed)
cd falla7
python3 -m http.server 8080
# Then open: http://localhost:8080
```

### Option 3 - Deploy Online
Upload the entire `falla7/` folder to any static host:
- **GitHub Pages** - push to repo → Settings → Pages
- **Netlify** - drag & drop the folder at netlify.com/drop
- **Vercel** - `vercel deploy` in the folder
- **Cloudflare Pages** - connect to GitHub repo

---

## ⚙️ Configuration

Edit `js/config.js` to set your Gemini API key:

```js
window.FALLA7_CONFIG = {
  GEMINI_API_KEY: "YOUR_KEY_HERE",  // ← replace this
  GEMINI_MODEL:   "gemini-1.5-flash",
};
```

Get a free API key at: https://aistudio.google.com/app/apikey

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Assistant** | Gemini-powered project advisor |
| ⚡ **Code Generator** | Full Arduino `.ino` for 5 MCU boards |
| 🌿 **119+ Species** | Greenhouse · Aquaculture · Hybrid · Indoor · Marine |
| 🔌 **13 Sensors** | DHT22, DS18B20, BH1750, TDS, pH, MQ-135 and more |
| ⚙️ **6 Actuators** | Fan, Pump, Lamp, Thermal, PTC Heater, Aerator |
| 🔀 **Multi-Trigger** | Each actuator triggers on multiple sensor conditions (OR logic) |
| 🔧 **Wiring Diagrams** | Text-based wiring for every sensor/actuator combination |
| 💰 **EGP Budget** | Real-time cost tracking in Egyptian Pounds |
| 📟 **Serial Monitor** | Simulated serial output preview |
| 🌙 **Dark Mode** | Full dark/light theme toggle |

---

## 🛠 Tech Stack

- **React 18** - UI framework (loaded via CDN)
- **Babel Standalone** - JSX transpilation in browser (no build step)
- **Google Gemini API** - AI assistant (gemini-1.5-flash)
- **Google Fonts** - Outfit + JetBrains Mono + Space Grotesk
- **Fontshare** - Clash Display

---

## 📝 License

MIT - Free to use, modify and share for educational purposes.
