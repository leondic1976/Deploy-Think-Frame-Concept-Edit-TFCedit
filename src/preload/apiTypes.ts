import type { ThinkFrameAPI } from '../shared/contracts';

declare global {
  interface Window {
    thinkframe: ThinkFrameAPI;
  }
}

export {};
