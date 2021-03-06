import { EditorState } from "@codemirror/state";
import { CompletionContext } from "@codemirror/autocomplete";
import { schemaCompletion, PostgreSQL, MySQL } from "@codemirror/lang-sql";
import ist from "ist";
function get(doc, conf = {}) {
    let cur = doc.indexOf("|");
    doc = doc.slice(0, cur) + doc.slice(cur + 1);
    let state = EditorState.create({
        doc,
        selection: { anchor: cur },
        extensions: [conf.dialect || PostgreSQL, schemaCompletion(Object.assign({ dialect: PostgreSQL }, conf))]
    });
    let result = state.languageDataAt("autocomplete", cur)[0](new CompletionContext(state, cur, !!conf.explicit));
    return result;
}
function str(result) {
    return !result ? "" : result.options.slice()
        .sort((a, b) => (b.boost || 0) - (a.boost || 0) || (a.label < b.label ? -1 : 1))
        .map(o => o.label)
        .join(", ");
}
let schema1 = {
    users: ["name", "id", "address"],
    products: ["name", "cost", "description"]
};
describe("SQL completion", () => {
    it("completes table names", () => {
        ist(str(get("select u|", { schema: schema1 })), "products, users");
    });
    it("completes quoted table names", () => {
        ist(str(get('select "u|', { schema: schema1 })), '"products", "users"');
    });
    it("completes column names", () => {
        ist(str(get("select users.|", { schema: schema1 })), "address, id, name");
    });
    it("completes quoted column names", () => {
        ist(str(get('select users."|', { schema: schema1 })), '"address", "id", "name"');
    });
    it("completes column names in quoted tables", () => {
        ist(str(get('select "users".|', { schema: schema1 })), "address, id, name");
    });
    it("includes closing quote in completion", () => {
        let r = get('select "u|"', { schema: schema1 });
        ist(r.to, 10);
    });
    it("keeps extra table completion properties", () => {
        let r = get("select u|", { schema: { users: ["id"] }, tables: [{ label: "users", type: "keyword" }] });
        ist(r.options[0].type, "keyword");
    });
    it("keeps extra column completion properties", () => {
        let r = get("select users.|", { schema: { users: [{ label: "id", type: "keyword" }] } });
        ist(r.options[0].type, "keyword");
    });
    it("supports a default table", () => {
        ist(str(get("select i|", { schema: schema1, defaultTable: "users" })), "address, id, name, products, users");
    });
    it("supports alternate quoting styles", () => {
        ist(str(get("select `u|", { dialect: MySQL, schema: schema1 })), "`products`, `users`");
    });
    it("doesn't complete without identifier", () => {
        ist(str(get("select |", { schema: schema1 })), "");
    });
    it("does complete explicitly without identifier", () => {
        ist(str(get("select |", { schema: schema1, explicit: true })), "products, users");
    });
});
