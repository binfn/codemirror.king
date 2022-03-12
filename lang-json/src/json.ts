import {parser} from "../../lezer/json/parser.js"
import {continuedIndent, indentNodeProp, foldNodeProp, foldInside, LRLanguage, LanguageSupport} from "../../language/src/index.ts"
import {styleTags, tags as t} from "../../highlight/src/highlight.ts"

/// A language provider that provides JSON parsing.
export const jsonLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        Object: continuedIndent({except: /^\s*\}/}),
        Array: continuedIndent({except: /^\s*\]/})
      }),
      foldNodeProp.add({
        "Object Array": foldInside
      }),
      styleTags({
        String: t.string,
        Number: t.number,
        "True False": t.bool,
        PropertyName: t.propertyName,
        Null: t.null,
        ",": t.separator,
        "[ ]": t.squareBracket,
        "{ }": t.brace
      })
    ]
  }),
  languageData: {
    closeBrackets: {brackets: ["[", "{", '"']},
    indentOnInput: /^\s*[\}\]]$/
  }
})

/// JSON language support.
export function json() {
  return new LanguageSupport(jsonLanguage)
}

export {jsonParseLinter} from "./lint.ts"
