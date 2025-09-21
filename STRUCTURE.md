# Projektstruktur

## backend/app

```text
backend/app
├── core
│   └── config.py
├── main.py
└── routes.py

2 directories, 3 files
```

## frontend/src

```text
frontend/src
├── App.tsx
├── api
│   └── client.ts
├── components
│   ├── Diagram
│   │   ├── Canvas.tsx
│   │   ├── nodes
│   │   │   ├── AndNode.tsx
│   │   │   ├── ComponentNode.tsx
│   │   │   ├── KofNNode.tsx
│   │   │   └── OrNode.tsx
│   │   ├── serialize.ts
│   │   ├── types.ts
│   │   ├── useDiagramStore.ts
│   │   └── validation.ts
│   ├── Errors
│   │   └── ErrorBoundary.tsx
│   ├── Formula
│   │   └── FormulaCard.tsx
│   ├── Header.tsx
│   ├── Plots
│   │   ├── APlot.tsx
│   │   ├── ComparePlot.tsx
│   │   └── RPlot.tsx
│   ├── ResultsPanel
│   │   ├── KpiCards.tsx
│   │   └── SummaryCard.tsx
│   ├── SidebarTools
│   │   ├── ConverterCard.tsx
│   │   └── TemplatesCard.tsx
│   └── SystemTable
│       ├── ComponentRow.tsx
│       └── SystemTable.tsx
├── formulas
│   └── engine.ts
├── index.css
├── main.tsx
├── pages
│   └── Home.tsx
├── store
│   ├── useFormulaStore.ts
│   └── useScenarioStore.ts
├── theme
│   └── useTheme.ts
├── types
│   ├── index.ts
│   └── react-plotly-js.d.ts
└── utils
    ├── useDebouncedEffect.ts
    └── validateScenario.ts

17 directories, 34 files
```

## Wichtige Dateien
- backend/requirements.txt
- frontend/package.json
- frontend/tsconfig.json
- frontend/vite.config.ts
