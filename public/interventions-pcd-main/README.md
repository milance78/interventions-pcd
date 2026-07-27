# Interventions PCD

Kompletan React + TypeScript + Vite projekat rekonstruisan iz sačuvanog webpack bundle-a.

## Pokretanje

```powershell
npm install
npm start
```

Aplikacija se otvara na `http://localhost:3000`.

## Produkcioni build

```powershell
npm run build
npm run preview
```

## Firebase

Firebase konfiguracija je u `src/firebase/firebaseConfig.ts`.
Za bezbedniji rad možeš koristiti `.env` fajl napravljen prema `.env.example`.

## Struktura

- `public/` statički fajlovi
- `src/components/` komponente
- `src/pages/` stranice
- `src/redux/` Redux store, slice-ovi i thunk-ovi
- `src/firebase/` autentifikacija i Firestore servisi
- `src/assets/` SVG ikonice

## Važno

Projekat je funkcionalno rekonstruisan iz kompajliranog bundle-a. Zbog nedostatka originalnog source map-a, deo fajlova zadržava automatski rekonstruisana imena importova i `@ts-nocheck`. Kod je odvojen po modulima i može da se menja, ali ga je preporučljivo postepeno čistiti i prepisivati u idiomatski TypeScript/JSX.
