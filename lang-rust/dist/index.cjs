'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var rust$1 = require('@lezer/rust');
var language = require('@codemirror/language');
var highlight = require('@codemirror/highlight');

/**
A syntax provider based on the [Lezer Rust
parser](https://github.com/lezer-parser/rust), extended with
highlighting and indentation information.
*/
const rustLanguage = language.LRLanguage.define({
    parser: rust$1.parser.configure({
        props: [
            language.indentNodeProp.add({
                IfExpression: language.continuedIndent({ except: /^\s*({|else\b)/ }),
                "String BlockComment": () => -1,
                "Statement MatchArm": language.continuedIndent()
            }),
            language.foldNodeProp.add(type => {
                if (/(Block|edTokens|List)$/.test(type.name))
                    return language.foldInside;
                if (type.name == "BlockComment")
                    return tree => ({ from: tree.from + 2, to: tree.to - 2 });
                return undefined;
            }),
            highlight.styleTags({
                "const macro_rules struct union enum type fn impl trait let static": highlight.tags.definitionKeyword,
                "mod use crate": highlight.tags.moduleKeyword,
                "pub unsafe async mut extern default move": highlight.tags.modifier,
                "for if else loop while match continue break return await": highlight.tags.controlKeyword,
                "as in ref": highlight.tags.operatorKeyword,
                "where _ crate super dyn": highlight.tags.keyword,
                "self": highlight.tags.self,
                String: highlight.tags.string,
                RawString: highlight.tags.special(highlight.tags.string),
                Boolean: highlight.tags.bool,
                Identifier: highlight.tags.variableName,
                "CallExpression/Identifier": highlight.tags.function(highlight.tags.variableName),
                BoundIdentifier: highlight.tags.definition(highlight.tags.variableName),
                LoopLabel: highlight.tags.labelName,
                FieldIdentifier: highlight.tags.propertyName,
                "CallExpression/FieldExpression/FieldIdentifier": highlight.tags.function(highlight.tags.propertyName),
                Lifetime: highlight.tags.special(highlight.tags.variableName),
                ScopeIdentifier: highlight.tags.namespace,
                TypeIdentifier: highlight.tags.typeName,
                "MacroInvocation/Identifier MacroInvocation/ScopedIdentifier/Identifier": highlight.tags.macroName,
                "MacroInvocation/TypeIdentifier MacroInvocation/ScopedIdentifier/TypeIdentifier": highlight.tags.macroName,
                "\"!\"": highlight.tags.macroName,
                UpdateOp: highlight.tags.updateOperator,
                LineComment: highlight.tags.lineComment,
                BlockComment: highlight.tags.blockComment,
                Integer: highlight.tags.integer,
                Float: highlight.tags.float,
                ArithOp: highlight.tags.arithmeticOperator,
                LogicOp: highlight.tags.logicOperator,
                BitOp: highlight.tags.bitwiseOperator,
                CompareOp: highlight.tags.compareOperator,
                "=": highlight.tags.definitionOperator,
                ".. ... => ->": highlight.tags.punctuation,
                "( )": highlight.tags.paren,
                "[ ]": highlight.tags.squareBracket,
                "{ }": highlight.tags.brace,
                ".": highlight.tags.derefOperator,
                "&": highlight.tags.operator,
                ", ; ::": highlight.tags.separator,
            })
        ]
    }),
    languageData: {
        commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
        indentOnInput: /^\s*(?:\{|\})$/
    }
});
/**
Rust language support
*/
function rust() {
    return new language.LanguageSupport(rustLanguage);
}

exports.rust = rust;
exports.rustLanguage = rustLanguage;
