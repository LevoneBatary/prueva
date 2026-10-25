/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import * as THREE from 'three';
import {
  CameraPresetId,
  DESIGN_MODELS,
  DesignModelSpec,
  FinishId,
  ModelId,
  StudioEnvId,
} from './types/studio';
import { Viewport3D } from './components/Viewport3D';
import { ControlDock } from './components/ControlDock';
import { parseCADFile } from './three/cadParser';

export default function App() {
  const [modelId, setModelId] = useState<ModelId>('chronograph');
  const [customGeometry, setCustomGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [customFileName, setCustomFileName] = useState<string>('');
  const [customSpec, setCustomSpec] = useState<DesignModelSpec | null>(null);

  const [finishId, setFinishId] = useState<FinishId>('titanium');
  const [envId, setEnvId] = useState<StudioEnvId>('obsidian');
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId | null>(null);

  const [explodeTarget, setExplodeTarget] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [kinematicsActive, setKinematicsActive] = useState<boolean>(true);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);

  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [captureTrigger, setCaptureTrigger] = useState<number>(0);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const activeSpec: DesignModelSpec =
    modelId === 'custom' && customSpec
      ? customSpec
      : DESIGN_MODELS.find((m) => m.id === modelId) || DESIGN_MODELS[0];

  const handleSelectModel = (id: ModelId) => {
    setModelId(id);
    setSelectedPartId(null);
    setExplodeTarget(0);
    setCameraPreset('isometric');
  };

  const handleUploadCADFile = useCallback(async (file: File) => {
    setUploadError(null);
    try {
      const geo = await parseCADFile(file);
      if (!geo.attributes.position || geo.attributes.position.count === 0) {
        setUploadError('El archivo no contiene vértices 3D válidos (.STL o .OBJ).');
        return;
      }
      setCustomGeometry(geo);
      setCustomFileName(file.name);
      setModelId('custom');
      setSelectedPartId(null);
      setExplodeTarget(0);
      setCameraPreset('isometric');
    } catch {
      setUploadError('No se pudo procesar el archivo 3D. Usa formato .STL o .OBJ.');
    }
  }, []);

  // Keyboard shortcut 'H' to collapse/expand bottom control dock (Cinema / Zen mode)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key.toLowerCase() === 'h') {
        setDockCollapsed((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSelectedPartId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragActive) setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUploadCADFile(file);
    }
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-[#0B0D11] text-[#F3F4F6]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Top Bar Contract: 3 Zones separated by gap-8 */}
      <header className="fixed top-0 inset-x-0 z-20 flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0B0D11]/95 border-b border-white/10">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            handleSelectModel('chronograph');
          }}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          Atelier Voxel
        </a>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          {DESIGN_MODELS.map((model) => {
            const isCurrent = modelId === model.id;
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => handleSelectModel(model.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                  isCurrent
                    ? 'text-white border-amber-500 font-semibold'
                    : 'text-slate-400 border-transparent hover:text-white hover:border-white/30'
                }`}
              >
                {model.shortTitle}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setCaptureTrigger((c) => c + 1)}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Capturar Render PNG
          </button>
        </div>
      </header>

      {/* Mobile Model Switcher Strip (Only visible on <md viewports) */}
      <div className="fixed top-14 inset-x-0 z-20 flex md:hidden items-center gap-2 px-4 py-2 bg-[#0B0D11]/95 border-b border-white/8 overflow-x-auto">
        {DESIGN_MODELS.map((model) => {
          const isCurrent = modelId === model.id;
          return (
            <button
              key={model.id}
              type="button"
              onClick={() => handleSelectModel(model.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                isCurrent
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'bg-[#141822] text-slate-300'
              }`}
            >
              {model.shortTitle}
            </button>
          );
        })}
      </div>

      {/* Upload Error Toast if invalid file dropped */}
      {uploadError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#1A1215] border border-red-500/40 text-xs text-red-200 shadow-xl">
          <span>{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-red-300 hover:text-white font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Drag & Drop 3D CAD Overlay */}
      {dragActive && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0B0D11]/90 border-2 border-dashed border-amber-500 m-4 rounded-2xl pointer-events-none">
          <div className="text-center">
            <p className="text-lg font-semibold text-white">
              Suelta tu archivo 3D (.STL o .OBJ) para inspeccionarlo en el estudio
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Normalización automática de escala, centrado sobre pedestal y materiales PBR
            </p>
          </div>
        </div>
      )}

      {/* Full-Bleed 3D WebGL Viewport (100% Unobstructed Center) */}
      <main className="w-full h-full">
        <Viewport3D
          modelId={modelId}
          customGeometry={customGeometry}
          customFileName={customFileName}
          finishId={finishId}
          envId={envId}
          cameraPreset={cameraPreset}
          onCameraPresetSettled={() => setCameraPreset(null)}
          explodeTarget={explodeTarget}
          autoRotate={autoRotate}
          kinematicsActive={kinematicsActive}
          wireframe={wireframe}
          selectedPartId={selectedPartId}
          onSelectPart={setSelectedPartId}
          onCustomModelLoaded={setCustomSpec}
          captureTrigger={captureTrigger}
        />
      </main>

      {/* Collapsible Unified Bottom Control Dock */}
      <ControlDock
        activeSpec={activeSpec}
        collapsed={dockCollapsed}
        onToggleCollapse={() => setDockCollapsed((c) => !c)}
        explodeTarget={explodeTarget}
        onChangeExplode={setExplodeTarget}
        finishId={finishId}
        onChangeFinish={setFinishId}
        envId={envId}
        onChangeEnv={setEnvId}
        onTriggerCameraPreset={(preset) => setCameraPreset(preset)}
        autoRotate={autoRotate}
        onToggleAutoRotate={() => setAutoRotate((r) => !r)}
        kinematicsActive={kinematicsActive}
        onToggleKinematics={() => setKinematicsActive((k) => !k)}
        wireframe={wireframe}
        onToggleWireframe={() => setWireframe((w) => !w)}
        selectedPartId={selectedPartId}
        onSelectPart={setSelectedPartId}
        onUploadCADFile={handleUploadCADFile}
      />
    </div>
  );
}
