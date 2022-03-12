import { EditorState, EditorView, basicSetup } from "@codemirror/basic-setup";
import { markdown } from "@codemirror/lang-markdown";
let state = EditorState.create({ doc: 'console.log("Hello world")', extensions: [
        basicSetup,
        markdown(),
    ] });
window.view = new EditorView({ state, parent: document.querySelector("#editor") });
