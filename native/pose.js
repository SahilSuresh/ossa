// The posture scan runs inside the page (MediaPipe in WebAssembly), but its model and engine
// ship with the app so the scan works offline and nothing is downloaded. The page asks for each
// file in pieces; this reads the requested piece from the app bundle and hands it back as base64.
import { Asset } from "expo-asset";
import * as FS from "expo-file-system/legacy";

const FILES = {
  js: require("../assets/pose/vision_bundle.mpjs"),
  loader: require("../assets/pose/vision_wasm_loader.mpjs"),
  wasm: require("../assets/pose/vision_wasm_internal.wasm"),
  model: require("../assets/pose/pose_landmarker_full.task"),
};
const CHUNK = 786432; // 768 KB, about 1 MB once encoded
const found = {};

async function locate(f) {
  if (found[f]) return found[f];
  if (!FILES[f]) throw new Error("unknown file");
  const asset = Asset.fromModule(FILES[f]);
  await asset.downloadAsync();
  const uri = asset.localUri || asset.uri;
  const info = await FS.getInfoAsync(uri);
  if (!info.exists || !info.size) throw new Error("missing " + f);
  found[f] = { uri, size: info.size };
  return found[f];
}

export async function chunk(f, i) {
  const { uri, size } = await locate(f);
  const n = Math.ceil(size / CHUNK);
  if (i < 0 || i >= n) throw new Error("bad chunk");
  const position = i * CHUNK;
  const b = await FS.readAsStringAsync(uri, {
    encoding: FS.EncodingType.Base64,
    position,
    length: Math.min(CHUNK, size - position),
  });
  return { n, b };
}

// a share card made in the page: write it to the cache, then open the share sheet
export async function shareImage(b64, name, Share) {
  const path = FS.cacheDirectory + (name || "ossa.png").replace(/[^a-z0-9._-]/gi, "");
  await FS.writeAsStringAsync(path, b64, { encoding: FS.EncodingType.Base64 });
  await Share.share({ url: path });
}
