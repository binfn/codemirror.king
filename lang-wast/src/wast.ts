import {delimitedIndent, indentNodeProp, foldNodeProp, foldInside, LRLanguage, LanguageSupport} from "../../language/src/index.ts"
import {styleTags, tags as t} from "../../highlight/src/highlight.ts"
import {parser} from "./wast.grammar"

export const wastLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        App: delimitedIndent({closing: ")", align: false})
      }),
      foldNodeProp.add({
        App: foldInside,
        BlockComment(tree) { return {from: tree.from + 2, to: tree.to - 2} }
      }),
      styleTags({
        Keyword: t.keyword,
        Type: t.typeName,
        Number: t.number,
        String: t.string,
        Identifier: t.variableName,
        LineComment: t.lineComment,
        BlockComment: t.blockComment,
        "( )": t.paren
      })
    ]
  }),
  languageData: {
    commentTokens: {line: ";;", block: {open: "(;", close: ";)"}},
    closeBrackets: {brackets: ["(", '"']}
  }
})

export function wast() {
  return new LanguageSupport(wastLanguage);
}
