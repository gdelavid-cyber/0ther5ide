// Comprehensive universal WebGL/TSL mock shim for Three.js WebGPU shaders

// Math / Shader built-ins
export const sin = (x) => x;
export const cos = (x) => x;
export const tan = (x) => x;
export const asin = (x) => x;
export const acos = (x) => x;
export const atan = (x) => x;
export const atan2 = (y, x) => y;
export const sinh = (x) => x;
export const cosh = (x) => x;
export const tanh = (x) => x;
export const sqrt = (x) => x;
export const pow = (x, y) => x;
export const exp = (x) => x;
export const exp2 = (x) => x;
export const log = (x) => x;
export const log2 = (x) => x;
export const abs = (x) => x;
export const sign = (x) => x;
export const floor = (x) => x;
export const ceil = (x) => x;
export const round = (x) => x;
export const trunc = (x) => x;
export const fract = (x) => x;
export const mod = (x, y) => x;
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
export const reflect = (I, N) => I;
export const refract = (I, N, eta) => I;
export const faceforward = (N, I, Nref) => N;

// TSL Types & Nodes
export const uniform = (v) => ({ value: v });
export const storage = (v) => ({ value: v });
export const attribute = (name) => ({ name });
export const varying = (v) => ({ value: v });
export const buffer = (b) => ({ value: b });
export const float = (v) => ({ value: v });
export const int = (v) => ({ value: v });
export const uint = (v) => ({ value: v });
export const bool = (v) => ({ value: v });
export const color = (c) => ({ value: c });
export const texture = (t) => ({ value: t });
export const sampler = (s) => ({ value: s });
export const vec2 = (...args) => ({ type: "vec2", args });
export const vec3 = (...args) => ({ type: "vec3", args });
export const vec4 = (...args) => ({ type: "vec4", args });
export const ivec2 = (...args) => ({ type: "ivec2", args });
export const ivec3 = (...args) => ({ type: "ivec3", args });
export const ivec4 = (...args) => ({ type: "ivec4", args });
export const uvec2 = (...args) => ({ type: "uvec2", args });
export const uvec3 = (...args) => ({ type: "uvec3", args });
export const uvec4 = (...args) => ({ type: "uvec4", args });
export const bvec2 = (...args) => ({ type: "bvec2", args });
export const bvec3 = (...args) => ({ type: "bvec3", args });
export const bvec4 = (...args) => ({ type: "bvec4", args });
export const mat2 = (...args) => ({ type: "mat2", args });
export const mat3 = (...args) => ({ type: "mat3", args });
export const mat4 = (...args) => ({ type: "mat4", args });

// Node construction & Materials
export const Fn = (fn) => fn;
export const tslFn = (fn) => fn;
export const nodeObject = (n) => n;
export const positionLocal = { type: "vec3", value: [0, 0, 0] };
export const positionWorld = { type: "vec3", value: [0, 0, 0] };
export const positionView = { type: "vec3", value: [0, 0, 0] };
export const normalLocal = { type: "vec3", value: [0, 1, 0] };
export const normalWorld = { type: "vec3", value: [0, 1, 0] };
export const normalView = { type: "vec3", value: [0, 1, 0] };
export const uv = () => ({ type: "vec2", value: [0, 0] });
export const time = { value: 0 };
export const cameraPosition = { type: "vec3", value: [0, 0, 0] };

export const Node = class {};
export const NodeMaterial = class {};
export const MeshBasicNodeMaterial = class {};
export const MeshStandardNodeMaterial = class {};
export const MeshPhysicalNodeMaterial = class {};
export const WebGPURenderer = class {};

const dummy = new Proxy({}, {
  get: () => () => ({})
});

export default dummy;
