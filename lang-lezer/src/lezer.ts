import {parser} from "../../lezer/lezer/parser.js"
import {LRLanguage, foldNodeProp, foldInside, LanguageSupport} from "../../language/src/index.ts"
import {styleTags, tags as t} from "../../highlight/src/highlight.ts"

/// A language provider based on the [Lezer Lezer
/// parser](https://github.com/lezer-parser/lezer-grammar), extended
/// with highlighting and indentation information.
export const lezerLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      foldNodeProp.add({
        "Body TokensBody SkipBody PrecedenceBody": foldInside
      }),
      styleTags({
        LineComment: t.lineComment,
        BlockComment: t.blockComment,
        AnyChar: t.character,
        Literal: t.string,
        "tokens from grammar as empty prop extend specialize": t.keyword,
        "@top @left @right @cut @external": t.modifier,
        "@precedence @tokens @context @dialects @skip @detectDelim @conflict": t.definitionKeyword,
        "@extend @specialize": t.operatorKeyword,
        "CharSet InvertedCharSet": t.regexp,
        RuleName: t.variableName,
        "RuleDeclaration/RuleName InlineRule/RuleName TokensBody/RuleName": t.definition(t.variableName),
        PrecedenceName: t.labelName,
        Name: t.name,
        "( )": t.paren,
        "[ ]": t.squareBracket,
        "{ }": t.brace,
        '"!" ~ "*" + ? |': t.operator
      })
    ]
  }),
  languageData: {
    commentTokens: {block: {open: "/*", close: "*/"}, line: "//"},
    indentOnInput: /^\s*\}$/
  }
})

/// Language support for Lezer grammars.
export function lezer() {
  return new LanguageSupport(lezerLanguage)
}
