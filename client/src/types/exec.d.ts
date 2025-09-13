// Type declarations for the Emscripten generated exec.js factory
// This silences TS complaints when we interact with the global factory dynamically.

declare function createExec(overrides?: any): Promise<any>;

// Augment globalThis for factory detection
interface Global {
  createExec?: (overrides?: any) => Promise<any>;
  Module?: any;
}

declare global {
  var createExec: typeof createExec | undefined;
  var Module: any;
}

export { };
