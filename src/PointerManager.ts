import * as THREE from "three";

/**
 * マウス・タッチイベントを管理して座標を保存するユーテリティー
 */
export class PointerManager extends EventTarget {
  private pixelRatio = 1.0;
  private flipHeight = 0;
  public pointer = new THREE.Vector2(-1, -1);
  public prevPointer = new THREE.Vector2(-1, -1);

  public init(target: HTMLElement) {
    target.addEventListener("mousemove", this.onPointerMove);
  }

  public resizeTarget(pixelRatio: number, flipHeight: number) {
    this.pixelRatio = pixelRatio;
    this.flipHeight = flipHeight;
  }

  public updatePreviousPointer() {
    this.prevPointer.copy(this.pointer);
  }

  private onPointerMove = (event: MouseEvent) => {
    this.updatePointer(event.clientX, event.clientY);
  };

  private updatePointer = (cx: number, cy: number) => {
    const x = cx * window.devicePixelRatio * this.pixelRatio;
    const yBase = cy * window.devicePixelRatio * this.pixelRatio;
    // 常にY座標を反転してシェーダーの座標系と合わせる
    const y = this.flipHeight > 0 ? this.flipHeight - yBase : yBase;
    this.pointer.set(x, y);
  };
}

export interface PointerManager {
  addEventListener(
    type: "firstInteraction",
    listener: (this: PointerManager, event: Event) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;

  removeEventListener(
    type: "firstInteraction",
    listener: (this: PointerManager, event: Event) => any,
    options?: boolean | EventListenerOptions,
  ): void;
}
