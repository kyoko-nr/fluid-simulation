import * as THREE from "three";
import GUI from "lil-gui";

import { PointerManager } from "./PointerManager";
import addForceFrag from "./glsl/addForce.glsl";
import advectVelFrag from "./glsl/advectVelocity.glsl";
import divergenceFrag from "./glsl/divergence.glsl";
import pressureJacobiFrag from "./glsl/pressureJacobi.glsl";
import subtractGradientFrag from "./glsl/subtractGradient.glsl";
import render2Frag from "./glsl/render2.glsl";
import vert from "./glsl/vert.glsl";

// シミュレーション用のパラメーター
const simulationConfig = {
  // データテクスチャー（格子）の画面サイズ比。大きいほど詳細になるが、負荷が高くなる
  pixelRatio: 0.5,
  // 1回のシミュレーションステップで行うヤコビ法の圧力計算の回数。大きいほど安定して正確性が増すが、負荷が高くなる
  solverIteration: 5,
  // マウスを外力として使用する際に影響を与える半径サイズ
  forceRadius: 20,
  // マウスを外力として使用する際のちからの係数
  forceCoefficient: 500,
  /**
   * 移流時の減衰
   * 1.0に近づけることで高粘度な流体のような見た目にできる
   * 1以上にはしない
   * あくまで粘度っぽさであり、粘性項とは無関係
   */
  dissipation: 0.96,
};

// 時間差分計算用の一時変数
let previousTime = 0.0;
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

// 初期化
await init();
// 実行開始
frame(performance.now());

/**
 * 初期化
 */
async function init() {
  // WebGPURendererの初期化
  // 本デモはTSL及びNodeMaterialを使用しているため、WebGLRendererではなくWebGPURendererを使用する
  // WebGPURendererはWebGPUが非対応の環境ではフォールバックとしてWebGLで表示される
  // WebGPURendererで強制的にWebGL表示をしたい場合は、オプションのforceWebGLをtrueにする
  renderer = new THREE.WebGLRenderer({ antialias: false });
  // await renderer.init();
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
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
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
      uDeltaT: new THREE.Uniform(0),
      uDissipation: new THREE.Uniform(simulationConfig.dissipation),
    },
  });
  divergenceShader = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: divergenceFrag,
    uniforms: {
      uData: new THREE.Uniform(null),
      uTexelSize: new THREE.Uniform(texelSize),
    },
  });
  pressureShader = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: pressureJacobiFrag,
    uniforms: {
      uData: new THREE.Uniform(null),
      uTexelSize: new THREE.Uniform(texelSize),
    },
  });
  subtractGradientShader = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: subtractGradientFrag,
    uniforms: {
      uData: new THREE.Uniform(null),
      uTexelSize: new THREE.Uniform(texelSize),
    },
  });

  // 描画に使用するシェーダーを作成
  renderShader = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: render2Frag,
    uniforms: {
      uTexture: new THREE.Uniform(null),
      uTextureSize: new THREE.Uniform(new THREE.Vector2()),
      uTimeStep: new THREE.Uniform(0),
    },
  });

  // 確認のためレンダリング用のシェーダーをデバッグ表示
  // await debugShader(renderShader);

  // イベントの登録・初期化時点でのサイズ設定処理
  window.addEventListener("resize", onWindowResize);
  pointerManager.init(renderer.domElement);
  setupGui();
  onWindowResize();
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
function frame(time: number) {
  const deltaT = (time - previousTime) / 1000;

  // 1. 外力の適用：速度場に外力を加算します。
  // 外力の注入
  const shader = addForceShader;
  const uniforms = shader.uniforms;

  // マウスの移動距離から速度の変化を計算
  const deltaV = pointerManager.pointer
    .clone()
    .sub(pointerManager.prevPointer)
    .multiply(texelSize)
    .multiplyScalar(simulationConfig.forceCoefficient);
  uniforms.uData.value = dataTexture.texture;
  uniforms.uForceCenter.value.copy(pointerManager.pointer.clone().multiply(texelSize));
  uniforms.uForceDeltaV.value.copy(deltaV);
  uniforms.uForceRadius.value = simulationConfig.forceRadius;

  render(shader, dataRenderTarget);
  swapTexture();

  // タイムスケールに合わせてシミュレーションステップを実行
  const stepCount = Math.min(Math.max(Math.floor(deltaT * 240), 1), 8);
  const simulationDeltaT = deltaT / stepCount;
  for (let i = 0; i < stepCount; i++) {
    // 2. 移流の計算：セミラグランジュ法を使って速度場を補間し、移流を適用します。
    {
      // 速度の移流
      const shader = advectVelShader;
      const uniforms = shader.uniforms;

      uniforms.uData.value = dataTexture.texture;
      uniforms.uDeltaT.value = simulationDeltaT;
      uniforms.uDissipation.value = simulationConfig.dissipation;
      render(shader, dataRenderTarget);
      swapTexture();
    }

    // 3. 移流の計算：現在速度と経過時間から前ステップの速度を参照することで移流を適用します。
    {
      // 発散の計算
      const shader = divergenceShader;
      const uniforms = shader.uniforms;

      uniforms.uData.value = dataTexture.texture;
      render(shader, dataRenderTarget);
      swapTexture();
    }

    // 4. 圧力の計算：速度と発散から非圧縮条件を満たすように圧力を計算します。
    for (let i = 0; i < simulationConfig.solverIteration; i++) {
      // 圧力の計算
      const shader = pressureShader;
      const uniforms = shader.uniforms;

      uniforms.uData.value = dataTexture.texture;
      render(shader, dataRenderTarget);
      swapTexture();
    }

    // 5. 速度場の更新：計算された圧力を使って速度場を更新します。
    {
      // 圧力勾配の減算
      const shader = subtractGradientShader;
      const uniforms = shader.uniforms;

      uniforms.uData.value = dataTexture.texture;
      render(shader, dataRenderTarget);
      swapTexture();
    }
  }

  // 6. 描画：更新された速度場を使って流体の見た目をレンダリングします。
  {
    // 描画
    const shader = renderShader;
    const uniforms = shader.uniforms;

    uniforms.uTexture.value = dataTexture.texture;
    uniforms.uTimeStep.value = time * 0.0001;
    render(shader, null);
  }

  // 次のフレームに備えて後処理
  pointerManager.updatePreviousPointer();
  previousTime = time;
  requestAnimationFrame(frame);
}

/**
 * lil-gui を使ったパラメーターコントロールのセットアップ
 */
function setupGui() {
  const gui = new GUI();
  const folder = gui.addFolder("Simulation");

  folder.add(simulationConfig, "forceRadius", 1, 200, 1).name("外力半径 (px)");
  folder.add(simulationConfig, "forceCoefficient", 0, 1000, 10).name("外力係数");
  folder.add(simulationConfig, "dissipation", 0.8, 1, 0.01).name("減衰");

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

/**
//  * デバッグ表示
//  * TSLを実行する3D APIのシェーダー言語に翻訳したものをコンソール出力して確認する
//  */
// async function debugShader(material: NodeMaterial) {
//   quad.material = material;
//   const rawShader = await renderer.debug.getShaderAsync(scene, camera, quad);
//   console.log(rawShader.vertexShader);
//   console.log(rawShader.fragmentShader);
// }
