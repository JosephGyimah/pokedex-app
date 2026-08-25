# Pokedex App

A simple Expo-based Pokédex app that fetches live Pokémon data from the public PokéAPI and includes a Home screen, Details screen, bottom tabs, and a drawer menu.

## Requirements

- Node.js 18+
- npm
- Expo CLI

## Local setup

1. Open a terminal in the project folder.
2. Install dependencies:

```bash
npm install
```

3. Start the app:

```bash
npm start
```

4. Use the Expo developer tools in your browser or run on a device:

- Press `i` to open the iOS simulator
- Press `a` to open the Android emulator
- Scan the QR code with the Expo Go app on your phone
- Or open the web version with:

```bash
npx expo start --web
```

## Useful scripts

```bash
npm start
npm run android
npm run ios
npx expo start --web
```

## App features

- Live Pokémon list from the PokéAPI
- Loading and error states
- Favorite toggle on cards and details screen
- Bottom tab navigation for Home and About
- Drawer navigation with Settings, Help and Support, and Logout
- Pokémon details fetched from the selected Pokémon endpoint

## Notes

This app uses the public PokéAPI:

- https://pokeapi.co/api/v2/pokemon
- https://pokeapi.co/api/v2/pokemon/{name or id}
