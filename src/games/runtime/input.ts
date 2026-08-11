import type { GameAction, GameInput } from "./types";

const KEY_ACTIONS: Readonly<Record<string, GameAction>> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  Space: "primary",
  Enter: "primary",
  KeyZ: "primary",
  KeyX: "secondary",
  Backspace: "secondary",
};

export class InputManager implements GameInput {
  readonly #down = new Set<GameAction>();
  readonly #pressed = new Set<GameAction>();

  constructor(root: HTMLElement, signal: AbortSignal, onInteraction: () => void) {
    root.addEventListener(
      "keydown",
      (event) => {
        const action = KEY_ACTIONS[event.code];
        if (!action) return;
        event.preventDefault();
        onInteraction();
        if (!event.repeat) this.press(action);
      },
      { signal },
    );

    root.addEventListener(
      "keyup",
      (event) => {
        const action = KEY_ACTIONS[event.code];
        if (!action) return;
        event.preventDefault();
        this.release(action);
      },
      { signal },
    );

    root.querySelectorAll<HTMLButtonElement>("[data-game-action]").forEach((button) => {
      const action = button.dataset.gameAction as GameAction | undefined;
      if (!action) return;

      button.addEventListener(
        "pointerdown",
        (event) => {
          event.preventDefault();
          button.setPointerCapture(event.pointerId);
          onInteraction();
          this.press(action);
        },
        { signal },
      );
      const release = () => this.release(action);
      button.addEventListener("pointerup", release, { signal });
      button.addEventListener("pointercancel", release, { signal });
      button.addEventListener("lostpointercapture", release, { signal });
    });

    window.addEventListener("blur", () => this.reset(), { signal });
  }

  press(action: GameAction) {
    if (!this.#down.has(action)) this.#pressed.add(action);
    this.#down.add(action);
  }

  release(action: GameAction) {
    this.#down.delete(action);
  }

  isDown(action: GameAction) {
    return this.#down.has(action);
  }

  consumePressed(action: GameAction) {
    if (!this.#pressed.has(action)) return false;
    this.#pressed.delete(action);
    return true;
  }

  finishUpdate() {
    this.#pressed.clear();
  }

  reset() {
    this.#down.clear();
    this.#pressed.clear();
  }
}
