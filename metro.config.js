// The posture scan ships Google's MediaPipe pose model and its WebAssembly engine as plain files,
// so Metro has to treat these extensions as assets rather than code.
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
for (const ext of ["wasm", "task", "mpjs"]) {
  if (!config.resolver.assetExts.includes(ext)) config.resolver.assetExts.push(ext);
}
module.exports = config;
