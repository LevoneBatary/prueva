import * as THREE from 'three';
import { DESIGN_MODELS, ModelId, PartMetadata } from '../types/studio';
import { StudioMaterialSet } from './materials';

export interface BuiltPartNode {
  partId: string;
  group: THREE.Group;
  basePosition: THREE.Vector3;
  explodeVector: THREE.Vector3;
}

export interface BuiltDesignModel {
  root: THREE.Group;
  parts: BuiltPartNode[];
  pickableMeshes: THREE.Object3D[];
  updateKinematics: (elapsed: number, delta: number) => void;
  disposeGeometries: () => void;
}

function tagPickableHierarchy(group: THREE.Group, partId: string, pickableList: THREE.Object3D[]) {
  group.userData.partId = partId;
  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.userData.partId = partId;
      child.castShadow = true;
      child.receiveShadow = true;
      child.layers.enable(1);
      pickableList.push(child);
    }
  });
}

function createPartGroup(
  partMeta: PartMetadata,
  baseY: number,
  partsList: BuiltPartNode[]
): THREE.Group {
  const group = new THREE.Group();
  group.name = partMeta.id;
  group.position.set(0, baseY, 0);
  const basePosition = group.position.clone();
  const explodeVector = new THREE.Vector3(...partMeta.explodeOffset);
  partsList.push({
    partId: partMeta.id,
    group,
    basePosition,
    explodeVector,
  });
  return group;
}

/**
 * 1. CRONÓGRAFO MECÁNICO TOURBILLON (8 distinct sub-assemblies + 36-tooth InstancedMesh gear ring)
 */
function buildChronographModel(
  mats: StudioMaterialSet,
  geometriesToDispose: THREE.BufferGeometry[]
): BuiltDesignModel {
  const spec = DESIGN_MODELS.find((m) => m.id === 'chronograph')!;
  const root = new THREE.Group();
  const parts: BuiltPartNode[] = [];
  const pickableMeshes: THREE.Object3D[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometriesToDispose.push(g);
    return g;
  };

  // Base pedestal & case height so bottom sits flush at Y = 0
  // 1. Case & Lugs (chrono-case)
  const caseGroup = createPartGroup(spec.parts[0], 0, parts);
  // Display plinth at Y = 0..0.18
  const plinthGeo = trackGeo(new THREE.CylinderGeometry(1.15, 1.28, 0.18, 48));
  plinthGeo.translate(0, 0.09, 0);
  const plinthMesh = new THREE.Mesh(plinthGeo, mats.darkChassis);
  caseGroup.add(plinthMesh);

  // Sculpted watch case barrel (Lathe profile) sitting from Y = 0.18 to Y = 0.72
  const casePoints = [
    new THREE.Vector2(0, 0.18),
    new THREE.Vector2(1.42, 0.18),
    new THREE.Vector2(1.56, 0.28),
    new THREE.Vector2(1.58, 0.56),
    new THREE.Vector2(1.46, 0.68),
    new THREE.Vector2(1.32, 0.68),
    new THREE.Vector2(1.32, 0.32),
    new THREE.Vector2(0, 0.32),
  ];
  const latheCaseGeo = trackGeo(new THREE.LatheGeometry(casePoints, 64));
  const latheCaseMesh = new THREE.Mesh(latheCaseGeo, mats.primary);
  caseGroup.add(latheCaseMesh);

  // 4 sculpted bevelled lugs using ExtrudeGeometry
  const lugShape = new THREE.Shape();
  lugShape.moveTo(-0.22, -0.35);
  lugShape.lineTo(0.22, -0.35);
  lugShape.lineTo(0.16, 0.35);
  lugShape.lineTo(-0.16, 0.35);
  lugShape.closePath();
  const lugGeo = trackGeo(
    new THREE.ExtrudeGeometry(lugShape, {
      depth: 0.24,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 3,
    })
  );
  lugGeo.rotateX(Math.PI / 2);

  const lugPositions = [
    [-0.68, 0.48, 1.48, 0],
    [0.68, 0.48, 1.48, 0],
    [-0.68, 0.48, -1.48, Math.PI],
    [0.68, 0.48, -1.48, Math.PI],
  ];
  lugPositions.forEach(([lx, ly, lz, rotY]) => {
    const lug = new THREE.Mesh(lugGeo, mats.primary);
    lug.position.set(lx, ly, lz);
    lug.rotation.y = rotY;
    caseGroup.add(lug);
  });
  tagPickableHierarchy(caseGroup, spec.parts[0].id, pickableMeshes);
  root.add(caseGroup);

  // 2. Tachymeter Bezel (chrono-bezel)
  const bezelGroup = createPartGroup(spec.parts[1], 0, parts);
  const bezelPoints = [
    new THREE.Vector2(1.26, 0.68),
    new THREE.Vector2(1.52, 0.68),
    new THREE.Vector2(1.45, 0.84),
    new THREE.Vector2(1.22, 0.84),
    new THREE.Vector2(1.22, 0.68),
  ];
  const bezelGeo = trackGeo(new THREE.LatheGeometry(bezelPoints, 64));
  const bezelMesh = new THREE.Mesh(bezelGeo, mats.secondary);
  bezelGroup.add(bezelMesh);

  const accentRingGeo = trackGeo(new THREE.TorusGeometry(1.36, 0.025, 16, 64));
  accentRingGeo.rotateX(Math.PI / 2);
  accentRingGeo.translate(0, 0.84, 0);
  bezelGroup.add(new THREE.Mesh(accentRingGeo, mats.accent));
  tagPickableHierarchy(bezelGroup, spec.parts[1].id, pickableMeshes);
  root.add(bezelGroup);

  // 3. Main Dial & Horological Plate (chrono-dial)
  const dialGroup = createPartGroup(spec.parts[2], 0, parts);
  const dialGeo = trackGeo(new THREE.CylinderGeometry(1.28, 1.28, 0.08, 64));
  dialGeo.translate(0, 0.42, 0);
  const dialMesh = new THREE.Mesh(dialGeo, mats.dialSurface);
  dialGroup.add(dialMesh);

  // Skeleton aperture rim at 6 o'clock
  const apertureRimGeo = trackGeo(new THREE.TorusGeometry(0.42, 0.035, 16, 48));
  apertureRimGeo.rotateX(Math.PI / 2);
  apertureRimGeo.translate(0, 0.47, 0.56);
  dialGroup.add(new THREE.Mesh(apertureRimGeo, mats.accent));
  tagPickableHierarchy(dialGroup, spec.parts[2].id, pickableMeshes);
  root.add(dialGroup);

  // 4. Planetary Gear Train with 36 InstancedMesh teeth (chrono-gears)
  const gearsGroup = createPartGroup(spec.parts[3], 0, parts);
  const gearWheelSubGroup = new THREE.Group();
  gearWheelSubGroup.position.set(-0.38, 0.54, -0.28);

  const mainWheelGeo = trackGeo(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 36));
  gearWheelSubGroup.add(new THREE.Mesh(mainWheelGeo, mats.accent));

  // InstancedMesh of 36 precision gear teeth (>20 repeated items)
  const toothGeo = trackGeo(new THREE.BoxGeometry(0.04, 0.055, 0.09));
  const toothCount = 36;
  const teethInstanced = new THREE.InstancedMesh(toothGeo, mats.accent, toothCount);
  const dummy = new THREE.Object3D();
  const tintColor = new THREE.Color();
  for (let i = 0; i < toothCount; i++) {
    const angle = (i / toothCount) * Math.PI * 2;
    dummy.position.set(Math.cos(angle) * 0.44, 0, Math.sin(angle) * 0.44);
    dummy.rotation.set(0, -angle, 0);
    const scaleVar = 0.92 + (i % 3) * 0.06;
    dummy.scale.set(1, scaleVar, 1);
    dummy.updateMatrix();
    teethInstanced.setMatrixAt(i, dummy.matrix);
    tintColor.setHSL(0.1 + (i % 4) * 0.01, 0.85, 0.55);
    teethInstanced.setColorAt(i, tintColor);
  }
  teethInstanced.instanceMatrix.needsUpdate = true;
  if (teethInstanced.instanceColor) teethInstanced.instanceColor.needsUpdate = true;
  teethInstanced.computeBoundingSphere();
  gearWheelSubGroup.add(teethInstanced);
  gearsGroup.add(gearWheelSubGroup);

  // Secondary escape wheel
  const secWheelGeo = trackGeo(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 24));
  secWheelGeo.translate(0.42, 0.53, -0.25);
  gearsGroup.add(new THREE.Mesh(secWheelGeo, mats.primary));
  tagPickableHierarchy(gearsGroup, spec.parts[3].id, pickableMeshes);
  root.add(gearsGroup);

  // 5. Flying Tourbillon Cage & Bridge (chrono-tourbillon)
  const tourbillonGroup = createPartGroup(spec.parts[4], 0, parts);
  const cageSpinner = new THREE.Group();
  cageSpinner.position.set(0, 0.56, 0.56);

  const cageRingGeo = trackGeo(new THREE.TorusGeometry(0.32, 0.028, 16, 48));
  cageRingGeo.rotateX(Math.PI / 2);
  cageSpinner.add(new THREE.Mesh(cageRingGeo, mats.primary));

  const balanceCrossGeo = trackGeo(new THREE.BoxGeometry(0.58, 0.03, 0.045));
  cageSpinner.add(new THREE.Mesh(balanceCrossGeo, mats.accent));

  const rubyGeo = trackGeo(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 16));
  const rubyMat = mats.accent;
  cageSpinner.add(new THREE.Mesh(rubyGeo, rubyMat));
  tourbillonGroup.add(cageSpinner);

  // Bridge bar across tourbillon
  const bridgeGeo = trackGeo(new THREE.BoxGeometry(0.96, 0.045, 0.12));
  bridgeGeo.translate(0, 0.62, 0.56);
  tourbillonGroup.add(new THREE.Mesh(bridgeGeo, mats.secondary));
  tagPickableHierarchy(tourbillonGroup, spec.parts[4].id, pickableMeshes);
  root.add(tourbillonGroup);

  // 6. Skeletonized Hands (chrono-hands)
  const handsGroup = createPartGroup(spec.parts[5], 0, parts);
  const hourHandGroup = new THREE.Group();
  hourHandGroup.position.set(0, 0.68, 0);
  const hourGeo = trackGeo(new THREE.BoxGeometry(0.09, 0.025, 0.72));
  hourGeo.translate(0, 0, -0.26);
  hourHandGroup.add(new THREE.Mesh(hourGeo, mats.primary));
  hourHandGroup.rotation.y = Math.PI / 6;

  const minHandGroup = new THREE.Group();
  minHandGroup.position.set(0, 0.72, 0);
  const minGeo = trackGeo(new THREE.BoxGeometry(0.065, 0.025, 1.04));
  minGeo.translate(0, 0, -0.42);
  minHandGroup.add(new THREE.Mesh(minGeo, mats.accent));
  minHandGroup.rotation.y = -Math.PI / 3;

  const centerCapGeo = trackGeo(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 24));
  centerCapGeo.translate(0, 0.72, 0);
  handsGroup.add(hourHandGroup, minHandGroup, new THREE.Mesh(centerCapGeo, mats.accent));
  tagPickableHierarchy(handsGroup, spec.parts[5].id, pickableMeshes);
  root.add(handsGroup);

  // 7. Fluted Crown & Chronograph Pushers (chrono-crown)
  const crownGroup = createPartGroup(spec.parts[6], 0, parts);
  const mainCrownGeo = trackGeo(new THREE.CylinderGeometry(0.18, 0.18, 0.26, 24));
  mainCrownGeo.rotateZ(Math.PI / 2);
  mainCrownGeo.translate(1.68, 0.48, 0);
  crownGroup.add(new THREE.Mesh(mainCrownGeo, mats.accent));

  const pusherTopGeo = trackGeo(new THREE.CylinderGeometry(0.11, 0.13, 0.24, 20));
  pusherTopGeo.rotateZ(Math.PI / 2);
  pusherTopGeo.translate(1.56, 0.48, -0.62);
  pusherTopGeo.rotateY(-0.38);
  crownGroup.add(new THREE.Mesh(pusherTopGeo, mats.secondary));

  const pusherBotGeo = trackGeo(new THREE.CylinderGeometry(0.11, 0.13, 0.24, 20));
  pusherBotGeo.rotateZ(Math.PI / 2);
  pusherBotGeo.translate(1.56, 0.48, 0.62);
  pusherBotGeo.rotateY(0.38);
  crownGroup.add(new THREE.Mesh(pusherBotGeo, mats.secondary));
  tagPickableHierarchy(crownGroup, spec.parts[6].id, pickableMeshes);
  root.add(crownGroup);

  // 8. Domed Sapphire Crystal (chrono-crystal)
  const crystalGroup = createPartGroup(spec.parts[7], 0, parts);
  const crystalGeo = trackGeo(
    new THREE.SphereGeometry(1.26, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.24)
  );
  crystalGeo.scale(1, 0.45, 1);
  crystalGeo.translate(0, 0.56, 0);
  const crystalMesh = new THREE.Mesh(crystalGeo, mats.crystalGlass);
  crystalMesh.renderOrder = 10;
  crystalGroup.add(crystalMesh);
  tagPickableHierarchy(crystalGroup, spec.parts[7].id, pickableMeshes);
  root.add(crystalGroup);

  return {
    root,
    parts,
    pickableMeshes,
    updateKinematics: (_elapsed: number, delta: number) => {
      cageSpinner.rotation.y += delta * 1.4;
      gearWheelSubGroup.rotation.y -= delta * 0.65;
      minHandGroup.rotation.y -= delta * 0.08;
      hourHandGroup.rotation.y -= delta * 0.008;
    },
    disposeGeometries: () => {
      geometriesToDispose.forEach((g) => g.dispose());
    },
  };
}

/**
 * 2. TURBINA AEROESPACIAL AXIAL VX-900 (7 sub-assemblies + 28 InstancedMesh compressor blades)
 */
function buildTurbineModel(
  mats: StudioMaterialSet,
  geometriesToDispose: THREE.BufferGeometry[]
): BuiltDesignModel {
  const spec = DESIGN_MODELS.find((m) => m.id === 'turbine')!;
  const root = new THREE.Group();
  const parts: BuiltPartNode[] = [];
  const pickableMeshes: THREE.Object3D[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometriesToDispose.push(g);
    return g;
  };

  const centerHeight = 1.25;

  // 1. Calibration Test Stand (turb-stand) grounded at Y = 0
  const standGroup = createPartGroup(spec.parts[0], 0, parts);
  const basePlateGeo = trackGeo(new THREE.BoxGeometry(2.1, 0.14, 2.4));
  basePlateGeo.translate(0, 0.07, 0);
  standGroup.add(new THREE.Mesh(basePlateGeo, mats.darkChassis));

  // Twin cradles rising from Y=0.14 to centerHeight
  [-0.65, 0.65].forEach((zOff) => {
    const pylonGeo = trackGeo(new THREE.BoxGeometry(0.18, 0.85, 0.22));
    pylonGeo.translate(0, 0.56, zOff);
    standGroup.add(new THREE.Mesh(pylonGeo, mats.secondary));

    const cradleArcGeo = trackGeo(
      new THREE.TorusGeometry(0.88, 0.06, 16, 40, Math.PI)
    );
    cradleArcGeo.rotateZ(Math.PI);
    cradleArcGeo.translate(0, centerHeight, zOff);
    standGroup.add(new THREE.Mesh(cradleArcGeo, mats.accent));
  });
  tagPickableHierarchy(standGroup, spec.parts[0].id, pickableMeshes);
  root.add(standGroup);

  // 2. High-Pressure Central Shaft (turb-shaft)
  const shaftGroup = createPartGroup(spec.parts[1], 0, parts);
  const shaftGeo = trackGeo(new THREE.CylinderGeometry(0.22, 0.22, 2.5, 36));
  shaftGeo.rotateX(Math.PI / 2);
  shaftGeo.translate(0, centerHeight, 0);
  shaftGroup.add(new THREE.Mesh(shaftGeo, mats.primary));
  tagPickableHierarchy(shaftGroup, spec.parts[1].id, pickableMeshes);
  root.add(shaftGroup);

  // 3. Supersonic Intake Nose Cone (turb-cone)
  const coneGroup = createPartGroup(spec.parts[2], 0, parts);
  const coneSpinner = new THREE.Group();
  coneSpinner.position.set(0, centerHeight, 1.18);
  const conePoints = [
    new THREE.Vector2(0, 0.55),
    new THREE.Vector2(0.18, 0.35),
    new THREE.Vector2(0.34, 0.12),
    new THREE.Vector2(0.38, 0),
    new THREE.Vector2(0, 0),
  ];
  const coneLatheGeo = trackGeo(new THREE.LatheGeometry(conePoints, 48));
  coneLatheGeo.rotateX(Math.PI / 2);
  coneSpinner.add(new THREE.Mesh(coneLatheGeo, mats.accent));
  coneGroup.add(coneSpinner);
  tagPickableHierarchy(coneGroup, spec.parts[2].id, pickableMeshes);
  root.add(coneGroup);

  // 4. 28-Blade Axial Compressor Rotor (turb-blades) via InstancedMesh
  const bladesGroup = createPartGroup(spec.parts[3], 0, parts);
  const rotorWheel = new THREE.Group();
  rotorWheel.position.set(0, centerHeight, 0.92);

  const hubGeo = trackGeo(new THREE.CylinderGeometry(0.38, 0.38, 0.24, 36));
  hubGeo.rotateX(Math.PI / 2);
  rotorWheel.add(new THREE.Mesh(hubGeo, mats.secondary));

  const bladeGeo = trackGeo(new THREE.BoxGeometry(0.035, 0.56, 0.18));
  bladeGeo.translate(0, 0.62, 0);
  const bladeCount = 28;
  const bladesInstanced = new THREE.InstancedMesh(bladeGeo, mats.primary, bladeCount);
  const dummy = new THREE.Object3D();
  const bladeColor = new THREE.Color();

  for (let i = 0; i < bladeCount; i++) {
    const angle = (i / bladeCount) * Math.PI * 2;
    dummy.position.set(0, 0, 0);
    dummy.rotation.set(0, 0, angle);
    dummy.rotateY(0.42); // aerodynamic pitch angle
    const s = 0.96 + (i % 2) * 0.06;
    dummy.scale.set(1, s, 1);
    dummy.updateMatrix();
    bladesInstanced.setMatrixAt(i, dummy.matrix);
    bladeColor.setHSL(0.58, 0.12, 0.72 + (i % 3) * 0.05);
    bladesInstanced.setColorAt(i, bladeColor);
  }
  bladesInstanced.instanceMatrix.needsUpdate = true;
  if (bladesInstanced.instanceColor) bladesInstanced.instanceColor.needsUpdate = true;
  bladesInstanced.computeBoundingSphere();
  rotorWheel.add(bladesInstanced);
  bladesGroup.add(rotorWheel);
  tagPickableHierarchy(bladesGroup, spec.parts[3].id, pickableMeshes);
  root.add(bladesGroup);

  // 5. Annular Combustion Chamber & Manifolds (turb-combustor)
  const combustorGroup = createPartGroup(spec.parts[4], 0, parts);
  const coreTorusGeo = trackGeo(new THREE.TorusGeometry(0.56, 0.22, 24, 48));
  coreTorusGeo.translate(0, centerHeight, 0.05);
  combustorGroup.add(new THREE.Mesh(coreTorusGeo, mats.accent));

  // Cooling manifold tubes around the combustor
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a) * 0.68, centerHeight + Math.sin(a) * 0.68, 0.55),
      new THREE.Vector3(Math.cos(a) * 0.82, centerHeight + Math.sin(a) * 0.82, 0.05),
      new THREE.Vector3(Math.cos(a) * 0.66, centerHeight + Math.sin(a) * 0.66, -0.55),
    ]);
    const pipeGeo = trackGeo(new THREE.TubeGeometry(curve, 20, 0.028, 10, false));
    combustorGroup.add(new THREE.Mesh(pipeGeo, mats.secondary));
  }
  tagPickableHierarchy(combustorGroup, spec.parts[4].id, pickableMeshes);
  root.add(combustorGroup);

  // 6. Thrust-Vectoring Exhaust Nozzle (turb-nozzle)
  const nozzleGroup = createPartGroup(spec.parts[5], 0, parts);
  const nozzlePoints = [
    new THREE.Vector2(0.76, -0.55),
    new THREE.Vector2(0.62, -0.95),
    new THREE.Vector2(0.72, -1.35),
    new THREE.Vector2(0.66, -1.35),
    new THREE.Vector2(0.56, -0.95),
    new THREE.Vector2(0.7, -0.55),
  ];
  const nozzleGeo = trackGeo(new THREE.LatheGeometry(nozzlePoints, 32));
  nozzleGeo.rotateX(Math.PI / 2);
  nozzleGeo.translate(0, centerHeight, 0);
  nozzleGroup.add(new THREE.Mesh(nozzleGeo, mats.secondary));
  tagPickableHierarchy(nozzleGroup, spec.parts[5].id, pickableMeshes);
  root.add(nozzleGroup);

  // 7. Outer Aerodynamic Nacelle Cowl (turb-shroud)
  const shroudGroup = createPartGroup(spec.parts[6], 0, parts);
  const shroudPoints = [
    new THREE.Vector2(0.95, -0.65),
    new THREE.Vector2(1.06, 0.25),
    new THREE.Vector2(0.98, 1.15),
    new THREE.Vector2(0.92, 1.15),
    new THREE.Vector2(0.98, 0.25),
    new THREE.Vector2(0.89, -0.65),
  ];
  const shroudGeo = trackGeo(new THREE.LatheGeometry(shroudPoints, 48));
  shroudGeo.rotateX(Math.PI / 2);
  shroudGeo.translate(0, centerHeight, 0);
  const shroudMesh = new THREE.Mesh(shroudGeo, mats.crystalGlass);
  shroudMesh.renderOrder = 10;
  shroudGroup.add(shroudMesh);
  tagPickableHierarchy(shroudGroup, spec.parts[6].id, pickableMeshes);
  root.add(shroudGroup);

  return {
    root,
    parts,
    pickableMeshes,
    updateKinematics: (_elapsed: number, delta: number) => {
      rotorWheel.rotation.z += delta * 2.4;
      coneSpinner.rotation.z += delta * 2.4;
    },
    disposeGeometries: () => {
      geometriesToDispose.forEach((g) => g.dispose());
    },
  };
}

/**
 * 3. TRANSDUCTOR PLANAR MAGNÉTICO AETHER-ONE (7 sub-assemblies + 40 InstancedMesh acoustic pins)
 */
function buildAcousticsModel(
  mats: StudioMaterialSet,
  geometriesToDispose: THREE.BufferGeometry[]
): BuiltDesignModel {
  const spec = DESIGN_MODELS.find((m) => m.id === 'acoustics')!;
  const root = new THREE.Group();
  const parts: BuiltPartNode[] = [];
  const pickableMeshes: THREE.Object3D[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometriesToDispose.push(g);
    return g;
  };

  // 1. Display Stand (ac-stand) grounded at Y = 0
  const standGroup = createPartGroup(spec.parts[0], 0, parts);
  const baseDiscGeo = trackGeo(new THREE.CylinderGeometry(0.95, 1.08, 0.14, 48));
  baseDiscGeo.translate(0, 0.07, 0);
  standGroup.add(new THREE.Mesh(baseDiscGeo, mats.darkChassis));

  const stemGeo = trackGeo(new THREE.CylinderGeometry(0.07, 0.11, 2.25, 24));
  stemGeo.translate(0, 1.2, -0.15);
  standGroup.add(new THREE.Mesh(stemGeo, mats.secondary));

  const saddleGeo = trackGeo(new THREE.CylinderGeometry(0.22, 0.22, 0.32, 24));
  saddleGeo.rotateX(Math.PI / 2);
  saddleGeo.translate(0, 2.32, -0.05);
  standGroup.add(new THREE.Mesh(saddleGeo, mats.accent));
  tagPickableHierarchy(standGroup, spec.parts[0].id, pickableMeshes);
  root.add(standGroup);

  // 2. Curved Titanium Headband Arch (ac-headband)
  const headbandGroup = createPartGroup(spec.parts[1], 0, parts);
  const archCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.98, 1.48, 0),
    new THREE.Vector3(-0.85, 2.12, 0),
    new THREE.Vector3(0, 2.46, 0),
    new THREE.Vector3(0.85, 2.12, 0),
    new THREE.Vector3(0.98, 1.48, 0),
  ]);
  const archGeo = trackGeo(new THREE.TubeGeometry(archCurve, 48, 0.065, 16, false));
  headbandGroup.add(new THREE.Mesh(archGeo, mats.primary));
  tagPickableHierarchy(headbandGroup, spec.parts[1].id, pickableMeshes);
  root.add(headbandGroup);

  // 3. Gimbal Suspension Yokes (ac-yokes)
  const yokesGroup = createPartGroup(spec.parts[2], 0, parts);
  [-0.98, 0.98].forEach((xSide) => {
    const yokeRingGeo = trackGeo(new THREE.TorusGeometry(0.54, 0.035, 16, 36, Math.PI));
    yokeRingGeo.rotateY(Math.PI / 2);
    yokeRingGeo.translate(xSide, 1.12, 0);
    yokesGroup.add(new THREE.Mesh(yokeRingGeo, mats.secondary));

    const rodGeo = trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 16));
    rodGeo.translate(xSide, 1.32, 0);
    yokesGroup.add(new THREE.Mesh(rodGeo, mats.accent));
  });
  tagPickableHierarchy(yokesGroup, spec.parts[2].id, pickableMeshes);
  root.add(yokesGroup);

  // 4. Turned Acoustic Cups (ac-cups)
  const cupsGroup = createPartGroup(spec.parts[3], 0, parts);
  [-0.92, 0.92].forEach((xSide) => {
    const sign = Math.sign(xSide);
    const cupGeo = trackGeo(new THREE.CylinderGeometry(0.52, 0.46, 0.24, 48));
    cupGeo.rotateZ(Math.PI / 2);
    cupGeo.translate(xSide, 1.12, 0);
    const cupMesh = new THREE.Mesh(cupGeo, mats.primary);
    cupMesh.rotation.z = sign * -0.08;
    cupsGroup.add(cupMesh);
  });
  tagPickableHierarchy(cupsGroup, spec.parts[3].id, pickableMeshes);
  root.add(cupsGroup);

  // 5. Planar Magnetic Drivers (ac-drivers)
  const driversGroup = createPartGroup(spec.parts[4], 0, parts);
  const driverPulseGroup = new THREE.Group();
  [-0.86, 0.86].forEach((xSide) => {
    const driverGeo = trackGeo(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 36));
    driverGeo.rotateZ(Math.PI / 2);
    driverGeo.translate(xSide, 1.12, 0);
    driverPulseGroup.add(new THREE.Mesh(driverGeo, mats.accent));
  });
  driversGroup.add(driverPulseGroup);
  tagPickableHierarchy(driversGroup, spec.parts[4].id, pickableMeshes);
  root.add(driversGroup);

  // 6. Phase Array Grilles (40 InstancedMesh acoustic pins) (ac-grilles)
  const grillesGroup = createPartGroup(spec.parts[5], 0, parts);
  const pinGeo = trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 0.32, 12));
  pinGeo.rotateZ(Math.PI / 2);
  const pinCount = 40;
  const pinsInstanced = new THREE.InstancedMesh(pinGeo, mats.accent, pinCount);
  const dummy = new THREE.Object3D();
  let idx = 0;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 20; i++) {
      const ring = i < 6 ? 0.14 : 0.3;
      const a = ((i % 14) / 14) * Math.PI * 2;
      dummy.position.set(side * 1.04, 1.12 + Math.cos(a) * ring, Math.sin(a) * ring);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(0.9 + (i % 3) * 0.08);
      dummy.updateMatrix();
      pinsInstanced.setMatrixAt(idx++, dummy.matrix);
    }
  }
  pinsInstanced.instanceMatrix.needsUpdate = true;
  pinsInstanced.computeBoundingSphere();
  grillesGroup.add(pinsInstanced);
  tagPickableHierarchy(grillesGroup, spec.parts[5].id, pickableMeshes);
  root.add(grillesGroup);

  // 7. Ergonomic Ear Pads (ac-pads)
  const padsGroup = createPartGroup(spec.parts[6], 0, parts);
  [-0.76, 0.76].forEach((xSide) => {
    const padGeo = trackGeo(new THREE.TorusGeometry(0.44, 0.11, 24, 48));
    padGeo.rotateY(Math.PI / 2);
    padGeo.translate(xSide, 1.12, 0);
    padsGroup.add(new THREE.Mesh(padGeo, mats.darkChassis));
  });
  tagPickableHierarchy(padsGroup, spec.parts[6].id, pickableMeshes);
  root.add(padsGroup);

  return {
    root,
    parts,
    pickableMeshes,
    updateKinematics: (elapsed: number) => {
      const pulse = 1 + Math.sin(elapsed * 3.5) * 0.025;
      driverPulseGroup.scale.set(1, pulse, pulse);
    },
    disposeGeometries: () => {
      geometriesToDispose.forEach((g) => g.dispose());
    },
  };
}

/**
 * 4. PABELLÓN BIODOMO PARAMÉTRICO SOLARIS (6 sub-assemblies + 32 InstancedMesh geodesic nodes)
 */
function buildPavilionModel(
  mats: StudioMaterialSet,
  geometriesToDispose: THREE.BufferGeometry[]
): BuiltDesignModel {
  const spec = DESIGN_MODELS.find((m) => m.id === 'pavilion')!;
  const root = new THREE.Group();
  const parts: BuiltPartNode[] = [];
  const pickableMeshes: THREE.Object3D[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometriesToDispose.push(g);
    return g;
  };

  // 1. Stepped Architectural Plinth (pav-plinth) grounded at Y = 0
  const plinthGroup = createPartGroup(spec.parts[0], 0, parts);
  const step1Geo = trackGeo(new THREE.CylinderGeometry(1.85, 1.95, 0.12, 64));
  step1Geo.translate(0, 0.06, 0);
  const step2Geo = trackGeo(new THREE.CylinderGeometry(1.62, 1.72, 0.12, 64));
  step2Geo.translate(0, 0.18, 0);
  plinthGroup.add(
    new THREE.Mesh(step1Geo, mats.darkChassis),
    new THREE.Mesh(step2Geo, mats.secondary)
  );
  tagPickableHierarchy(plinthGroup, spec.parts[0].id, pickableMeshes);
  root.add(plinthGroup);

  // 2. Solar Convection Core Spire (pav-core)
  const coreGroup = createPartGroup(spec.parts[1], 0, parts);
  const spireSpinner = new THREE.Group();
  const spirePoints = [
    new THREE.Vector2(0, 0.24),
    new THREE.Vector2(0.44, 0.24),
    new THREE.Vector2(0.22, 0.95),
    new THREE.Vector2(0.36, 1.65),
    new THREE.Vector2(0.08, 2.25),
    new THREE.Vector2(0, 2.35),
  ];
  const spireGeo = trackGeo(new THREE.LatheGeometry(spirePoints, 32));
  spireSpinner.add(new THREE.Mesh(spireGeo, mats.accent));
  coreGroup.add(spireSpinner);
  tagPickableHierarchy(coreGroup, spec.parts[1].id, pickableMeshes);
  root.add(coreGroup);

  // 3. Parabolic Compression Ribs (pav-ribs)
  const ribsGroup = createPartGroup(spec.parts[2], 0, parts);
  const ribCount = 8;
  for (let i = 0; i < ribCount; i++) {
    const a = (i / ribCount) * Math.PI * 2;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a) * 1.52, 0.24, Math.sin(a) * 1.52),
      new THREE.Vector3(Math.cos(a + 0.25) * 1.18, 1.35, Math.sin(a + 0.25) * 1.18),
      new THREE.Vector3(0, 2.28, 0),
    ]);
    const ribGeo = trackGeo(new THREE.TubeGeometry(curve, 32, 0.036, 12, false));
    ribsGroup.add(new THREE.Mesh(ribGeo, mats.primary));
  }
  tagPickableHierarchy(ribsGroup, spec.parts[2].id, pickableMeshes);
  root.add(ribsGroup);

  // 4. Cantilevered Walkway Rings (pav-walkways)
  const walkwaysGroup = createPartGroup(spec.parts[3], 0, parts);
  const walk1Geo = trackGeo(new THREE.TorusGeometry(1.12, 0.065, 16, 64));
  walk1Geo.rotateX(Math.PI / 2);
  walk1Geo.translate(0, 0.78, 0);
  const walk2Geo = trackGeo(new THREE.TorusGeometry(0.78, 0.055, 16, 64));
  walk2Geo.rotateX(Math.PI / 2);
  walk2Geo.translate(0, 1.42, 0);
  walkwaysGroup.add(
    new THREE.Mesh(walk1Geo, mats.secondary),
    new THREE.Mesh(walk2Geo, mats.secondary)
  );
  tagPickableHierarchy(walkwaysGroup, spec.parts[3].id, pickableMeshes);
  root.add(walkwaysGroup);

  // 5. 32 Geodesic Structural Nodes via InstancedMesh (pav-nodes)
  const nodesGroup = createPartGroup(spec.parts[4], 0, parts);
  const nodeGeo = trackGeo(new THREE.OctahedronGeometry(0.075, 1));
  const nodeCount = 32;
  const nodesInstanced = new THREE.InstancedMesh(nodeGeo, mats.accent, nodeCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < nodeCount; i++) {
    const tier = Math.floor(i / 8); // 4 tiers of 8 nodes
    const a = ((i % 8) / 8) * Math.PI * 2 + tier * 0.12;
    const r = 1.45 - tier * 0.32;
    const y = 0.45 + tier * 0.48;
    dummy.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    dummy.rotation.set(a, tier * 0.5, 0);
    dummy.scale.setScalar(0.9 + (tier % 2) * 0.18);
    dummy.updateMatrix();
    nodesInstanced.setMatrixAt(i, dummy.matrix);
  }
  nodesInstanced.instanceMatrix.needsUpdate = true;
  nodesInstanced.computeBoundingSphere();
  nodesGroup.add(nodesInstanced);
  tagPickableHierarchy(nodesGroup, spec.parts[4].id, pickableMeshes);
  root.add(nodesGroup);

  // 6. Geodesic Glass Envelope Dome (pav-dome)
  const domeGroup = createPartGroup(spec.parts[5], 0, parts);
  const domeGeo = trackGeo(
    new THREE.SphereGeometry(1.48, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.48)
  );
  domeGeo.scale(1, 1.35, 1);
  domeGeo.translate(0, 0.24, 0);
  const domeMesh = new THREE.Mesh(domeGeo, mats.crystalGlass);
  domeMesh.renderOrder = 10;
  domeGroup.add(domeMesh);
  tagPickableHierarchy(domeGroup, spec.parts[5].id, pickableMeshes);
  root.add(domeGroup);

  return {
    root,
    parts,
    pickableMeshes,
    updateKinematics: (_elapsed: number, delta: number) => {
      spireSpinner.rotation.y += delta * 0.45;
    },
    disposeGeometries: () => {
      geometriesToDispose.forEach((g) => g.dispose());
    },
  };
}

/**
 * Builds a custom uploaded BufferGeometry (.STL / .OBJ) mounted on a precision pedestal.
 */
export function buildCustomGeometryModel(
  customGeometry: THREE.BufferGeometry,
  fileName: string,
  mats: StudioMaterialSet
): { model: BuiltDesignModel; spec: (typeof DESIGN_MODELS)[0] } {
  const root = new THREE.Group();
  const parts: BuiltPartNode[] = [];
  const pickableMeshes: THREE.Object3D[] = [];
  const geometriesToDispose: THREE.BufferGeometry[] = [];

  const cloned = customGeometry.clone();
  cloned.computeVertexNormals();
  cloned.computeBoundingBox();

  const box = cloned.boundingBox!;
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  const scale = 2.0 / maxDim;
  cloned.center();
  cloned.scale(scale, scale, scale);
  cloned.computeBoundingBox();

  const minY = cloned.boundingBox!.min.y;
  cloned.translate(0, -minY + 0.18, 0);
  geometriesToDispose.push(cloned);

  const customParts: PartMetadata[] = [
    {
      id: 'custom-plinth',
      name: 'Pedestal Metrológico de Exhibición',
      role: 'Base nivelada de referencia a cota Y=0',
      materialSpec: 'Acero pavonado antirreflejos',
      tolerance: '±0.005 mm',
      massGrams: 1200,
      explodeOffset: [0, -0.5, 0],
    },
    {
      id: 'custom-mesh',
      name: `Malla Importada (${fileName})`,
      role: 'Geometría 3D cargada por el usuario',
      materialSpec: 'Renderizado PBR de estudio activo',
      tolerance: 'Nativo CAD',
      massGrams: 450,
      explodeOffset: [0, 0.45, 0],
    },
  ];

  const plinthGroup = createPartGroup(customParts[0], 0, parts);
  const plinthGeo = new THREE.CylinderGeometry(1.3, 1.42, 0.18, 48);
  plinthGeo.translate(0, 0.09, 0);
  geometriesToDispose.push(plinthGeo);
  plinthGroup.add(new THREE.Mesh(plinthGeo, mats.darkChassis));
  tagPickableHierarchy(plinthGroup, customParts[0].id, pickableMeshes);
  root.add(plinthGroup);

  const meshGroup = createPartGroup(customParts[1], 0, parts);
  const mainMesh = new THREE.Mesh(cloned, mats.primary);
  meshGroup.add(mainMesh);
  tagPickableHierarchy(meshGroup, customParts[1].id, pickableMeshes);
  root.add(meshGroup);

  const triCount = cloned.index
    ? Math.round(cloned.index.count / 3)
    : Math.round((cloned.attributes.position?.count || 0) / 3);

  const spec = {
    id: 'custom' as ModelId,
    title: fileName.replace(/\.(stl|obj)$/i, ''),
    shortTitle: 'Modelo Importado',
    category: 'Archivo CAD Local (.STL / .OBJ)',
    dimensions: `${size.x.toFixed(1)} × ${size.y.toFixed(1)} × ${size.z.toFixed(1)} u`,
    partCount: 2,
    vertexEstimate: `${triCount.toLocaleString()} tris`,
    description:
      'Geometría tridimensional cargada directamente desde tu equipo y normalizada sobre el pedestal de iluminación PBR de estudio.',
    parts: customParts,
  };

  return {
    spec,
    model: {
      root,
      parts,
      pickableMeshes,
      updateKinematics: () => {},
      disposeGeometries: () => {
        geometriesToDispose.forEach((g) => g.dispose());
      },
    },
  };
}

export function buildProceduralModel(
  modelId: ModelId,
  mats: StudioMaterialSet
): BuiltDesignModel {
  const geometriesToDispose: THREE.BufferGeometry[] = [];
  switch (modelId) {
    case 'chronograph':
      return buildChronographModel(mats, geometriesToDispose);
    case 'turbine':
      return buildTurbineModel(mats, geometriesToDispose);
    case 'acoustics':
      return buildAcousticsModel(mats, geometriesToDispose);
    case 'pavilion':
      return buildPavilionModel(mats, geometriesToDispose);
    default:
      return buildChronographModel(mats, geometriesToDispose);
  }
}
