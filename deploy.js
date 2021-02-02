// npm install --save-dev promisify-node axios promisify-child-process simple-git shelljs prompt-sync dotenv
const path = require("path");
const promisify = require("promisify-node");
const axios = require("axios");
const fs = promisify("fs");
const { exec, spawn, fork, execFile } = require("promisify-child-process");
require("dotenv").config();
const simpleGit = require("simple-git")(); // Simple-git without promise
const shellJs = require("shelljs"); // Shelljs package for running shell tasks optional

// Simple Git with Promise for handling success and failure
const simpleGitPromise = require("simple-git/promise")();
const prompt = require("prompt-sync")();

module.exports.asyncForEach = async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

// sequentially
module.exports.asyncFilter = async (arr, predicate) =>
  arr.reduce(
    async (memo, e) => [...(await memo), ...((await predicate(e)) ? [e] : [])],
    []
  );
let count = 0;
module.exports.setMode = async () => {
  shellJs.cd(__dirname);
  const modes = ["production", "stage"];
  const mode = prompt('Enter Mode "production" or "stage":');
  if (modes.includes(mode)) {
    console.log("OK .....");
    return (process.env.MODE = mode);
  }
  console.log("Wrong value provided; try again");
  count++;
  if (count > 3) throw Error("Please restart the program");
  setModePrompt();
};
module.exports.deploy = async function () {
  try {
    const mode = process.argv[2];
    process.env.MODE = mode;
    if (!["production", "stage"].includes(mode)) {
      await this.setMode();
    }

    // console.log(mode);

    // await exec(`rimref dist`); // delete dist folder
    await exec("npm run build:prod"); // run build:stage command for webpack
    await this.pushToGit();
    console.log("Code Pushed to git \n");
    if (process.env.MODE === "stage") {
      const tag = await this.tagStage();
      await this.updateImportMapStage(tag);
      console.log("done");
    }

    if (process.env.MODE === "production") {
      const tag = await this.tagProduction();
      await this.updateImportMapProd(tag);
      console.log("done");
    }
  } catch (e) {
    console.dir(e);
    throw e;
  }
};

module.exports.updateImportMapStage = async function (tag) {
  try {
    await axios.get(
      `https://purge.jsdelivr.net/gh/dev-mehmood/${process.env.GIT_REPO}@${tag}/dist/${process.env.SYSTEM_JS_FILE_NAME}.js`
    );
    console.log("previous path purged");
  } catch (e) {
    console.log(e);
  }
  const token = await this.getAuthToken(process.env.DEV_BOX_SPA_URI_STAGE);
  axios.defaults.headers.common["x-access-token"] = token;
  const x = await axios({
    method: "patch",
    url: `${process.env.DEV_BOX_SPA_URI_STAGE}/import-maps/import-map.json`,
    data: {
      // "imports": {
      //     "@dev-box/navbar": `https://cdn.jsdelivr.net/gh/dev-mehmood/${process.env.GIT_REPO}/dist/${process.env.SYSTEM_JS_FILE_NAME}.js`,
      //     "@dev-box/navbar/": `https://cdn.jsdelivr.net/gh/dev-mehmood/${process.env.GIT_REPO}/dist/${process.env.SYSTEM_JS_FILE_NAME}.js/`
      // },
      imports: {
        [`${process.env.SYSTEMJS_PATH}`]: `https://cdn.jsdelivr.net/gh/dev-mehmood/${process.env.GIT_REPO}@${tag}/dist/${process.env.SYSTEM_JS_FILE_NAME}.js`,
        [`${process.env.SYSTEMJS_PATH}/`]: `https://cdn.jsdelivr.net/gh/dev-mehmood/${process.env.GIT_REPO}@${tag}/dist/${process.env.SYSTEM_JS_FILE_NAME}.js/`,
      },
      mode: "stage",
    },
  });
  return true;
};
module.exports.updateImportMapProd = async function (tag) {
  const token = await this.getAuthToken(process.env.DEV_BOX_SPA_URI_PRODUCTION);
  axios.defaults.headers.common["x-access-token"] = token;
  console.log("Tag ", tag);
  try {
    const x = await axios({
      method: "patch",
      url: `${process.env.DEV_BOX_SPA_URI_PRODUCTION}/import-maps/import-map.json`,
      data: {
        imports: {
          [`${process.env.SYSTEMJS_PATH}`]: `https://cdn.jsdelivr.net/gh/dev-mehmood/${process.env.GIT_REPO}@${tag}/dist/${process.env.SYSTEM_JS_FILE_NAME}.js`,
          [`${process.env.SYSTEMJS_PATH}/`]: `https://cdn.jsdelivr.net/gh/dev-mehmood/${process.env.GIT_REPO}@${tag}/dist/${process.env.SYSTEM_JS_FILE_NAME}.js/`,
        },
        mode: "prod",
      },
    });
    console.log(x);
  } catch (e) {
    console.log(e);
  }
};
//git tag -l -n v*

module.exports.getAuthToken = async function getAuthToken(uri) {
  const {
    data: { token },
  } = await axios({
    url: `${uri}/auth/login`,
    method: "post",
    data: { email: process.env.USER_EMAIL, password: process.env.USER_PASS },
  });
  return token;
};
//https://dev.to/it if()next/the-ultimate-free-ci-cd-for-your-open-source-projects-3bkd
module.exports.pushToGit = async function () {
  // cd into current directory
  shellJs.cd(__dirname);
  const repo = process.env.GIT_REPO;
  // User name and password of your GitHub
  const userName = process.env.GIT_USER_NAME;
  const password = process.env.GIT_USER_PASSWORD;
  // const gitHubUrl = `https://${userName}:${password}@github.com/${userName}/${repo}`;
  // add local git config like username and email

  simpleGit.addConfig("user.email", process.env.GIT_USER_EMAIL);
  simpleGit.addConfig("user.name", userName);

  await simpleGitPromise.add(".");
  const message = prompt("Enter commit message:");

  //  const message = 'test commit'
  // console.log(message);
  await simpleGitPromise.raw(["commit", "-m", message]);
  await simpleGitPromise.push("origin", "master");
  return true;
};

module.exports.tagStage = async function () {
  // await this.pushToGit();
  let lastTag = "";
  try {
    lastTag = await simpleGitPromise.raw([
      "describe",
      "--match",
      "[stage-v]*",
      "--abbrev=0",
    ]);
  } catch (e) {
    console.log("No tag found please enter new tag name");
  }

  let tagName = "stage-v1.0.0",
    tagMessage = "First tag deployment v1.0.0";
  if (lastTag) {
    console.log("Last tag on this branch is: ", lastTag);
  }
  tagName = prompt("Enter Stage Tag Name:");
  tagMessage = prompt("Enter Tag Message:");
  await simpleGitPromise.addAnnotatedTag(tagName, tagMessage);
  await simpleGitPromise.pushTags("origin", tagName);
  return tagName;
};

module.exports.tagProduction = async function () {
  // await this.pushToGit();
  let lastTag = "";
  try {
    lastTag = await simpleGitPromise.raw(["describe", "--abbrev=0"]);
  } catch (e) {
    console.log(e);
  }

  let tagName = "v1.0.0",
    tagMessage = "First tag deployment v1.0.0";
  if (lastTag) {
    console.log("Last tag on this branch is: ", lastTag);
  }
  tagName = prompt("Enter Production Tag Name:");
  tagMessage = prompt("Enter Tag Message:");
  await simpleGitPromise.addAnnotatedTag(tagName, tagMessage);
  await simpleGitPromise.pushTags("origin", tagName);
  return tagName;
};

//https://medium.com/meshstudio/continuous-integration-with-circleci-and-nodejs-44c3cf0074a0
this.deploy();

module.exports.init = () => {
  const mode = process.argv[2];
  process.env.MODE = mode;
  const ciMode = process.argv[3];
  if (ciMode && ciMode === "stage") {
    this.stageCI();
  } else if (ciMode && ciMode === "production") {
    this.prodCI();
  } else this.deploy();
};

module.exports.stageCI = () => {};
