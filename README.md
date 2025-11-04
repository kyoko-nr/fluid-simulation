# 流体シミュレーション

![fluid simulation](./docs/fluid-simulation.gif)

## 概要 (Japanese)

Three.js と WebGL を用いたリアルタイム 2D 流体シミュレーションです。
- 技術スタック: TypeScript, Vite, Three.js, lil-gui, GLSL

主なファイル:

- `src/main.ts`: シミュレーションの初期化・更新・描画
- `src/gui.ts`: lil-gui でのパラメータ調整
- `src/PointerManager.ts`: マウス入力の管理
- `src/glsl/*.glsl`: 各種計算・描画用シェーダー
- `src/debug.ts`: 速度場のデバッグ可視化

---

## Overview (English)

This project implements a real-time 2D fluid simulation with Three.js and WebGL. 

- Stack: TypeScript, Vite, Three.js, lil-gui, GLSL

Key files:

- `src/main.ts`: Simulation setup, update, and rendering
- `src/gui.ts`: Parameter controls via lil-gui
- `src/PointerManager.ts`: Mouse input management
- `src/glsl/*.glsl`: Compute and render shaders
- `src/debug.ts`: Debug visualizer for the velocity field
