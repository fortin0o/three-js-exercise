// animation.js

// Global application state
const state = {
  shape: 'cube',
  color: '#00f0ff',
  scale: 1.0,
  speed: 1.0
};

// Three.js global variables
let scene, camera, renderer, clock;
let arToolkitSource, arToolkitContext, markerControls;
let markerRoot, activeMesh;

// DOM Elements
const btnStartAr = document.getElementById('btn-start-ar');
const splashScreen = document.getElementById('splash-screen');
const loadingScreen = document.getElementById('loading-screen');
const textCamera = document.getElementById('text-camera');
const dotCamera = document.getElementById('dot-camera');
const textTracking = document.getElementById('text-tracking');
const dotTracking = document.getElementById('dot-tracking');

const shapeSelect = document.getElementById('shape-select');
const scaleSlider = document.getElementById('scale-slider');
const lblScale = document.getElementById('lbl-scale');
const speedSlider = document.getElementById('speed-slider');
const lblSpeed = document.getElementById('lbl-speed');

const markerModal = document.getElementById('marker-modal');
const btnShowMarker = document.getElementById('btn-show-marker');
const btnCloseModal = document.getElementById('btn-close-modal');

// --- Onboarding / Entry ---
btnStartAr.addEventListener('click', () => {
  splashScreen.classList.add('hidden');
  loadingScreen.classList.add('active');
  
  // Initialize AR context and WebGL after UI interaction
  initAR();
});

// --- Initialize Three.js and AR.js ---
function initAR() {
  // 1. Clock for time-based animation (like floating effect)
  clock = new THREE.Clock();

  // 2. Setup Three.js Scene
  scene = new THREE.Scene();

  // 3. Setup Camera (AR.js controls projection matrix, but we initialize a standard camera)
  camera = new THREE.Camera();
  scene.add(camera);

  // 4. Setup Lighting for depth and aesthetics
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
  keyLight.position.set(2, 4, 3);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
  fillLight.position.set(-2, -1, -2);
  scene.add(fillLight);

  // 5. Setup WebGL Renderer with Alpha transparent channel
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  document.body.appendChild(renderer.domElement);

  // 6. Setup AR.js Source (Camera Input)
  arToolkitSource = new THREEx.ArToolkitSource({
    sourceType: 'webcam'
  });

  arToolkitSource.init(() => {
    // Timeout helps ensure camera has fully negotiated resolution
    setTimeout(() => {
      onResize();
      loadingScreen.classList.remove('active');
      
      // Update Camera HUD indicator
      dotCamera.classList.add('active');
      textCamera.textContent = 'ACTIVE';
      textCamera.style.color = '#39ff14';
    }, 1500);
  }, (err) => {
    console.error("Camera access error:", err);
    alert("Unable to access camera. Please make sure camera permissions are allowed and you are running under HTTPS or localhost.");
    loadingScreen.classList.remove('active');
  });

  // Handle window resizing
  window.addEventListener('resize', onResize);

  // 7. Setup AR.js Context (Matrix matching camera calibration parameters)
  arToolkitContext = new THREEx.ArToolkitContext({
    cameraParametersUrl: 'https://raw.githack.com/AR-js-org/AR.js/master/data/data/camera_para.dat',
    detectionMode: 'mono'
  });

  arToolkitContext.init(() => {
    // Copy projection matrix to camera when calibration file is loaded
    camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
  });

  // 8. Create Marker Anchor Group
  markerRoot = new THREE.Group();
  scene.add(markerRoot);

  // Bind Marker Controls to the Anchor
  markerControls = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
    type: 'pattern',
    patternUrl: 'https://raw.githack.com/AR-js-org/AR.js/master/data/data/patt.hiro'
  });

  // Initialize the first 3D object inside the marker anchor
  updateMesh();

  // Setup HUD listeners
  setupHUDListeners();

  // Start rendering loop
  animate();
}

// --- Window Resize Handler ---
function onResize() {
  if (!arToolkitSource) return;
  
  arToolkitSource.onResize();
  arToolkitSource.copySizeTo(renderer.domElement);
  
  if (arToolkitContext && arToolkitContext.arController !== null) {
    arToolkitSource.copySizeTo(arToolkitContext.arController.canvas);
  }
}

// --- Create and Update Mesh ---
function updateMesh() {
  if (!markerRoot) return;

  // Clear previous mesh if it exists
  if (activeMesh) {
    markerRoot.remove(activeMesh);
    activeMesh.geometry.dispose();
    if (Array.isArray(activeMesh.material)) {
      activeMesh.material.forEach(m => m.dispose());
    } else {
      activeMesh.material.dispose();
    }
  }

  // Create geometry based on state
  let geometry;
  switch (state.shape) {
    case 'cube':
      geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      break;
    case 'torus':
      // TorusKnotGeometry(radius, tube, tubularSegments, radialSegments, p, q)
      geometry = new THREE.TorusKnotGeometry(0.3, 0.1, 80, 12);
      break;
    case 'sphere':
      geometry = new THREE.SphereGeometry(0.45, 32, 32);
      break;
    case 'cylinder':
      geometry = new THREE.CylinderGeometry(0.35, 0.35, 0.8, 32);
      break;
    default:
      geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  }

  // Setup material with metallic properties for reflective lighting
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(state.color),
    metalness: 0.85,
    roughness: 0.15,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  });

  activeMesh = new THREE.Mesh(geometry, material);
  
  // Elevate pivot point above the marker base plane
  activeMesh.position.y = 0.5;
  
  // Set scale based on range state
  activeMesh.scale.set(state.scale, state.scale, state.scale);

  // Add to the AR tracker root
  markerRoot.add(activeMesh);
}

// --- Connect HUD controls to JS State ---
function setupHUDListeners() {
  // Shape Dropdown
  shapeSelect.addEventListener('change', (e) => {
    state.shape = e.target.value;
    updateMesh();
  });

  // Color selection clicks
  const colorDots = document.querySelectorAll('.color-dot');
  colorDots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      // Manage CSS active states
      colorDots.forEach(d => d.classList.remove('selected'));
      e.target.classList.add('selected');
      
      // Update color and mesh
      state.color = e.target.dataset.color;
      updateMesh();
    });
  });

  // Scale Range Slider
  scaleSlider.addEventListener('input', (e) => {
    state.scale = parseFloat(e.target.value);
    lblScale.textContent = `${state.scale.toFixed(1)}x`;
    if (activeMesh) {
      activeMesh.scale.set(state.scale, state.scale, state.scale);
    }
  });

  // Rotation Speed Slider
  speedSlider.addEventListener('input', (e) => {
    state.speed = parseFloat(e.target.value);
    lblSpeed.textContent = `${state.speed.toFixed(1)}x`;
  });
}

// --- Marker Modal Logic ---
btnShowMarker.addEventListener('click', () => {
  markerModal.classList.add('active');
});

btnCloseModal.addEventListener('click', () => {
  markerModal.classList.remove('active');
});

markerModal.addEventListener('click', (e) => {
  if (e.target === markerModal) {
    markerModal.classList.remove('active');
  }
});

// --- Main Render / Animation Loop ---
function animate() {
  requestAnimationFrame(animate);

  // Update tracking status
  if (arToolkitSource && arToolkitSource.ready !== false) {
    arToolkitContext.update(arToolkitSource.domElement);
    
    // Manage tracking indicator badge
    if (markerRoot && markerRoot.visible) {
      dotTracking.className = 'status-dot active';
      textTracking.textContent = 'LOCKED';
      textTracking.style.color = '#39ff14';
    } else {
      dotTracking.className = 'status-dot searching';
      textTracking.textContent = 'SEARCHING';
      textTracking.style.color = '#ffb700';
    }
  }

  // Mesh animation (floating & rotating)
  if (activeMesh && state.speed > 0) {
    const elapsed = clock.getElapsedTime();
    
    // Subtle levitation (bobbing up and down)
    activeMesh.position.y = 0.5 + Math.sin(elapsed * 2) * 0.12;
    
    // Base rotation rate multiplied by speed factor
    activeMesh.rotation.x += 0.01 * state.speed;
    activeMesh.rotation.y += 0.015 * state.speed;
  }

  // Render frame
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}
