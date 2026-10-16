import {THREE, createFlower, addLighting} from './flower-model.js';
const status = document.getElementById('status');
try {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, .1, 40);
  camera.position.set(0, .1, 6.7);
  const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75)); renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-label', 'Hoa hồng 3D có thể xoay');
  document.body.prepend(renderer.domElement);
  const light = addLighting(scene, 4); light.castShadow = true;
  light.shadow.mapSize.set(2048,2048); light.shadow.bias = -.0003;
  Object.assign(light.shadow.camera, {left:-2,right:2,top:3,bottom:-3,near:.1,far:20}); light.shadow.camera.updateProjectionMatrix();
  const flower = createFlower({seed: 3}); flower.position.y = .3; scene.add(flower);
  const stemMaterial = new THREE.MeshStandardMaterial({color:'#4f7150',roughness:.8});
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0,-2.2,-.12), new THREE.Vector3(.06,-1.1,-.2),new THREE.Vector3(0,0,-.14)]);
  const stem = new THREE.Mesh(new THREE.TubeGeometry(curve,32,.027,9,false),stemMaterial); flower.add(stem);
  const leafMaterial = new THREE.MeshStandardMaterial({color:'#668259',side:THREE.DoubleSide,roughness:.65});
  for (const side of [-1,1]) {
    const pos=[],uv=[],idx=[];
    for(let j=0;j<=20;j++)for(let k=0;k<=10;k++){
      const t=j/20,u=(k/10-.5)*2;
      pos.push(side*(t*.68), -1.18+t*.5+u*.21*Math.sin(Math.PI*t), -.16+.12*Math.sin(Math.PI*t)+u*u*.08);
      uv.push(k/10,t);
      if(j<20&&k<10){const a=j*11+k;idx.push(a,a+1,a+11,a+1,a+12,a+11);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
    const leaf=new THREE.Mesh(geo,leafMaterial);leaf.castShadow=true;flower.add(leaf);
  }
  let targetX=-.25,targetY=.32,spin=!matchMedia('(prefers-reduced-motion: reduce)').matches,drag=false,px=0,py=0,frame,last=0;
  function updateButton(){document.getElementById('spin').textContent=spin?'Dừng xoay':'Tự xoay';document.getElementById('spin').setAttribute('aria-pressed',String(spin));}
  updateButton();
  renderer.domElement.addEventListener('pointerdown',e=>{drag=true;px=e.clientX;py=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);});
  renderer.domElement.addEventListener('pointermove',e=>{if(!drag)return;targetY+=(e.clientX-px)*.007;targetX+=(e.clientY-py)*.007;px=e.clientX;py=e.clientY;});
  renderer.domElement.addEventListener('pointerup',()=>{drag=false;});
  renderer.domElement.addEventListener('pointercancel',()=>{drag=false;});
  renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();camera.position.z=THREE.MathUtils.clamp(camera.position.z+e.deltaY*.005,3.6,10);},{passive:false});
  document.getElementById('front').onclick=()=>{targetX=-.08;targetY=0;spin=false;updateButton();};
  document.getElementById('side').onclick=()=>{targetX=-.22;targetY=.95;spin=false;updateButton();};
  document.getElementById('spin').onclick=()=>{spin=!spin;updateButton();};
  addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
  function render(now){frame=requestAnimationFrame(render);if(document.hidden||now-last<1000/30)return;last=now;if(spin&&!drag)targetY+=.002;flower.rotation.x+=(targetX-flower.rotation.x)*.07;flower.rotation.y+=(targetY-flower.rotation.y)*.07;renderer.render(scene,camera);}
  frame=requestAnimationFrame(render);status.textContent='Cánh hoa, ánh sáng và chuyển động được dựng bằng Three.js';
  addEventListener('pagehide',()=>{cancelAnimationFrame(frame);flower.userData.dispose();renderer.dispose();},{once:true});
}catch(error){status.textContent='Trình duyệt này chưa mở được WebGL. Bạn có thể quay lại món quà.';console.error(error);}
