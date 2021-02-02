const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-react");

module.exports = (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "dev-skill",
    projectName: "navbar",
    webpackConfigEnv,
    // rootDirectoryLevel: 1,
    argv,
  });

  return merge(defaultConfig, {
    externals: [
      "react",
      "react-dom",
      "single-spa-react",
      "react-router-dom",
      /^@dev-box\/.*/,
      /^@dev-skill\/.*/,
    ],
    // modify the webpack config however you'd like to by adding to this object
  });
};
