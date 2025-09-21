# RAM Tool

A lightweight tool for exploring reliability, availability, and parameter conversions for simple repairable systems (series, parallel, k-of-n with identical components).

## Prerequisites

- Node.js 18+
- Python 3.11
>  see @Installation tips for download these
## Using the app

1. Start the backend (see below).
2. Start the frontend dev server (see below).
3. Visit http://localhost:5173 in your browser.
4. Build a scenario by adding components, selecting the system structure, and adjusting plot settings.
5. Use the converter to switch between MTBF, λ, and availability. Use the plot “Berechnen” button to request the backend solution.

## Backend setup

### Windows (PowerShell)

```powershell
cd backend
py -3.11 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
>  **Hint (Execution Policy / venv activation fails)**  
> If you see this error when activating the virtual environment:  
> `Die Datei "...\.venv\Scripts\Activate.ps1" kann nicht geladen werden, da die Ausführung von Skripts auf diesem System deaktiviert ist.`  
> there are three clean options:
>
> **A) Allow for this session only (recommended):**
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> . .\.venv\Scripts\Activate.ps1
> ```
> **B) Loosen permanently for your user:**
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> . .\.venv\Scripts\Activate.ps1
> ```
> **C) Use classic Command Prompt (CMD) without changing policy:**
> ```bat
> .venv\Scripts\activate.bat
> ```
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

## Installation tips

### Windows
#### Python 3.11
Recommended (PowerShell, Administrator):
```bash
winget install Python.Python.3.11
```
Or download the installer from https://www.python.org/downloads/release/python-3110/ and check "Add Python to PATH"

#### Node.js
Recommended (PowerShell, Administrator):
```bash
winget install OpenJS.NodeJS.LTS
```
Or download the LTS installer from nodejs.org.


After installation, open a new PowerShell and verify:
```bash
python --version
node --version
npm --version
```
### macOS

Homebrew (recommended):
```bash
brew install python@3.11
brew install node
```
Verify:
```bash
python3.11 --version
node --version
npm --version
```

## Notes

- All computations use exponential components; k-of-n assumes identical components via averaged λ.
- Scenario JSON is always available in the right sidebar for manual saving.
- The backend returns clear 400 errors for invalid scenarios so the UI can surface them inline.
- Errors are shown contextually (z. B. direkt im Plot oder Converter) anstatt über ein globales Status-Badge.
