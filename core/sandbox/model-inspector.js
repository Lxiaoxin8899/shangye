import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { createGfx } from '../engine/gfx.js';
import { createReferenceMesh } from './reference-mesh.js';
import decoderJs from 'three/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js?url';
import decoderWasm from 'three/examples/jsm/libs/draco/gltf/draco_decoder.wasm?url';

const params = new URLSearchParams(window.location.search);
const headless = params.has('headless');
const modelUrl = params.get('model');

const canvas = document.getElementById('stage');
const gfx = createGfx(canvas, { headless });
const rtMain = gfx.createTarget({ owner: 'core', scale: 1, samples: 4, depth: true, type: THREE.HalfFloatType });

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06080f);
scene.environment = gfx.getStudioEnv();

const camera = new THREE.PerspectiveCamera(34, gfx.width / gfx.height, 0.002, 50);
camera.position.set(0.18, 0.12, 0.22);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.target.set(0, 0.055, 0);

// Studio light rig
const keyLight = new THREE.DirectionalLight(0xf0f6ff, 3.2);
keyLight.position.set(-0.6, 1.0, 0.7);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xe9e5df, 3.6);
rimLight.position.set(0.7, 0.45, -0.7);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight(0xc7d4df, 1.1);
fillLight.position.set(-0.5, 0.2, -0.8);
scene.add(fillLight);

// Ground contact plane (Y = 0) & millimeter/centimeter reference grid
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(0.6, 72),
  new THREE.MeshStandardMaterial({ color: 0x06090f, roughness: 0.36, metalness: 0.42 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(0.4, 40, 0x3b5878, 0x1a2636);
grid.position.y = 0.0002;
scene.add(grid);

const axes = new THREE.AxesHelper(0.08);
axes.position.y = 0.0005;
scene.add(axes);

let activeModel = null;
let autoRotate = !headless;
let currentMode = 'pbr';
const savedMaterials = new Map();

const clayMat = new THREE.MeshStandardMaterial({ color: 0xbac3cf, roughness: 0.55, metalness: 0.0 });
const normalMat = new THREE.MeshNormalMaterial();
const wireMat = new THREE.MeshBasicMaterial({ color: 0xb2c7da, wireframe: true });

function setShadingMode(mode) {
  currentMode = mode;
  if (!activeModel) return;
  activeModel.traverse((o) => {
    if (!o.isMesh) return;
    if (!savedMaterials.has(o)) savedMaterials.set(o, o.material);
    if (mode === 'pbr') o.material = savedMaterials.get(o);
    else if (mode === 'clay') o.material = clayMat;
    else if (mode === 'normal') o.material = normalMat;
    else if (mode === 'wire') o.material = wireMat;
  });
}

function setLightingPreset(preset) {
  if (preset === 'darkroom') {
    scene.background.setHex(0x06080f);
    floor.material.color.setHex(0x0b0f17);
    keyLight.intensity = 3.2;
    rimLight.intensity = 3.6;
    fillLight.intensity = 1.1;
  } else if (preset === 'whitebox') {
    scene.background.setHex(0xdde2ea);
    floor.material.color.setHex(0xcfd6e0);
    keyLight.intensity = 2.6;
    rimLight.intensity = 1.4;
    fillLight.intensity = 1.6;
  } else if (preset === 'rim') {
    scene.background.setHex(0x020306);
    floor.material.color.setHex(0x05070c);
    keyLight.intensity = 0.7;
    rimLight.intensity = 6.0;
    fillLight.intensity = 2.6;
  }
}

function updateStats(obj, labelName) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  let meshes = 0;
  let tris = 0;
  obj.traverse((o) => {
    if (!o.isMesh) return;
    meshes++;
    const geo = o.geometry;
    const count = geo.index ? geo.index.count : geo.attributes.position?.count || 0;
    const inst = o.isInstancedMesh ? o.count : 1;
    tris += Math.round((count / 3) * inst);
  });

  // Auto-frame camera nicely around bounding sphere
  const radius = Math.max(0.03, size.length() * 0.5);
  controls.target.copy(center);
  camera.position.set(center.x + radius * 1.9, center.y + radius * 1.15, center.z + radius * 2.1);
  controls.update();

  const el = document.getElementById('inspector-stats');
  if (el) {
    el.innerHTML = `
      <div><strong>模型</strong>：<span data-model-name></span></div>
      <div><strong>尺寸</strong>：${(size.x * 1000).toFixed(1)} × ${(size.y * 1000).toFixed(1)} × ${(size.z * 1000).toFixed(1)} mm</div>
      <div><strong>底面 Y 间隙</strong>：${(box.min.y * 1000).toFixed(2)} mm ${Math.abs(box.min.y) < 0.0005 ? '✅ 贴地' : '⚠ 悬空/穿地'}</div>
      <div><strong>网格 / 三角面</strong>：${meshes} meshes · ${tris.toLocaleString()} tris</div>
    `;
    el.querySelector('[data-model-name]').textContent = labelName;
  }
}

async function loadModel(url) {
  if (activeModel) {
    scene.remove(activeModel);
    savedMaterials.clear();
  }
  if (!url) {
    activeModel = createReferenceMesh();
    scene.add(activeModel);
    updateStats(activeModel, '尺寸校准块');
    return;
  }
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath({ js: decoderJs, wasm: decoderWasm });
  loader.setDRACOLoader(draco);
  let gltf;
  try {
    gltf = await loader.loadAsync(url);
  } finally {
    draco.dispose();
  }
  activeModel = gltf.scene;
  activeModel.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  scene.add(activeModel);
  updateStats(activeModel, url);
}

// Bind inspector UI
if (!headless) {
  document.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => setShadingMode(btn.dataset.mode));
  });
  document.querySelectorAll('[data-light]').forEach((btn) => {
    btn.addEventListener('click', () => setLightingPreset(btn.dataset.light));
  });
  document.getElementById('btn-spin')?.addEventListener('click', (e) => {
    autoRotate = !autoRotate;
    e.target.textContent = autoRotate ? '暂停自转' : '开启自转';
  });
  document.getElementById('btn-grid')?.addEventListener('click', () => {
    grid.visible = !grid.visible;
    axes.visible = grid.visible;
  });
} else {
  const hud = document.getElementById('inspector-hud');
  if (hud) hud.style.display = 'none';
}

window.addEventListener('resize', () => {
  gfx.resize(window.innerWidth, window.innerHeight);
  camera.aspect = gfx.width / Math.max(1, gfx.height);
  camera.updateProjectionMatrix();
});

let t = 0;
function renderOnce() {
  camera.aspect = rtMain.width / Math.max(1, rtMain.height);
  camera.updateProjectionMatrix();
  controls.update();
  gfx.renderer.setRenderTarget(rtMain);
  gfx.renderer.setViewport(0, 0, rtMain.width, rtMain.height);
  gfx.renderer.setScissorTest(false);
  gfx.renderer.clear(true, true, false);
  gfx.renderer.render(scene, camera);
  gfx.post(rtMain.texture, gfx.gradedRT, {
    bloom: currentMode === 'pbr' ? 0.24 : 0.04,
    halation: currentMode === 'pbr' ? 0.08 : 0.0,
    grain: 0.01
  });
  gfx.present(gfx.gradedRT.texture);
}

try {
  await loadModel(modelUrl);
} catch (error) {
  document.getElementById('inspector-stats').textContent = `无法载入模型 · ${error.message}`;
  throw error;
}
if (headless) {
  window.__inspector = {
    setShadingMode,
    setLightingPreset,
    setOrbit(angleRad) {
      if (activeModel) activeModel.rotation.y = angleRad;
      renderOnce();
    },
    renderOnce
  };
  renderOnce();
  window.ready = true;
} else {
  let prev = performance.now();
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    t += dt;
    gfx.time = t;
    if (autoRotate && activeModel) activeModel.rotation.y += dt * 0.35;
    renderOnce();
  }
  requestAnimationFrame(loop);
}
