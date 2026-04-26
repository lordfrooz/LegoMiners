import { Buffer } from 'node:buffer';

const ARRAY_BUFFER = 34962;

function degrees(value) {
  return (value * Math.PI) / 180;
}

function normalize(vector) {
  const length = Math.hypot(vector[0], vector[1], vector[2]) || 1;
  return vector.map((value) => value / length);
}

function quaternionFromEuler(xDeg = 0, yDeg = 0, zDeg = 0) {
  const x = degrees(xDeg) / 2;
  const y = degrees(yDeg) / 2;
  const z = degrees(zDeg) / 2;
  const sx = Math.sin(x);
  const cx = Math.cos(x);
  const sy = Math.sin(y);
  const cy = Math.cos(y);
  const sz = Math.sin(z);
  const cz = Math.cos(z);

  return [
    sx * cy * cz + cx * sy * sz,
    cx * sy * cz - sx * cy * sz,
    cx * cy * sz + sx * sy * cz,
    cx * cy * cz - sx * sy * sz,
  ];
}

function pushTriangle(targetPositions, targetNormals, a, b, c, normal) {
  targetPositions.push(...a, ...b, ...c);
  targetNormals.push(...normal, ...normal, ...normal);
}

function createBoxGeometry() {
  const p = [];
  const n = [];

  const faces = [
    { normal: [0, 0, 1], corners: [[-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]] },
    { normal: [0, 0, -1], corners: [[0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5]] },
    { normal: [1, 0, 0], corners: [[0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5]] },
    { normal: [-1, 0, 0], corners: [[-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5]] },
    { normal: [0, 1, 0], corners: [[-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5]] },
    { normal: [0, -1, 0], corners: [[-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5]] },
  ];

  for (const face of faces) {
    pushTriangle(p, n, face.corners[0], face.corners[1], face.corners[2], face.normal);
    pushTriangle(p, n, face.corners[0], face.corners[2], face.corners[3], face.normal);
  }

  return {
    positions: new Float32Array(p),
    normals: new Float32Array(n),
  };
}

function createCylinderGeometry(segments = 14) {
  const p = [];
  const n = [];
  const topCenter = [0, 0.5, 0];
  const bottomCenter = [0, -0.5, 0];

  for (let index = 0; index < segments; index += 1) {
    const start = (index / segments) * Math.PI * 2;
    const end = ((index + 1) / segments) * Math.PI * 2;
    const a = [Math.cos(start) * 0.5, -0.5, Math.sin(start) * 0.5];
    const b = [Math.cos(end) * 0.5, -0.5, Math.sin(end) * 0.5];
    const c = [Math.cos(end) * 0.5, 0.5, Math.sin(end) * 0.5];
    const d = [Math.cos(start) * 0.5, 0.5, Math.sin(start) * 0.5];
    const normal = normalize([Math.cos((start + end) / 2), 0, Math.sin((start + end) / 2)]);

    pushTriangle(p, n, a, b, c, normal);
    pushTriangle(p, n, a, c, d, normal);
    pushTriangle(p, n, topCenter, d, c, [0, 1, 0]);
    pushTriangle(p, n, bottomCenter, b, a, [0, -1, 0]);
  }

  return {
    positions: new Float32Array(p),
    normals: new Float32Array(n),
  };
}

function createExtrudedPolygon(profile, depth) {
  const p = [];
  const n = [];
  const halfDepth = depth / 2;
  const frontNormal = [0, 0, 1];
  const backNormal = [0, 0, -1];

  for (let index = 1; index < profile.length - 1; index += 1) {
    const a = [profile[0][0], profile[0][1], halfDepth];
    const b = [profile[index][0], profile[index][1], halfDepth];
    const c = [profile[index + 1][0], profile[index + 1][1], halfDepth];
    pushTriangle(p, n, a, b, c, frontNormal);

    const ab = [profile[0][0], profile[0][1], -halfDepth];
    const bb = [profile[index + 1][0], profile[index + 1][1], -halfDepth];
    const cb = [profile[index][0], profile[index][1], -halfDepth];
    pushTriangle(p, n, ab, bb, cb, backNormal);
  }

  for (let index = 0; index < profile.length; index += 1) {
    const next = (index + 1) % profile.length;
    const a = [profile[index][0], profile[index][1], halfDepth];
    const b = [profile[next][0], profile[next][1], halfDepth];
    const c = [profile[next][0], profile[next][1], -halfDepth];
    const d = [profile[index][0], profile[index][1], -halfDepth];
    const edge = [profile[next][0] - profile[index][0], profile[next][1] - profile[index][1], 0];
    const normal = normalize([edge[1], -edge[0], 0]);

    pushTriangle(p, n, a, b, c, normal);
    pushTriangle(p, n, a, c, d, normal);
  }

  return {
    positions: new Float32Array(p),
    normals: new Float32Array(n),
  };
}

function padBuffer(buffer, fill = 0) {
  const padding = (4 - (buffer.length % 4)) % 4;
  if (padding === 0) {
    return buffer;
  }

  return Buffer.concat([buffer, Buffer.alloc(padding, fill)]);
}

class BinaryChunkBuilder {
  constructor() {
    this.parts = [];
    this.offset = 0;
  }

  append(typedArray) {
    const currentPadding = (4 - (this.offset % 4)) % 4;
    if (currentPadding > 0) {
      this.parts.push(Buffer.alloc(currentPadding));
      this.offset += currentPadding;
    }

    const part = Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
    this.parts.push(part);

    const byteOffset = this.offset;
    this.offset += part.length;

    return { byteOffset, byteLength: part.length };
  }

  build() {
    return padBuffer(Buffer.concat(this.parts));
  }
}

function computeMinMax(array, arity) {
  const min = Array.from({ length: arity }, () => Number.POSITIVE_INFINITY);
  const max = Array.from({ length: arity }, () => Number.NEGATIVE_INFINITY);

  for (let index = 0; index < array.length; index += arity) {
    for (let offset = 0; offset < arity; offset += 1) {
      const value = array[index + offset];
      min[offset] = Math.min(min[offset], value);
      max[offset] = Math.max(max[offset], value);
    }
  }

  return { min, max };
}

function accessorTypeSize(type) {
  switch (type) {
    case 'SCALAR':
      return 1;
    case 'VEC2':
      return 2;
    case 'VEC3':
      return 3;
    case 'VEC4':
      return 4;
    default:
      throw new Error(`Unsupported accessor type: ${type}`);
  }
}

function addAccessor(document, binary, typedArray, type, options = {}) {
  const bufferView = binary.append(typedArray);
  const bufferViewIndex = document.bufferViews.push({
    buffer: 0,
    byteOffset: bufferView.byteOffset,
    byteLength: bufferView.byteLength,
    ...(options.target ? { target: options.target } : {}),
  }) - 1;

  const accessor = {
    bufferView: bufferViewIndex,
    byteOffset: 0,
    componentType: 5126,
    count: typedArray.length / accessorTypeSize(type),
    type,
  };

  if (options.includeBounds) {
    const bounds = computeMinMax(typedArray, accessorTypeSize(type));
    accessor.min = bounds.min;
    accessor.max = bounds.max;
  }

  return document.accessors.push(accessor) - 1;
}

function createMaterial(name, baseColorFactor, options = {}) {
  return {
    name,
    pbrMetallicRoughness: {
      baseColorFactor,
      metallicFactor: options.metallicFactor ?? 0,
      roughnessFactor: options.roughnessFactor ?? 1,
    },
    ...(options.emissiveFactor ? { emissiveFactor: options.emissiveFactor } : {}),
    ...(options.doubleSided ? { doubleSided: true } : {}),
  };
}

function buildGeometryAccessors(document, binary) {
  const geometries = {
    box: createBoxGeometry(),
    cylinder: createCylinderGeometry(),
    flame: createExtrudedPolygon(
      [
        [0, 0.95],
        [0.28, 0.52],
        [0.22, 0.05],
        [0, -0.72],
        [-0.2, 0.02],
        [-0.28, 0.5],
      ],
      0.18,
    ),
    pickaxe: createExtrudedPolygon(
      [
        [-0.8, 0.02],
        [-0.28, 0.2],
        [0, 0.34],
        [0.76, 0.04],
        [0.08, -0.34],
        [-0.22, -0.18],
      ],
      0.14,
    ),
  };

  const accessors = {};

  for (const [name, geometry] of Object.entries(geometries)) {
    const positionAccessor = addAccessor(document, binary, geometry.positions, 'VEC3', {
      target: ARRAY_BUFFER,
      includeBounds: true,
    });
    const normalAccessor = addAccessor(document, binary, geometry.normals, 'VEC3', {
      target: ARRAY_BUFFER,
    });

    accessors[name] = { positionAccessor, normalAccessor };
  }

  return accessors;
}

function addMesh(document, cache, geometryAccessors, geometryName, materialIndex, meshName) {
  const key = `${geometryName}:${materialIndex}:${meshName}`;
  if (cache.has(key)) {
    return cache.get(key);
  }

  const accessors = geometryAccessors[geometryName];
  const meshIndex = document.meshes.push({
    name: meshName,
    primitives: [
      {
        attributes: {
          POSITION: accessors.positionAccessor,
          NORMAL: accessors.normalAccessor,
        },
        material: materialIndex,
      },
    ],
  }) - 1;

  cache.set(key, meshIndex);
  return meshIndex;
}

function addNode(document, node) {
  return document.nodes.push(node) - 1;
}

function addAnimationTrack(document, binary, animation, nodeIndex, path, times, values, type) {
  const inputAccessor = addAccessor(document, binary, new Float32Array(times), 'SCALAR', {
    includeBounds: true,
  });
  const outputAccessor = addAccessor(document, binary, new Float32Array(values), type);

  const samplerIndex = animation.samplers.push({
    input: inputAccessor,
    output: outputAccessor,
    interpolation: 'LINEAR',
  }) - 1;

  animation.channels.push({
    sampler: samplerIndex,
    target: { node: nodeIndex, path },
  });
}

function buildAnimations(document, binary, nodes) {
  const idleTimes = [0, 0.5, 1, 1.5, 2];
  const walkTimes = [0, 0.25, 0.5, 0.75, 1];

  const idle = { name: 'Idle', samplers: [], channels: [] };
  addAnimationTrack(
    document,
    binary,
    idle,
    nodes.hipsPivot,
    'translation',
    idleTimes,
    [
      0, 1.42, 0,
      0, 1.46, 0,
      0, 1.42, 0,
      0, 1.38, 0,
      0, 1.42, 0,
    ],
    'VEC3',
  );
  addAnimationTrack(
    document,
    binary,
    idle,
    nodes.torsoPivot,
    'rotation',
    idleTimes,
    [
      ...quaternionFromEuler(1, 0, -2),
      ...quaternionFromEuler(0, 0, 0),
      ...quaternionFromEuler(-1, 0, 2),
      ...quaternionFromEuler(0, 0, 0),
      ...quaternionFromEuler(1, 0, -2),
    ],
    'VEC4',
  );
  addAnimationTrack(
    document,
    binary,
    idle,
    nodes.headPivot,
    'rotation',
    idleTimes,
    [
      ...quaternionFromEuler(0, -3, 0),
      ...quaternionFromEuler(1, 0, 0),
      ...quaternionFromEuler(0, 3, 0),
      ...quaternionFromEuler(-1, 0, 0),
      ...quaternionFromEuler(0, -3, 0),
    ],
    'VEC4',
  );
  addAnimationTrack(
    document,
    binary,
    idle,
    nodes.leftArmPivot,
    'rotation',
    idleTimes,
    [
      ...quaternionFromEuler(6, 0, 3),
      ...quaternionFromEuler(4, 0, 2),
      ...quaternionFromEuler(2, 0, 1),
      ...quaternionFromEuler(4, 0, 2),
      ...quaternionFromEuler(6, 0, 3),
    ],
    'VEC4',
  );
  addAnimationTrack(
    document,
    binary,
    idle,
    nodes.rightArmPivot,
    'rotation',
    idleTimes,
    [
      ...quaternionFromEuler(8, 0, -3),
      ...quaternionFromEuler(5, 0, -1),
      ...quaternionFromEuler(2, 0, 0),
      ...quaternionFromEuler(5, 0, -1),
      ...quaternionFromEuler(8, 0, -3),
    ],
    'VEC4',
  );
  addAnimationTrack(
    document,
    binary,
    idle,
    nodes.flameOuter,
    'scale',
    idleTimes,
    [
      0.58, 0.95, 0.58,
      0.63, 1.05, 0.63,
      0.55, 0.9, 0.55,
      0.61, 1.02, 0.61,
      0.58, 0.95, 0.58,
    ],
    'VEC3',
  );
  addAnimationTrack(
    document,
    binary,
    idle,
    nodes.flameInner,
    'scale',
    idleTimes,
    [
      0.28, 0.5, 0.28,
      0.31, 0.56, 0.31,
      0.24, 0.43, 0.24,
      0.3, 0.54, 0.3,
      0.28, 0.5, 0.28,
    ],
    'VEC3',
  );

  const walk = { name: 'Walk', samplers: [], channels: [] };
  addAnimationTrack(
    document,
    binary,
    walk,
    nodes.hipsPivot,
    'translation',
    walkTimes,
    [
      0, 1.42, 0,
      0, 1.36, 0,
      0, 1.42, 0,
      0, 1.36, 0,
      0, 1.42, 0,
    ],
    'VEC3',
  );
  addAnimationTrack(
    document,
    binary,
    walk,
    nodes.torsoPivot,
    'rotation',
    walkTimes,
    [
      ...quaternionFromEuler(1, 0, 2),
      ...quaternionFromEuler(0, 0, 0),
      ...quaternionFromEuler(-1, 0, -2),
      ...quaternionFromEuler(0, 0, 0),
      ...quaternionFromEuler(1, 0, 2),
    ],
    'VEC4',
  );
  addAnimationTrack(
    document,
    binary,
    walk,
    nodes.headPivot,
    'rotation',
    walkTimes,
    [
      ...quaternionFromEuler(0, 2, 0),
      ...quaternionFromEuler(0, 0, 0),
      ...quaternionFromEuler(0, -2, 0),
      ...quaternionFromEuler(0, 0, 0),
      ...quaternionFromEuler(0, 2, 0),
    ],
    'VEC4',
  );
  addAnimationTrack(
    document,
    binary,
    walk,
    nodes.leftArmPivot,
    'rotation',
    walkTimes,
    [
      ...quaternionFromEuler(-20, 0, 5),
      ...quaternionFromEuler(0, 0, 2),
      ...quaternionFromEuler(20, 0, -1),
      ...quaternionFromEuler(0, 0, 2),
      ...quaternionFromEuler(-20, 0, 5),
    ],
    'VEC4',
  );
  addAnimationTrack(
    document,
    binary,
    walk,
    nodes.rightArmPivot,
    'rotation',
    walkTimes,
    [
      ...quaternionFromEuler(20, 0, -5),
      ...quaternionFromEuler(0, 0, -2),
      ...quaternionFromEuler(-20, 0, 1),
      ...quaternionFromEuler(0, 0, -2),
      ...quaternionFromEuler(20, 0, -5),
    ],
    'VEC4',
  );
  addAnimationTrack(
    document,
    binary,
    walk,
    nodes.leftLegPivot,
    'rotation',
    walkTimes,
    [
      ...quaternionFromEuler(26, 0, 0),
      ...quaternionFromEuler(0, 0, 0),
      ...quaternionFromEuler(-26, 0, 0),
      ...quaternionFromEuler(0, 0, 0),
      ...quaternionFromEuler(26, 0, 0),
    ],
    'VEC4',
  );
  addAnimationTrack(
    document,
    binary,
    walk,
    nodes.rightLegPivot,
    'rotation',
    walkTimes,
    [
      ...quaternionFromEuler(-26, 0, 0),
      ...quaternionFromEuler(0, 0, 0),
      ...quaternionFromEuler(26, 0, 0),
      ...quaternionFromEuler(0, 0, 0),
      ...quaternionFromEuler(-26, 0, 0),
    ],
    'VEC4',
  );
  addAnimationTrack(
    document,
    binary,
    walk,
    nodes.flameOuter,
    'scale',
    walkTimes,
    [
      0.58, 0.95, 0.58,
      0.55, 0.9, 0.55,
      0.6, 0.98, 0.6,
      0.56, 0.92, 0.56,
      0.58, 0.95, 0.58,
    ],
    'VEC3',
  );
  addAnimationTrack(
    document,
    binary,
    walk,
    nodes.flameInner,
    'scale',
    walkTimes,
    [
      0.28, 0.5, 0.28,
      0.25, 0.46, 0.25,
      0.29, 0.52, 0.29,
      0.26, 0.48, 0.26,
      0.28, 0.5, 0.28,
    ],
    'VEC3',
  );

  document.animations.push(idle, walk);
}

function buildDocument() {
  const document = {
    asset: {
      generator: 'TempoClaw procedural miner generator',
      version: '2.0',
    },
    scenes: [],
    nodes: [],
    meshes: [],
    materials: [],
    accessors: [],
    bufferViews: [],
    buffers: [],
    animations: [],
  };

  const binary = new BinaryChunkBuilder();
  const geometryAccessors = buildGeometryAccessors(document, binary);
  const meshCache = new Map();
  const materialIndices = {
    skin: document.materials.push(createMaterial('Skin', [0.98, 0.9, 0.8, 1], { roughnessFactor: 1 })) - 1,
    leather: document.materials.push(createMaterial('Leather', [0.46, 0.25, 0.14, 1], { roughnessFactor: 0.95 })) - 1,
    leatherDark: document.materials.push(createMaterial('LeatherDark', [0.27, 0.16, 0.09, 1], { roughnessFactor: 1 })) - 1,
    cloth: document.materials.push(createMaterial('Cloth', [0.24, 0.28, 0.28, 1], { roughnessFactor: 1 })) - 1,
    sleeve: document.materials.push(createMaterial('Sleeve', [0.83, 0.81, 0.73, 1], { roughnessFactor: 1 })) - 1,
    wood: document.materials.push(createMaterial('Wood', [0.42, 0.25, 0.11, 1], { roughnessFactor: 1 })) - 1,
    metal: document.materials.push(createMaterial('Metal', [0.42, 0.44, 0.47, 1], { metallicFactor: 0.3, roughnessFactor: 0.65 })) - 1,
    face: document.materials.push(createMaterial('FaceDetail', [0.13, 0.08, 0.04, 1], { roughnessFactor: 1 })) - 1,
    flameOuter: document.materials.push(createMaterial('FlameOuter', [1, 0.84, 0.34, 1], { emissiveFactor: [1, 0.78, 0.22], roughnessFactor: 1 })) - 1,
    flameInner: document.materials.push(createMaterial('FlameInner', [1, 0.48, 0.12, 1], { emissiveFactor: [1, 0.42, 0.1], roughnessFactor: 1 })) - 1,
  };

  const meshes = {
    head: addMesh(document, meshCache, geometryAccessors, 'box', materialIndices.skin, 'HeadMesh'),
    torso: addMesh(document, meshCache, geometryAccessors, 'box', materialIndices.leather, 'TorsoMesh'),
    sleeve: addMesh(document, meshCache, geometryAccessors, 'box', materialIndices.sleeve, 'SleeveMesh'),
    cloth: addMesh(document, meshCache, geometryAccessors, 'box', materialIndices.cloth, 'ClothMesh'),
    leatherDarkBox: addMesh(document, meshCache, geometryAccessors, 'box', materialIndices.leatherDark, 'LeatherDarkBoxMesh'),
    face: addMesh(document, meshCache, geometryAccessors, 'box', materialIndices.face, 'FaceDetailMesh'),
    hatBrim: addMesh(document, meshCache, geometryAccessors, 'cylinder', materialIndices.leatherDark, 'HatBrimMesh'),
    hatCrown: addMesh(document, meshCache, geometryAccessors, 'cylinder', materialIndices.leather, 'HatCrownMesh'),
    torchHandle: addMesh(document, meshCache, geometryAccessors, 'cylinder', materialIndices.wood, 'TorchHandleMesh'),
    pickaxeHandle: addMesh(document, meshCache, geometryAccessors, 'cylinder', materialIndices.wood, 'PickaxeHandleMesh'),
    pickaxeHead: addMesh(document, meshCache, geometryAccessors, 'pickaxe', materialIndices.metal, 'PickaxeHeadMesh'),
    flameOuter: addMesh(document, meshCache, geometryAccessors, 'flame', materialIndices.flameOuter, 'FlameOuterMesh'),
    flameInner: addMesh(document, meshCache, geometryAccessors, 'flame', materialIndices.flameInner, 'FlameInnerMesh'),
  };

  const nodes = {};
  nodes.root = addNode(document, { name: 'TempoMinerRoot', children: [] });
  nodes.hipsPivot = addNode(document, { name: 'HipsPivot', translation: [0, 1.42, 0], children: [] });
  nodes.hips = addNode(document, { name: 'Hips', mesh: meshes.cloth, translation: [0, 0.08, 0], scale: [1.24, 0.42, 0.82] });
  nodes.torsoPivot = addNode(document, { name: 'TorsoPivot', translation: [0, 0.12, 0], children: [] });
  nodes.torso = addNode(document, { name: 'Torso', mesh: meshes.torso, translation: [0, 0.82, 0], scale: [1.46, 1.28, 0.86] });
  nodes.backpack = addNode(document, { name: 'Backpack', mesh: meshes.leatherDarkBox, translation: [0, 0.74, -0.72], scale: [1.02, 1.08, 0.42] });
  nodes.headPivot = addNode(document, { name: 'HeadPivot', translation: [0, 1.56, 0], children: [] });
  nodes.head = addNode(document, { name: 'Head', mesh: meshes.head, translation: [0, 0.55, 0], scale: [1.08, 1.08, 1.08] });
  nodes.eyeLeft = addNode(document, { name: 'EyeLeft', mesh: meshes.face, translation: [-0.22, 0.7, 0.56], scale: [0.14, 0.2, 0.05] });
  nodes.eyeRight = addNode(document, { name: 'EyeRight', mesh: meshes.face, translation: [0.22, 0.7, 0.56], scale: [0.14, 0.2, 0.05] });
  nodes.browLeft = addNode(document, {
    name: 'BrowLeft',
    mesh: meshes.face,
    translation: [-0.23, 0.92, 0.56],
    rotation: quaternionFromEuler(0, 0, 10),
    scale: [0.28, 0.06, 0.04],
  });
  nodes.browRight = addNode(document, {
    name: 'BrowRight',
    mesh: meshes.face,
    translation: [0.23, 0.92, 0.56],
    rotation: quaternionFromEuler(0, 0, -10),
    scale: [0.28, 0.06, 0.04],
  });
  nodes.mouth = addNode(document, { name: 'Mouth', mesh: meshes.face, translation: [0, 0.4, 0.56], scale: [0.32, 0.05, 0.04] });
  nodes.hatBrim = addNode(document, { name: 'HatBrim', mesh: meshes.hatBrim, translation: [0, 1.12, 0], scale: [1.45, 0.08, 1.45] });
  nodes.hatCrown = addNode(document, { name: 'HatCrown', mesh: meshes.hatCrown, translation: [0, 1.52, 0], scale: [0.96, 0.62, 0.96] });

  nodes.leftArmPivot = addNode(document, {
    name: 'LeftArmPivot',
    translation: [-1.05, 1.2, 0],
    rotation: quaternionFromEuler(6, 0, 3),
    children: [],
  });
  nodes.leftArm = addNode(document, { name: 'LeftArm', mesh: meshes.sleeve, translation: [0, -0.58, 0], scale: [0.46, 1.16, 0.46] });
  nodes.leftHand = addNode(document, { name: 'LeftHand', mesh: meshes.head, translation: [0, -1.19, 0], scale: [0.36, 0.36, 0.36] });
  nodes.torchRoot = addNode(document, { name: 'TorchRoot', translation: [0.18, -1.18, 0.14], children: [] });
  nodes.torchHandle = addNode(document, { name: 'TorchHandle', mesh: meshes.torchHandle, translation: [0, 0.75, 0], scale: [0.14, 1.5, 0.14] });
  nodes.flameRoot = addNode(document, { name: 'FlameRoot', translation: [0, 1.58, 0], children: [] });
  nodes.flameOuter = addNode(document, { name: 'FlameOuter', mesh: meshes.flameOuter, scale: [0.58, 0.95, 0.58] });
  nodes.flameInner = addNode(document, { name: 'FlameInner', mesh: meshes.flameInner, translation: [0, -0.02, 0.01], scale: [0.28, 0.5, 0.28] });

  nodes.rightArmPivot = addNode(document, {
    name: 'RightArmPivot',
    translation: [1.05, 1.2, 0],
    rotation: quaternionFromEuler(8, 0, -3),
    children: [],
  });
  nodes.rightArm = addNode(document, { name: 'RightArm', mesh: meshes.sleeve, translation: [0, -0.58, 0], scale: [0.46, 1.16, 0.46] });
  nodes.rightHand = addNode(document, { name: 'RightHand', mesh: meshes.head, translation: [0, -1.19, 0], scale: [0.36, 0.36, 0.36] });
  nodes.pickaxeRoot = addNode(document, {
    name: 'PickaxeRoot',
    translation: [-0.04, -1.16, 0.16],
    rotation: quaternionFromEuler(0, 18, 56),
    children: [],
  });
  nodes.pickaxeHandle = addNode(document, {
    name: 'PickaxeHandle',
    mesh: meshes.pickaxeHandle,
    translation: [0.62, -0.02, 0],
    rotation: quaternionFromEuler(0, 0, 90),
    scale: [0.12, 1.6, 0.12],
  });
  nodes.pickaxeHead = addNode(document, {
    name: 'PickaxeHead',
    mesh: meshes.pickaxeHead,
    translation: [0, 0, 0],
    rotation: quaternionFromEuler(0, 0, 90),
    scale: [0.82, 0.82, 0.82],
  });

  nodes.leftLegPivot = addNode(document, { name: 'LeftLegPivot', translation: [-0.42, 0, 0], children: [] });
  nodes.leftLeg = addNode(document, { name: 'LeftLeg', mesh: meshes.cloth, translation: [0, -0.72, 0], scale: [0.54, 1.45, 0.58] });
  nodes.rightLegPivot = addNode(document, { name: 'RightLegPivot', translation: [0.42, 0, 0], children: [] });
  nodes.rightLeg = addNode(document, { name: 'RightLeg', mesh: meshes.cloth, translation: [0, -0.72, 0], scale: [0.54, 1.45, 0.58] });

  document.nodes[nodes.root].children.push(nodes.hipsPivot);
  document.nodes[nodes.hipsPivot].children.push(nodes.hips, nodes.torsoPivot, nodes.leftLegPivot, nodes.rightLegPivot);
  document.nodes[nodes.torsoPivot].children.push(nodes.torso, nodes.backpack, nodes.headPivot, nodes.leftArmPivot, nodes.rightArmPivot);
  document.nodes[nodes.headPivot].children.push(
    nodes.head,
    nodes.eyeLeft,
    nodes.eyeRight,
    nodes.browLeft,
    nodes.browRight,
    nodes.mouth,
    nodes.hatBrim,
    nodes.hatCrown,
  );
  document.nodes[nodes.leftArmPivot].children.push(nodes.leftArm, nodes.leftHand, nodes.torchRoot);
  document.nodes[nodes.torchRoot].children.push(nodes.torchHandle, nodes.flameRoot);
  document.nodes[nodes.flameRoot].children.push(nodes.flameOuter, nodes.flameInner);
  document.nodes[nodes.rightArmPivot].children.push(nodes.rightArm, nodes.rightHand, nodes.pickaxeRoot);
  document.nodes[nodes.pickaxeRoot].children.push(nodes.pickaxeHandle, nodes.pickaxeHead);
  document.nodes[nodes.leftLegPivot].children.push(nodes.leftLeg);
  document.nodes[nodes.rightLegPivot].children.push(nodes.rightLeg);

  document.scenes.push({
    name: 'TempoMinerScene',
    nodes: [nodes.root],
  });
  document.scene = 0;

  buildAnimations(document, binary, nodes);

  const binChunk = binary.build();
  document.buffers.push({ byteLength: binChunk.length });

  return { document, binChunk };
}

export function buildMinerGlb() {
  const { document, binChunk } = buildDocument();
  const jsonBuffer = padBuffer(Buffer.from(JSON.stringify(document), 'utf8'), 0x20);

  const totalLength = 12 + 8 + jsonBuffer.length + 8 + binChunk.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonBuffer.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHeader, jsonBuffer, binHeader, binChunk]);
}

export function parseGlb(buffer) {
  const source = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const magic = source.readUInt32LE(0);
  if (magic !== 0x46546c67) {
    throw new Error('Invalid GLB magic header.');
  }

  const version = source.readUInt32LE(4);
  if (version !== 2) {
    throw new Error(`Unsupported GLB version: ${version}`);
  }

  let offset = 12;
  let json;
  let bin = Buffer.alloc(0);

  while (offset < source.length) {
    const chunkLength = source.readUInt32LE(offset);
    const chunkType = source.readUInt32LE(offset + 4);
    const chunkData = source.subarray(offset + 8, offset + 8 + chunkLength);
    offset += 8 + chunkLength;

    if (chunkType === 0x4e4f534a) {
      json = JSON.parse(chunkData.toString('utf8').trim());
    } else if (chunkType === 0x004e4942) {
      bin = chunkData;
    }
  }

  if (!json) {
    throw new Error('GLB JSON chunk is missing.');
  }

  return { json, bin };
}
