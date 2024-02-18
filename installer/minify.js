/*
 * Code minifier
 * @busgounet
 */

const path = require("path");
const { globSync } = require("glob");
const esbuild = require("esbuild");

let files = [
  `../${require("../package.json").main}`,
  "../node_helper.js",
  "../components/lib/node/index.js"
];

const project = require("../package.json").name;
const revision = require("../package.json").rev;
const version = require("../package.json").version;

const commentIn = "/**";
const commentOut = "**/";

/**
 * search all javascript files
 */
function searchFiles () {
  const components = globSync("../components/*.js");
  files = files.concat(components);
  console.log(`Found: ${files.length} files to minify\n`);
}

/**
 * Minify filename with esbuild
 * @param {string} file to minify
 * @returns {boolean} resolved with true
 */
function minify (file) {
  const pathResolve = path.resolve(__dirname, file);
  const FileName = path.parse(file).base;
  console.log("Process File:", file);
  return new Promise((resolve, reject) => {
    try {
      esbuild.buildSync({
        entryPoints: [pathResolve],
        allowOverwrite: true,
        minify: true,
        outfile: pathResolve,
        banner: {
          js: `${commentIn} ${project}\n  * File: ${FileName}\n  * Version: ${version}\n  * Revision: ${revision}\n${commentOut}`
        },
        footer: {
          js: `${commentIn} Coded With Heart by bugsounet ${commentOut}`
        }
      });
      resolve(true);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Minify all files in array with Promise
 */
async function minifyFiles () {
  searchFiles();
  await Promise.all(files.map((file) => minify(file))).catch(() => process.exit(255));
}

minifyFiles();
