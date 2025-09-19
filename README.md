# RAM Tool

A lightweight tool for exploring reliability, availability, and parameter conversions for simple repairable systems (series, parallel, k-of-n with identical components).

## Prerequisites

- Node.js 18+
- Python 3.11

## Backend setup

### Windows (PowerShell)

```powershell
cd backend
py -3.11 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### macOS / Linux (bash)

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API listens on http://localhost:8000 with CORS open for the Vite dev server.

## Frontend setup

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server starts on http://localhost:5173.

## Using the app

1. Start the backend (see above).
2. Start the frontend dev server.
3. Visit http://localhost:5173 in your browser.
4. Build a scenario by adding components, selecting the system structure, and adjusting plot settings.
5. Use the converter to switch between MTBF, λ, and availability. Use the plot “Berechnen” button to request the backend solution.

## Smoke test checklist

- Converter → returns JSON with computed MTBF/λ/A.
- Add two components with exponential parameters → Solve → R(t) line appears.
- Change system type and re-solve.
- k-of-n with k and n set → warning banner text visible from backend response.

## How to extend next

1. Add Weibull distribution support to backend models and frontend forms.
2. Introduce a React Flow canvas tab to visualise reliability block diagrams.
3. Add a Monte-Carlo simulation route and UI controls for stochastic studies.

## Notes

- All computations use exponential components; k-of-n assumes identical components via averaged λ.
- Scenario JSON is always available in the right sidebar for manual saving.
- The backend returns clear 400 errors for invalid scenarios so the UI can surface them inline.
