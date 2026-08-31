# 🌐 0ther5ide Intelligence Terminal (v2.1.0)

> **Next-Generation Geopolitical OSINT, Institutional Order Flow & Autonomous AI Swarm Terminal**

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-18.2-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)
![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=flat-square&logo=three.js)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 📖 Executive Summary & Vision

**0ther5ide** is a high-velocity, multi-domain intelligence operating system engineered to bridge the gap between **Palantir Gotham / Bloomberg Terminals** (macroeconomic and geopolitical intelligence) and **institutional high-frequency trading execution desks**.

When a kinetic strike occurs near a strategic maritime chokepoint (e.g., Bab el-Mandeb or the Taiwan Strait), the system instantly correlates:
1. **NASA VIIRS Satellite Thermal Infrared Passes** (Active kinetic hotspots)
2. **OpenSky Military Flight Reroutes** (ADS-B transponders)
3. **SEC Form 4 Corporate Insider Dispositions** (CEO/Whale acquisitions)
4. **Institutional Dark Pool Liquidity Crosses** (ADF/ATS block prints)

...synthesizing high-confidence tactical trade signals in real-time.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 0THER5IDE SENSOR ARRAYS                                │
├───────────────────┬────────────────────┬────────────────────┬──────────────────────────┤
│   GEOINT SATELLITE│     SIGINT OSINT   │     FININT FLOW    │    CORPORATE SURVEILLANCE│
│   • NASA FIRMS    │   • GDELT 2.0 API  │   • Nasdaq DOM L2  │    • SEC EDGAR Form 4    │
│   • OpenSky ADS-B │   • ACLED Conflict │   • Options Sweeps │    • CEO / Whale Tracker │
│   • Global SDR    │   • News Wire RSS  │   • Dark Pool ADF  │    • Congress Disclosures│
└─────────┬─────────┴──────────┬─────────┴──────────┬─────────┴─────────────┬────────────┘
          │                    │                    │                       │
          └────────────────────┼────────────────────┼───────────────────────┘
                               ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        AUTONOMOUS MULTI-AGENT SWARM ENGINE                             │
│  [RECON-ALPHA]      [WHALE-HUNTER]      [ORBITAL-SENTINEL]      [FUSION-COMMANDER]     │
│  SIGINT Crawler     FININT Parser       GEOINT Infrared Array   Neural Consensus Core  │
└──────────────────────────────────────┬─────────────────────────────────────────────────┘
                                       │ Real-Time Server-Sent Events (SSE) Stream
                                       ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         0THER5IDE MASTER COMMAND INTERFACE                             │
│  • Ultra-HD 3D Earth Projection (WebGL)     • Institutional Level 2 Order Book & DOM   │
│  • Classified Executive Dossier Overlay     • Multi-Stage Chart Analyzer (Entry/SL/TP) │
│  • Global Tension Index Radar (0-100)       • VIP Access Tier & Cryptographic Auth     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 💎 Primary Features

### 🌐 1. Ultra-HD 3D Earth Projection
* Volumetric atmosphere with Rayleigh scattering shaders and cosmos backdrop.
* Dynamic moving trajectory arcs between global command centers.
* Expanding radar beacons on active conflict hotspots.
* Chokepoints monitor: Strait of Hormuz, Suez Canal, Bab el-Mandeb, Taiwan Strait.
* Real-time nuclear sensor radiation watch (Chernobyl, Zaporizhzhia, Bushehr, Dimona).

### 🤖 2. Autonomous Multi-Agent AI Swarm
* **`RECON-ALPHA` (SIGINT)**: GDELT 2.0 and regional crisis dispatch crawler.
* **`WHALE-HUNTER` (FININT)**: SEC Form 4 Atom feed parser & dark pool radar.
* **`ORBITAL-SENTINEL` (GEOINT)**: NASA VIIRS 375m thermal pixel sensor.
* **`FUSION-COMMANDER` (Synthesis)**: Multi-domain threat consensus engine ($0-100\%$).
* **Perpetual Scraping Pipeline**: 28.4 kB/s background ingestion streaming via **Server-Sent Events (SSE)**.

### ⚡ 3. Institutional Order Flow & Liquidity Radar
* **Nasdaq TotalView Level 2 DOM Ladder**: 40-level depth-of-book order book.
* **Options Sweeps**: Detection of aggressive institutional sweep orders with Vol/OI $>3.0\times$.
* **Dark Pool ADF Cross Prints**: Off-exchange Alternative Trading System (ATS) block prints.
* **BMLL-Grade Flow Decomposition**: Taker sweeps, maker absorption, and block crosses.

### ⚲ 4. SEC Form 4 Classified Surveillance Dossiers
* Real-time EDGAR XML feed parser.
* Trending executive filters: Jensen Huang, Elon Musk, Mark Zuckerberg, Jeff Bezos, Nancy Pelosi, Tim Cook.
* Dossier HUD Overlay with CRT scanlines, reticle targeting, and **"DECRYPT & COPY THIS TRADE"** action card.

### 📈 5. AI Chart Analysis & Tactical Trade Generator
* Drag-and-drop or clipboard image paste ($\text{Cmd/Ctrl} + \text{V}$).
* Multi-stage volume footprint scan (Entry, Stop-Loss, Take-Profit targets).
* Interactive AI chat for tactical follow-up questions.

### 💳 6. Pricing & VIP Access Gating
* **Recon ($0 / Free)** vs **VIP Insider ($25 / week)** dual-tier matrix.
* Stripe Checkout & automated webhook subscription provisioning.
* HMAC-SHA256 signed `HttpOnly` JWT session verification.

---

## 🛠️ Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/gdelavid-cyber/0ther5ide.git
cd 0ther5ide
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory:
```bash
# Satellite & Market Data (Optional / Live)
FIRMS_MAP_KEY=your_nasa_firms_key
FINNHUB_API_KEY=your_finnhub_key
POLYGON_API_KEY=your_polygon_key

# AI Intelligence
OPENAI_API_KEY=your_openai_key

# Payments & Sessions
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
JWT_SECRET=your_random_secret_string
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Test Suite & Build
```bash
npm test
npm run build
```

---

## 🚀 Deployment to Vercel

1. Push this repository to GitHub:
```bash
git remote add origin https://github.com/gdelavid-cyber/0ther5ide.git
git branch -M main
git push -u origin main
```
2. Import the repository in [vercel.com](https://vercel.com).
3. Add your environment variables in **Settings ➜ Environment Variables**.
4. Click **Deploy**.

---

## 📄 License
MIT License. Created for advanced macroeconomic, geopolitical, and financial market intelligence research.
