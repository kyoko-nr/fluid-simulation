import GUI from "lil-gui";
import * as THREE from "three";

// シミュレーション用のパラメーター
export const simulationConfig = {
  // データテクスチャー（格子）の画面サイズ比。大きいほど詳細になるが、負荷が高くなる
  pixelRatio: 0.125,
  // 1回のシミュレーションステップで行うヤコビ法の圧力計算の回数。大きいほど安定して正確性が増すが、負荷が高くなる
  solverIteration: 10,
  // マウスを外力として使用する際に影響を与える半径サイズ
  forceRadius: 18,
  // マウスを外力として使用する際のちからの係数
  forceCoefficient: 100,
  /**
   * 移流時の減衰
   * 1.0に近づけることで高粘度な流体のような見た目にできる
   * 1以上にはしない
   * あくまで粘度っぽさであり、粘性項とは無関係
   */
  dissipation: 0.98,
  // シミュレーションの時間ステップ
  deltaT: 0.01,
  // 描画色の強さ
  colorStrength: 0.7,
  // デバッグ表示の有無
  showDebug: true,
  // 背景色
  bgColor: new THREE.Color(0.2, 0.2, 0.2),
  // 流体の色
  fluidColor: new THREE.Color(1, 1, 1),
};

const gui = new GUI();

/**
 * lil-gui を使ったパラメーターコントロールのセットアップ
 */
export const setupGui = () => {
  const folder = gui.addFolder("Simulation");

  folder.addColor(simulationConfig, "bgColor").name("背景色");
  folder.addColor(simulationConfig, "fluidColor").name("流体の色");
  folder.add(simulationConfig, "forceRadius", 1, 200, 1).name("外力半径 (px)");
  folder.add(simulationConfig, "forceCoefficient", 0, 1000, 10).name("外力係数");
  folder.add(simulationConfig, "dissipation", 0.8, 1, 0.001).name("減衰");
  folder.add(simulationConfig, "deltaT", 0.001, 0.08, 0.001).name("時間ステップ");
  folder.add(simulationConfig, "showDebug").name("デバッグ表示");

  folder.open();
};
