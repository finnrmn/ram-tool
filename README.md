# RAM Tool

A lightweight tool for exploring reliability, availability, and parameter conversions for simple repairable systems (series, parallel, k-of-n with identical components).

## Prerequisites

- Node.js 18+
>  see @Installation tips for download these

## Start the app
In a new terminal:

```bash
cd ram-tool
npm install
npm run dev
```

The Vite dev server starts on http://localhost:5173.

## Using the app
1. Build a scenario by adding components, selecting the system structure.
2. Use the converter to switch between MTBF, λ, and availability.
3. Show the behavior of your secenario with plots:
    3.1 Reliablity 
    3.2 Availability 
    3.3 Comparison of System Components
4. Or use the "System-Builder" to build your own System in a simple UI


## Installation tips

### Windows

Recommended (PowerShell, Administrator):
```bash
winget install OpenJS.NodeJS.LTS
```
Or download the LTS installer from nodejs.org.


After installation, open a new PowerShell and verify:
```bash
node --version
npm --version
```
### macOS

Homebrew (recommended):
```bash
brew install node
```
Verify:
```bash
node --version
npm --version
```

## BUILDING (not relevant for Users)

### Win.exe
```bash
npm run build:renderer
npm run build:electron
npx electron-builder --win portable -c electron/electron-builder.yml
```
>Sign-Error-Handling

(Powershell as Admin)
```bash
setx CSC_IDENTITY_AUTO_DISCOVERY false
setx WIN_CSC_LINK ""
setx CSC_LINK ""
setx CSC_KEY_PASSWORD ""
```

### Mac.zip
```bash
gh workflow run "build-mac" --ref main -R finnrmn/ram-tool
gh run watch -R finnrmn/ram-tool
gh run download -R finnrmn/ram-tool --name ram-tool-mac --dir artifacts
```



