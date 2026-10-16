import * as THREE from '/vendor/three.module.min.js';
const $=s=>document.querySelector(s);
// Share the same content as the main gift, in the local server and static build.
const gift=await fetch('/gift-config.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json();}).catch(()=>({}));
const configuredPhotos=gift.chapters?.flatMap(chapter=>chapter.photos?.map(photo=>photo.src)||[])||[];
const albumPhotos=await fetch('/falling/album.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json();}).catch(()=>[]);
const photos=[...new Set(Array.isArray(albumPhotos)&&albumPhotos.length?albumPhotos:configuredPhotos.length?configuredPhotos:Array.from({length:11},(_,i)=>`/gift/photos/p${String(i+1).padStart(2,'0')}.jpg`))];
const wishes=gift.falling?.wishes || ['Chúc mừng 20/10!','Các bạn nữ lớp 11 Tin','Luôn vui vẻ nhé!','Tự tin là chính mình','Học tốt, chơi vui','Mong an chong lon','Chúc càng bạn càng móc càng lên tay','Một năm học thật đáng nhớ','Từ các bạn nam trong lớp'];
const audio=$('#audio');
if(gift.music?.loop)audio.src=gift.music.loop;
let selected=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
function updatePhoto(index){
  selected=(index+photos.length)%photos.length;
  $('#large').src=photos[selected];
  $('#large').alt=`Kỷ niệm lớp mình — ảnh ${selected+1}`;
  $('#photo-count').textContent=`${selected+1} / ${photos.length}`;
  document.querySelectorAll('#thumbnails button').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===selected)));
}
function viewPhoto(index=0){updatePhoto(index);if(!$('#viewer').open)$('#viewer').showModal();}
photos.forEach((src,i)=>{
  const button=document.createElement('button'),image=new Image();
  button.type='button';button.setAttribute('aria-label',`Xem ảnh ${i+1}`);
  image.src=src;image.alt='';image.loading='lazy';button.append(image);
  button.onclick=()=>updatePhoto(i);$('#thumbnails').append(button);
});
$('#album').onclick=()=>viewPhoto(selected);
$('#previous').onclick=()=>updatePhoto(selected-1);
$('#next').onclick=()=>updatePhoto(selected+1);
$('#viewer').addEventListener('keydown',event=>{
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();updatePhoto(selected+(event.key==='ArrowRight'?1:-1));}
});
function updatePause(){
  $('#pause').textContent=paused?'Tiếp tục':'Tạm dừng';
  $('#pause').setAttribute('aria-label',paused?'Tiếp tục ảnh chuyển động':'Dừng ảnh chuyển động');
  $('#pause').setAttribute('aria-pressed',String(paused));
}
$('#pause').onclick=()=>{paused=!paused;updatePause();};updatePause();
function updateMusic(){
  $('#music').textContent=audio.paused?'♫':'Ⅱ';
  $('#music').setAttribute('aria-label',audio.paused?'Bật nhạc':'Tắt nhạc');
  $('#music').setAttribute('aria-pressed',String(!audio.paused));
}
audio.addEventListener('play',updateMusic);audio.addEventListener('pause',updateMusic);
let resumeAudio=false;
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){resumeAudio=!audio.paused;audio.pause();}
  else if(resumeAudio){resumeAudio=false;audio.play().catch(()=>{});}
});

function music(){if(audio.paused)audio.play().then(()=>{$('#music').textContent='Ⅱ';$('#music').setAttribute('aria-label','Tắt nhạc');}).catch(()=>{});else{audio.pause();$('#music').textContent='♫';$('#music').setAttribute('aria-label','Bật nhạc');}}
$('#music').onclick=music;
$('#close').onclick=()=>$('#viewer').close();
$('#viewer').onclick=e=>{if(e.target===$('#viewer'))$('#viewer').close();};
function showFallback(){
  document.body.classList.add('fallback');$('#fallback').hidden=false;
  $('#skip').hidden=true;$('#hint').hidden=true;$('#pause').hidden=true;
  if($('#gallery').childElementCount)return;
  photos.forEach((src,i)=>{
    const button=document.createElement('button'),img=new Image();
    button.type='button';button.setAttribute('aria-label',`Xem ảnh ${i+1}`);
    img.src=src;img.alt=`Kỷ niệm lớp mình — ảnh ${i+1}`;img.loading='lazy';
    button.append(img);button.onclick=()=>viewPhoto(i);$('#gallery').append(button);
  });
}
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas:$('#sky'),antialias:true,alpha:false});}catch(e){showFallback();}
await document.fonts.load('48px Mali').catch(()=>{});
if(renderer){
  $('#sky').addEventListener('webglcontextlost',event=>{event.preventDefault();showFallback();});
  try{run();}catch(error){console.warn('Không thể khởi tạo cảnh kỷ niệm:',error);showFallback();}
}
function run() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x07030d);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, .1, 280);
  camera.position.z = 42;
  const world = new THREE.Group();
  scene.add(world);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = innerWidth < 700;
  let phase = 'idle', current = -1, time = 0, began = 0, rainTime = 0, frameId;
  let holdStart = null, drag = null, yaw = 0, pitch = 0, distance = 32;
  let lastFrame = 0;
  const resources = new Set();
  const keep = resource => (resources.add(resource), resource);
  const random = (low, high) => low + Math.random() * (high - low);
  const setPhase = value => { phase = value; document.body.dataset.phase = value; };
  setPhase('idle');

  function texture(draw, width = 128, height = width) {
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    draw(canvas.getContext('2d'), width, height);
    const map = keep(new THREE.CanvasTexture(canvas));
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }
  const glow = texture((ctx, w) => {
    const gradient = ctx.createRadialGradient(w/2, w/2, 0, w/2, w/2, w/2);
    gradient.addColorStop(0, '#fff'); gradient.addColorStop(.16, '#fff9');
    gradient.addColorStop(.45, '#fff3'); gradient.addColorStop(1, '#fff0');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, w);
  });
  const heartMap = texture((ctx) => {
    ctx.translate(64, 64); ctx.scale(2.5, 2.5);
    ctx.beginPath(); ctx.moveTo(0, 15);
    ctx.bezierCurveTo(-30, -3, -13, -25, 0, -12);
    ctx.bezierCurveTo(13, -25, 30, -3, 0, 15);
    ctx.fillStyle = '#ff0528'; ctx.shadowColor = '#ff426a'; ctx.shadowBlur = 5; ctx.fill();
    ctx.strokeStyle = '#ff99b5'; ctx.lineWidth = .65; ctx.stroke();
  });
  function points(positions, size, color, opacity = 1, colors) {
    const geometry = keep(new THREE.BufferGeometry());
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    if (colors) geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return new THREE.Points(geometry, keep(new THREE.PointsMaterial({
      map: glow, size, color, transparent: true, opacity, depthWrite: false,
      blending: THREE.AdditiveBlending, vertexColors: Boolean(colors)
    })));
  }
  const stars = new Float32Array(2400 * 3);
  for (let i = 0; i < stars.length; i++) stars[i] = random(-120, 120);
  const starfield = points(stars, .27, 0xded5ff, .95);
  scene.add(starfield);

  const diskPositions = new Float32Array(11000 * 3);
  const diskColors = new Float32Array(diskPositions.length);
  const pink = new THREE.Color('#ff579e'), lavender = new THREE.Color('#9878ee');
  for (let i = 0; i < 11000; i++) {
    const radius = 34 * Math.pow(Math.random(), .7), angle = random(0, Math.PI * 2) + radius * .13;
    diskPositions.set([Math.cos(angle) * radius, random(-.35, .35), Math.sin(angle) * radius], i*3);
    const color = pink.clone().lerp(lavender, radius / 34);
    diskColors.set([color.r, color.g, color.b], i*3);
  }
  const galaxy = points(diskPositions, .115, 0xffffff, .6, diskColors);
  galaxy.rotation.x = .3; galaxy.position.y = -10;
  scene.add(galaxy);

  const count = mobile ? 10000 : 16000;
  const positions = new Float32Array(count * 3), targets = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const radius = random(10, 13), theta = random(0, Math.PI * 2), phi = Math.acos(random(-1, 1));
    positions.set([radius*Math.sin(phi)*Math.cos(theta), radius*Math.cos(phi), radius*Math.sin(phi)*Math.sin(theta)], i*3);
    colors.set([random(.8, 1), random(.07, .2), random(.3, .5)], i*3);
  }
  targets.set(positions);
  const particles = points(positions, .15, 0xffffff, .95, colors);
  particles.position.y = 2;
  scene.add(particles);
  const textLines = gift.falling?.intro || [
    ['Gửi các bạn nữ', 'lớp 11 Tin'], ['Chúc mừng', '20 / 10'],
    ['Luôn vui vẻ', 'và tự tin nhé!'], ['Cùng lưu lại', 'những kỷ niệm đẹp']
  ];
  function setText(index) {
    current = index;
    const canvas = document.createElement('canvas'); canvas.width = 1400; canvas.height = 500;
    const ctx = canvas.getContext('2d');
    const lines = Array.isArray(textLines[index]) ? textLines[index] : [textLines[index]];
    ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 100px Mali, Arial';
    lines.forEach((line, i) => ctx.fillText(line, 700, 250 + (i - (lines.length-1)/2)*135, 1250));
    const pixels = ctx.getImageData(0, 0, 1400, 500).data, samples = [];
    for (let y=0; y<500; y+=3) for (let x=0; x<1400; x+=3) {
      if (pixels[(y*1400+x)*4+3] > 128) samples.push([x, y]);
    }
    // Bring the opening words closer while keeping long lines inside the viewport.
    const span = Math.min(68, 59 * camera.aspect);
    for (let i=0; i<count; i++) {
      const p = samples[Math.floor(Math.random()*samples.length)] || [700,250];
      targets.set([(p[0]/1400-.5)*span, (.5-p[1]/500)*span*500/1400, random(-.3,.3)], i*3);
    }
    $('#scene-status').textContent = lines.join(' ');
  }
  function resize() {
    renderer.setSize(innerWidth, innerHeight);
    const previousAspect = camera.aspect;
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    if (phase === 'rain') for (const card of cards) {
      card.userData.x *= camera.aspect/previousAspect;
      card.position.x *= camera.aspect/previousAspect;
    }
    if (phase === 'idle') particles.scale.setScalar(Math.min(1, camera.aspect*1.6));
    if (phase === 'text') setText(Math.max(0, current));
  }
  addEventListener('resize', resize); resize();

  function begin() {
    if (phase !== 'idle') return;
    setPhase('text'); began = time;
    particles.scale.setScalar(1); particles.rotation.set(0, 0, 0);
    $('#intro').classList.add('out'); $('#skip').hidden = false;
    setText(0);
  }
  function release() {
    holdStart = null;
    if (phase === 'idle') $('#progress').style.strokeDashoffset = 183;
  }
  function press(event) {
    if (phase !== 'idle' || holdStart !== null) return;
    event.preventDefault(); holdStart = performance.now();
    if (audio.paused) music();
  }
  $('#start').onpointerdown = event => { $('#start').setPointerCapture(event.pointerId); press(event); };
  $('#start').onpointerup = release; $('#start').onpointercancel = release;
  $('#start').onkeydown = event => { if (['Enter', ' '].includes(event.key)) press(event); };
  $('#start').onkeyup = event => { if (['Enter', ' '].includes(event.key)) release(); };
  $('#start').onblur = release;

  function labelTexture(text) {
    // Fit the canvas to the words so the sprite size reflects visible lettering.
    const measure = document.createElement('canvas').getContext('2d');
    measure.font = '64px Mali, Arial';
    const width = Math.ceil(measure.measureText(text).width) + 80;
    return texture((ctx, w, h) => {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '64px Mali, Arial'; ctx.fillStyle = '#fff';
      ctx.shadowColor = '#ff8fe4'; ctx.shadowBlur = 18;
      ctx.fillText(text, w/2, h/2);
    }, width, 128);
  }
  const labels = wishes.map(labelTexture);
  const meteorMap = texture((ctx,w,h) => {
    const trail = ctx.createLinearGradient(0,h,w,0);
    trail.addColorStop(0,'#d5b7ff00'); trail.addColorStop(.9,'#e8d5ff88'); trail.addColorStop(1,'#fff');
    ctx.strokeStyle = trail; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(0,h); ctx.lineTo(w,0); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(w-5,5,2.5,0,Math.PI*2); ctx.fill();
  },256,128);
  const meteors = new THREE.Group(); scene.add(meteors);
  for (let i=0;i<7;i++) {
    const meteor = new THREE.Sprite(keep(new THREE.SpriteMaterial({map:meteorMap,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));
    meteor.position.set(random(-65,65),random(-35,45),-45); meteor.scale.set(7,3.5,1);
    meteor.userData.delay = i*1.4; meteors.add(meteor);
  }
  meteors.visible = false;
  const cards = [];
  function sprite(map, x, y, z, width, height, speed, data = {}) {
    const material = keep(new THREE.SpriteMaterial({map, transparent: true, depthWrite: false}));
    const card = new THREE.Sprite(material);
    card.position.set(x, y, z); card.scale.set(width, height, 1);
    card.userData = {speed, seed: random(0, 20), x, ...data};
    world.add(card); cards.push(card); return card;
  }
  const photoTextures = new Map();
  let nextPhoto = 0;
  function loadPhoto(src, card) {
    card.userData.src = src;
    card.material.opacity = 0;
    if (!photoTextures.has(src)) photoTextures.set(src, new Promise(resolve => {
      new THREE.TextureLoader().load(src, image => {
        const aspect = image.image.width / image.image.height;
        const resolution = mobile ? 480 : 640;
        const width = aspect >= 1 ? resolution : Math.max(128, Math.round(resolution*aspect));
        const height = aspect >= 1 ? Math.max(128, Math.round(resolution/aspect)) : resolution;
        const map = texture(ctx => {
          ctx.save(); ctx.beginPath(); ctx.roundRect(12, 12, width-24, height-24, 16);
          ctx.clip(); ctx.drawImage(image.image, 12, 12, width-24, height-24); ctx.restore();
          ctx.strokeStyle = '#ffb2d677'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.roundRect(12, 12, width-24, height-24, 16); ctx.stroke();
        }, width, height);
        // Moving photo cards do not need mipmaps; keep the album light on GPU memory.
        map.generateMipmaps = false;
        map.minFilter = THREE.LinearFilter;
        image.dispose(); resolve({map, aspect});
      }, undefined, () => resolve(null));
    }));
    photoTextures.get(src).then(photo => {
      if (card.userData.src !== src) return;
      if (!photo) { card.visible = false; return; }
      card.visible = true;
      card.material.map = photo.map; card.material.opacity = 1; card.material.needsUpdate = true;
      const height = card.userData.photoHeight;
      card.scale.set(height*photo.aspect, height, 1);
    });
  }
  function rain() {
    if (phase === 'rain') return;
    setPhase('rain'); rainTime = 0;
    camera.fov = 60; camera.position.set(0, 0, distance); camera.updateProjectionMatrix();
    particles.visible = false; galaxy.visible = false; meteors.visible = true;
    $('#intro').classList.add('out'); $('#skip').hidden = true;
    $('#hint').hidden = false; $('#pause').hidden = false;
    $('#scene-status').textContent = 'Mưa lời chúc và ảnh kỷ niệm. Mở Album ảnh để xem từng ảnh.';
    // Include a close foreground: large wishes can drift past the screen edges.
    // Each depth layer fills the viewport instead of scattering cards out of view.
    const depths = [17, 7, -5, -20, -40];
    if (!mobile) for (let i=0;i<3;i++) {
      const map = labels[(i*3)%labels.length], height = random(2.2,3.2);
      const visibleHeight = 2*(distance-24)*Math.tan(camera.fov*Math.PI/360);
      sprite(map, (i-1)*visibleHeight*camera.aspect*.36, (i-1)*visibleHeight*.42, 24,
        height*map.image.width/map.image.height, height, .65,
        {text:true, wrapHeight:visibleHeight*1.8});
    }
    depths.forEach((z, layer) => {
      const height = 2*(distance-z)*Math.tan(camera.fov*Math.PI/360);
      const span = height*camera.aspect;
      // Reuse a fixed number of cards as photos cycle through the whole album.
      const photoCount = mobile ? 4 : 8;
      for (let col=0; col<photoCount; col++) {
        const src = photos[nextPhoto++%photos.length];
        const photoHeight = layer === 0 ? random(3.4,4.8) : random(4.8,7);
        const card = sprite(null, ((col+.5)/photoCount-.5)*span*.86,
          ((col*.618+layer*.37)%1-.5)*height, z, 5, photoHeight, random(.85,1.4),
          {photo:true, src, photoHeight, wrapHeight:height*1.2});
        card.material.opacity = 0; loadPhoto(src, card);
      }
      const textColumns = mobile ? 3 : 6, rows = 4;
      for (let col=0; col<textColumns; col++) for (let row=0; row<rows; row++) {
        const map = labels[(layer+col+row)%labels.length];
        const textHeight = layer === 0 ? random(1.1,2.3) : random(1.5,2.7);
        const x = ((col+random(.1,.9))/textColumns-.5)*span*1.12;
        const y = ((row+random(.05,.95))/rows-.5)*height*1.2;
        const card = sprite(map, x, y, z-1, textHeight*map.image.width/map.image.height,
          textHeight, random(.8,1.6), {text:true, wrapHeight:height*1.4});
        card.material.color.set('#ffb3e4');
      }
      for (let n=0; n<(mobile?5:8); n++) {
        const size = random(.65,1.65);
        sprite(heartMap, random(-span/2,span/2), random(-height/2,height/2), z+.5,
          size, size, random(.6,1.2), {heart:true, wrapHeight:height*1.3});
      }
    });

  }
  $('#skip').onclick = rain;
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  const canvas = $('#sky');
  canvas.onpointerdown = event => {
    if (phase !== 'rain') return;
    canvas.setPointerCapture(event.pointerId);
    drag = {id:event.pointerId, x:event.clientX, y:event.clientY, lastX:event.clientX, lastY:event.clientY, moved:false};
  };
  canvas.onpointermove = event => {
    if (!drag || drag.id !== event.pointerId) return;
    if (Math.hypot(event.clientX-drag.x, event.clientY-drag.y)>7) drag.moved = true;
    yaw += (event.clientX-drag.lastX)*.003;
    pitch = THREE.MathUtils.clamp(pitch+(event.clientY-drag.lastY)*.002, -.65, .65);
    drag.lastX = event.clientX; drag.lastY = event.clientY;
  };
  canvas.onpointerup = event => {
    if (!drag || drag.id !== event.pointerId) return;
    const moved = drag.moved; drag = null; if (moved) return;
    mouse.set(event.clientX/innerWidth*2-1, 1-event.clientY/innerHeight*2);
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObjects(cards).find(hit => hit.object.visible && hit.object.userData.photo && hit.object.material.opacity>0);
    if (hit) viewPhoto(photos.indexOf(hit.object.userData.src));
  };
  canvas.onpointercancel = () => {drag = null;};
  canvas.addEventListener('wheel', event => {
    if (phase !== 'rain') return;
    event.preventDefault(); distance = THREE.MathUtils.clamp(distance + event.deltaY*.025, 28, 52);
  }, {passive:false});

  function frame(now) {
    frameId = requestAnimationFrame(frame);
    if (now-lastFrame<1000/30) return;
    const dt = Math.min((now-lastFrame)/1000, .05); lastFrame = now;
    if (document.hidden || $('#viewer').open || document.body.classList.contains('fallback')) return;
    time += dt;
    if (holdStart !== null && phase === 'idle') {
      const held = Math.min((performance.now()-holdStart)/1000, 1);
      $('#progress').style.strokeDashoffset = 183*(1-held);
      if (held>=1) { release(); begin(); }
    }
    if (phase === 'idle') {
      if (!reduced) {particles.rotation.y = time*.13; particles.rotation.z = Math.sin(time*.2)*.08; galaxy.rotation.y = time*.06;}
    } else if (phase === 'text' || phase === 'burst') {
      particles.position.y += (0-particles.position.y)*Math.min(1,dt*4);
      const elapsed = time-began;
      if (phase === 'text') {
        const index = Math.floor(elapsed/3.8);
        if (index >= textLines.length) {
          setPhase('burst'); began = time;
          for (let i=0; i<targets.length; i++) targets[i] = random(-100, 100);
        } else if (index !== current) setText(index);
      }
      const speed = phase === 'burst' ? 1.5 : 4.5;
      for (let i=0; i<positions.length; i++) positions[i] += (targets[i]-positions[i])*Math.min(1,dt*speed);
      particles.geometry.attributes.position.needsUpdate = true;
      if (phase === 'burst') {particles.material.opacity = Math.max(0,1-(time-began)); if (time-began>1) rain();}
    }
    if (phase === 'rain') {
      if (!paused) {
        rainTime += dt;
        for (const meteor of meteors.children) {
          const cycle = (rainTime+meteor.userData.delay)%10;
          meteor.material.opacity = cycle<2 ? Math.sin(cycle*Math.PI/2)*.8 : 0;
          meteor.position.x -= dt*5; meteor.position.y -= dt*2.5;
          if (meteor.position.y < -40 || meteor.position.x < -75) meteor.position.set(random(-30,75),random(25,50),-45);
        }
      }
      world.rotation.y += (yaw-world.rotation.y)*.06; world.rotation.x += (pitch-world.rotation.x)*.06;
      camera.position.z += (distance-camera.position.z)*.08;
      for (const card of cards) {
        const data = card.userData;
        if (!paused) {
          card.position.y -= dt*data.speed*4;
          const halfHeight = data.wrapHeight/2;
          if (card.position.y < -halfHeight) {
            card.position.y += data.wrapHeight;
            if (data.photo) loadPhoto(photos[nextPhoto++%photos.length], card);
          }
          if (data.photo) {card.position.x = data.x + Math.sin(rainTime*.6+data.seed)*.5; card.material.rotation = Math.sin(rainTime*.5+data.seed)*.04;}
        }
        if (data.text) card.material.color.setHSL(.87 + Math.sin(rainTime*.3+data.seed)*.045, .8, .83);
        if (data.heart) card.material.opacity = .7 + .3*Math.sin(rainTime+data.seed)**2;
      }
    }
    if (!reduced && !(phase === 'rain' && paused)) starfield.rotation.y += dt*.006;
    renderer.render(scene, camera);
  }
  frameId = requestAnimationFrame(frame);
  addEventListener('pagehide', () => {
    cancelAnimationFrame(frameId); removeEventListener('resize', resize);
    renderer.dispose(); resources.forEach(resource => resource.dispose());
  }, {once:true});
}
