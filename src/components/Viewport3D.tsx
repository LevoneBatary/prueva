import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {
  CAMERA_PRESETS,
  CameraPresetId,
  DESIGN_MODELS,
  DesignModelSpec,
  FinishId,
  ModelId,
  STUDIO_ENVIRONMENTS,
  StudioEnvId,
} from '../types/studio';
import {
  createBrushedRoughnessTexture,
  createContactShadowTexture,
  createHorologyDialTexture,
  createStudioFloorTexture,
} from '../three/textures';
import {
  createStudioMaterialSet,
  StudioMaterialSet,
  updateStudioMaterialSet,
} from '../three/materials';
import {
  buildCustomGeometryModel,
  buildProceduralModel,
  BuiltDesignModel,
} from '../three/models';

// Pre-allocated scratch math helpers at module scope (zero GC in render loop)
const _partTargetPos = new THREE.Vector3();
const _camGoalPos = new THREE.Vector3();
const _camGoalTarget = new THREE.Vector3();
const _pointerNdc = new THREE.Vector2();

export interface Viewport3DProps {
  modelId: ModelId;
  customGeometry: THREE.BufferGeometry | null;
  customFileName: string;
  finishId: FinishId;
  envId: StudioEnvId;
  cameraPreset: CameraPresetId | null;
  onCameraPresetSettled: () => void;
  explodeTarget: number; // 0 to 1
  autoRotate: boolean;
  kinematicsActive: boolean;
  wireframe: boolean;
  selectedPartId: string | null;
  onSelectPart: (partId: string | null) => void;
  onCustomModelLoaded?: (spec: DesignModelSpec) => void;
  captureTrigger: number;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  modelId,
  customGeometry,
  customFileName,
  finishId,
  envId,
  cameraPreset,
  onCameraPresetSettled,
  explodeTarget,
  autoRotate,
  kinematicsActive,
  wireframe,
  selectedPartId,
  onSelectPart,
  onCustomModelLoaded,
  captureTrigger,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState(false);

  // Mutable ref state for the animation loop so React re-renders never tear down WebGL
  const stateRef = useRef({
    explodeCurrent: 0,
    explodeTarget,
    autoRotate,
    kinematicsActive,
    selectedPartId,
    activeCameraPreset: null as {
      pos: THREE.Vector3;
      target: THREE.Vector3;
    } | null,
    onSelectPart,
    onCameraPresetSettled,
  });

  stateRef.current.explodeTarget = explodeTarget;
  stateRef.current.autoRotate = autoRotate;
  stateRef.current.kinematicsActive = kinematicsActive;
  stateRef.current.selectedPartId = selectedPartId;
  stateRef.current.onSelectPart = onSelectPart;
  stateRef.current.onCameraPresetSettled = onCameraPresetSettled;

  const sceneRefs = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    matSet: StudioMaterialSet;
    currentModel: BuiltDesignModel | null;
    keyLight: THREE.DirectionalLight;
    hemiLight: THREE.HemisphereLight;
    rimLight: THREE.DirectionalLight;
    isSoftwareGl: boolean;
  } | null>(null);

  // Initialize WebGLRenderer, RoomEnvironment, Studio Lighting, Floor & Loop once
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // WebGL Context Lost / Restored safety
    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    const initialEnv = STUDIO_ENVIRONMENTS[0];
    scene.background = new THREE.Color(initialEnv.bgHex);
    scene.fog = new THREE.FogExp2(initialEnv.fogHex, 0.065);

    // Studio Environment Reflection (RoomEnvironment + PMREMGenerator)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 60);
    camera.position.set(3.4, 2.5, 3.6);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.05, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI * 0.495; // Prevent camera going below studio floor
    controls.minDistance = 1.3;
    controls.maxDistance = 11.5;
    controls.update();

    // Cancel scripted camera transition when user interacts manually
    const onControlsStart = () => {
      if (stateRef.current.activeCameraPreset) {
        stateRef.current.activeCameraPreset = null;
        stateRef.current.onCameraPresetSettled();
      }
    };
    controls.addEventListener('start', onControlsStart);

    // 3-Point Studio Lighting Rig
    const keyLight = new THREE.DirectionalLight(initialEnv.keyLightHex, initialEnv.keyIntensity);
    keyLight.position.set(4.5, 6.8, 4.2);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(2048, 2048);
    const d = 3.2;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 1.0;
    keyLight.shadow.camera.far = 16.0;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(
      initialEnv.hemiSkyHex,
      initialEnv.hemiGroundHex,
      initialEnv.hemiIntensity
    );
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(initialEnv.rimLightHex, initialEnv.rimIntensity);
    rimLight.position.set(-4.2, 3.8, -4.5);
    scene.add(rimLight);

    // Studio Softboxes (RectAreaLight) when hardware WebGL is active
    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softboxLeft = new THREE.RectAreaLight(0xffffff, 3.2, 3.5, 2.2);
      softboxLeft.position.set(-3.8, 3.2, 2.2);
      softboxLeft.lookAt(0, 1.0, 0);
      scene.add(softboxLeft);

      const softboxTop = new THREE.RectAreaLight(0xfffbeb, 2.4, 3.0, 3.0);
      softboxTop.position.set(0, 5.2, 0.5);
      softboxTop.lookAt(0, 1.0, 0);
      scene.add(softboxTop);
    }

    // Procedural Textures & Studio Floor
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const floorGridTex = createStudioFloorTexture(maxAnisotropy);
    const contactShadowTex = createContactShadowTexture();
    const brushedRoughTex = createBrushedRoughnessTexture(maxAnisotropy);
    const horologyDialTex = createHorologyDialTexture(maxAnisotropy);

    // Base Matte Studio Floor at Y = 0
    const baseFloorGeo = new THREE.CircleGeometry(18, 64);
    baseFloorGeo.rotateX(-Math.PI / 2);
    const baseFloorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0E1117'),
      roughness: 0.82,
      metalness: 0.15,
    });
    const baseFloorMesh = new THREE.Mesh(baseFloorGeo, baseFloorMat);
    baseFloorMesh.receiveShadow = true;
    scene.add(baseFloorMesh);

    // Precision Turntable Scale Decal at Y = 0.002 with polygonOffset
    const gridPlaneGeo = new THREE.PlaneGeometry(6.8, 6.8);
    gridPlaneGeo.rotateX(-Math.PI / 2);
    const gridPlaneMat = new THREE.MeshBasicMaterial({
      map: floorGridTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const gridPlaneMesh = new THREE.Mesh(gridPlaneGeo, gridPlaneMat);
    gridPlaneMesh.position.y = 0.002;
    scene.add(gridPlaneMesh);

    // Soft Radial Contact Shadow Plane at Y = 0.006
    const shadowPlaneGeo = new THREE.PlaneGeometry(4.2, 4.2);
    shadowPlaneGeo.rotateX(-Math.PI / 2);
    const shadowPlaneMat = new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const shadowPlaneMesh = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlaneMesh.position.y = 0.006;
    scene.add(shadowPlaneMesh);

    const matSet = createStudioMaterialSet(
      finishId,
      brushedRoughTex,
      horologyDialTex,
      isSoftwareGl,
      wireframe
    );

    const initialModel = buildProceduralModel(modelId, matSet);
    scene.add(initialModel.root);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    sceneRefs.current = {
      renderer,
      scene,
      camera,
      controls,
      matSet,
      currentModel: initialModel,
      keyLight,
      hemiLight,
      rimLight,
      isSoftwareGl,
    };

    // High-Performance Raycasting on Layer 1
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    let pointerDownPos = { x: 0, y: 0 };
    let lastHoverTime = 0;

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastHoverTime < 45) return;
      lastHoverTime = now;

      const activeModel = sceneRefs.current?.currentModel;
      if (!activeModel) return;

      const rect = renderer.domElement.getBoundingClientRect();
      _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(_pointerNdc, camera);
      const hits = raycaster.intersectObjects(activeModel.pickableMeshes, false);
      renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
    };

    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (Math.hypot(dx, dy) > 6) return; // Dragged orbit, not a click

      const activeModel = sceneRefs.current?.currentModel;
      if (!activeModel) return;

      const rect = renderer.domElement.getBoundingClientRect();
      _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(_pointerNdc, camera);
      const hits = raycaster.intersectObjects(activeModel.pickableMeshes, false);
      if (hits.length > 0) {
        const hitPartId = hits[0].object.userData.partId || null;
        stateRef.current.onSelectPart(
          stateRef.current.selectedPartId === hitPartId ? null : hitPartId
        );
      } else {
        stateRef.current.onSelectPart(null);
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // Responsive Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop with Software WebGL Fence Pacing
    const clock = new THREE.Clock();
    let frameId = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const st = stateRef.current;
      const activeModel = sceneRefs.current?.currentModel;

      // 1. Exponential damping for Exploded View separation
      st.explodeCurrent = THREE.MathUtils.damp(
        st.explodeCurrent,
        st.explodeTarget,
        6.5,
        delta
      );

      if (activeModel) {
        // Update each sub-assembly part position smoothly
        for (let i = 0; i < activeModel.parts.length; i++) {
          const p = activeModel.parts[i];
          const isSelected = st.selectedPartId === p.partId;
          const selectBoost = isSelected ? 0.18 : 0;

          _partTargetPos
            .copy(p.basePosition)
            .addScaledVector(p.explodeVector, st.explodeCurrent + selectBoost);

          p.group.position.x = THREE.MathUtils.damp(
            p.group.position.x,
            _partTargetPos.x,
            9,
            delta
          );
          p.group.position.y = THREE.MathUtils.damp(
            p.group.position.y,
            _partTargetPos.y,
            9,
            delta
          );
          p.group.position.z = THREE.MathUtils.damp(
            p.group.position.z,
            _partTargetPos.z,
            9,
            delta
          );
        }

        // Update internal mechanical kinematics
        if (st.kinematicsActive) {
          activeModel.updateKinematics(elapsed, delta);
        }

        // Turntable auto-rotation
        if (st.autoRotate && !isSoftwareGl) {
          activeModel.root.rotation.y += delta * 0.32;
        }
      }

      // 2. Smooth Damped Camera Preset Transition
      if (st.activeCameraPreset) {
        const goal = st.activeCameraPreset;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, goal.pos.x, 5.5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, goal.pos.y, 5.5, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, goal.pos.z, 5.5, delta);

        controls.target.x = THREE.MathUtils.damp(
          controls.target.x,
          goal.target.x,
          5.5,
          delta
        );
        controls.target.y = THREE.MathUtils.damp(
          controls.target.y,
          goal.target.y,
          5.5,
          delta
        );
        controls.target.z = THREE.MathUtils.damp(
          controls.target.z,
          goal.target.z,
          5.5,
          delta
        );

        if (
          camera.position.distanceToSquared(goal.pos) < 0.002 &&
          controls.target.distanceToSquared(goal.target) < 0.002
        ) {
          st.activeCameraPreset = null;
          st.onCameraPresetSettled();
        }
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      controls.removeEventListener('start', onControlsStart);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      sceneRefs.current?.currentModel?.disposeGeometries();
      matSet.dispose();
      baseFloorGeo.dispose();
      baseFloorMat.dispose();
      gridPlaneGeo.dispose();
      gridPlaneMat.dispose();
      shadowPlaneGeo.dispose();
      shadowPlaneMat.dispose();
      floorGridTex.dispose();
      contactShadowTex.dispose();
      brushedRoughTex.dispose();
      horologyDialTex.dispose();
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Switch 3D Design Model or Custom Uploaded CAD Model
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs) return;

    if (refs.currentModel) {
      refs.scene.remove(refs.currentModel.root);
      refs.currentModel.disposeGeometries();
    }

    if (modelId === 'custom' && customGeometry) {
      const built = buildCustomGeometryModel(customGeometry, customFileName, refs.matSet);
      refs.currentModel = built.model;
      refs.scene.add(built.model.root);
      onCustomModelLoaded?.(built.spec);
    } else {
      const built = buildProceduralModel(modelId, refs.matSet);
      refs.currentModel = built;
      refs.scene.add(built.root);
    }
  }, [modelId, customGeometry, customFileName]);

  // Update PBR Finish & Wireframe mode dynamically
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs) return;
    updateStudioMaterialSet(refs.matSet, finishId, refs.isSoftwareGl, wireframe);
  }, [finishId, wireframe]);

  // Update Studio Lighting Environment & Atmosphere
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs) return;
    const env =
      STUDIO_ENVIRONMENTS.find((e) => e.id === envId) || STUDIO_ENVIRONMENTS[0];

    refs.scene.background = new THREE.Color(env.bgHex);
    refs.scene.fog = new THREE.FogExp2(env.fogHex, 0.065);
    refs.keyLight.color.set(env.keyLightHex);
    refs.keyLight.intensity = env.keyIntensity;
    refs.hemiLight.color.set(env.hemiSkyHex);
    refs.hemiLight.groundColor.set(env.hemiGroundHex);
    refs.hemiLight.intensity = env.hemiIntensity;
    refs.rimLight.color.set(env.rimLightHex);
    refs.rimLight.intensity = env.rimIntensity;
    refs.renderer.toneMappingExposure = env.exposure;
  }, [envId]);

  // Trigger Smooth Camera Angle Preset
  useEffect(() => {
    if (!cameraPreset) return;
    const preset = CAMERA_PRESETS.find((c) => c.id === cameraPreset);
    if (!preset) return;
    _camGoalPos.set(...preset.position);
    _camGoalTarget.set(...preset.target);
    stateRef.current.activeCameraPreset = {
      pos: _camGoalPos.clone(),
      target: _camGoalTarget.clone(),
    };
  }, [cameraPreset]);

  // Export High-Resolution PNG Render Snapshot
  useEffect(() => {
    if (captureTrigger === 0) return;
    const refs = sceneRefs.current;
    if (!refs) return;

    // Render synchronously right before toDataURL so buffer is populated
    refs.renderer.render(refs.scene, refs.camera);
    const dataUrl = refs.renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `atelier-voxel-${modelId}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, [captureTrigger]);

  return (
    <div className="relative w-full h-full select-none">
      <div ref={canvasMountRef} className="w-full h-full" />
      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0B0D11] text-slate-200 z-30">
          <div className="max-w-md p-6 border border-white/10 rounded-xl bg-[#12151C] text-center">
            <h2 className="text-lg font-semibold mb-2">Contexto WebGL en pausa</h2>
            <p className="text-sm text-slate-400">
              Restaurando el motor gráfico tridimensional y los sombreadores PBR de estudio...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
