# Simple Phaser 3 Game

A minimal Phaser 3 project built with Vite and JavaScript. It starts with a blank game scene and a canvas that fills the browser window.

## Controls

- Use Start on the opening screen to begin
- Use High Score on the opening screen to view your best score
- Press Space to jump
- Click or tap the game to jump
- Use the Restart button on the Game Over screen to play again

## Goal

Collect beer mugs to increase your score. Avoid liquor bottles because each hit reduces your health.

The game gradually gets faster and busier the longer you survive.

The game uses image assets for the runner, collectibles, obstacles, randomized storefront background segments, ground, and heart health icons from `public/assets`.

## Requirements

- Node.js 18 or newer
- pnpm 11 or newer

## Run Locally

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm run dev
```

Open the local URL printed in your terminal, usually:

```text
http://localhost:5173/
```

## Build

Create a production build:

```bash
pnpm run build
```

Preview the production build:

```bash
pnpm run preview
```

## Project Structure

```text
.
├── index.html
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── public
│   └── assets
├── src
│   ├── main.js
│   └── style.css
└── README.md
```
