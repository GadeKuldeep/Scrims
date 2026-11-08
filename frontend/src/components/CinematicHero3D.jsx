import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default function CinematicHero3D() {
  const mountRef = useRef(null);
  const audioRef = useRef(null);

  // UI Interactive States
  const [modelMode, setModelMode] = useState('trophy'); // 'trophy' | 'car'
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [fps, setFps] = useState(60);
  const [cameraView, setCameraView] = useState('cinematic'); // 'cinematic' | 'front' | 'top'

  // Three.js object references for real-time updates
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const trophyGroupRef = useRef(null);
  const carGroupRef = useRef(null);
  const lightsRef = useRef({});

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, and WebGL Renderer
    const width = container.clientWidth;
    const height = container.clientHeight || 520;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(3.8, 2.4, 5.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.6;

    container.replaceChildren(renderer.domElement);

    // 2. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 10;
    controls.minDistance = 2.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.6;
    controlsRef.current = controls;

    // 3. STUDIO 4-POINT LIGHTING RIG (Gleaming 24K Gold Visibility)
    // High-energy ambient light so no part of the trophy is ever submerged in dark shadows
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 1.8);
    scene.add(ambientLight);

    // Hemisphere light simulating warm arena overhead floodlights + dark slate floor bounce
    const hemiLight = new THREE.HemisphereLight(0xffeedd, 0x1e1e2d, 2.5);
    scene.add(hemiLight);

    // Key Light: intense daylight spot directly illuminating the trophy face
    const keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // Warm Gold Fill Light on the left flank
    const goldFill = new THREE.PointLight(0xf59e0b, 16, 15);
    goldFill.position.set(-4, 3.5, 3.5);
    scene.add(goldFill);

    // Cyber Cyan Rim Light for dramatic esports rim separation
    const cyanRim = new THREE.DirectionalLight(0x38bdf8, 3.2);
    cyanRim.position.set(-5, 4, -4);
    cyanRim.target.position.set(0, 1.5, 0);
    scene.add(cyanRim.target);
    scene.add(cyanRim);

    // Pedestal Underglow
    const pedestalGlow = new THREE.PointLight(0xf97316, 14, 8);
    pedestalGlow.position.set(0, 0.15, 0);
    scene.add(pedestalGlow);

    lightsRef.current = { ambientLight, hemiLight, keyLight, goldFill, cyanRim, pedestalGlow };

    // 4. Ground Stage & Reflective Pedestal Pad
    const groundGeo = new THREE.CircleGeometry(5.5, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x14141d,
      roughness: 0.25,
      metalness: 0.6,
      transparent: true,
      opacity: 0.95
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    // Floor Cyber Grid
    const gridHelper = new THREE.GridHelper(10, 20, 0xea580c, 0x27272a);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Telemetry Floor Rings
    const ringGeo1 = new THREE.RingGeometry(2.6, 2.65, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0xea580c, side: THREE.DoubleSide });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = -Math.PI / 2;
    ring1.position.y = 0.01;
    scene.add(ring1);

    const ringGeo2 = new THREE.RingGeometry(3.9, 3.94, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = 0.01;
    scene.add(ring2);

    // 5. Floating Victory Golden Embers (Rising upward)
    const emberCount = 180;
    const emberGeo = new THREE.BufferGeometry();
    const emberPos = new Float32Array(emberCount * 3);
    const emberSpeeds = new Float32Array(emberCount);

    for (let i = 0; i < emberCount; i++) {
      emberPos[i * 3] = (Math.random() - 0.5) * 8;
      emberPos[i * 3 + 1] = Math.random() * 4.5 + 0.1;
      emberPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
      emberSpeeds[i] = Math.random() * 0.015 + 0.008;
    }
    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));

    const emberMat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.055,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const embers = new THREE.Points(emberGeo, emberMat);
    scene.add(embers);

    // 6. PRESTIGE 3D CHAMPIONSHIP CUP (Human-Crafted 24K Polished Gold)
    const trophyGroup = new THREE.Group();
    trophyGroupRef.current = trophyGroup;

    // Rich 24K polished championship gold material (balanced metalness so it reflects vibrant gold without void-blackening)
    const goldChampionshipMat = new THREE.MeshStandardMaterial({
      color: 0xffb703,
      metalness: 0.48,
      roughness: 0.18,
      emissive: 0x593200,
      emissiveIntensity: 0.32,
      side: THREE.DoubleSide
    });

    // Dark Obsidian Pedestal Base
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x292524,
      emissiveIntensity: 0.2
    });

    // Plinth Step 1 (Octagonal bottom)
    const plinth1 = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.22, 16), plinthMat);
    plinth1.position.y = 0.11;
    plinth1.castShadow = true;
    plinth1.receiveShadow = true;
    trophyGroup.add(plinth1);

    // Plinth Step 2
    const plinth2 = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.78, 0.18, 16), plinthMat);
    plinth2.position.y = 0.31;
    plinth2.castShadow = true;
    trophyGroup.add(plinth2);

    // Golden Plaque Ring
    const plaqueRing = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.74, 0.08, 32), goldChampionshipMat);
    plaqueRing.position.y = 0.31;
    trophyGroup.add(plaqueRing);

    // Stem Base Flare
    const stemBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.55, 0.22, 32), goldChampionshipMat);
    stemBase.position.y = 0.51;
    stemBase.castShadow = true;
    trophyGroup.add(stemBase);

    // Center Slender Stem
    const stemCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.45, 32), goldChampionshipMat);
    stemCenter.position.y = 0.82;
    stemCenter.castShadow = true;
    trophyGroup.add(stemCenter);

    // Stem Decorative Ring Bead
    const stemBead = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.04, 16, 32), goldChampionshipMat);
    stemBead.position.y = 0.82;
    stemBead.rotation.x = Math.PI / 2;
    trophyGroup.add(stemBead);

    // Stem Upper Transition
    const stemTop = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.2, 0.25, 32), goldChampionshipMat);
    stemTop.position.y = 1.15;
    trophyGroup.add(stemTop);

    // Main Chalice Cup Bowl (Double-sided flared classical trophy)
    const cupGeo = new THREE.CylinderGeometry(0.92, 0.4, 1.35, 32, 1, false);
    const cupMesh = new THREE.Mesh(cupGeo, goldChampionshipMat);
    cupMesh.position.y = 1.95;
    cupMesh.castShadow = true;
    cupMesh.receiveShadow = true;
    trophyGroup.add(cupMesh);

    // Cup Top Flared Lip Rim
    const rimGeo = new THREE.TorusGeometry(0.92, 0.045, 16, 64);
    const rimMesh = new THREE.Mesh(rimGeo, goldChampionshipMat);
    rimMesh.position.y = 2.62;
    rimMesh.rotation.x = Math.PI / 2;
    trophyGroup.add(rimMesh);

    // Swept Championship Handles (Left & Right)
    const handleGeo = new THREE.TorusGeometry(0.48, 0.055, 16, 32, Math.PI * 1.25);

    // Left Handle
    const leftHandle = new THREE.Mesh(handleGeo, goldChampionshipMat);
    leftHandle.position.set(-0.95, 2.05, 0);
    leftHandle.rotation.z = Math.PI * 0.42;
    leftHandle.castShadow = true;
    trophyGroup.add(leftHandle);

    // Right Handle
    const rightHandle = new THREE.Mesh(handleGeo, goldChampionshipMat);
    rightHandle.position.set(0.95, 2.05, 0);
    rightHandle.rotation.z = -Math.PI * 0.42;
    rightHandle.castShadow = true;
    trophyGroup.add(rightHandle);

    // Floating Inner Victory Crystal / Glowing Ember
    const coreGeo = new THREE.OctahedronGeometry(0.24, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.2,
      roughness: 0.1,
      metalness: 0.2
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = 2.05;
    trophyGroup.add(coreMesh);

    // Floating Championship Crown Halo Ring above the cup
    const haloGeo = new THREE.TorusGeometry(0.65, 0.025, 16, 64);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: false });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.y = 2.95;
    haloMesh.rotation.x = Math.PI / 2;
    trophyGroup.add(haloMesh);

    // Floating Kinetic Orbit Rings around the cup
    const orbitRing1 = new THREE.Mesh(
      new THREE.TorusGeometry(1.35, 0.022, 16, 64),
      new THREE.MeshBasicMaterial({ color: 0xea580c })
    );
    orbitRing1.position.y = 1.95;
    orbitRing1.rotation.x = Math.PI / 3.5;
    trophyGroup.add(orbitRing1);

    const orbitRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.52, 0.018, 16, 64),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    orbitRing2.position.y = 1.95;
    orbitRing2.rotation.x = -Math.PI / 4;
    trophyGroup.add(orbitRing2);

    scene.add(trophyGroup);

    // 7. Mode B: GLTF Vehicle Model
    const carGroup = new THREE.Group();
    carGroupRef.current = carGroup;
    carGroup.visible = false;
    scene.add(carGroup);

    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      '/model/ferrari_laferrari_Black.glb',
      (gltf) => {
        const car = gltf.scene;
        car.scale.set(1.4, 1.4, 1.4);
        car.position.set(0, 0, 0);
        car.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        carGroup.add(car);
      },
      undefined,
      (err) => {
        console.warn('GLTF fallback notice:', err.message);
      }
    );

    // 8. Animation & Render Loop
    let lastTime = performance.now();
    let frameCount = 0;
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Animate floating embers rising upward
      const positions = emberGeo.attributes.position.array;
      for (let i = 0; i < emberCount; i++) {
        positions[i * 3 + 1] += emberSpeeds[i];
        if (positions[i * 3 + 1] > 4.5) {
          positions[i * 3 + 1] = 0.1;
          positions[i * 3] = (Math.random() - 0.5) * 8;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
        }
      }
      emberGeo.attributes.position.needsUpdate = true;

      // Animate Trophy kinetic rings and floating core
      if (trophyGroupRef.current && trophyGroupRef.current.visible) {
        orbitRing1.rotation.z = elapsedTime * 0.75;
        orbitRing2.rotation.z = -elapsedTime * 0.55;
        haloMesh.rotation.z = elapsedTime * 0.4;
        coreMesh.rotation.y = elapsedTime * 1.5;
        coreMesh.rotation.x = elapsedTime * 0.8;
        coreMesh.position.y = 2.05 + Math.sin(elapsedTime * 2.2) * 0.05;
      }

      // Rotate telemetry floor rings
      ring1.rotation.z = elapsedTime * 0.2;
      ring2.rotation.z = -elapsedTime * 0.15;

      // Calculate FPS
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Handling
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Handle Model Switching (Trophy vs Supercar)
  useEffect(() => {
    if (trophyGroupRef.current && carGroupRef.current) {
      if (modelMode === 'trophy') {
        trophyGroupRef.current.visible = true;
        carGroupRef.current.visible = false;
        if (cameraRef.current) {
          cameraRef.current.position.set(3.8, 2.4, 5.2);
        }
      } else {
        trophyGroupRef.current.visible = false;
        carGroupRef.current.visible = true;
        if (cameraRef.current) {
          cameraRef.current.position.set(4.5, 2, 4.5);
        }
      }
    }
  }, [modelMode]);

  // Handle Auto Rotation toggle
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Handle Camera Presets
  const setPresetView = (view) => {
    setCameraView(view);
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;

    if (view === 'cinematic') {
      camera.position.set(3.8, 2.4, 5.2);
    } else if (view === 'front') {
      camera.position.set(0, 1.9, 5.5);
    } else if (view === 'top') {
      camera.position.set(0.1, 6.8, 1.5);
    }
    controlsRef.current.target.set(0, 1.4, 0);
  };

  // Audio Playback Handler
  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.volume = 0.4;
      audioRef.current.play().then(() => {
        setIsAudioPlaying(true);
      }).catch((e) => console.log('Audio autoplay prevented:', e));
    }
  };

  return (
    <div className="relative w-full h-[480px] md:h-[560px] rounded-3xl bg-gradient-to-b from-surface-container-low/90 via-surface-container-lowest to-surface-container-lowest border border-outline-variant/30 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] group">
      {/* Dynamic Ambient Glow Behind Trophy */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-gradient-to-tr from-primary/20 via-amber-500/15 to-transparent rounded-full blur-[80px] pointer-events-none -z-0"></div>

      {/* 3D WebGL Mounting Canvas */}
      <div ref={mountRef} className="relative z-10 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Background Audio SFX Element */}
      <audio ref={audioRef} loop src="/sound/LaFerrari-Sound.mp3" />

      {/* TOP HUD: Sector Callout & Live Telemetry */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-2 py-1.5 px-3.5 rounded-full bg-surface-container-lowest/85 backdrop-blur-xl border border-outline-variant/40 shadow-xl">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          <span className="font-label-badge text-label-badge uppercase tracking-wider text-on-surface font-bold">
            CHAMPIONSHIP ARENA // {modelMode.toUpperCase()}
          </span>
          <span className="text-[10px] text-amber-400 font-mono ml-1 font-bold">
            [{fps} FPS]
          </span>
        </div>

        {/* Tactical Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-lowest/85 backdrop-blur-xl border border-outline-variant/40 text-[11px] font-mono text-on-surface-variant shadow-xl">
          <span className="text-emerald-400 font-semibold">● 24K GOLD RIG</span>
          <span>•</span>
          <span className="text-on-surface">STUDIO LIGHTING</span>
        </div>
      </div>

      {/* BOTTOM-LEFT: Model & Camera Selectors */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-20">
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/40 shadow-2xl">
          <button
            onClick={() => setModelMode('trophy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 transition-all ${
              modelMode === 'trophy'
                ? 'bg-gradient-to-r from-amber-500 to-primary text-black font-extrabold shadow-lg shadow-amber-500/25'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">emoji_events</span>
            Gold Trophy
          </button>
          <button
            onClick={() => setModelMode('car')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 transition-all ${
              modelMode === 'car'
                ? 'bg-gradient-to-r from-amber-500 to-primary text-black font-extrabold shadow-lg shadow-amber-500/25'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">speed</span>
            Apex Hypercar
          </button>
        </div>

        {/* Camera Preset View Pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container-lowest/85 backdrop-blur-xl border border-outline-variant/30 text-[11px] font-label-badge font-bold">
          <span className="text-[10px] text-on-surface-variant uppercase px-1.5">ANGLE:</span>
          {['cinematic', 'front', 'top'].map((preset) => (
            <button
              key={preset}
              onClick={() => setPresetView(preset)}
              className={`px-2.5 py-0.5 rounded-lg uppercase text-[10px] font-bold transition-all ${
                cameraView === preset
                  ? 'bg-surface-container-high text-primary border border-primary/50'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* BOTTOM-RIGHT: Audio & Orbit Toggle Controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          title="Toggle Auto-Rotation"
          className={`p-2.5 rounded-2xl backdrop-blur-xl border shadow-xl transition-all flex items-center justify-center ${
            autoRotate
              ? 'bg-primary/20 border-primary text-primary'
              : 'bg-surface-container-lowest/90 border-outline-variant/40 text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {autoRotate ? 'sync' : 'sync_disabled'}
          </span>
        </button>

        <button
          onClick={toggleAudio}
          title={isAudioPlaying ? 'Mute SFX' : 'Play Arena SFX'}
          className={`px-3 py-2 rounded-2xl backdrop-blur-xl border shadow-xl transition-all flex items-center gap-1.5 text-xs font-bold ${
            isAudioPlaying
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 animate-pulse'
              : 'bg-surface-container-lowest/90 border-outline-variant/40 text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">
            {isAudioPlaying ? 'volume_up' : 'volume_off'}
          </span>
          <span>{isAudioPlaying ? 'ARENA AUDIO' : 'AUDIO SFX'}</span>
        </button>
      </div>

      {/* Interactive Drag Hint */}
      <div className="absolute top-1/2 left-4 -translate-y-1/2 hidden xl:flex flex-col gap-1 p-2 rounded-xl bg-surface-container-lowest/70 backdrop-blur-md border border-outline-variant/20 text-[10px] text-on-surface-variant pointer-events-none">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-amber-400">360</span>
          DRAG TO ROTATE
        </span>
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-amber-400">pinch</span>
          SCROLL TO ZOOM
        </span>
      </div>

      {/* Sleek Corner Accents */}
      <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-amber-400/70 pointer-events-none"></div>
      <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-amber-400/70 pointer-events-none"></div>
      <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-amber-400/70 pointer-events-none"></div>
      <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-amber-400/70 pointer-events-none"></div>
    </div>
  );
}
