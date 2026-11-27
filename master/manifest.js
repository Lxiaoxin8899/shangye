import { createReferenceScene } from '../core/sandbox/reference-scenes.js';

// Import selected candidates' default exports here and return them in playback order.
// Each entry needs a unique id, at least one beat, and a create(ctx) factory.
export function getMasterScenes() {
  return [
    createReferenceScene({ id: 'split-view', title: '材质与线框', compare: true }),
    createReferenceScene({ id: 'dimensions', title: '尺寸与选框' })
  ];
}
