import * as THREE from './vendor/three.module.min.js';

// Photographic botanical surfaces on shallow, curved 3D meshes.
// Keep the original photo centres while replacing the uniformly coloured petals.
const atlasURL = '/botanical/bouquet-atlas.png';
const roseTextures = [0, 1].map(column => {
  const texture = new THREE.TextureLoader().load(atlasURL);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.repeat.set(.5, .5); texture.offset.set(column * .5, .5);
  texture.anisotropy = 8;
  return texture;
});
const geometryCache = new Map();
function geometry(seed) {
  const key = seed % 5;
  if (geometryCache.has(key)) return geometryCache.get(key);
  const geometry = new THREE.PlaneGeometry(2.36, 2.36, 48, 48);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), r = Math.hypot(x,y), angle = Math.atan2(y,x);
    const bowl = .25 * Math.exp(-r * r * 1.8);
    const relief = .018 * Math.sin(angle * 9 + r * 21 + key) * Math.sin(Math.min(1,r) * Math.PI);
    p.setZ(i, bowl + relief);
  }
  geometry.computeVertexNormals(); geometryCache.set(key,geometry); return geometry;
}
function softenPhoto(material) {
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vPhotoUV;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvPhotoUV = uv;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vPhotoUV;')
      .replace('#include <alphatest_fragment>', '#include <alphatest_fragment>\ndiffuseColor.a *= 1.0 - smoothstep(0.46, 0.5, distance(vPhotoUV, vec2(0.5)));');
  };
  material.customProgramCacheKey = () => 'bouquet-soft-photo-v1';
}
export function createBouquetFlower({seed = 0, photo = ''} = {}) {
  const root = new THREE.Group(), map = roseTextures[seed % 5 === 0 ? 1 : 0];
  const material = new THREE.MeshBasicMaterial({map, side:THREE.DoubleSide, transparent:true, alphaTest:.025});
  // Feathered irregular opening lets the petals overlap the photograph naturally.
  if (photo) {
    material.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vBotanicalUV;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\nvBotanicalUV = uv;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vBotanicalUV;')
        .replace('#include <alphatest_fragment>', `
          vec2 q = vBotanicalUV - vec2(0.5);
          float angle = atan(q.y, q.x);
          float edge = .204 + .005 * sin(angle * 11.0) + .003 * sin(angle * 19.0 + 1.0);
          diffuseColor.a *= smoothstep(edge - .009, edge + .006, length(q));
          #include <alphatest_fragment>
        `);
    };
    material.customProgramCacheKey = () => 'bouquet-photo-petals-v1';
  }
  const bloom = new THREE.Mesh(geometry(seed),material); root.add(bloom);
  const materials = [material]; let disposed = false, photoTexture, photoGeo;
  if (photo) {
    const m = new THREE.MeshBasicMaterial({color:'#f2d9cf',transparent:true});
    softenPhoto(m);
    photoGeo = new THREE.CircleGeometry(.53,80);
    const disk = new THREE.Mesh(photoGeo,m); disk.position.z = .18;
    root.add(disk); root.userData.photoDisk = disk; materials.push(m);
    photoTexture = new THREE.TextureLoader().load(photo, tex => {
      if (disposed) {tex.dispose(); return;}
      tex.colorSpace = THREE.SRGBColorSpace;
      const ratio = tex.image.width / tex.image.height;
      if (ratio > 1) {tex.repeat.x = 1 / ratio; tex.offset.x = (1 - tex.repeat.x) / 2;}
      else {tex.repeat.y = ratio; tex.offset.y = (1 - ratio) / 2;}
      m.map = tex; m.color.set('#ffffff'); m.needsUpdate = true;
    });
  }
  root.userData.isReady = () => Boolean(map.image?.complete && map.image.naturalWidth);
  root.userData.setOpacity = opacity => materials.forEach(m => {m.opacity = opacity;});
  root.userData.dispose = () => {disposed = true; materials.forEach(m=>m.dispose()); photoTexture?.dispose(); photoGeo?.dispose();};
  return root;
}
