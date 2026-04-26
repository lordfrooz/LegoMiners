import test from 'node:test';
import assert from 'node:assert/strict';

import { buildMinerGlb, parseGlb } from './miner-glb.mjs';

test('buildMinerGlb creates a compact self-contained asset with idle and walk clips', () => {
  const glb = buildMinerGlb();
  const { json, bin } = parseGlb(glb);

  assert.equal(glb.readUInt32LE(0), 0x46546c67);
  assert.equal(json.asset.version, '2.0');
  assert.equal(json.scene, 0);
  assert.deepEqual(
    json.animations.map((animation) => animation.name),
    ['Idle', 'Walk'],
  );

  const nodeNames = new Set(json.nodes.map((node) => node.name));
  assert.ok(nodeNames.has('TempoMinerRoot'));
  assert.ok(nodeNames.has('LeftArmPivot'));
  assert.ok(nodeNames.has('RightArmPivot'));
  assert.ok(nodeNames.has('LeftLegPivot'));
  assert.ok(nodeNames.has('RightLegPivot'));
  assert.ok(nodeNames.has('TorchRoot'));
  assert.ok(nodeNames.has('PickaxeRoot'));

  assert.ok(json.materials.length >= 8);
  assert.equal(json.buffers.length, 1);
  assert.equal(json.buffers[0].byteLength, bin.length);
  assert.ok(glb.length < 200 * 1024);
});
