import * as THREE from "three";

const THRESHOLD = 0.01;

/**
 * マウス・タッチイベントを管理して座標を保存するユーテリティー
 */
export class PointerManager extends EventTarget {
  private pixelRatio = 1.0;
  public pointer = new THREE.Vector2(-1, -1);
  public prevPointer = new THREE.Vector2(-1, -1);

  public init(target: HTMLElement) {
    target.addEventListener("mousemove", this.onPointerMove);
  }

  public resizeTarget(pixelRatio: number) {
    this.pixelRatio = pixelRatio;
  }

  public updatePreviousPointer() {
    this.prevPointer.copy(this.pointer);
  }

  public getDelta() {
    return this.pointer.clone().sub(this.prevPointer);
  }

  private onPointerMove = (event: MouseEvent) => {
    if (
      Math.abs(this.pointer.x - event.clientX) < THRESHOLD &&
      Math.abs(this.pointer.y - event.clientY) < THRESHOLD
    ) {
      return;
    }
    this.updatePointer(event.clientX, event.clientY);
  };

  private updatePointer = (cx: number, cy: number) => {
    const x = cx * window.devicePixelRatio * this.pixelRatio;
    const y = cy * window.devicePixelRatio * this.pixelRatio;
    this.pointer.set(x, y);
  };
}

// export interface PointerManager {
//   addEventListener(
//     type: "firstInteraction",
//     listener: (this: PointerManager, event: Event) => any,
//     options?: boolean | AddEventListenerOptions,
//   ): void;

//   removeEventListener(
//     type: "firstInteraction",
//     listener: (this: PointerManager, event: Event) => any,
//     options?: boolean | EventListenerOptions,
//   ): void;
// }
