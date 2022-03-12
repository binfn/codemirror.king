'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var lezer$1 = require('@lezer/lezer');
var language = require('@codemirror/language');
var highlight = require('@codemirror/highlight');

/**
A language provider based on the [Lezer Lezer
parser](https://github.com/lezer-parser/lezer-grammar), extended
with highlighting and indentation information.
*/
const lezerLanguage = language.LRLanguage.define({
    parser: lezer$1.parser.configure({
        props: [
            language.foldNodeProp.add({
                "Body TokensBody SkipBody PrecedenceBody": language.foldInside
            }),
            highlight.styleTags({
                LineComment: highlight.tags.lineComment,
                BlockComment: highlight.tags.blockComment,
                AnyChar: highlight.tags.character,
                Literal: highlight.tags.string,
                "tokens from grammar as empty prop extend specialize": highlight.tags.keyword,
                "@top @left @right @cut @external": highlight.tags.modifier,
                "@precedence @tokens @context @dialects @skip @detectDelim @conflict": highlight.tags.definitionKeyword,
                "@extend @specialize": highlight.tags.operatorKeyword,
                "CharSet InvertedCharSet": highlight.tags.regexp,
                RuleName: highlight.tags.variableName,
                "RuleDeclaration/RuleName InlineRule/RuleName TokensBody/RuleName": highlight.tags.definition(highlight.tags.variableName),
                PrecedenceName: highlight.tags.labelName,
                Name: highlight.tags.name,
                "( )": highlight.tags.paren,
                "[ ]": highlight.tags.squareBracket,
                "{ }": highlight.tags.brace,
                '"!" ~ "*" + ? |': highlight.tags.operator
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
    return new language.LanguageSupport(lezerLanguage);
}

exports.lezer = lezer;
exports.lezerLanguage = lezerLanguage;
