import {THREE, createFlower, addLighting, FLOWER_STYLE} from './flower-model.js';
import {createBouquetFlower} from './bouquet-materials.js';

// One shared WebGL context for every flower, including moving photo blooms.
// The original DOM controls all scene timing; the renderer follows its layout.
const slots = new Map();
let renderer, scene, camera, light, observer, frame, last = 0;
const pointer = {x: 0, y: 0}, motion = {x: 0, y: 0};
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let width = innerWidth, height = innerHeight;
function disposeSlot(el, entry) {
  scene.remove(entry.flower); entry.flower.userData.dispose();
  el.classList.remove('flower-3d-ready'); slots.delete(el);
}
function sync() {
  for (const [el, entry] of slots) if (!el.isConnected) disposeSlot(el, entry);
  document.querySelectorAll('[data-flower-3d]').forEach(el => {
    if (slots.has(el)) return;
    const make = el.getAttribute('data-flower-3d') === 'bouquet' ? createBouquetFlower : createFlower;
    const flower = make({seed: Number(el.dataset.seed || 0), photo: el.dataset.photo || ''});
    scene.add(flower); slots.set(el, {flower, seed: Number(el.dataset.seed || 0)});
  });
  // Clear the previous scene once; image-only intro needs no WebGL rendering.
  if (!slots.size) renderer.clear();
}
function resize() {
  width = innerWidth; height = innerHeight;
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(devicePixelRatio, FLOWER_STYLE.maxPixelRatio));
  camera.left = -width / 2; camera.right = width / 2;
  camera.top = height / 2; camera.bottom = -height / 2; camera.updateProjectionMatrix();
  const reach = Math.max(width, height);
  Object.assign(light.shadow.camera, {left: -reach / 2, right: reach / 2, top: reach / 2, bottom: -reach / 2});
  light.shadow.camera.updateProjectionMatrix();
}
function tick(now) {
  frame = requestAnimationFrame(tick);
  if (document.hidden || now - last < 1000 / 30) return;
  last = now;
  if (!slots.size) return;
  motion.x += (pointer.x - motion.x) * .065; motion.y += (pointer.y - motion.y) * .065;
  const styleCache = new Map();
  function inheritedOpacity(el) {
    if (!el || el === document.body) return 1;
    if (styleCache.has(el)) return styleCache.get(el);
    const css = getComputedStyle(el);
    const value = css.display === 'none' || css.visibility === 'hidden' ? 0 : Number(css.opacity) * inheritedOpacity(el.parentElement);
    styleCache.set(el, value); return value;
  }
  let visible = 0;
  for (const [el, entry] of slots) {
    const {flower, seed} = entry, rect = el.getBoundingClientRect(), opacity = inheritedOpacity(el);
    const ready = !flower.userData.isReady || flower.userData.isReady();
    flower.visible = ready && opacity > .005 && rect.width > 1 && rect.bottom > 0 && rect.top < height;
    if (!flower.visible) continue;
    visible++;
    const radius = Math.min(rect.width, rect.height) * .5;
    flower.position.set(rect.left + rect.width / 2 - width / 2, height / 2 - rect.top - rect.height / 2, Number(el.dataset.depth || 0));
    flower.scale.setScalar(radius);
    const tiltX = Number(el.dataset.tiltX || 0), tiltY = Number(el.dataset.tiltY || 0);
    flower.rotation.set(tiltX * Math.PI / 180 + (reduced.matches ? 0 : motion.y * .14),
      tiltY * Math.PI / 180 + (reduced.matches ? 0 : motion.x * .2),
      seed * 2.39996 + (reduced.matches ? 0 : Math.sin(now * .00045 + seed) * .035));
    if (flower.userData.photoDisk) flower.userData.photoDisk.rotation.z = -flower.rotation.z;
    flower.userData.setOpacity(opacity);
  }
  renderer.domElement.dataset.flowers = String(visible);
  renderer.render(scene, camera);
  // Hide the fallback only after a successful WebGL render.
  for (const [el, {flower}] of slots) {
    if (!flower.userData.isReady || flower.userData.isReady()) el.classList.add('flower-3d-ready');
  }
}
function fallback() {
  cancelAnimationFrame(frame); observer?.disconnect();
  for (const [el, entry] of slots) disposeSlot(el, entry);
  renderer?.domElement.remove(); renderer?.dispose();
}
try {
  renderer = new THREE.WebGLRenderer({alpha: true, antialias: true, powerPreference: 'high-performance'});
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.id = 'flowers-webgl';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:55;width:100%;height:100%';
  renderer.domElement.addEventListener('webglcontextlost', event => {event.preventDefault(); fallback();});
  document.body.append(renderer.domElement);
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, .1, 4000);
  camera.position.z = 2000;
  light = addLighting(scene, 1300);
  light.castShadow = true; light.shadow.mapSize.set(2048, 2048);
  light.shadow.camera.near = 10; light.shadow.camera.far = 4000;
  light.shadow.bias = -.00015; light.shadow.normalBias = .7;
  resize(); sync();
  observer = new MutationObserver(sync); observer.observe(document.getElementById('app'), {childList: true, subtree: true});
  addEventListener('resize', resize);
  addEventListener('pointermove', event => {pointer.x = event.clientX / width * 2 - 1; pointer.y = event.clientY / height * 2 - 1;}, {passive: true});
  frame = requestAnimationFrame(tick);
  addEventListener('pagehide', fallback, {once: true});
} catch (error) {
  console.warn('3D flowers unavailable; showing original flowers.', error);
  fallback();
}
