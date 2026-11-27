import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Deterministic linear roughness reference. Repetition is controlled by the material's UVs.
function createBrushedRoughness(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const brush = canvas.getContext('2d');
  for (let y = 0; y < size; y++) {
    const value = 145 + Math.round(18 * Math.sin(y * 12.9898) + 8 * Math.sin(y * 78.233));
    brush.fillStyle = `rgb(${value}, ${value}, ${value})`;
    brush.fillRect(0, y, size, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Metres. The 100 × 60 × 80 mm block rests on the reference plane Y = 0.
export function createReferenceMesh() {
  const geometry = new RoundedBoxGeometry(0.1, 0.06, 0.08, 3, 0.005);
  const material = new THREE.MeshStandardMaterial({
    color: 0x9fa8b2,
    roughness: 0.52,
    roughnessMap: createBrushedRoughness(),
    metalness: 0.64
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = 0.03;
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
