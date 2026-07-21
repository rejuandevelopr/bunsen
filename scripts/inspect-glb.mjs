import fs from 'node:fs';
import path from 'node:path';
import { Box3, Mesh, SkinnedMesh, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

globalThis.ProgressEvent ??= class ProgressEvent {
  constructor(type, init = {}) {
    this.type = type;
    Object.assign(this, init);
  }
};
globalThis.self ??= globalThis;
globalThis.createImageBitmap ??= async () => ({ width: 1, height: 1, close() {} });

async function loadGlb(filePath) {
  const bytes = fs.readFileSync(filePath);
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const loader = new GLTFLoader();

  return new Promise((resolve, reject) => {
    loader.parse(arrayBuffer, `${path.dirname(filePath)}/`, resolve, reject);
  });
}

for (const requestedPath of process.argv.slice(2)) {
  const filePath = path.resolve(requestedPath);
  const gltf = await loadGlb(filePath);
  const box = new Box3().setFromObject(gltf.scene);
  const size = box.getSize(new Vector3());
  const meshes = [];

  gltf.scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.updateWorldMatrix(true, false);
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const meshBox = new Box3().setFromObject(object);
    const meshSize = meshBox.getSize(new Vector3());
    const meshCenter = meshBox.getCenter(new Vector3());
    const upPlanes = new Map();
    const position = object.geometry.getAttribute('position');
    const index = object.geometry.getIndex();
    const a = new Vector3();
    const b = new Vector3();
    const c = new Vector3();
    const ab = new Vector3();
    const ac = new Vector3();
    const normal = new Vector3();
    const triangleCount = index ? index.count / 3 : position.count / 3;

    for (let triangle = 0; triangle < triangleCount; triangle += 1) {
      const ia = index ? index.getX(triangle * 3) : triangle * 3;
      const ib = index ? index.getX(triangle * 3 + 1) : triangle * 3 + 1;
      const ic = index ? index.getX(triangle * 3 + 2) : triangle * 3 + 2;
      a.fromBufferAttribute(position, ia).applyMatrix4(object.matrixWorld);
      b.fromBufferAttribute(position, ib).applyMatrix4(object.matrixWorld);
      c.fromBufferAttribute(position, ic).applyMatrix4(object.matrixWorld);
      ab.subVectors(b, a);
      ac.subVectors(c, a);
      normal.crossVectors(ab, ac);
      const twiceArea = normal.length();
      if (twiceArea === 0) continue;
      normal.divideScalar(twiceArea);
      if (normal.y < 0.96) continue;
      const y = ((a.y + b.y + c.y) / 3).toFixed(4);
      const current = upPlanes.get(y) ?? { area: 0, triangles: 0 };
      current.area += twiceArea / 2;
      current.triangles += 1;
      upPlanes.set(y, current);
    }

    meshes.push({
      name: object.name || '(unnamed)',
      type: object instanceof SkinnedMesh ? 'SkinnedMesh' : 'Mesh',
      size: meshSize.toArray().map((value) => value.toFixed(3)).join(' x '),
      center: meshCenter.toArray().map((value) => value.toFixed(3)).join(', '),
      materials: materials.map((material) => {
        const color = material.color ? `#${material.color.getHexString()}` : 'n/a';
        return `${material.name || '(unnamed)'} ${color}${material.map ? ' [texture]' : ''}`;
      }),
      upPlanes: [...upPlanes.entries()]
        .map(([y, data]) => ({ y, ...data }))
        .sort((left, right) => Number(left.y) - Number(right.y)),
    });
  });

  console.log(`\n=== ${path.basename(filePath)} ===`);
  console.log(`Bounds: ${size.x.toFixed(3)} x ${size.y.toFixed(3)} x ${size.z.toFixed(3)}`);
  console.log(`Min: ${box.min.toArray().map((value) => value.toFixed(3)).join(', ')} | Max: ${box.max.toArray().map((value) => value.toFixed(3)).join(', ')}`);
  console.log(`Animations (${gltf.animations.length}): ${gltf.animations.map((clip) => clip.name || '(unnamed)').join(', ') || '(none)'}`);
  console.log('Meshes:');
  for (const mesh of meshes) {
    console.log(`- ${mesh.name} [${mesh.type}] size ${mesh.size} center ${mesh.center} materials: ${mesh.materials.join(', ')}`);
    if (mesh.upPlanes.length > 0) {
      console.log(`  Upward planes: ${mesh.upPlanes.map((plane) => `${plane.y} (area ${plane.area.toFixed(4)}, ${plane.triangles} tri)`).join('; ')}`);
    }
  }
}
