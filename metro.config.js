const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

// The demos consume the wrapper from the sibling checkout (file: dependency).
// Metro must watch it, resolve react/react-native from THIS app only, and
// never see the wrapper's own node_modules copies (duplicate React = the
// "useRef of null" crash).
const wrapper = path.resolve(__dirname, '../ogplayer-react-native');
const esc = (p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const config = {
  watchFolders: [wrapper],
  resolver: {
    blockList: new RegExp(
      `(${esc(wrapper)}/node_modules/react/.*|` +
        `${esc(wrapper)}/node_modules/react-native/.*|` +
        `${esc(wrapper)}/example/.*)$`
    ),
    extraNodeModules: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-native': path.resolve(__dirname, 'node_modules/react-native'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
