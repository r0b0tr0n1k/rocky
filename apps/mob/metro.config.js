const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

// Workspace packages now ship compiled ESM + .d.ts to their dist/ (exports point
// at ./dist/*). Metro must run them through the RN transformer. List the
// @rocky packages this app consumes (and the source-only @rocky/ui lib).
config.transpilePackages = [
  "@rocky/auth",
  "@rocky/validators",
  "@rocky/trpc",
  "@rocky/ui",
];

// expo-sqlite's web worker imports ./wa-sqlite.wasm. Metro must treat .wasm as a
// binary ASSET (copied, not transformed as JS) so the offline DB bundles for web.
config.resolver.assetExts.push("wasm");

// Keep Metro's peak memory low so the cold web transform fits inside a normal
// Node heap on modest/dev machines. Parallel transforms hold many module ASTs in
// memory at once (the original OOM); serializing them + skipping cache
// compression cuts peak RAM hard, which avoids the CPU-spike + system-OOM kill
// that an 8 GB --max-old-space-size ceiling triggers when physical RAM is tight.
config.maxWorkers = 1;
config.cacheCompression = false;

module.exports = withUniwindConfig(config, {
  // relative path to your global.css file (from previous step)
  cssEntryFile: './global.css',
  // (optional) path where we gonna auto-generate typings
  // defaults to project's root
  dtsFile: './uniwind-types.d.ts',
});
