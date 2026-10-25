import React, { useRef, useState } from 'react';
import {
  Box,
  Camera,
  ChevronDown,
  ChevronUp,
  Layers,
  Palette,
  Pause,
  Play,
  RotateCw,
  SunMedium,
  Upload,
} from 'lucide-react';
import {
  CAMERA_PRESETS,
  CameraPresetId,
  DesignModelSpec,
  FINISH_PRESETS,
  FinishId,
  STUDIO_ENVIRONMENTS,
  StudioEnvId,
} from '../types/studio';

type DockTab = 'explode' | 'materials' | 'studio' | 'parts';

export interface ControlDockProps {
  activeSpec: DesignModelSpec;
  collapsed: boolean;
  onToggleCollapse: () => void;
  explodeTarget: number;
  onChangeExplode: (val: number) => void;
  finishId: FinishId;
  onChangeFinish: (id: FinishId) => void;
  envId: StudioEnvId;
  onChangeEnv: (id: StudioEnvId) => void;
  onTriggerCameraPreset: (id: CameraPresetId) => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  kinematicsActive: boolean;
  onToggleKinematics: () => void;
  wireframe: boolean;
  onToggleWireframe: () => void;
  selectedPartId: string | null;
  onSelectPart: (partId: string | null) => void;
  onUploadCADFile: (file: File) => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  activeSpec,
  collapsed,
  onToggleCollapse,
  explodeTarget,
  onChangeExplode,
  finishId,
  onChangeFinish,
  envId,
  onChangeEnv,
  onTriggerCameraPreset,
  autoRotate,
  onToggleAutoRotate,
  kinematicsActive,
  onToggleKinematics,
  wireframe,
  onToggleWireframe,
  selectedPartId,
  onSelectPart,
  onUploadCADFile,
}) => {
  const [activeTab, setActiveTab] = useState<DockTab>('explode');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedPart =
    activeSpec.parts.find((p) => p.id === selectedPartId) || null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadCADFile(file);
      e.target.value = '';
    }
  };

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-[min(940px,94vw)] pointer-events-auto transition-transform duration-200 ease-out"
      style={{
        transform: collapsed
          ? 'translate(-50%, calc(100% - 34px))'
          : 'translate(-50%, 0)',
      }}
    >
      {/* Hidden CAD file input (.stl, .obj) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".stl,.obj"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top Collapse / Expand Drawer Handle */}
      <div className="flex items-center justify-between px-1 mb-1.5">
        <div className="flex items-center gap-2 text-xs text-slate-300 bg-[#10131A] border border-white/10 rounded-lg px-3 py-1.5 shadow-md">
          <span className="font-semibold text-white">{activeSpec.title}</span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span className="text-slate-400">{activeSpec.category}</span>
          <span aria-hidden="true" className="text-slate-600 hidden sm:inline">
            ·
          </span>
          <span className="font-mono text-amber-400/90 tabular-nums hidden sm:inline">
            {activeSpec.dimensions}
          </span>
          {selectedPart && (
            <>
              <span aria-hidden="true" className="text-slate-600">
                ·
              </span>
              <span className="text-amber-300 font-medium">
                Pieza: {selectedPart.name}
              </span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#10131A] hover:bg-[#181C26] border border-white/10 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-md"
          title="Atajo de teclado: H"
        >
          {collapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Mostrar Controles (H)</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
              <span>Modo Cine (H)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Unified Control Dock Surface (Zero backdrop-filter over WebGL) */}
      <div className="bg-[#10131A] border border-white/12 rounded-xl p-3.5 shadow-2xl">
        {/* Top Row inside Dock: Segmented Mode Tabs + Quick Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-white/8">
          <div className="flex items-center gap-1 bg-[#0A0C10] p-1 rounded-lg border border-white/6">
            <button
              type="button"
              onClick={() => setActiveTab('explode')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'explode'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Despiece y Vista</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('materials')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'materials'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Acabados PBR</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'studio'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <SunMedium className="w-3.5 h-3.5" />
              <span>Luz y Cámara</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('parts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'parts'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Piezas ({activeSpec.parts.length})</span>
            </button>
          </div>

          {/* Right Quick Action Bar */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleKinematics}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                kinematicsActive
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-[#161A24] border-white/8 text-slate-400 hover:text-slate-200'
              }`}
              title="Activar o pausar movimiento mecánico interno"
            >
              {kinematicsActive ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>Mecánica</span>
            </button>

            <button
              type="button"
              onClick={onToggleAutoRotate}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                autoRotate
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-[#161A24] border-white/8 text-slate-400 hover:text-slate-200'
              }`}
              title="Rotación continua de tornamesa 360°"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Giro 360°</span>
            </button>

            <button
              type="button"
              onClick={onToggleWireframe}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                wireframe
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-[#161A24] border-white/8 text-slate-400 hover:text-slate-200'
              }`}
            >
              Malla CAD
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#161A24] hover:bg-[#1E2433] border border-white/10 text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Cargar archivo 3D propio (.STL o .OBJ)"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Importar .STL / .OBJ</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Exploded View Slider & Selected Part Summary */}
        {activeTab === 'explode' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-7 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">
                  Separación de Vista Explotada (Ingeniería)
                </span>
                <span className="font-mono text-amber-400 font-semibold tabular-nums">
                  {Math.round(explodeTarget * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={explodeTarget}
                  onChange={(e) => onChangeExplode(parseFloat(e.target.value))}
                  aria-label="Separación de vista explotada"
                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onChangeExplode(0)}
                    className="px-2 py-1 text-xs font-mono rounded bg-[#161A24] hover:bg-[#1E2433] text-slate-300 border border-white/8 cursor-pointer whitespace-nowrap"
                  >
                    0%
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeExplode(0.5)}
                    className="px-2 py-1 text-xs font-mono rounded bg-[#161A24] hover:bg-[#1E2433] text-slate-300 border border-white/8 cursor-pointer whitespace-nowrap"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeExplode(1)}
                    className="px-2 py-1 text-xs font-mono rounded bg-[#161A24] hover:bg-[#1E2433] text-slate-300 border border-white/8 cursor-pointer whitespace-nowrap"
                  >
                    100%
                  </button>
                </div>
              </div>
            </div>

            <div className="md:col-span-5 bg-[#0B0D12] border border-white/8 rounded-lg px-3.5 py-2.5">
              {selectedPart ? (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-amber-400 truncate">
                      {selectedPart.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectPart(null)}
                      className="text-xs text-slate-400 hover:text-white whitespace-nowrap cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 truncate">{selectedPart.role}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                    <span>{selectedPart.materialSpec}</span>
                    <span aria-hidden="true">·</span>
                    <span>Tol: {selectedPart.tolerance}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedPart.massGrams} g</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-slate-200">
                    Inspección Interactiva de Subcomponentes
                  </span>
                  <p className="text-xs text-slate-400">
                    Haz clic sobre cualquier pieza del modelo 3D o usa la pestaña Piezas para aislar su ficha técnica.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Studio PBR Material Finishes */}
        {activeTab === 'materials' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {FINISH_PRESETS.map((preset) => {
              const active = preset.id === finishId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onChangeFinish(preset.id)}
                  className={`flex items-center gap-2.5 p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#1A1F2C] border-amber-500/60 text-white'
                      : 'bg-[#0B0D12] border-white/8 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <span
                    className="w-6 h-6 rounded-md shrink-0 border border-white/20"
                    style={{
                      background: `linear-gradient(135deg, ${preset.swatchHex} 0%, ${preset.secondaryHex} 65%, ${preset.accentHex} 100%)`,
                    }}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{preset.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                      R:{preset.roughness} · M:{preset.metalness}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 3: Studio Lighting Environments & Camera Presets */}
        {activeTab === 'studio' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-6 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400 mr-1 whitespace-nowrap">
                Ambiente:
              </span>
              {STUDIO_ENVIRONMENTS.map((env) => {
                const active = env.id === envId;
                return (
                  <button
                    key={env.id}
                    type="button"
                    onClick={() => onChangeEnv(env.id)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
                        : 'bg-[#0B0D12] border-white/8 text-slate-300 hover:text-white'
                    }`}
                  >
                    {env.name}
                  </button>
                );
              })}
            </div>

            <div className="md:col-span-6 flex flex-wrap items-center gap-1.5 md:justify-end">
              <span className="text-xs text-slate-400 mr-1 flex items-center gap-1 whitespace-nowrap">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Cámara:</span>
              </span>
              {CAMERA_PRESETS.map((cam) => (
                <button
                  key={cam.id}
                  type="button"
                  onClick={() => onTriggerCameraPreset(cam.id)}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#0B0D12] hover:bg-[#1A1F2C] border border-white/10 text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {cam.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Sub-Assembly Parts Selector */}
        {activeTab === 'parts' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {activeSpec.parts.map((part, index) => {
              const isSelected = selectedPartId === part.id;
              return (
                <button
                  key={part.id}
                  type="button"
                  onClick={() =>
                    onSelectPart(isSelected ? null : part.id)
                  }
                  className={`flex flex-col gap-0.5 px-3 py-2 rounded-lg border text-left transition-colors shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#1A1F2C] border-amber-500/60 text-white'
                      : 'bg-[#0B0D12] border-white/8 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium whitespace-nowrap">
                    <span className="font-mono text-amber-400 tabular-nums">
                      0{index + 1}.
                    </span>
                    <span>{part.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono tabular-nums whitespace-nowrap">
                    {part.materialSpec} · {part.tolerance}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
