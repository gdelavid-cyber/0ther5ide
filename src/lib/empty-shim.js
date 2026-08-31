// Exact universal WebGL/TSL mock shim for three-globe & globe.gl

// WebGPU Classes
export class StorageInstancedBufferAttribute {
  constructor(array, itemSize) {
    this.array = array;
    this.itemSize = itemSize;
    this.isStorageInstancedBufferAttribute = true;
  }
}

export class WebGPURenderer {
  constructor() {
    this.isWebGPURenderer = false;
  }
}

// TSL Shader Functions
export const Fn = (fn) => fn;
export const If = (...args) => ({ else: () => ({}) });
export const Loop = (...args) => ({});
export const asin = (x) => x;
export const cos = (x) => x;
export const exp = (x) => x;
export const instanceIndex = { type: "int", value: 0 };
export const negate = (x) => -x;
export const sin = (x) => x;
export const sqrt = (x) => x;
export const storage = (v) => ({ value: v });
export const uniform = (v) => ({ value: v });

// General Shader Built-ins
export const abs = (x) => x;
export const tan = (x) => x;
export const acos = (x) => x;
export const atan = (x) => x;
export const atan2 = (y, x) => y;
export const pow = (x, y) => x;
export const log = (x) => x;
export const floor = (x) => x;
export const ceil = (x) => x;
export const fract = (x) => x;
export const min = (...args) => args[0];
export const max = (...args) => args[0];
export const clamp = (x) => x;
export const mix = (x, y, a) => x;
export const step = (edge, x) => x;
export const smoothstep = (e0, e1, x) => x;
export const length = (x) => x;
export const distance = (p0, p1) => 0;
export const dot = (x, y) => 0;
export const cross = (x, y) => x;
export const normalize = (x) => x;

export const attribute = (name) => ({ name });
export const varying = (v) => ({ value: v });
export const float = (v) => ({ value: v });
export const int = (v) => ({ value: v });
export const color = (c) => ({ value: c });
export const texture = (t) => ({ value: t });
export const vec2 = (...args) => ({ type: "vec2", args });
export const vec3 = (...args) => ({ type: "vec3", args });
export const vec4 = (...args) => ({ type: "vec4", args });

const dummy = new Proxy({}, {
  get: () => () => ({})
});

export default dummy;
