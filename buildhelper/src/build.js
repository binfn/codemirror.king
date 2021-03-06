"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.watch = exports.build = void 0;
const ts = require("typescript");
const path_1 = require("path");
const fs = require("fs");
const rollup_1 = require("rollup");
const rollup_plugin_dts_1 = require("rollup-plugin-dts");
const acorn_1 = require("acorn");
const acorn_walk_1 = require("acorn-walk");
const pkgCache = Object.create(null);
function tsFiles(dir) {
    return fs.readdirSync(dir).filter(f => /(?<!\.d)\.ts$/.test(f)).map(f => (0, path_1.join)(dir, f));
}
class Package {
    constructor(main) {
        this.main = main;
        let src = (0, path_1.dirname)(main), root = (0, path_1.dirname)(src), tests = (0, path_1.join)(root, "test");
        this.root = root;
        let dirs = this.dirs = [src];
        if (fs.existsSync(tests)) {
            this.tests = tsFiles(tests);
            dirs.push(tests);
        }
        else {
            this.tests = [];
        }
        this.lezer = fs.readdirSync(src).some(f => /\.grammar$/.test(f));
        this.json = JSON.parse(fs.readFileSync((0, path_1.join)(this.root, "package.json"), "utf8"));
    }
    static get(main) {
        return pkgCache[main] || (pkgCache[main] = new Package(main));
    }
}
const tsOptions = {
    lib: ["es6", "scripthost", "dom"],
    types: ["mocha"],
    stripInternal: true,
    noUnusedLocals: true,
    strict: true,
    target: "es6",
    module: "es2020",
    newLine: "lf",
    declaration: true,
    moduleResolution: "node"
};
function configFor(pkgs, extra = [], generateSourceMap = false) {
    let paths = {};
    for (let pkg of pkgs)
        paths[pkg.json.name] = [pkg.main];
    return {
        compilerOptions: { paths, ...tsOptions, sourceMap: generateSourceMap, inlineSources: generateSourceMap },
        include: pkgs.reduce((ds, p) => ds.concat(p.dirs.map(d => (0, path_1.join)(d, "*.ts"))), [])
            .concat(extra).map(normalize)
    };
}
function normalize(path) {
    return path.replace(/\\/g, "/");
}
class Output {
    constructor() {
        this.files = Object.create(null);
        this.changed = [];
        this.watchers = [];
        this.watchTimeout = null;
        this.write = this.write.bind(this);
    }
    write(path, content) {
        let norm = normalize(path);
        if (this.files[norm] == content)
            return;
        this.files[norm] = content;
        if (!this.changed.includes(path))
            this.changed.push(path);
        if (this.watchTimeout)
            clearTimeout(this.watchTimeout);
        if (this.watchers.length)
            this.watchTimeout = setTimeout(() => {
                this.watchers.forEach(w => w(this.changed));
                this.changed = [];
            }, 100);
    }
    get(path) {
        return this.files[normalize(path)];
    }
}
function readAndMangleComments(dirs) {
    return (name) => {
        let file = ts.sys.readFile(name);
        if (file && dirs.includes((0, path_1.dirname)(name)))
            file = file.replace(/(?<=^|\n)(?:([ \t]*)\/\/\/.*\n)+/g, (comment, space) => {
                comment = comment.replace(/\]\(#/g, "](https://codemirror.net/6/docs/ref/#");
                return `${space}/**\n${space}${comment.slice(space.length).replace(/\/\/\/ ?/g, "")}${space}*/\n`;
            });
        return file;
    };
}
function runTS(dirs, tsconfig) {
    let config = ts.parseJsonConfigFileContent(tsconfig, ts.sys, (0, path_1.dirname)(dirs[0]));
    let host = ts.createCompilerHost(config.options);
    host.readFile = readAndMangleComments(dirs);
    let program = ts.createProgram({ rootNames: config.fileNames, options: config.options, host });
    let out = new Output, result = program.emit(undefined, out.write);
    return result.emitSkipped ? null : out;
}
const tsFormatHost = {
    getCanonicalFileName: (path) => path,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => "\n"
};
function watchTS(dirs, tsconfig) {
    let out = new Output, mangle = readAndMangleComments(dirs);
    let dummyConf = (0, path_1.join)((0, path_1.dirname)((0, path_1.dirname)(dirs[0])), "TSCONFIG.json");
    ts.createWatchProgram(ts.createWatchCompilerHost(dummyConf, undefined, Object.assign({}, ts.sys, {
        writeFile: out.write,
        readFile: (name) => {
            return name == dummyConf ? JSON.stringify(tsconfig) : mangle(name);
        }
    }), ts.createEmitAndSemanticDiagnosticsBuilderProgram, diag => console.error(ts.formatDiagnostic(diag, tsFormatHost)), diag => console.info(ts.flattenDiagnosticMessageText(diag.messageText, "\n"))));
    return out;
}
function external(id) { return id != "tslib" && !/^(\.?\/|\w:)/.test(id); }
function outputPlugin(output, ext, base) {
    let { resolveId, load } = base;
    return {
        ...base,
        resolveId(source, base, options) {
            let full = base && source[0] == "." ? (0, path_1.resolve)((0, path_1.dirname)(base), source) : source;
            if (!/\.\w+$/.test(full))
                full += ext;
            if (output.get(full))
                return full;
            return resolveId ? resolveId.call(this, source, base, options) : undefined;
        },
        load(file) {
            let code = output.get(file);
            return code ? { code, map: output.get(file + '.map') } : (load && load.call(this, file));
        }
    };
}
const pure = "/*@__PURE__*/";
function addPureComments(code) {
    let patches = [];
    function walkCall(node, c) {
        node.arguments.forEach((n) => c(n));
        c(node.callee);
    }
    function addPure(pos) {
        let last = patches.length ? patches[patches.length - 1] : null;
        if (!last || last.from != pos || last.insert != pure)
            patches.push({ from: pos, insert: pure });
    }
    (0, acorn_walk_1.recursive)((0, acorn_1.parse)(code, { ecmaVersion: 2020, sourceType: "module" }), null, {
        CallExpression(node, _s, c) {
            walkCall(node, c);
            let m;
            addPure(node.start);
            // TS-style enum
            if (node.callee.type == "FunctionExpression" && node.callee.params.length == 1 &&
                (m = /\bvar (\w+);\s*$/.exec(code.slice(node.start - 100, node.start))) &&
                m[1] == node.callee.params[0].name) {
                patches.push({ from: m.index + 4 + m[1].length + (node.start - 100), to: node.start, insert: " = " });
                patches.push({ from: node.callee.body.end - 1, insert: "return " + m[1] });
            }
        },
        NewExpression(node, _s, c) {
            walkCall(node, c);
            addPure(node.start);
        },
        Function() { },
        Class() { }
    });
    patches.sort((a, b) => a.from - b.from);
    for (let pos = 0, i = 0, result = "";; i++) {
        let next = i == patches.length ? null : patches[i];
        let nextPos = next ? next.from : code.length;
        result += code.slice(pos, nextPos);
        if (!next)
            return result;
        result += next.insert;
        pos = next.to ?? nextPos;
    }
}
async function emit(bundle, conf, makePure = false) {
    let result = await bundle.generate(conf);
    let dir = (0, path_1.dirname)(conf.file);
    await fs.promises.mkdir(dir, { recursive: true }).catch(() => null);
    for (let file of result.output) {
        let content = file.code || file.source;
        if (makePure)
            content = addPureComments(content);
        let sourceMap = file.map;
        if (sourceMap) {
            content = content + `\n//# sourceMappingURL=${file.fileName}.map`;
            await fs.promises.writeFile((0, path_1.join)(dir, file.fileName + ".map"), sourceMap.toString());
        }
        await fs.promises.writeFile((0, path_1.join)(dir, file.fileName), content);
    }
}
async function bundle(pkg, compiled, options) {
    let bundle = await (0, rollup_1.rollup)({
        input: pkg.main.replace(/\.ts$/, ".js"),
        external,
        plugins: [
            // @ts-ignore
            outputPlugin(compiled, ".js", pkg.lezer ? (await Promise.resolve().then(() => require("@lezer/generator/rollup"))).lezer() : { name: "dummy" })
        ]
    });
    let dist = (0, path_1.join)(pkg.root, "dist");
    await emit(bundle, {
        format: "esm",
        file: (0, path_1.join)(dist, "index.js"),
        externalLiveBindings: false,
        sourcemap: options.sourceMap
    }, !options.sourceMap); // makePure set to false when generating source map since this manipulates output after source map is generated
    await emit(bundle, {
        format: "cjs",
        file: (0, path_1.join)(dist, "index.cjs"),
        sourcemap: options.sourceMap
    });
    let tscBundle = await (0, rollup_1.rollup)({
        input: pkg.main.replace(/\.ts$/, ".d.ts"),
        plugins: [outputPlugin(compiled, ".d.ts", { name: "dummy" }), (0, rollup_plugin_dts_1.default)()],
        onwarn(warning, warn) {
            if (warning.code != "CIRCULAR_DEPENDENCY" && warning.code != "UNUSED_EXTERNAL_IMPORT")
                warn(warning);
        }
    });
    await emit(tscBundle, {
        format: "esm",
        file: (0, path_1.join)(dist, "index.d.ts")
    });
}
function allDirs(pkgs) {
    return pkgs.reduce((a, p) => a.concat(p.dirs), []);
}
async function build(main, options = {}) {
    let pkgs = typeof main == "string" ? [Package.get(main)] : main.map(Package.get);
    let compiled = runTS(allDirs(pkgs), configFor(pkgs, undefined, options.sourceMap));
    if (!compiled)
        return false;
    for (let pkg of pkgs) {
        await bundle(pkg, compiled, options);
        for (let file of pkg.tests.map(f => f.replace(/\.ts$/, ".js")))
            fs.writeFileSync(file, compiled.get(file));
    }
    return true;
}
exports.build = build;
function watch(mains, extra = [], options = {}) {
    let extraNorm = extra.map(normalize);
    let pkgs = mains.map(Package.get);
    let out = watchTS(allDirs(pkgs), configFor(pkgs, extra, options.sourceMap));
    out.watchers.push(writeFor);
    writeFor(Object.keys(out.files));
    async function writeFor(files) {
        let changedPkgs = [], changedFiles = [];
        for (let file of files) {
            let ts = file.replace(/\.d\.ts$|\.js$|\.js.map$/, ".ts");
            if (extraNorm.includes(ts)) {
                changedFiles.push(file);
            }
            else {
                let root = (0, path_1.dirname)((0, path_1.dirname)(file));
                let pkg = pkgs.find(p => normalize(p.root) == root);
                if (!pkg)
                    throw new Error("No package found for " + file);
                if (pkg.tests.includes(ts))
                    changedFiles.push(file);
                else if (!changedPkgs.includes(pkg))
                    changedPkgs.push(pkg);
            }
        }
        for (let file of changedFiles)
            if (/\.(js|map)$/.test(file))
                fs.writeFileSync(file, out.get(file));
        console.log("Bundling " + pkgs.map(p => (0, path_1.basename)(p.root)).join(", "));
        for (let pkg of changedPkgs) {
            try {
                await bundle(pkg, out, options);
            }
            catch (e) {
                console.error(`Failed to bundle ${(0, path_1.basename)(pkg.root)}:\n${e}`);
            }
        }
        console.log("Bundling done.");
    }
}
exports.watch = watch;
