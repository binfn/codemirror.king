import {LanguageSupport, LanguageDescription} from "../../language/src/index.ts"
import {StreamParser} from "../../stream-parser/src/stream-parser.ts"

function legacy(parser: StreamParser<unknown>): Promise<LanguageSupport> {
  return import("../../stream-parser/src/stream-parser.ts").then(m => new LanguageSupport(m.StreamLanguage.define(parser)))
}

function sql(dialectName: keyof typeof import("../../lang-sql/src/sql.ts")) {
  return import("../../lang-sql/src/sql.ts").then(m => m.sql({dialect: (m as any)[dialectName]}))
}

/// An array of language descriptions for known language packages.
export const languages = [
  // New-style language modes
  LanguageDescription.of({
    name: "C",
    extensions: ["c","h","ino"],
    load() {
      return import("../../lang-cpp/src/cpp.ts").then(m => m.cpp())
    }
  }),
  LanguageDescription.of({
    name: "C++",
    alias: ["cpp"],
    extensions: ["cpp","c++","cc","cxx","hpp","h++","hh","hxx"],
    load() {
      return import("../../lang-cpp/src/cpp.ts").then(m => m.cpp())
    }
  }),
  LanguageDescription.of({
    name: "CQL",
    alias: ["cassandra"],
    extensions: ["cql"],
    load() { return sql("Cassandra") }
  }),
  LanguageDescription.of({
    name: "CSS",
    extensions: ["css"],
    load() {
      return import("../../lang-css/src/css.ts").then(m => m.css())
    }
  }),
  LanguageDescription.of({
    name: "HTML",
    alias: ["xhtml"],
    extensions: ["html", "htm", "handlebars", "hbs"],
    load() {
      return import("../../lang-html/src/html.ts").then(m => m.html())
    }
  }),
  LanguageDescription.of({
    name: "Java",
    extensions: ["java"],
    load() {
      return import("../../lang-java/src/java.ts").then(m => m.java())
    }
  }),
  LanguageDescription.of({
    name: "JavaScript",
    alias: ["ecmascript","js","node"],
    extensions: ["js", "mjs", "cjs"],
    load() {
      return import("../../lang-javascript/src/javascript.ts").then(m => m.javascript())
    }
  }),
  LanguageDescription.of({
    name: "JSON",
    alias: ["json5"],
    extensions: ["json","map"],
    load() {
      return import("../../lang-json/src/json.ts").then(m => m.json())
    }
  }),
  LanguageDescription.of({
    name: "JSX",
    extensions: ["jsx"],
    load() {
      return import("../../lang-javascript/src/javascript.ts").then(m => m.javascript({jsx: true}))
    }
  }),
  LanguageDescription.of({
    name: "MariaDB SQL",
    load() { return sql("MariaSQL") }
  }),
  LanguageDescription.of({
    name: "Markdown",
    extensions: ["md", "markdown", "mkd"],
    load() {
      return import("../../lang-markdown/src/markdown.ts").then(m => m.markdown())
    }
  }),
  LanguageDescription.of({
    name: "MS SQL",
    load() { return sql("MSSQL") }
  }),
  LanguageDescription.of({
    name: "MySQL",
    load() { return sql("MySQL") }
  }),
  LanguageDescription.of({
    name: "PHP",
    extensions: ["php", "php3", "php4", "php5", "php7", "phtml"],
    load() {
      return import("../../lang-php/src/php.ts").then(m => m.php())
    }
  }),
  LanguageDescription.of({
    name: "PLSQL",
    extensions: ["pls"],
    load() { return sql("PLSQL") }
  }),
  LanguageDescription.of({
    name: "PostgreSQL",
    load() { return sql("PostgreSQL") }
  }),
  LanguageDescription.of({
    name: "Python",
    extensions: ["BUILD","bzl","py","pyw"],
    filename: /^(BUCK|BUILD)$/,
    load() {
      return import("../../lang-python/src/python.ts").then(m => m.python())
    }
  }),
  LanguageDescription.of({
    name: "Rust",
    extensions: ["rs"],
    load() {
      return import("../../lang-rust/src/rust.ts").then(m => m.rust())
    }
  }),
  LanguageDescription.of({
    name: "SQL",
    extensions: ["sql"],
    load() { return sql("StandardSQL") }
  }),
  LanguageDescription.of({
    name: "SQLite",
    load() { return sql("SQLite") }
  }),
  LanguageDescription.of({
    name: "TSX",
    extensions: ["tsx"],
    load() {
      return import("../../lang-javascript/src/javascript.ts").then(m => m.javascript({jsx: true, typescript: true}))
    }
  }),
  LanguageDescription.of({
    name: "TypeScript",
    alias: ["ts"],
    extensions: ["ts"],
    load() {
      return import("../../lang-javascript/src/javascript.ts").then(m => m.javascript({typescript: true}))
    }
  }),
  LanguageDescription.of({
    name: "WebAssembly",
    extensions: ["wat","wast"],
    load() {
      return import("../../lang-wast/src/wast.ts").then(m => m.wast())
    }
  }),
  LanguageDescription.of({
    name: "XML",
    alias: ["rss","wsdl","xsd"],
    extensions: ["xml","xsl","xsd","svg"],
    load() {
      return import("../../lang-xml/src/xml.ts").then(m => m.xml())
    }
  }),]