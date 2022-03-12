#!/usr/bin/env node

// NOTE: Don't require anything from node_modules here, since the
// install script has to be able to run _before_ that exists.
const child = require("child_process"), fs = require("fs"), path = require("path"), {join} = path

let root = join(__dirname, "..")

const {loadPackages, nonCore} = require("./packages")

let {packages, packageNames, buildPackages} = loadPackages()

function start() {
  let command = process.argv[2]
  if (command && !["install", "--help"].includes(command)) assertInstalled()
  let args = process.argv.slice(3)
  let cmdFn = {
    packages: listPackages,
    status,
    build,
    devserver,
    release,
    install,
    clean,
    run: runCmd,
    "--help": () => help(0)
  }[command]
  if (!cmdFn || cmdFn.length > args.length) help(1)
  new Promise(r => r(cmdFn.apply(null, args))).catch(e => error(e))
}

function help(status) {
  console.log(`Usage:
  cm install [--ssh]      Clone and symlink the packages, install deps, build
  cm packages             Emit a list of all pkg names
  cm status               Output git status, when interesting, for packages
  cm build                Build the bundle files
  cm clean                Delete files created by the build
  cm devserver [--source-map]
                          Start a dev server on port 8090
  cm build-readme <pkg>   Regenerate the readme file for a non-core package
  cm run <command>        Run the given command in each of the package dirs
  cm test [--no-browser]  Run the test suite of all the packages
  cm --help`)
  process.exit(status)
}

function error(err) {
  console.error(err)
  process.exit(1)
}

function run(cmd, args, wd = root, { shell = false } = {}) {
  return child.execFileSync(cmd, args, {shell, cwd: wd, encoding: "utf8", stdio: ["ignore", "pipe", process.stderr]})
}

function replace(file, f) {
  fs.writeFileSync(file, f(fs.readFileSync(file, "utf8")))
}

function assertInstalled() {
  for (let p of packages) {
    if (!fs.existsSync(p.dir)) {
      console.error(`module ${p.name} is missing. Did you forget to run 'cm install'?`)
      process.exit(1)
    }
  }
}

function install(arg = null) {
  /*let base = arg == "--ssh" ? "git@github.com:codemirror/" : "https://github.com/codemirror/"
  if (arg && arg != "--ssh") help(1)

  for (let pkg of packages) {
    if (fs.existsSync(pkg.dir)) {
      console.warn(`Skipping cloning of ${pkg.name} (directory exists)`)
    } else {
      let origin = base + pkg.name + ".git"
      run("git", ["clone", origin, pkg.dir])
    }
  }

  console.log("Running npm install")
  run("npm", ["install"], root, {shell: process.platform == "win32"})
  console.log("Building modules")
  ;({packages, packageNames, buildPackages} = loadPackages())*/
  build()
}


function listPackages() {
  console.log(packages.map(p => p.name).join("\n"))
}

function status() {
  for (let pkg of packages) {
    let output = run("git", ["status", "-sb"], pkg.dir)
    if (output != "## main...origin/main\n")
      console.log(`${pkg.name}:\n${output}`)
  }
}

async function build() {
  console.info("Building...")
  let t0 = Date.now()
  await require("@codemirror/buildhelper").build(buildPackages.map(p => p.main))
  console.info(`Done in ${((Date.now() - t0) / 1000).toFixed(2)}s`)
}

function startServer() {
  let serve = join(root, "demo")
  let moduleserver = new (require("esmoduleserve/moduleserver"))({root: serve, maxDepth: 2})
  let serveStatic = require("serve-static")(serve)
  require("http").createServer((req, resp) => {
    if (/^\/test\/?($|\?)/.test(req.url)) {
      let runTests = require("@codemirror/buildhelper/src/runtests")
      let {browserTests} = runTests.gatherTests(buildPackages.map(p => p.dir))
      resp.writeHead(200, {"content-type": "text/html"})
      resp.end(runTests.testHTML(browserTests.map(f => path.relative(serve, f)), false))
    } else {
      moduleserver.handleRequest(req, resp) || serveStatic(req, resp, _err => {
        resp.statusCode = 404
        resp.end('Not found')
      })
    }
  }).listen(8090, process.env.OPEN ? undefined : "127.0.0.1")
  console.log("Dev server listening on 8090")
}

function devserver(...args) {
  let options = {
    sourceMap : args.includes('--source-map')
  }
  require("@codemirror/buildhelper").watch(buildPackages.map(p => p.main).filter(f => f), [join(root, "demo/demo.ts")], options)
  startServer()
}

function clean() {
  for (let pkg of buildPackages)
    run("rm", ["-rf", "dist"], pkg.dir)
}
/*
function commit(...args) {
  for (let pkg of packages) {
    if (run("git", ["diff"], pkg.dir) || run("git", ["diff", "--cached"], pkg.dir))
      console.log(pkg.name + ":\n" + run("git", ["commit"].concat(args), pkg.dir))
  }
}

function push() {
  for (let pkg of packages) {
    if (/\bahead\b/.test(run("git", ["status", "-sb"], pkg.dir)))
      run("git", ["push"], pkg.dir)
  }
}

function grep(pattern) {
  let files = [join(root, "demo", "demo.ts")]
  function add(dir, ext) {
    let list
    try { list = fs.readdirSync(dir) }
    catch (_) { return }
    for (let f of list) if (ext.includes(/^[^.]*(.*)/.exec(f)[1])) {
      files.push(path.relative(process.cwd(), join(dir, f)))
    }
  }
  for (let pkg of packages) {
    if (pkg.name == "legacy-modes") {
      add(join(pkg.dir, "mode"), [".js", ".d.ts"])
    } else {
      add(join(pkg.dir, "src"), [".ts"])
      add(join(pkg.dir, "test"), [".ts"])
    }
  }
  try {
    console.log(run("grep", ["--color", "-nH", "-e", pattern].concat(files), process.cwd()))
  } catch(e) {
    process.exit(1)
  }
}*/

function runCmd(cmd, ...args) {
  for (let pkg of packages) {
    console.log(pkg.name + ":")
    try {
      console.log(run(cmd, args, pkg.dir))
    } catch (e) {
      console.log(e.toString())
      process.exit(1)
    }
  }
}
/*
function buildReadme(name) {
  if (!nonCore.includes(name)) help(1)
  let pkg = packageNames[name]
  fs.writeFileSync(join(pkg.dir, "README.md"), require("./build-readme").buildReadme(pkg))
}

function test(...args) {
  let runTests = require("@codemirror/buildhelper/src/runtests")
  let {tests, browserTests} = runTests.gatherTests(buildPackages.map(p => p.dir))
  let browsers = [], grep, noBrowser = false
  for (let i = 0; i < args.length; i++) {
    if (args[i] == "--firefox") browsers.push("firefox")
    if (args[i] == "--chrome") browser.push("chrome")
    if (args[i] == "--no-browser") noBrowser = true
    if (args[i] == "--grep") grep = args[++i]
  }
  if (!browsers.length && !noBrowser) browsers.push("chrome")
  runTests.runTests({tests, browserTests, browsers, grep}).then(failed => process.exit(failed ? 1 : 0))
}*/

start()
