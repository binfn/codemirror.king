'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var java$1 = require('@lezer/java');
var language = require('@codemirror/language');
var highlight = require('@codemirror/highlight');

/**
A language provider based on the [Lezer Java
parser](https://github.com/lezer-parser/java), extended with
highlighting and indentation information.
*/
const javaLanguage = language.LRLanguage.define({
    parser: java$1.parser.configure({
        props: [
            language.indentNodeProp.add({
                IfStatement: language.continuedIndent({ except: /^\s*({|else\b)/ }),
                TryStatement: language.continuedIndent({ except: /^\s*({|catch|finally)\b/ }),
                LabeledStatement: language.flatIndent,
                SwitchBlock: context => {
                    let after = context.textAfter, closed = /^\s*\}/.test(after), isCase = /^\s*(case|default)\b/.test(after);
                    return context.baseIndent + (closed ? 0 : isCase ? 1 : 2) * context.unit;
                },
                BlockComment: () => -1,
                Statement: language.continuedIndent({ except: /^{/ })
            }),
            language.foldNodeProp.add({
                ["Block SwitchBlock ClassBody ElementValueArrayInitializer ModuleBody EnumBody " +
                    "ConstructorBody InterfaceBody ArrayInitializer"]: language.foldInside,
                BlockComment(tree) { return { from: tree.from + 2, to: tree.to - 2 }; }
            }),
            highlight.styleTags({
                null: highlight.tags.null,
                instanceof: highlight.tags.operatorKeyword,
                this: highlight.tags.self,
                "new super assert open to with void": highlight.tags.keyword,
                "class interface extends implements enum": highlight.tags.definitionKeyword,
                "module package import": highlight.tags.moduleKeyword,
                "switch while for if else case default do break continue return try catch finally throw": highlight.tags.controlKeyword,
                ["requires exports opens uses provides public private protected static transitive abstract final " +
                    "strictfp synchronized native transient volatile throws"]: highlight.tags.modifier,
                IntegerLiteral: highlight.tags.integer,
                FloatLiteral: highlight.tags.float,
                "StringLiteral TextBlock": highlight.tags.string,
                CharacterLiteral: highlight.tags.character,
                LineComment: highlight.tags.lineComment,
                BlockComment: highlight.tags.blockComment,
                BooleanLiteral: highlight.tags.bool,
                PrimitiveType: highlight.tags.standard(highlight.tags.typeName),
                TypeName: highlight.tags.typeName,
                Identifier: highlight.tags.variableName,
                "MethodName/Identifier": highlight.tags.function(highlight.tags.variableName),
                Definition: highlight.tags.definition(highlight.tags.variableName),
                ArithOp: highlight.tags.arithmeticOperator,
                LogicOp: highlight.tags.logicOperator,
                BitOp: highlight.tags.bitwiseOperator,
                CompareOp: highlight.tags.compareOperator,
                AssignOp: highlight.tags.definitionOperator,
                UpdateOp: highlight.tags.updateOperator,
                Asterisk: highlight.tags.punctuation,
                Label: highlight.tags.labelName,
                "( )": highlight.tags.paren,
                "[ ]": highlight.tags.squareBracket,
                "{ }": highlight.tags.brace,
                ".": highlight.tags.derefOperator,
                ", ;": highlight.tags.separator
            })
        ]
    }),
    languageData: {
        commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
        indentOnInput: /^\s*(?:case |default:|\{|\})$/
    }
});
/**
Java language support.
*/
function java() {
    return new language.LanguageSupport(javaLanguage);
}

exports.java = java;
exports.javaLanguage = javaLanguage;
