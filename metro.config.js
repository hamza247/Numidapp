const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.resolverMainFields = ["react-native", "browser", "main"];

// Exclude Replit's internal temp skill directories from file watching
// These are transient dirs created/deleted by Replit that crash Metro's watcher
const { blockList } = config.resolver;
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const extraBlocks = [
  /\.local[\\/]skills[\\/]\.old-/,
];
config.resolver.blockList = blockList
  ? Array.isArray(blockList)
    ? [...blockList, ...extraBlocks]
    : [blockList, ...extraBlocks]
  : extraBlocks;

module.exports = config;
