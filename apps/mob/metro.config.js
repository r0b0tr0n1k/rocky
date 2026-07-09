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

module.exports = withUniwindConfig(config, {
  // relative path to your global.css file (from previous step)
  cssEntryFile: './global.css',
  // (optional) path where we gonna auto-generate typings
  // defaults to project's root
  dtsFile: './uniwind-types.d.ts',
});
