/* ---------------- scroll reveal ---------------- */
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
},{ threshold:0.15 });
revealEls.forEach(el=>io.observe(el));

/* ---------------- background scene grid (ambient, purposeful: node/graph field) ---------------- */
(function(){
  const canvas = document.getElementById('bg-grid');
  const ctx = canvas.getContext('2d');
  let w,h,points=[];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const count = Math.min(70, Math.floor((w*h)/22000));
    points = Array.from({length:count}, ()=>({
      x: Math.random()*w, y: Math.random()*h,
      vx:(Math.random()-0.5)*0.15, vy:(Math.random()-0.5)*0.15
    }));
  }
  window.addEventListener('resize', resize);
  resize();

  function step(){
    ctx.clearRect(0,0,w,h);
    for(const p of points){
      if(!reduced){ p.x+=p.vx; p.y+=p.vy; }
      if(p.x<0||p.x>w) p.vx*=-1;
      if(p.y<0||p.y>h) p.vy*=-1;
    }
    for(let i=0;i<points.length;i++){
      for(let j=i+1;j<points.length;j++){
        const a=points[i], b=points[j];
        const d = Math.hypot(a.x-b.x, a.y-b.y);
        if(d<130){
          ctx.strokeStyle = `rgba(120,140,220,${0.09*(1-d/130)})`;
          ctx.lineWidth=1;
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }
      ctx.fillStyle='rgba(150,170,255,0.35)';
      ctx.beginPath(); ctx.arc(points[i].x, points[i].y, 1.4, 0, Math.PI*2); ctx.fill();
    }
    requestAnimationFrame(step);
  }
  step();
})();

/* ---------------- hero 3D neural sphere (three.js) ---------------- */
(function(){
  const el = document.querySelector('.viewport');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 6.2;

  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  el.appendChild(renderer.domElement);

  function fit(){
    const size = el.clientWidth;
    renderer.setSize(size, size, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }
  fit();
  window.addEventListener('resize', fit);

  const group = new THREE.Group();
  scene.add(group);

  // core wireframe icosahedron (behaviour-tree / NPC framework core)
  const coreGeo = new THREE.IcosahedronGeometry(1.9, 1);
  const coreEdges = new THREE.EdgesGeometry(coreGeo);
  const coreMat = new THREE.LineBasicMaterial({ color: 0x5EEAD4, transparent:true, opacity:0.55 });
  const core = new THREE.LineSegments(coreEdges, coreMat);
  group.add(core);

  // outer shell, offset rotation, violet
  const shellGeo = new THREE.IcosahedronGeometry(2.55, 1);
  const shellEdges = new THREE.EdgesGeometry(shellGeo);
  const shellMat = new THREE.LineBasicMaterial({ color: 0x9C8CFB, transparent:true, opacity:0.25 });
  const shell = new THREE.LineSegments(shellEdges, shellMat);
  group.add(shell);

  // node points at icosahedron vertices
  const nodeGeo = new THREE.IcosahedronGeometry(1.9, 1);
  const nodeMat = new THREE.PointsMaterial({ color: 0xEDEDF7, size: 0.075, transparent:true, opacity:0.9 });
  const nodes = new THREE.Points(nodeGeo, nodeMat);
  group.add(nodes);

  const nodeCount = nodeGeo.attributes.position.count;
  document.getElementById('hud-nodes').textContent = 'NODES: ' + nodeCount;

  // gentle ambient point light feel via a second color pass isn't needed for line materials,
  // but add a soft point light in case geometry is swapped for shaded meshes later.
  const light = new THREE.PointLight(0x9C8CFB, 1.2);
  light.position.set(4,4,4);
  scene.add(light);

  let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
  el.addEventListener('mousemove', (e)=>{
    const rect = el.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  });
  el.addEventListener('mouseleave', ()=>{ mouseX = 0; mouseY = 0; });

  let t = 0;
  function animate(){
    t += 0.004;
    if(!reduced){
      group.rotation.y += 0.0028;
      group.rotation.x = Math.sin(t*0.6)*0.08;
      shell.rotation.y -= 0.0016;
    }
    targetX += (mouseX - targetX) * 0.04;
    targetY += (mouseY - targetY) * 0.04;
    camera.position.x = targetX * 0.9;
    camera.position.y = -targetY * 0.9;
    camera.lookAt(0,0,0);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  const statuses = ['RENDERING','SIMULATING','ONLINE'];
  let si = 0;
  if(!reduced){
    setInterval(()=>{ si=(si+1)%statuses.length; document.getElementById('hud-status').textContent = 'STATUS: ' + statuses[si]; }, 3200);
  }
})();

/* ---------------- glass card 3D tilt on hover ---------------- */
document.querySelectorAll('.project-card').forEach(card=>{
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced) return;
  card.addEventListener('mousemove', (e)=>{
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(900px) rotateY(${x*3.5}deg) rotateX(${-y*3.5}deg) translateY(-2px)`;
  });
  card.addEventListener('mouseleave', ()=>{ card.style.transform = ''; });
});
