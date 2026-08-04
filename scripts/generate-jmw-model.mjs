import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { openSync } from "fontkit";
import { EdgesGeometry } from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

const geistModule = fileURLToPath(import.meta.resolve("geist/font/pixel"));
const geistPath = resolve(dirname(geistModule), "fonts/geist-pixel/GeistPixel-Line.woff2");
const sourceFont = openSync(geistPath);

const glyphs = Object.fromEntries(
  Array.from("jmw").map((character) => {
    const glyph = sourceFont.glyphForCodePoint(character.codePointAt(0));
    const outline = [];

    for (const { command, args } of glyph.path.commands) {
      if (command === "moveTo") outline.push("m", args[0], args[1]);
      else if (command === "lineTo") outline.push("l", args[0], args[1]);
      else if (command === "quadraticCurveTo") {
        outline.push("q", args[2], args[3], args[0], args[1]);
      } else if (command === "bezierCurveTo") {
        outline.push("b", args[4], args[5], args[0], args[1], args[2], args[3]);
      }
    }

    return [
      character,
      {
        ha: glyph.advanceWidth,
        x_min: glyph.bbox.minX,
        x_max: glyph.bbox.maxX,
        o: outline.join(" "),
      },
    ];
  }),
);

const font = new FontLoader().parse({
  glyphs,
  familyName: sourceFont.familyName,
  ascender: sourceFont.ascent,
  descender: sourceFont.descent,
  underlinePosition: sourceFont.underlinePosition ?? 0,
  underlineThickness: sourceFont.underlineThickness ?? 0,
  boundingBox: {
    xMin: sourceFont.bbox.minX,
    xMax: sourceFont.bbox.maxX,
    yMin: sourceFont.bbox.minY,
    yMax: sourceFont.bbox.maxY,
  },
  resolution: sourceFont.unitsPerEm,
});

const geometry = new TextGeometry("jmw", {
  font,
  size: 4.4,
  depth: 0.52,
  curveSegments: 1,
  bevelEnabled: true,
  bevelThickness: 0.045,
  bevelSize: 0.012,
  bevelOffset: 0,
  bevelSegments: 1,
});

geometry.computeBoundingBox();
const bounds = geometry.boundingBox;
if (bounds) {
  geometry.translate(
    -(bounds.max.x + bounds.min.x) / 2,
    -(bounds.max.y + bounds.min.y) / 2,
    -(bounds.max.z + bounds.min.z) / 2,
  );
}

const triangles = geometry.index ? geometry.toNonIndexed() : geometry;
triangles.computeVertexNormals();
const edges = new EdgesGeometry(geometry, 34);

const positions = triangles.getAttribute("position");
const normals = triangles.getAttribute("normal");
const edgePositions = edges.getAttribute("position");
const triangleVertexCount = positions.count;
const edgeVertexCount = edgePositions.count;

const positionScale = 4096;
const normalScale = 32767;
const headerBytes = 16;
const triangleBytes = triangleVertexCount * 6 * Int16Array.BYTES_PER_ELEMENT;
const edgeBytes = edgeVertexCount * 3 * Int16Array.BYTES_PER_ELEMENT;
const output = new ArrayBuffer(headerBytes + triangleBytes + edgeBytes);
const bytes = new Uint8Array(output);
bytes.set([0x4a, 0x4d, 0x57, 0x32]);

const view = new DataView(output);
view.setUint32(4, triangleVertexCount, true);
view.setUint32(8, edgeVertexCount, true);
view.setFloat32(12, positionScale, true);

const triangleData = new Int16Array(output, headerBytes, triangleVertexCount * 6);
for (let index = 0; index < triangleVertexCount; index += 1) {
  const offset = index * 6;
  triangleData[offset] = Math.round(positions.getX(index) * positionScale);
  triangleData[offset + 1] = Math.round(positions.getY(index) * positionScale);
  triangleData[offset + 2] = Math.round(positions.getZ(index) * positionScale);
  triangleData[offset + 3] = Math.round(normals.getX(index) * normalScale);
  triangleData[offset + 4] = Math.round(normals.getY(index) * normalScale);
  triangleData[offset + 5] = Math.round(normals.getZ(index) * normalScale);
}

const edgeData = new Int16Array(output, headerBytes + triangleBytes, edgeVertexCount * 3);
for (let index = 0; index < edgeVertexCount; index += 1) {
  const offset = index * 3;
  edgeData[offset] = Math.round(edgePositions.getX(index) * positionScale);
  edgeData[offset + 1] = Math.round(edgePositions.getY(index) * positionScale);
  edgeData[offset + 2] = Math.round(edgePositions.getZ(index) * positionScale);
}

const destination = resolve("static/jmw-model.bin");
await writeFile(destination, new Uint8Array(output));
console.log(`Wrote ${destination} (${output.byteLength.toLocaleString()} bytes)`);

geometry.dispose();
if (triangles !== geometry) triangles.dispose();
edges.dispose();
