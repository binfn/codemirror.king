import {EditorState, EditorView, basicSetup} from "../basic-setup/src/basic-setup.ts"
import {markdown} from "../lang-markdown/src/index.ts"

const state = EditorState.create({doc: 'console.log("Hello world")', extensions: [
  basicSetup,
  markdown(),
]})

;(window as any).view = new EditorView({state, parent: document.querySelector("#editor")!})
