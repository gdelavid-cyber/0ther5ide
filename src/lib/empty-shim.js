// Safe universal WebGL/TSL mock shim for Three.js WebGPU shaders
export const uniform = (v) => ({ value: v });
export const storage = (v) => ({ value: v });
export const attribute = (name) => ({ name });
export const varying = (v) => ({ value: v });
export const vec2 = (...args) => ({ type: "vec2", args });
export const vec3 = (...args) => ({ type: "vec3", args });
export const vec4 = (...args) => ({ type: "vec4", args });
export const mat3 = (...args) => ({ type: "mat3", args });
export const mat4 = (...args) => ({ type: "mat4", args });
export const float = (v) => ({ value: v });
export const color = (c) => ({ value: c });
export const texture = (t) => ({ value: t });
export const Fn = (fn) => fn;
export const tslFn = (fn) => fn;
export const Node = class {};
export const NodeMaterial = class {};
export const MeshBasicNodeMaterial = class {};
export const MeshStandardNodeMaterial = class {};
export const WebGPURenderer = class {};

const dummy = new Proxy({}, {
  get: () => () => ({})
});

export default dummy;
