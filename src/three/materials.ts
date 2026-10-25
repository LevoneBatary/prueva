import * as THREE from 'three';
import { FINISH_PRESETS, FinishId } from '../types/studio';

export interface StudioMaterialSet {
  primary: THREE.MeshPhysicalMaterial;
  secondary: THREE.MeshPhysicalMaterial;
  accent: THREE.MeshPhysicalMaterial;
  darkChassis: THREE.MeshStandardMaterial;
  dialSurface: THREE.MeshStandardMaterial;
  crystalGlass: THREE.MeshPhysicalMaterial;
  dispose: () => void;
}

export function createStudioMaterialSet(
  finishId: FinishId,
  brushedMap: THREE.Texture,
  dialTexture: THREE.Texture,
  isSoftwareGl: boolean,
  wireframe: boolean
): StudioMaterialSet {
  const preset = FINISH_PRESETS.find((f) => f.id === finishId) || FINISH_PRESETS[0];

  const primary = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(preset.swatchHex),
    metalness: preset.metalness,
    roughness: preset.roughness,
    roughnessMap: brushedMap,
    bumpMap: brushedMap,
    bumpScale: 0.004,
    clearcoat: preset.clearcoat,
    clearcoatRoughness: 0.15,
    anisotropy: isSoftwareGl ? 0 : preset.anisotropy,
    anisotropyRotation: Math.PI / 4,
    envMapIntensity: 1.35,
    wireframe,
  });

  // Secondary material varies roughness by >= 0.25 from primary as required by Three.js craft rules
  const secondaryRoughness =
    preset.roughness < 0.35
      ? Math.min(0.85, preset.roughness + 0.32)
      : Math.max(0.12, preset.roughness - 0.28);

  const secondary = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(preset.secondaryHex),
    metalness: Math.max(0.25, preset.metalness - 0.2),
    roughness: secondaryRoughness,
    roughnessMap: brushedMap,
    clearcoat: 0.2,
    envMapIntensity: 1.15,
    wireframe,
  });

  const accent = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(preset.accentHex),
    metalness: 0.94,
    roughness: 0.14,
    clearcoat: 0.65,
    anisotropy: isSoftwareGl ? 0 : 0.8,
    envMapIntensity: 1.5,
    wireframe,
  });

  const darkChassis = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#161922'),
    metalness: 0.45,
    roughness: 0.68,
    roughnessMap: brushedMap,
    envMapIntensity: 0.9,
    wireframe,
  });

  const dialSurface = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#FFFFFF'),
    map: dialTexture,
    metalness: 0.55,
    roughness: 0.32,
    envMapIntensity: 1.1,
    wireframe,
  });

  const crystalGlass = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#E0F2FE'),
    metalness: 0,
    roughness: 0.04,
    transmission: isSoftwareGl ? 0 : 0.92,
    transparent: true,
    opacity: isSoftwareGl ? 0.32 : 1.0,
    ior: 1.77,
    thickness: 0.6,
    attenuationColor: new THREE.Color('#BAE6FD'),
    attenuationDistance: 2.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    depthWrite: false,
    wireframe,
  });

  return {
    primary,
    secondary,
    accent,
    darkChassis,
    dialSurface,
    crystalGlass,
    dispose: () => {
      primary.dispose();
      secondary.dispose();
      accent.dispose();
      darkChassis.dispose();
      dialSurface.dispose();
      crystalGlass.dispose();
    },
  };
}

export function updateStudioMaterialSet(
  matSet: StudioMaterialSet,
  finishId: FinishId,
  isSoftwareGl: boolean,
  wireframe: boolean
) {
  const preset = FINISH_PRESETS.find((f) => f.id === finishId) || FINISH_PRESETS[0];

  matSet.primary.color.set(preset.swatchHex);
  matSet.primary.metalness = preset.metalness;
  matSet.primary.roughness = preset.roughness;
  matSet.primary.clearcoat = preset.clearcoat;
  matSet.primary.anisotropy = isSoftwareGl ? 0 : preset.anisotropy;
  matSet.primary.wireframe = wireframe;

  const secondaryRoughness =
    preset.roughness < 0.35
      ? Math.min(0.85, preset.roughness + 0.32)
      : Math.max(0.12, preset.roughness - 0.28);

  matSet.secondary.color.set(preset.secondaryHex);
  matSet.secondary.metalness = Math.max(0.25, preset.metalness - 0.2);
  matSet.secondary.roughness = secondaryRoughness;
  matSet.secondary.wireframe = wireframe;

  matSet.accent.color.set(preset.accentHex);
  matSet.accent.wireframe = wireframe;

  matSet.darkChassis.wireframe = wireframe;
  matSet.dialSurface.wireframe = wireframe;
  matSet.crystalGlass.wireframe = wireframe;
}
