import {parser, configureNesting} from "../../lezer/html/index.js"
import {cssLanguage, css} from "../../lang-css/src/css.ts"
import {javascriptLanguage, javascript} from "../../lang-javascript/src/javascript.ts"
import {EditorView} from "../../view/src/index.ts"
import {EditorSelection} from "../../state/src/index.ts"
import {LRLanguage, indentNodeProp, foldNodeProp, LanguageSupport, syntaxTree} from "../../language/src/index.ts"
import {styleTags, tags as t} from "../../highlight/src/highlight.ts"
import {htmlCompletionSource, elementName} from "./complete.ts"
export {htmlCompletionSource} from "./complete.ts"

/// A language provider based on the [Lezer HTML
/// parser](https://github.com/lezer-parser/html), extended with the
/// JavaScript and CSS parsers to parse the content of `<script>` and
/// `<style>` tags.
export const htmlLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        Element(context) {
          let after = /^(\s*)(<\/)?/.exec(context.textAfter)!
          if (context.node.to <= context.pos + after[0].length) return context.continue()
          return context.lineIndent(context.node.from) + (after[2] ? 0 : context.unit)
        },
        "OpenTag CloseTag SelfClosingTag"(context) {
          return context.column(context.node.from) + context.unit
        },
        Document(context) {
          if (context.pos + /\s*/.exec(context.textAfter)![0].length < context.node.to)
            return context.continue()
          let endElt = null, close
          for (let cur = context.node;;) {
            let last = cur.lastChild
            if (!last || last.name != "Element" || last.to != cur.to) break
            endElt = cur = last
          }
          if (endElt && !((close = endElt.lastChild) && (close.name == "CloseTag" || close.name == "SelfClosingTag")))
            return context.lineIndent(endElt.from) + context.unit
          return null
        }
      }),
      foldNodeProp.add({
        Element(node) {
          let first = node.firstChild, last = node.lastChild!
          if (!first || first.name != "OpenTag") return null
          return {from: first.to, to: last.name == "CloseTag" ? last.from : node.to}
        }
      }),
      styleTags({
        "Text RawText": t.content,
        "StartTag StartCloseTag SelfCloserEndTag EndTag SelfCloseEndTag": t.angleBracket,
        TagName: t.tagName,
        "MismatchedCloseTag/TagName": [t.tagName,  t.invalid],
        AttributeName: t.attributeName,
        "AttributeValue UnquotedAttributeValue": t.attributeValue,
        Is: t.definitionOperator,
        "EntityReference CharacterReference": t.character,
        Comment: t.blockComment,
        ProcessingInst: t.processingInstruction,
        DoctypeDecl: t.documentMeta
      })
    ],
    wrap: configureNesting([
      {tag: "script",
       attrs(attrs: { type: string; }) {
         return !attrs.type || /^(?:text|application)\/(?:x-)?(?:java|ecma)script$|^module$|^$/i.test(attrs.type)
       },
       parser: javascriptLanguage.parser},
      {tag: "style",
       attrs(attrs: { lang: string; type: string; }) {
         return (!attrs.lang || attrs.lang == "css") && (!attrs.type || /^(text\/)?(x-)?(stylesheet|css)$/i.test(attrs.type))
       },
       parser: cssLanguage.parser}
    ])
  }),
  languageData: {
    commentTokens: {block: {open: "<!--", close: "-->"}},
    indentOnInput: /^\s*<\/\w+\W$/,
    wordChars: "-._"
  }
})

// FIXME remove on next major version
export const htmlCompletion = htmlLanguage.data.of({autocomplete: htmlCompletionSource})

/// Language support for HTML, including
/// [`htmlCompletion`](#lang-html.htmlCompletion) and JavaScript and
/// CSS support extensions.
export function html(config: {
  /// By default, the syntax tree will highlight mismatched closing
  /// tags. Set this to `false` to turn that off (for example when you
  /// expect to only be parsing a fragment of HTML text, not a full
  /// document).
  matchClosingTags?: boolean,
  /// Determines whether [`autoCloseTags`](#lang-html.autoCloseTags)
  /// is included in the support extensions. Defaults to true.
  autoCloseTags?: boolean,
} = {}) {
  let lang = htmlLanguage
  if (config.matchClosingTags === false) lang = lang.configure({dialect: "noMatch"})
  return new LanguageSupport(lang, [
    htmlCompletion,
    config.autoCloseTags !== false ? autoCloseTags: [],
    javascript().support,
    css().support
  ])
}

/// Extension that will automatically insert close tags when a `>` or
/// `/` is typed.
export const autoCloseTags = EditorView.inputHandler.of((view, from, to, text) => {
  if (view.composing || view.state.readOnly || from != to || (text != ">" && text != "/") ||
      !htmlLanguage.isActiveAt(view.state, from, -1)) return false
  let {state} = view
  let changes = state.changeByRange(range => {
    let {head} = range, around = syntaxTree(state).resolveInner(head, -1), name
    if (around.name == "TagName" || around.name == "StartTag") around = around.parent!
    if (text == ">" && around.name == "OpenTag") {
      if (around.parent?.lastChild?.name != "CloseTag" && (name = elementName(state.doc, around.parent, head)))
        return {range: EditorSelection.cursor(head + 1), changes: {from: head, insert: `></${name}>`}}
    } else if (text == "/" && around.name == "OpenTag") {
      let empty = around.parent, base = empty?.parent
      if (empty!.from == head - 1 && base!.lastChild?.name != "CloseTag" && (name = elementName(state.doc, base, head))) {
        let insert = `/${name}>`
        return {range: EditorSelection.cursor(head + insert.length), changes: {from: head, insert}}
      }
    }
    return {range}
  })
  if (changes.changes.empty) return false
  view.dispatch(changes, {userEvent: "input.type", scrollIntoView: true})
  return true
});
