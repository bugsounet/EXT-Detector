/** Code minifier **/
/** @busgounet **/

const path = require("path");
const { globSync } = require("glob");
const esbuild = require("esbuild");

let files = [
  `../${require("../package.json").main}`,
  "../node_helper.js",
  "../components/lib/node/index.js"
];

function searchFiles () {
  const components = globSync("../components/*.js");
  files = files.concat(components);
  console.log(`Found: ${files.length} files to minify\n`);
}

// minify files array
async function minifyFiles () {
  searchFiles();
  await Promise.all(files.map((file) => minify(file))).catch(() => process.exit(255));
}

function minify (file) {
  const pathResolve = path.resolve(__dirname, file);
  const error = 0;
  console.log("Process File:", file);
  return new Promise((resolve, reject) => {
    try {
      esbuild.buildSync({
        entryPoints: [pathResolve],
        allowOverwrite: true,
        minify: true,
        outfile: pathResolve
      });
      resolve(true);
    } catch (e) {
      reject();
    }
  });
}

minifyFiles();
