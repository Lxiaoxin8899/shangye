import * as THREE from 'three';
import { createSelectBox } from '../engine/selectBox.js';
import { createReferenceMesh } from './reference-mesh.js';
import { createSplitView } from './split-view.js';

// Two instrument views of one dimensioned primitive, used to exercise the scene protocol.
export function createReferenceScene({ id, title, compare = false }) {
  return {
    id,
    title,
    enterWith: compare ? 'fade' : 'portal',
    beats: [{ dur: 0.8, hold: 2 }, { dur: 1, hold: 2 }],
    notes: [],
    create(ctx) {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.002, 10);
      let block, surface, wire, split, label, outline;

      function draw(target, material) {
        block.material = material;
        camera.aspect = target.width / Math.max(1, target.height);
        camera.updateProjectionMatrix();
        const renderer = ctx.gfx.renderer;
        renderer.setRenderTarget(target);
        renderer.setViewport(0, 0, target.width, target.height);
        renderer.setScissorTest(false);
        renderer.clear(true, true, false);
        renderer.render(scene, camera);
      }

      return {
        async init() {
          scene.background = new THREE.Color(0x20252b);
          scene.environment = ctx.studioEnv;
          block = createReferenceMesh();
          surface = block.material;
          scene.add(block, new THREE.GridHelper(0.32, 16, 0x515c67, 0x38414c));
          const key = new THREE.DirectionalLight(0xffffff, 2);
          key.position.set(-0.4, 0.7, 0.5);
          scene.add(key);

          if (compare) {
            wire = new THREE.MeshBasicMaterial({ color: 0xb8c9db, wireframe: true });
            split = createSplitView(ctx, id);
          } else {
            await ctx.text.loadFonts();
            label = new THREE.Group();
            label.scale.setScalar(0.018);
            label.position.y = 0.085;
            const caption = ctx.text.createTextMesh('100 mm', { size: 0.55, color: 0xf1f4f7 });
            caption.mesh.position.y = -0.2;
            outline = createSelectBox({ width: caption.bounds.width + 0.26, height: 0.82, color: 0xb2c7da });
            label.add(caption.mesh, outline.mesh);
            scene.add(label);
          }
        },
        enter() { split?.reset(); },
        pointer(type, nx) { return split?.pointer(type, nx) ?? false; },
        update(s) {
          const orbit = s.k(1, 0, 1, ctx.ease.inOutCubic);
          const angle = 0.55 + orbit * 0.53 + s.mouse.x * 0.12;
          camera.position.set(Math.sin(angle) * 0.25, 0.135 + s.mouse.y * 0.022, Math.cos(angle) * 0.25);
          camera.lookAt(0, 0.039, 0);
          if (label) {
            label.quaternion.copy(camera.quaternion);
            outline.update(s.sceneTime, s.k(1, 0, 0.5));
          }
        },
        render(target) {
          if (split) split.render(target, (to) => draw(to, surface), (to) => draw(to, wire));
          else draw(target, surface);
        }
      };
    }
  };
}
