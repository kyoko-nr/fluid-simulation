import * as THREE from "three";
import GUI from "lil-gui";

import { PointerManager } from "./PointerManager";
import { DebugVisualizer } from "./debug";
import addForceFrag from "./glsl/addForce.glsl";
import advectVelFrag from "./glsl/advectVelocity.glsl";
import divergenceFrag from "./glsl/divergence.glsl";
import pressureJacobiFrag from "./glsl/pressureJacobi.glsl";
import subtractGradientFrag from "./glsl/subtractGradient.glsl";
import renderFrag from "./glsl/render.glsl";
import vert from "./glsl/vert.glsl";

// シミュレーション用のパラメーター
const simulationConfig = {
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
  colorStrength: 0.7,
};

// マウス・タッチイベントを管理するオブジェクト
const pointerManager = new PointerManager();

// Three.jsのレンダリングに必要な一式
let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.OrthographicCamera;
let quad: THREE.Mesh;

// シミュレーションのサイズ定義。画面リサイズに応じて変更する。よく使用するので変数化しておく
let dataWidth = Math.round(
  window.innerWidth * window.devicePixelRatio * simulationConfig.pixelRatio,
);
let dataHeight = Math.round(
  window.innerHeight * window.devicePixelRatio * simulationConfig.pixelRatio,
);
const texelSize = new THREE.Vector2();

// シミューレーション結果を格納するテクスチャー
let dataTexture: THREE.WebGLRenderTarget;
let dataRenderTarget: THREE.WebGLRenderTarget;

// シミュレーション及び描画に使用するTSLシェーダーを設定したマテリアル
let addForceShader: THREE.ShaderMaterial;
let advectVelShader: THREE.ShaderMaterial;
let divergenceShader: THREE.ShaderMaterial;
let pressureShader: THREE.ShaderMaterial;
let subtractGradientShader: THREE.ShaderMaterial;
let renderShader: THREE.ShaderMaterial;

let debugVisualizer: DebugVisualizer;

await init();

/**
 * 初期化
 */
async function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Three.js用のシーンとカメラを作成
  // カメラは透視投影の必要がないのでOrthographicCamera
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // 貼り付けるための平面メッシュを作成
  // 使用したいシェーダーに対応したマテリアルを差し替えてrenderer.render()を都度呼び出す
  quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  scene.add(quad);

  // シミュレーションデータを書き込むテクスチャーをPing-Pong用に2つ作成。
  const renderTargetOptions = {
    type: THREE.FloatType,
    depthBuffer: false,
    stencilBuffer: false,
  };
  dataTexture = new THREE.WebGLRenderTarget(dataWidth, dataHeight, renderTargetOptions);
  dataRenderTarget = new THREE.WebGLRenderTarget(dataWidth, dataHeight, renderTargetOptions);
  clearRenderTarget(dataTexture);
  clearRenderTarget(dataRenderTarget);

  // シミュレーションで使用するシェーダーを作成
  addForceShader = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: addForceFrag,
    uniforms: {
      uData: new THREE.Uniform(null),
      uTexelSize: new THREE.Uniform(texelSize),
      uForceCenter: new THREE.Uniform(new THREE.Vector2()),
      uForceDeltaV: new THREE.Uniform(new THREE.Vector2()),
      uForceRadius: new THREE.Uniform(simulationConfig.forceRadius),
    },
  });
  advectVelShader = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: advectVelFrag,
    uniforms: {
      uData: new THREE.Uniform(null),
      uTexelSize: new THREE.Uniform(texelSize),
      uDissipation: new THREE.Uniform(simulationConfig.dissipation),
      uDeltaT: new THREE.Uniform(simulationConfig.deltaT),
    },
  });
  divergenceShader = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: divergenceFrag,
    uniforms: {
      uData: new THREE.Uniform(null),
      uTexelSize: new THREE.Uniform(texelSize),
      uDeltaT: new THREE.Uniform(simulationConfig.deltaT),
    },
  });
  pressureShader = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: pressureJacobiFrag,
    uniforms: {
      uData: new THREE.Uniform(null),
      uTexelSize: new THREE.Uniform(texelSize),
      uDeltaT: new THREE.Uniform(simulationConfig.deltaT),
    },
  });
  subtractGradientShader = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: subtractGradientFrag,
    uniforms: {
      uData: new THREE.Uniform(null),
      uTexelSize: new THREE.Uniform(texelSize),
      uDeltaT: new THREE.Uniform(simulationConfig.deltaT),
    },
  });

  // 描画に使用するシェーダーを作成
  renderShader = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: renderFrag,
    uniforms: {
      uTexture: new THREE.Uniform(null),
      uTextureSize: new THREE.Uniform(new THREE.Vector2()),
      uTimeStep: new THREE.Uniform(0),
      uColorStrength: new THREE.Uniform(simulationConfig.colorStrength),
    },
  });

  // GUI のセットアップ
  const gui = new GUI();
  setupGui(gui);

  // デバッグビジュアライザーの初期化（レンダラーを共有）
  debugVisualizer = new DebugVisualizer(renderer);

  // イベントの登録・初期化時点でのサイズ設定処理
  window.addEventListener("resize", onWindowResize);
  pointerManager.init(renderer.domElement);
  onWindowResize();

  // アニメーション開始
  renderer.setAnimationLoop(tick);
}

/**
 * 画面リサイズ時の挙動
 * シミュレーション用のデータテクスチャーを画面サイズに応じてリサイズする
 */
function onWindowResize() {
  // リサイズ時のお約束処理
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  // シミュレーション用のデータテクスチャーを画面サイズに応じてリサイズする
  const newWidth = window.innerWidth * window.devicePixelRatio;
  const newHeight = window.innerHeight * window.devicePixelRatio;
  dataWidth = Math.round(newWidth * simulationConfig.pixelRatio);
  dataHeight = Math.round(newHeight * simulationConfig.pixelRatio);
  dataTexture.setSize(dataWidth, dataHeight);
  dataRenderTarget.setSize(dataWidth, dataHeight);

  pointerManager.resizeTarget(simulationConfig.pixelRatio);

  // シェーダーで使用するデータテクスチャーの1ピクセルごとのサイズをシェーダー定数に設定し直す
  texelSize.set(1 / dataWidth, 1 / dataHeight);
  addForceShader.uniforms.uTexelSize.value.copy(texelSize);
  advectVelShader.uniforms.uTexelSize.value.copy(texelSize);
  divergenceShader.uniforms.uTexelSize.value.copy(texelSize);
  pressureShader.uniforms.uTexelSize.value.copy(texelSize);
  subtractGradientShader.uniforms.uTexelSize.value.copy(texelSize);
  renderShader.uniforms.uTextureSize.value.set(1 / newWidth, 1 / newHeight);
}

/**
 * 毎フレーム実行する関数
 * シミュレーションの実行と画面へのレンダリングを行う
 */
function tick(time: number) {
  // 1. 外力の適用：速度場に外力を加算します（フレームごと1回注入）
  // マウスの移動距離から速度の変化を計算
  const deltaV = pointerManager
    .getDelta()
    .multiply(texelSize)
    .multiplyScalar(simulationConfig.forceCoefficient);
  addForceShader.uniforms.uData.value = dataTexture.texture;
  addForceShader.uniforms.uForceCenter.value.copy(
    pointerManager.pointer.clone().multiply(texelSize),
  );
  addForceShader.uniforms.uForceDeltaV.value.copy(deltaV);
  addForceShader.uniforms.uForceRadius.value = simulationConfig.forceRadius;

  render(addForceShader, dataRenderTarget);
  swapTexture();

  // 2. 移流の計算：セミラグランジュ法による速度の移流
  advectVelShader.uniforms.uData.value = dataTexture.texture;
  advectVelShader.uniforms.uDeltaT.value = simulationConfig.deltaT;
  advectVelShader.uniforms.uDissipation.value = simulationConfig.dissipation;
  render(advectVelShader, dataRenderTarget);
  swapTexture();

  // 3. 発散の計算
  divergenceShader.uniforms.uData.value = dataTexture.texture;
  divergenceShader.uniforms.uDeltaT.value = simulationConfig.deltaT;
  render(divergenceShader, dataRenderTarget);
  swapTexture();

  // 4. 圧力の計算（ヤコビ反復を複数回）
  for (let i = 0; i < simulationConfig.solverIteration; i++) {
    pressureShader.uniforms.uData.value = dataTexture.texture;
    render(pressureShader, dataRenderTarget);
    swapTexture();
  }

  // 5. 圧力勾配の減算
  subtractGradientShader.uniforms.uData.value = dataTexture.texture;
  subtractGradientShader.uniforms.uDeltaT.value = simulationConfig.deltaT;
  render(subtractGradientShader, dataRenderTarget);
  swapTexture();

  // 6. 描画：更新された速度場を使って流体の見た目をレンダリングします。
  renderShader.uniforms.uTexture.value = dataTexture.texture;
  renderShader.uniforms.uTimeStep.value = time * 0.0001;
  render(renderShader, null);

  // デバッグビジュアライザーで速度場を表示
  debugVisualizer.render(dataTexture.texture);

  // 次のフレームに備えて後処理
  pointerManager.updatePreviousPointer();
}

/**
 * lil-gui を使ったパラメーターコントロールのセットアップ
 */
function setupGui(gui: GUI) {
  const folder = gui.addFolder("Simulation");

  folder.add(simulationConfig, "colorStrength", 0.1, 1.0, 0.1).name("色の強さ");
  folder.add(simulationConfig, "forceRadius", 1, 200, 1).name("外力半径 (px)");
  folder.add(simulationConfig, "forceCoefficient", 0, 1000, 10).name("外力係数");
  folder.add(simulationConfig, "dissipation", 0.8, 1, 0.001).name("減衰");
  folder.add(simulationConfig, "deltaT", 0.001, 0.08, 0.001).name("時間ステップ");

  folder.open();
}

/**
 * レンダーターゲットに書かれた内容をリセットする
 */
function clearRenderTarget(renderTarget: THREE.WebGLRenderTarget) {
  renderer.setRenderTarget(renderTarget);
  renderer.clearColor();
  renderer.setRenderTarget(null);
}

/**
 * 指定したNodeMaterialで指定したターゲット（テクスチャーかフレームバッファー）にレンダリングする
 */
function render(material: THREE.Material, target: THREE.WebGLRenderTarget | null) {
  quad.material = material;
  renderer.setRenderTarget(target);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
}

/**
 * 参照用テクスチャーとレンダーターゲット用テクスチャーを入れ替える
 * Ping-Pong用
 */
function swapTexture() {
  [dataTexture, dataRenderTarget] = [dataRenderTarget, dataTexture];
}
