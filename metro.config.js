const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.resolverMainFields = ["react-native", "browser", "main"];

// On web, redirect react-native-google-mobile-ads to a no-op stub so the
// native-only codegenNativeComponent import doesn't crash the web bundler.
const admobStub = path.resolve(__dirname, "stubs/react-native-google-mobile-ads.js");
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === "web" &&
    moduleName === "react-native-google-mobile-ads"
  ) {
    return { filePath: admobStub, type: "sourceFile" };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Exclude Replit's internal temp skill directories from file watching.
// These are transient dirs created/deleted by Replit that crash Metro's watcher.
const { blockList } = config.resolver;
const extraBlocks = [/\.local[\\/]skills[\\/]\.old-/];
config.resolver.blockList = blockList
  ? Array.isArray(blockList)
    ? [...blockList, ...extraBlocks]
    : [blockList, ...extraBlocks]
  : extraBlocks;

module.exports = config;
