import * as THREE from './vendor/three.module.min.js';

// Editable botanical model. All petals are curved meshes, not image planes.
export const FLOWER_STYLE = {
  throat: '#bd3767', middle: '#ed88a5', edge: '#ffced9',
  roughness: 0.72, sheen: 0.35, maxPixelRatio: 1.5
};
const rand = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const shapes = new Map();
let petalTexture;

function texture() {
  if (petalTexture) return petalTexture;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const pixels = ctx.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = (x / 255 - 0.5) * 2, v = y / 255;
    const vein = Math.sin((u * 29 + Math.sin(v * 5) * 0.4) * Math.PI);
    const value = 132 + vein * 3 + (rand(x + y * 256) - 0.5) * 6;
    const p = (y * 256 + x) * 4;
    pixels.data[p] = pixels.data[p + 1] = pixels.data[p + 2] = value; pixels.data[p + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  petalTexture = new THREE.CanvasTexture(canvas);
  petalTexture.anisotropy = 4;
  return petalTexture;
}

function petalGeometry(seed, photo) {
  const key = `${seed % 5}-${photo}`;
  if (shapes.has(key)) return shapes.get(key);
  const positions = [], colors = [], uvs = [], indices = [];
  const dark = new THREE.Color(FLOWER_STYLE.throat), mid = new THREE.Color(FLOWER_STYLE.middle), pale = new THREE.Color(FLOWER_STYLE.edge);
  const layers = photo ? [
    [8, .47, .54, .40, -.07, .23, .16],
    [9, .45, .42, .33, .02, .30, .13],
    [10, .44, .24, .23, .15, .25, .08]
  ] : [
    [9, .14, .83, .43, -.09, .22, .13],
    [11, .11, .70, .35, .03, .34, .14],
    [9, .07, .51, .29, .17, .37, .12],
    [7, .035, .32, .19, .29, .34, .08],
    [5, .01, .15, .10, .40, .21, .025]
  ];
  layers.forEach(([count, radius, length, width, baseZ, lift, curl], layer) => {
    for (let p = 0; p < count; p++) {
      const id = p + layer * 33 + seed * 7;
      const angle = p * Math.PI * 2 / count + layer * 1.743 + (rand(id) - .5) * .28;
      const ca = Math.cos(angle), sa = Math.sin(angle), start = positions.length / 3;
      const L = length * (.87 + rand(id + 1) * .22), W = width * (.89 + rand(id + 2) * .22);
      const rows = 24, cols = 18;
      for (let j = 0; j <= rows; j++) for (let k = 0; k <= cols; k++) {
        const v = j / rows, u = (k / cols - .5) * 2;
        const contour = Math.pow(Math.sin(Math.PI * v), .62);
        const x = u * W * contour + .035 * Math.sin(v * 3) * (rand(id + 3) - .5);
        const y = radius + L * Math.sin(v * Math.PI * .5) - .055 * u * u * contour;
        const z = baseZ + lift * Math.sin(v * Math.PI * .78) - curl * Math.pow(v, 5)
          + .075 * u * u * contour + .012 * Math.sin(u * 6 + id) * Math.pow(v, 3) * contour
          + .018 * Math.sin(v * 5 + id) * u * contour;
        positions.push(x * ca - y * sa, x * sa + y * ca, z);
        const edge = Math.pow(v, 1.1) * .45 + Math.abs(u) * .16;
        const color = dark.clone().lerp(mid, Math.min(1, v * 3 + .15));
        color.lerp(pale, Math.min(.93, edge));
        color.multiplyScalar(.94 + rand(id + 9) * .1);
        colors.push(color.r, color.g, color.b); uvs.push(k / cols, v);
        if (j < rows && k < cols) {
          const a = start + j * (cols + 1) + k, b = a + cols + 1;
          indices.push(a, a + 1, b, a + 1, b + 1, b);
        }
      }
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  shapes.set(key, geometry); return geometry;
}

export function createFlower({seed = 0, photo = ''} = {}) {
  const root = new THREE.Group();
  const material = new THREE.MeshPhysicalMaterial({
    vertexColors: true, side: THREE.DoubleSide,
    roughness: FLOWER_STYLE.roughness, metalness: 0,
    sheen: FLOWER_STYLE.sheen, sheenRoughness: .8, sheenColor: new THREE.Color('#ffc9d8'),
    bumpMap: texture(), bumpScale: .003, clearcoat: 0,
    transparent: true, opacity: 1
  });
  const petals = new THREE.Mesh(petalGeometry(seed, Boolean(photo)), material);
  petals.castShadow = true; petals.receiveShadow = true; root.add(petals);
  const materials = [material]; let imageTexture;
  if (photo) {
    const photoMaterial = new THREE.MeshBasicMaterial({color: '#fff0e5', transparent: true});
    const disk = new THREE.Mesh(new THREE.CircleGeometry(.50, 64), photoMaterial);
    disk.position.z = .40; root.add(disk); materials.push(photoMaterial);
    root.userData.photoDisk = disk;
    let alive = true;
    imageTexture = new THREE.TextureLoader().load(photo, tex => {
      if (!alive) { tex.dispose(); return; }
      tex.colorSpace = THREE.SRGBColorSpace;
      const ratio = tex.image.width / tex.image.height;
      if (ratio > 1) {tex.repeat.x = 1 / ratio; tex.offset.x = (1 - tex.repeat.x) / 2;}
      else {tex.repeat.y = ratio; tex.offset.y = (1 - ratio) / 2;}
      photoMaterial.map = tex; photoMaterial.color.set('#ffffff'); photoMaterial.needsUpdate = true;
    }, undefined, () => {});
    root.userData.disposePhoto = () => { alive = false; disk.geometry.dispose(); imageTexture?.dispose(); };
  }
  root.userData.setOpacity = value => materials.forEach(m => {m.opacity = value;});
  root.userData.dispose = () => { materials.forEach(m => m.dispose()); root.userData.disposePhoto?.(); };
  return root;
}

export function addLighting(scene, extent = 1000) {
  scene.add(new THREE.HemisphereLight('#fff1e6', '#b46b80', 1.65));
  const key = new THREE.DirectionalLight('#fff1dd', 2.6);
  key.position.set(-extent * .4, extent * .65, extent); scene.add(key);
  const rim = new THREE.DirectionalLight('#ffb1c7', 1.2);
  rim.position.set(extent * .6, extent * .3, -extent * .3); scene.add(rim);
  const fill = new THREE.DirectionalLight('#dce8ff', .65);
  fill.position.set(extent * .7, -extent * .2, extent * .5); scene.add(fill);
  return key;
}
export {THREE};
