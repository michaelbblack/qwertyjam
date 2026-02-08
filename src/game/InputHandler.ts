export interface KeyEvent {
  key: string;
  time: number;   // performance.now() / 1000 based timestamp
  type: 'down' | 'up';
}

export type InputCallback = (event: KeyEvent) => void;

export class InputHandler {
  private callback: InputCallback | null = null;
  private pressedKeys: Set<string> = new Set();
  private handleKeyDown: (e: KeyboardEvent) => void;
  private handleKeyUp: (e: KeyboardEvent) => void;
  private active = false;

  constructor() {
    this.handleKeyDown = (e: KeyboardEvent) => {
      if (!this.active) return;
      // Ignore repeat events (key held down)
      if (e.repeat) return;
      // Ignore modifier-only keys
      if (['Shift', 'Control', 'Alt', 'Meta', 'Tab', 'CapsLock', 'Escape'].includes(e.key)) return;

      e.preventDefault();

      const key = this.normalizeKey(e.key);
      if (this.pressedKeys.has(key)) return;
      this.pressedKeys.add(key);

      this.callback?.({
        key,
        time: performance.now() / 1000,
        type: 'down',
      });
    };

    this.handleKeyUp = (e: KeyboardEvent) => {
      if (!this.active) return;
      const key = this.normalizeKey(e.key);
      this.pressedKeys.delete(key);

      this.callback?.({
        key,
        time: performance.now() / 1000,
        type: 'up',
      });
    };
  }

  private normalizeKey(key: string): string {
    // Normalize to lowercase for letter keys
    return key.length === 1 ? key.toLowerCase() : key;
  }

  start(callback: InputCallback): void {
    this.callback = callback;
    this.active = true;
    this.pressedKeys.clear();
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  stop(): void {
    this.active = false;
    this.callback = null;
    this.pressedKeys.clear();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  isPressed(key: string): boolean {
    return this.pressedKeys.has(key.toLowerCase());
  }

  getPressedKeys(): Set<string> {
    return new Set(this.pressedKeys);
  }
}
