import * as THREE from 'three';

/**
 * Parses an STL file (binary or ASCII) or Wavefront OBJ file into a THREE.BufferGeometry.
 */
export async function parseCADFile(file: File): Promise<THREE.BufferGeometry> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'obj') {
    const text = await file.text();
    return parseOBJText(text);
  }
  const buffer = await file.arrayBuffer();
  return parseSTLBuffer(buffer);
}

function parseSTLBuffer(buffer: ArrayBuffer): THREE.BufferGeometry {
  const view = new DataView(buffer);
  if (buffer.byteLength > 84) {
    const faceCount = view.getUint32(80, true);
    const expectedByteLength = 84 + faceCount * 50;
    if (expectedByteLength === buffer.byteLength) {
      return parseBinarySTL(view, faceCount);
    }
  }
  const text = new TextDecoder().decode(buffer);
  return parseASCIISTL(text);
}

function parseBinarySTL(view: DataView, faceCount: number): THREE.BufferGeometry {
  const positions = new Float32Array(faceCount * 9);
  const normals = new Float32Array(faceCount * 9);

  let offset = 84;
  for (let i = 0; i < faceCount; i++) {
    const nx = view.getFloat32(offset, true);
    const ny = view.getFloat32(offset + 4, true);
    const nz = view.getFloat32(offset + 8, true);
    offset += 12;

    const baseIdx = i * 9;
    for (let v = 0; v < 3; v++) {
      const vIdx = baseIdx + v * 3;
      positions[vIdx] = view.getFloat32(offset, true);
      positions[vIdx + 1] = view.getFloat32(offset + 4, true);
      positions[vIdx + 2] = view.getFloat32(offset + 8, true);
      normals[vIdx] = nx;
      normals[vIdx + 1] = ny;
      normals[vIdx + 2] = nz;
      offset += 12;
    }
    offset += 2; // attribute byte count
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return geometry;
}

function parseASCIISTL(text: string): THREE.BufferGeometry {
  const positions: number[] = [];
  const vertexRegex = /vertex\s+([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)\s+([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)\s+([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)/g;
  let match: RegExpExecArray | null;
  while ((match = vertexRegex.exec(text)) !== null) {
    positions.push(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function parseOBJText(text: string): THREE.BufferGeometry {
  const rawVertices: [number, number, number][] = [];
  const finalPositions: number[] = [];

  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('v ')) {
      const parts = line.split(/\s+/);
      rawVertices.push([
        parseFloat(parts[1]) || 0,
        parseFloat(parts[2]) || 0,
        parseFloat(parts[3]) || 0,
      ]);
    } else if (line.startsWith('f ')) {
      const parts = line.split(/\s+/).slice(1);
      const faceIndices = parts.map((p) => {
        const idx = parseInt(p.split('/')[0], 10);
        return idx > 0 ? idx - 1 : rawVertices.length + idx;
      });
      for (let j = 1; j < faceIndices.length - 1; j++) {
        const v0 = rawVertices[faceIndices[0]];
        const v1 = rawVertices[faceIndices[j]];
        const v2 = rawVertices[faceIndices[j + 1]];
        if (v0 && v1 && v2) {
          finalPositions.push(...v0, ...v1, ...v2);
        }
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(finalPositions, 3));
  geometry.computeVertexNormals();
  return geometry;
}
