
interface Window {
  // Fix: All declarations of 'aistudio' must have identical modifiers.
  // Making aistudio optional to match potential environmental declarations and resolve interface merging conflicts.
  aistudio?: {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  };
  webkitAudioContext: typeof AudioContext;
}

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}
