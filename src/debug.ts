import * as THREE from "three";
import debugVisFrag from "./glsl/debugVis.glsl";
import vert from "./glsl/vert.glsl";
import { simulationConfig } from "./gui";

export class DebugVisualizer {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private quad: THREE.Mesh;
  private debugShader: THREE.ShaderMaterial;
  private debugRenderTarget: THREE.WebGLRenderTarget;
  private canvasContext: CanvasRenderingContext2D;
  private pixelBuffer: Uint8Array;

  private config = {
    enabled: true,
    channel: 6, // 0=r, 1=g, 2=b, 3=a, 4=rg, 5=gb, 6=rg magnitude, 7=rg heatmap
    scale: 1.0,
    offset: 0.0,
  };

  constructor(renderer: THREE.WebGLRenderer) {
    // 共有レンダラーを使用
    this.renderer = renderer;

    // デバッグ用のcanvas要素を作成（2Dコンテキスト）
    this.canvas = document.createElement("canvas");
    this.canvas.id = "debug-canvas";
    document.body.appendChild(this.canvas);

    const context = this.canvas.getContext("2d");
    if (!context) {
      throw new Error("2Dコンテキストの取得に失敗しました");
    }
    this.canvasContext = context;

    // シーンとカメラの作成
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // デバッグ描画用のシェーダーマテリアル
    this.debugShader = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: debugVisFrag,
      uniforms: {
        uTexture: new THREE.Uniform(null),
        uChannel: new THREE.Uniform(this.config.channel),
        uScale: new THREE.Uniform(this.config.scale),
        uOffset: new THREE.Uniform(this.config.offset),
      },
    });

    // 全画面を覆う平面メッシュ
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.debugShader);
    this.scene.add(this.quad);

    // デバッグ用のRenderTargetを作成
    const width = Math.floor(window.innerWidth / 6);
    const height = Math.floor(window.innerHeight / 6);
    this.debugRenderTarget = new THREE.WebGLRenderTarget(width, height, {
      type: THREE.UnsignedByteType,
      depthBuffer: false,
      stencilBuffer: false,
    });
    this.pixelBuffer = new Uint8Array(width * height * 4);

    // リサイズ処理
    this.updateSize();
    window.addEventListener("resize", () => this.updateSize());
  }

  /**
   * デバッグcanvasのサイズを更新
   */
  private updateSize() {
    const width = Math.floor(window.innerWidth / 6);
    const height = Math.floor(window.innerHeight / 6);
    this.canvas.width = width;
    this.canvas.height = height;
    this.debugRenderTarget.setSize(width, height);
    this.pixelBuffer = new Uint8Array(width * height * 4);
  }

  /**
   * テクスチャを描画
   */
  public render(texture: THREE.Texture) {
    if (!simulationConfig.showDebug) {
      this.canvas.classList.add("hidden");
      return;
    }

    this.canvas.classList.remove("hidden");

    // 共有レンダラーでRenderTargetに描画
    this.debugShader.uniforms.uTexture.value = texture;
    this.quad.material = this.debugShader;
    this.renderer.setRenderTarget(this.debugRenderTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);

    // RenderTargetからピクセルデータを読み取る
    this.renderer.readRenderTargetPixels(
      this.debugRenderTarget,
      0,
      0,
      this.canvas.width,
      this.canvas.height,
      this.pixelBuffer,
    );

    // ImageDataを作成して2Dキャンバスに描画
    const imageData = new ImageData(
      new Uint8ClampedArray(this.pixelBuffer),
      this.canvas.width,
      this.canvas.height,
    );

    // WebGLはY軸が上向きなので、上下反転して描画
    this.canvasContext.save();
    this.canvasContext.scale(1, -1);
    this.canvasContext.translate(0, -this.canvas.height);
    this.canvasContext.putImageData(imageData, 0, 0);
    this.canvasContext.restore();
  }

  /**
   * リソースの解放
   */
  public dispose() {
    this.debugRenderTarget.dispose();
    this.canvas.remove();
  }
}
