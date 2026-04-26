import { Buffer } from "node:buffer";

const ARRAY_BUFFER = 34962;

function deg(value) {
  return (value * Math.PI) / 180;
}

function normalize([x, y, z]) {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

function quaternionFromEuler(xDeg = 0, yDeg = 0, zDeg = 0) {
  const x = deg(xDeg) / 2;
  const y = deg(yDeg) / 2;
  const z = deg(zDeg) / 2;
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

function pushTri(positions, normals, a, b, c, normal) {
  positions.push(...a, ...b, ...c);
  normals.push(...normal, ...normal, ...normal);
}

function createBoxGeometry() {
  const positions = [];
  const normals = [];
  const faces = [
    { n: [0, 0, 1], c: [[-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]] },
    { n: [0, 0, -1], c: [[0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5]] },
    { n: [1, 0, 0], c: [[0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5]] },
    { n: [-1, 0, 0], c: [[-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5]] },
    { n: [0, 1, 0], c: [[-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5]] },
    { n: [0, -1, 0], c: [[-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5]] },
  ];

  for (const face of faces) {
    pushTri(positions, normals, face.c[0], face.c[1], face.c[2], face.n);
    pushTri(positions, normals, face.c[0], face.c[2], face.c[3], face.n);
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
  };
}

function createCylinderGeometry(segments = 18) {
  const positions = [];
  const normals = [];
  const top = [0, 0.5, 0];
  const bottom = [0, -0.5, 0];

  for (let index = 0; index < segments; index += 1) {
    const start = (index / segments) * Math.PI * 2;
    const end = ((index + 1) / segments) * Math.PI * 2;
    const a = [Math.cos(start) * 0.5, -0.5, Math.sin(start) * 0.5];
    const b = [Math.cos(end) * 0.5, -0.5, Math.sin(end) * 0.5];
    const c = [Math.cos(end) * 0.5, 0.5, Math.sin(end) * 0.5];
    const d = [Math.cos(start) * 0.5, 0.5, Math.sin(start) * 0.5];
    const sideNormal = normalize([Math.cos((start + end) / 2), 0, Math.sin((start + end) / 2)]);

    pushTri(positions, normals, a, b, c, sideNormal);
    pushTri(positions, normals, a, c, d, sideNormal);
    pushTri(positions, normals, top, d, c, [0, 1, 0]);
    pushTri(positions, normals, bottom, b, a, [0, -1, 0]);
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
  };
}

function createExtrudedPolygon(profile, depth) {
  const positions = [];
  const normals = [];
  const halfDepth = depth / 2;

  for (let index = 1; index < profile.length - 1; index += 1) {
    pushTri(
      positions,
      normals,
      [profile[0][0], profile[0][1], halfDepth],
      [profile[index][0], profile[index][1], halfDepth],
      [profile[index + 1][0], profile[index + 1][1], halfDepth],
      [0, 0, 1],
    );
    pushTri(
      positions,
      normals,
      [profile[0][0], profile[0][1], -halfDepth],
      [profile[index + 1][0], profile[index + 1][1], -halfDepth],
      [profile[index][0], profile[index][1], -halfDepth],
      [0, 0, -1],
    );
  }

  for (let index = 0; index < profile.length; index += 1) {
    const next = (index + 1) % profile.length;
    const a = [profile[index][0], profile[index][1], halfDepth];
    const b = [profile[next][0], profile[next][1], halfDepth];
    const c = [profile[next][0], profile[next][1], -halfDepth];
    const d = [profile[index][0], profile[index][1], -halfDepth];
    const edge = [profile[next][0] - profile[index][0], profile[next][1] - profile[index][1], 0];
    const normal = normalize([edge[1], -edge[0], 0]);

    pushTri(positions, normals, a, b, c, normal);
    pushTri(positions, normals, a, c, d, normal);
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
  };
}

function padBuffer(buffer, fill = 0) {
  const padding = (4 - (buffer.length % 4)) % 4;
  return padding ? Buffer.concat([buffer, Buffer.alloc(padding, fill)]) : buffer;
}

class BinaryBuilder {
  constructor() {
    this.parts = [];
    this.offset = 0;
  }

  append(typedArray) {
    const padding = (4 - (this.offset % 4)) % 4;
    if (padding) {
      this.parts.push(Buffer.alloc(padding));
      this.offset += padding;
    }

    const buffer = Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
    const byteOffset = this.offset;
    this.parts.push(buffer);
    this.offset += buffer.length;
    return { byteOffset, byteLength: buffer.length };
  }

  build() {
    return padBuffer(Buffer.concat(this.parts));
  }
}

function accessorSize(type) {
  return { SCALAR: 1, VEC3: 3, VEC4: 4 }[type];
}

function minMax(values, size) {
  const min = Array.from({ length: size }, () => Number.POSITIVE_INFINITY);
  const max = Array.from({ length: size }, () => Number.NEGATIVE_INFINITY);

  for (let index = 0; index < values.length; index += size) {
    for (let offset = 0; offset < size; offset += 1) {
      min[offset] = Math.min(min[offset], values[index + offset]);
      max[offset] = Math.max(max[offset], values[index + offset]);
    }
  }

  return { min, max };
}

function addAccessor(document, binary, typedArray, type, options = {}) {
  const view = binary.append(typedArray);
  const viewIndex = document.bufferViews.push({
    buffer: 0,
    byteOffset: view.byteOffset,
    byteLength: view.byteLength,
    ...(options.target ? { target: options.target } : {}),
  }) - 1;
  const size = accessorSize(type);
  const accessor = {
    bufferView: viewIndex,
    byteOffset: 0,
    componentType: 5126,
    count: typedArray.length / size,
    type,
  };

  if (options.bounds) {
    Object.assign(accessor, minMax(typedArray, size));
  }

  return document.accessors.push(accessor) - 1;
}

function createMaterial(name, color, options = {}) {
  return {
    name,
    pbrMetallicRoughness: {
      baseColorFactor: color,
      metallicFactor: options.metallicFactor ?? 0,
      roughnessFactor: options.roughnessFactor ?? 0.82,
    },
    ...(options.emissiveFactor ? { emissiveFactor: options.emissiveFactor } : {}),
  };
}

function buildGeometry(document, binary) {
  const definitions = {
    box: createBoxGeometry(),
    cylinder: createCylinderGeometry(20),
    pickaxeHead: createExtrudedPolygon(
      [
        [-0.95, 0.02],
        [-0.34, 0.22],
        [0, 0.34],
        [0.92, 0.04],
        [0.18, -0.22],
        [-0.26, -0.2],
      ],
      0.16,
    ),
    helmetNasal: createExtrudedPolygon(
      [
        [-0.14, 0.55],
        [0.14, 0.55],
        [0.1, -0.55],
        [-0.1, -0.55],
      ],
      0.08,
    ),
    flame: createExtrudedPolygon(
      [
        [0, 0.78],
        [0.24, 0.32],
        [0.14, -0.16],
        [0, -0.58],
        [-0.16, -0.12],
        [-0.24, 0.32],
      ],
      0.1,
    ),
    shield: createExtrudedPolygon(
      [
        [0, 0.7],
        [0.48, 0.42],
        [0.38, -0.2],
        [0, -0.72],
        [-0.38, -0.2],
        [-0.48, 0.42],
      ],
      0.14,
    ),
  };
  const accessors = {};

  for (const [name, geometry] of Object.entries(definitions)) {
    accessors[name] = {
      position: addAccessor(document, binary, geometry.positions, "VEC3", { target: ARRAY_BUFFER, bounds: true }),
      normal: addAccessor(document, binary, geometry.normals, "VEC3", { target: ARRAY_BUFFER }),
    };
  }

  return accessors;
}

function addMesh(document, cache, geometry, material, name) {
  const key = `${geometry.position}:${material}:${name}`;
  if (cache.has(key)) {
    return cache.get(key);
  }

  const mesh = document.meshes.push({
    name,
    primitives: [
      {
        attributes: {
          POSITION: geometry.position,
          NORMAL: geometry.normal,
        },
        material,
      },
    ],
  }) - 1;
  cache.set(key, mesh);
  return mesh;
}

function addNode(document, node) {
  return document.nodes.push(node) - 1;
}

function addTrack(document, binary, animation, node, path, times, values, type) {
  const input = addAccessor(document, binary, new Float32Array(times), "SCALAR", { bounds: true });
  const output = addAccessor(document, binary, new Float32Array(values), type);
  const sampler = animation.samplers.push({ input, output, interpolation: "LINEAR" }) - 1;
  animation.channels.push({ sampler, target: { node, path } });
}

function buildAnimations(document, binary, nodes) {
  const idleTimes = [0, 0.6, 1.2, 1.8, 2.4];
  const mineTimes = [0, 0.22, 0.44, 0.72, 1];

  const idle = { name: "Idle", samplers: [], channels: [] };
  addTrack(document, binary, idle, nodes.bodyRoot, "translation", idleTimes, [
    0, 1.48, 0,
    0, 1.51, 0,
    0, 1.48, 0,
    0, 1.45, 0,
    0, 1.48, 0,
  ], "VEC3");
  addTrack(document, binary, idle, nodes.headPivot, "rotation", idleTimes, [
    ...quaternionFromEuler(0, -3, 0),
    ...quaternionFromEuler(1, 0, 0),
    ...quaternionFromEuler(0, 3, 0),
    ...quaternionFromEuler(-1, 0, 0),
    ...quaternionFromEuler(0, -3, 0),
  ], "VEC4");
  addTrack(document, binary, idle, nodes.lanternFlame, "scale", idleTimes, [
    0.22, 0.42, 0.22,
    0.27, 0.5, 0.27,
    0.2, 0.38, 0.2,
    0.25, 0.47, 0.25,
    0.22, 0.42, 0.22,
  ], "VEC3");

  const mine = { name: "Mine", samplers: [], channels: [] };
  addTrack(document, binary, mine, nodes.rightArmPivot, "rotation", mineTimes, [
    ...quaternionFromEuler(-36, 0, -16),
    ...quaternionFromEuler(-86, 0, -20),
    ...quaternionFromEuler(-14, 0, -10),
    ...quaternionFromEuler(-44, 0, -16),
    ...quaternionFromEuler(-36, 0, -16),
  ], "VEC4");
  addTrack(document, binary, mine, nodes.torsoPivot, "rotation", mineTimes, [
    ...quaternionFromEuler(0, 0, 0),
    ...quaternionFromEuler(-4, 0, 3),
    ...quaternionFromEuler(5, 0, -5),
    ...quaternionFromEuler(0, 0, 0),
    ...quaternionFromEuler(0, 0, 0),
  ], "VEC4");

  document.animations.push(idle, mine);
}

function buildDocument() {
  const document = {
    asset: {
      version: "2.0",
      generator: "TempoClaw medieval block miner generator",
      copyright: "Original block-toy medieval miner asset, no brand marks.",
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
  const binary = new BinaryBuilder();
  const geometry = buildGeometry(document, binary);
  const meshCache = new Map();
  const materials = {
    toySkin: document.materials.push(createMaterial("WarmToySkin", [1, 0.78, 0.24, 1], { roughnessFactor: 0.42 })) - 1,
    chainmail: document.materials.push(createMaterial("DarkChainmail", [0.34, 0.36, 0.38, 1], { metallicFactor: 0.48, roughnessFactor: 0.5 })) - 1,
    helmet: document.materials.push(createMaterial("DentedIronHelmet", [0.58, 0.59, 0.56, 1], { metallicFactor: 0.62, roughnessFactor: 0.38 })) - 1,
    leather: document.materials.push(createMaterial("AgedBrownLeather", [0.36, 0.2, 0.09, 1], { roughnessFactor: 0.78 })) - 1,
    tunic: document.materials.push(createMaterial("MedievalOchreTunic", [0.72, 0.42, 0.13, 1], { roughnessFactor: 0.72 })) - 1,
    boot: document.materials.push(createMaterial("CharcoalBoots", [0.07, 0.06, 0.05, 1], { roughnessFactor: 0.86 })) - 1,
    wood: document.materials.push(createMaterial("MineToolWood", [0.45, 0.27, 0.1, 1], { roughnessFactor: 0.85 })) - 1,
    steel: document.materials.push(createMaterial("ForgedSteel", [0.62, 0.62, 0.58, 1], { metallicFactor: 0.7, roughnessFactor: 0.34 })) - 1,
    face: document.materials.push(createMaterial("PaintedFace", [0.08, 0.05, 0.025, 1], { roughnessFactor: 0.95 })) - 1,
    glow: document.materials.push(createMaterial("LanternGlow", [1, 0.58, 0.12, 1], { emissiveFactor: [1, 0.48, 0.08], roughnessFactor: 0.5 })) - 1,
    shieldBlue: document.materials.push(createMaterial("DeepMineBlueShield", [0.08, 0.14, 0.26, 1], { roughnessFactor: 0.68 })) - 1,
  };
  const meshes = {
    skinBox: addMesh(document, meshCache, geometry.box, materials.toySkin, "ToySkinBox"),
    tunicBox: addMesh(document, meshCache, geometry.box, materials.tunic, "TunicBox"),
    chainBox: addMesh(document, meshCache, geometry.box, materials.chainmail, "ChainmailBox"),
    leatherBox: addMesh(document, meshCache, geometry.box, materials.leather, "LeatherBox"),
    bootBox: addMesh(document, meshCache, geometry.box, materials.boot, "BootBox"),
    faceBox: addMesh(document, meshCache, geometry.box, materials.face, "FacePaintBox"),
    cylinderSkin: addMesh(document, meshCache, geometry.cylinder, materials.toySkin, "ToySkinCylinder"),
    helmetCylinder: addMesh(document, meshCache, geometry.cylinder, materials.helmet, "IronHelmetCylinder"),
    woodCylinder: addMesh(document, meshCache, geometry.cylinder, materials.wood, "WoodCylinder"),
    steelPick: addMesh(document, meshCache, geometry.pickaxeHead, materials.steel, "ForgedPickaxeHead"),
    nasal: addMesh(document, meshCache, geometry.helmetNasal, materials.helmet, "HelmetNasalGuard"),
    flame: addMesh(document, meshCache, geometry.flame, materials.glow, "LanternFlame"),
    shield: addMesh(document, meshCache, geometry.shield, materials.shieldBlue, "MineGuildShield"),
  };
  const nodes = {};

  nodes.root = addNode(document, { name: "MedievalBlockMinerRoot", children: [] });
  nodes.bodyRoot = addNode(document, { name: "BodyRoot", translation: [0, 1.48, 0], children: [] });
  nodes.hips = addNode(document, { name: "BlockyHips", mesh: meshes.leatherBox, translation: [0, 0.02, 0], scale: [1.18, 0.34, 0.76] });
  nodes.torsoPivot = addNode(document, { name: "TorsoPivot", translation: [0, 0.1, 0], children: [] });
  nodes.torso = addNode(document, { name: "ChainmailTorso", mesh: meshes.chainBox, translation: [0, 0.72, 0], scale: [1.34, 1.08, 0.78] });
  nodes.tunicPanel = addNode(document, { name: "OchreTunicFront", mesh: meshes.tunicBox, translation: [0, 0.42, 0.42], scale: [1.0, 0.76, 0.08] });
  nodes.belt = addNode(document, { name: "LeatherBelt", mesh: meshes.leatherBox, translation: [0, 0.16, 0.43], scale: [1.42, 0.16, 0.1] });
  nodes.buckle = addNode(document, { name: "SteelBeltBuckle", mesh: meshes.chainBox, translation: [0, 0.17, 0.5], scale: [0.28, 0.2, 0.08] });
  nodes.pack = addNode(document, { name: "MedievalOreSatchel", mesh: meshes.leatherBox, translation: [0, 0.68, -0.62], scale: [0.88, 0.82, 0.34] });
  nodes.shield = addNode(document, { name: "BackMountedMineGuildShield", mesh: meshes.shield, translation: [0, 0.78, -0.84], rotation: quaternionFromEuler(0, 180, 0), scale: [0.78, 0.78, 0.78] });
  nodes.headPivot = addNode(document, { name: "HeadPivot", translation: [0, 1.34, 0], children: [] });
  nodes.head = addNode(document, { name: "SquareToyHead", mesh: meshes.skinBox, translation: [0, 0.45, 0], scale: [1.02, 1.02, 1.02] });
  nodes.headStud = addNode(document, { name: "UnbrandedHeadStud", mesh: meshes.cylinderSkin, translation: [0, 1.02, 0], scale: [0.42, 0.12, 0.42] });
  nodes.helmetBrim = addNode(document, { name: "IronHelmetBrim", mesh: meshes.helmetCylinder, translation: [0, 1.0, 0], scale: [1.22, 0.12, 1.22] });
  nodes.helmetDome = addNode(document, { name: "IronHelmetDome", mesh: meshes.helmetCylinder, translation: [0, 1.26, 0], scale: [0.88, 0.42, 0.88] });
  nodes.nasalGuard = addNode(document, { name: "HelmetNasalGuard", mesh: meshes.nasal, translation: [0, 0.72, 0.58], scale: [0.72, 0.72, 0.72] });
  nodes.eyeLeft = addNode(document, { name: "LeftPaintedEye", mesh: meshes.faceBox, translation: [-0.22, 0.55, 0.53], scale: [0.13, 0.17, 0.045] });
  nodes.eyeRight = addNode(document, { name: "RightPaintedEye", mesh: meshes.faceBox, translation: [0.22, 0.55, 0.53], scale: [0.13, 0.17, 0.045] });
  nodes.beard = addNode(document, { name: "BlockyMinerBeard", mesh: meshes.leatherBox, translation: [0, 0.22, 0.54], scale: [0.5, 0.32, 0.055] });
  nodes.mouth = addNode(document, { name: "SmallDeterminedMouth", mesh: meshes.faceBox, translation: [0, 0.28, 0.59], scale: [0.24, 0.045, 0.035] });

  nodes.leftArmPivot = addNode(document, { name: "LeftArmPivot", translation: [-0.96, 1.04, 0], rotation: quaternionFromEuler(10, 0, 8), children: [] });
  nodes.leftArm = addNode(document, { name: "LeftChainmailArm", mesh: meshes.chainBox, translation: [0, -0.48, 0], scale: [0.42, 1.0, 0.42] });
  nodes.leftHand = addNode(document, { name: "LeftCGripHand", mesh: meshes.cylinderSkin, translation: [0, -1.02, 0], rotation: quaternionFromEuler(90, 0, 0), scale: [0.32, 0.24, 0.32] });
  nodes.lanternRoot = addNode(document, { name: "IronLanternRoot", translation: [0, -1.1, 0.16], children: [] });
  nodes.lanternFrame = addNode(document, { name: "IronLanternFrame", mesh: meshes.helmetCylinder, translation: [0, -0.18, 0], scale: [0.28, 0.36, 0.28] });
  nodes.lanternFlame = addNode(document, { name: "LanternFlame", mesh: meshes.flame, translation: [0, -0.14, 0.02], scale: [0.22, 0.42, 0.22] });

  nodes.rightArmPivot = addNode(document, { name: "RightArmPivot", translation: [0.96, 1.04, 0], rotation: quaternionFromEuler(-36, 0, -16), children: [] });
  nodes.rightArm = addNode(document, { name: "RightChainmailArm", mesh: meshes.chainBox, translation: [0, -0.48, 0], scale: [0.42, 1.0, 0.42] });
  nodes.rightHand = addNode(document, { name: "RightCGripHand", mesh: meshes.cylinderSkin, translation: [0, -1.02, 0], rotation: quaternionFromEuler(90, 0, 0), scale: [0.32, 0.24, 0.32] });
  nodes.pickaxeRoot = addNode(document, { name: "TwoHandedMedievalPickaxeRoot", translation: [0.08, -1.08, 0.14], rotation: quaternionFromEuler(0, 16, 48), children: [] });
  nodes.pickaxeHandle = addNode(document, { name: "LongWoodPickaxeHandle", mesh: meshes.woodCylinder, translation: [0.56, 0, 0], rotation: quaternionFromEuler(0, 0, 90), scale: [0.1, 1.48, 0.1] });
  nodes.pickaxeHead = addNode(document, { name: "ForgedSteelPickaxeHead", mesh: meshes.steelPick, translation: [-0.1, 0, 0], rotation: quaternionFromEuler(0, 0, 90), scale: [0.76, 0.76, 0.76] });

  nodes.leftLegPivot = addNode(document, { name: "LeftLegPivot", translation: [-0.36, -0.12, 0], children: [] });
  nodes.leftLeg = addNode(document, { name: "LeftShortBlockLeg", mesh: meshes.bootBox, translation: [0, -0.56, 0], scale: [0.48, 1.08, 0.5] });
  nodes.rightLegPivot = addNode(document, { name: "RightLegPivot", translation: [0.36, -0.12, 0], children: [] });
  nodes.rightLeg = addNode(document, { name: "RightShortBlockLeg", mesh: meshes.bootBox, translation: [0, -0.56, 0], scale: [0.48, 1.08, 0.5] });

  document.nodes[nodes.root].children.push(nodes.bodyRoot);
  document.nodes[nodes.bodyRoot].children.push(nodes.hips, nodes.torsoPivot, nodes.leftLegPivot, nodes.rightLegPivot);
  document.nodes[nodes.torsoPivot].children.push(
    nodes.torso,
    nodes.tunicPanel,
    nodes.belt,
    nodes.buckle,
    nodes.pack,
    nodes.shield,
    nodes.headPivot,
    nodes.leftArmPivot,
    nodes.rightArmPivot,
  );
  document.nodes[nodes.headPivot].children.push(
    nodes.head,
    nodes.headStud,
    nodes.helmetBrim,
    nodes.helmetDome,
    nodes.nasalGuard,
    nodes.eyeLeft,
    nodes.eyeRight,
    nodes.beard,
    nodes.mouth,
  );
  document.nodes[nodes.leftArmPivot].children.push(nodes.leftArm, nodes.leftHand, nodes.lanternRoot);
  document.nodes[nodes.lanternRoot].children.push(nodes.lanternFrame, nodes.lanternFlame);
  document.nodes[nodes.rightArmPivot].children.push(nodes.rightArm, nodes.rightHand, nodes.pickaxeRoot);
  document.nodes[nodes.pickaxeRoot].children.push(nodes.pickaxeHandle, nodes.pickaxeHead);
  document.nodes[nodes.leftLegPivot].children.push(nodes.leftLeg);
  document.nodes[nodes.rightLegPivot].children.push(nodes.rightLeg);

  document.scenes.push({ name: "MedievalBlockMinerScene", nodes: [nodes.root] });
  document.scene = 0;

  buildAnimations(document, binary, nodes);

  const binChunk = binary.build();
  document.buffers.push({ byteLength: binChunk.length });

  return { document, binChunk };
}

export function buildMedievalBlockMinerGlb() {
  const { document, binChunk } = buildDocument();
  const jsonChunk = padBuffer(Buffer.from(JSON.stringify(document), "utf8"), 0x20);
  const totalLength = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
}

export function parseGlb(buffer) {
  const source = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (source.readUInt32LE(0) !== 0x46546c67) {
    throw new Error("Invalid GLB magic header.");
  }
  if (source.readUInt32LE(4) !== 2) {
    throw new Error("Unsupported GLB version.");
  }

  let offset = 12;
  let json = null;
  let bin = Buffer.alloc(0);

  while (offset < source.length) {
    const chunkLength = source.readUInt32LE(offset);
    const chunkType = source.readUInt32LE(offset + 4);
    const data = source.subarray(offset + 8, offset + 8 + chunkLength);
    offset += 8 + chunkLength;

    if (chunkType === 0x4e4f534a) {
      json = JSON.parse(data.toString("utf8").trim());
    }
    if (chunkType === 0x004e4942) {
      bin = data;
    }
  }

  if (!json) {
    throw new Error("Missing GLB JSON chunk.");
  }

  return { json, bin };
}
