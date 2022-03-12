import { parser } from '@lezer/lezer';
import { LRLanguage, foldNodeProp, foldInside, LanguageSupport } from '@codemirror/language';
import { styleTags, tags } from '@codemirror/highlight';

/**
A language provider based on the [Lezer Lezer
parser](https://github.com/lezer-parser/lezer-grammar), extended
with highlighting and indentation information.
*/
const lezerLanguage = /*@__PURE__*/LRLanguage.define({
    parser: /*@__PURE__*/parser.configure({
        props: [
            /*@__PURE__*/foldNodeProp.add({
                "Body TokensBody SkipBody PrecedenceBody": foldInside
            }),
            /*@__PURE__*/styleTags({
                LineComment: tags.lineComment,
                BlockComment: tags.blockComment,
                AnyChar: tags.character,
                Literal: tags.string,
                "tokens from grammar as empty prop extend specialize": tags.keyword,
                "@top @left @right @cut @external": tags.modifier,
                "@precedence @tokens @context @dialects @skip @detectDelim @conflict": tags.definitionKeyword,
                "@extend @specialize": tags.operatorKeyword,
                "CharSet InvertedCharSet": tags.regexp,
                RuleName: tags.variableName,
                "RuleDeclaration/RuleName InlineRule/RuleName TokensBody/RuleName": /*@__PURE__*/tags.definition(tags.variableName),
                PrecedenceName: tags.labelName,
                Name: tags.name,
                "( )": tags.paren,
                "[ ]": tags.squareBracket,
                "{ }": tags.brace,
                '"!" ~ "*" + ? |': tags.operator
            })
        ]
    }),
    languageData: {
        commentTokens: { block: { open: "/*", close: "*/" }, line: "//" },
        indentOnInput: /^\s*\}$/
    }
});
/**
Language support for Lezer grammars.
*/
function lezer() {
    return new LanguageSupport(lezerLanguage);
}

export { lezer, lezerLanguage };
