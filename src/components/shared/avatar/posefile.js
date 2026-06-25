// Parser .pose murni DataView (tanpa dependency) — meniru pose-format v0.1/0.2.
// Dipakai di browser supaya tidak bergantung binary-parser/Buffer global.
//
// Layout (little-endian):
//   HEADER: version f32 | width u16 | height u16 | depth u16 | _components u16
//           per komponen: _name u16 + name | _format u16 + format |
//                         _points u16 | _limbs u16 | _colors u16 |
//                         points[_points] (u16 len + str) |
//                         limbs[_limbs] (u16,u16) | colors[_colors] (u16,u16,u16)
//   BODY v0.2: fps f32 | _frames u32 | _people u16 |
//           data   Float32[_frames*_people*_points*_dims] |
//           conf   Float32[_frames*_people*_points]
//   (v0.1 sama tapi fps u16 + _frames u16)

export function parsePoseFile(arrayBuffer) {
  const dv = new DataView(arrayBuffer);
  let off = 0;
  const u16 = () => {
    const v = dv.getUint16(off, true);
    off += 2;
    return v;
  };
  const u32 = () => {
    const v = dv.getUint32(off, true);
    off += 4;
    return v;
  };
  const f32 = () => {
    const v = dv.getFloat32(off, true);
    off += 4;
    return v;
  };
  const str = () => {
    const len = u16();
    let s = "";
    for (let i = 0; i < len; i++) s += String.fromCharCode(dv.getUint8(off + i));
    off += len;
    return s;
  };

  const version = Math.round(f32() * 1000) / 1000;
  const width = u16();
  const height = u16();
  const depth = u16();
  const nComp = u16();

  const components = [];
  let totalPoints = 0;
  let maxFormat = 0;
  for (let c = 0; c < nComp; c++) {
    const name = str();
    const format = str();
    const nPoints = u16();
    const nLimbs = u16();
    const nColors = u16();
    const points = [];
    for (let i = 0; i < nPoints; i++) points.push(str());
    off += nLimbs * 4; // limbs (skip)
    off += nColors * 6; // colors (skip)
    components.push({ name, format, nPoints, points });
    totalPoints += nPoints;
    if (format.length > maxFormat) maxFormat = format.length;
  }
  const headerLength = off;
  const dims = maxFormat - 1; // X,Y,Z (C disimpan terpisah)

  // Body header
  let fps, nFrames;
  if (version === 0.1) {
    fps = u16();
    nFrames = u16();
  } else if (version === 0.2) {
    fps = f32();
    nFrames = u32();
  } else {
    throw new Error("Versi .pose tidak didukung: " + version);
  }
  const nPeople = u16();

  // Offset byte data & confidence. Baca via DataView (offset bisa tak align 4).
  const dataStart = headerLength + (version === 0.1 ? 6 : 10);
  const dataCount = nFrames * nPeople * totalPoints * dims;
  const confStart = dataStart + dataCount * 4;
  const dataAt = (n) => dv.getFloat32(dataStart + n * 4, true);
  const confAt = (n) => dv.getFloat32(confStart + n * 4, true);

  const dimNames = ["X", "Y", "Z", "W"];
  const frames = new Array(nFrames);
  for (let i = 0; i < nFrames; i++) {
    const person = {};
    const j = 0; // ambil orang pertama
    let k = 0;
    for (const comp of components) {
      const list = new Array(comp.nPoints);
      for (let l = 0; l < comp.nPoints; l++) {
        const place = i * (nPeople * totalPoints) + j * totalPoints + k + l;
        const pt = { C: confAt(place) };
        for (let d = 0; d < dims; d++) pt[dimNames[d]] = dataAt(place * dims + d);
        list[l] = pt;
      }
      person[comp.name] = list;
      k += comp.nPoints;
    }
    frames[i] = person;
  }

  return { version, width, height, depth, fps: fps || 25, nFrames, components, frames };
}
