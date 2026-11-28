// 全片总装清单：按播放顺序引用每一幕的当前主选候选。
// 各幕仍在 acts/ 下独立开发与单独预览；换候选或调顺序只改这里的一行引用。
import act01 from '../acts/act-01-vision/candidates/mcp-global-light/scene.js';
import act02 from '../acts/act-02-consensus/candidates/gallery-light/scene.js';
import act03 from '../acts/act-03-disruption/candidates/scale-light/scene.js';
import act04 from '../acts/act-04-watermelon/candidates/gallery-light/scene.js';
import act05 from '../acts/act-05-customer-discovery/candidates/gallery-light/scene.js';
import act06 from '../acts/act-06-agent-workflow/candidates/gallery-light/scene.js';
import act07 from '../acts/act-07-commerce-platform/candidates/floating-light/scene.js';
import act08 from '../acts/act-08-infrastructure/candidates/floating-light/scene.js';
import act09 from '../acts/act-09-data-security/candidates/floating-light/scene.js';
import act10 from '../acts/act-10-execution/candidates/floating-light/scene.js';
import act11 from '../acts/act-11-finale/candidates/floating-light/scene.js';

export function getMasterScenes() {
  return [act01, act02, act03, act04, act05, act06, act07, act08, act09, act10, act11];
}
