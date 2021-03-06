'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var python$1 = require('@lezer/python');
var language = require('@codemirror/language');
var highlight = require('@codemirror/highlight');

function indentBody(context, node) {
    let base = context.lineIndent(node.from);
    let line = context.lineAt(context.pos, -1), to = line.from + line.text.length;
    // Don't consider blank, deindented lines at the end of the
    // block part of the block
    if (!/\S/.test(line.text) &&
        context.node.to < to + 100 &&
        !/\S/.test(context.state.sliceDoc(to, context.node.to)) &&
        context.lineIndent(context.pos, -1) <= base)
        return null;
    // A normally deindenting keyword that appears at a higher
    // indentation than the block should probably be handled by the next
    // level
    if (/^\s*(else:|elif |except |finally:)/.test(context.textAfter) && context.lineIndent(context.pos, -1) > base)
        return null;
    return base + context.unit;
}
/**
A language provider based on the [Lezer Python
parser](https://github.com/lezer-parser/python), extended with
highlighting and indentation information.
*/
const pythonLanguage = language.LRLanguage.define({
    parser: python$1.parser.configure({
        props: [
            language.indentNodeProp.add({
                Body: context => { var _a; return (_a = indentBody(context, context.node)) !== null && _a !== void 0 ? _a : context.continue(); },
                IfStatement: cx => /^\s*(else:|elif )/.test(cx.textAfter) ? cx.baseIndent : cx.continue(),
                TryStatement: cx => /^\s*(except |finally:)/.test(cx.textAfter) ? cx.baseIndent : cx.continue(),
                "TupleExpression ComprehensionExpression ParamList ArgList ParenthesizedExpression": language.delimitedIndent({ closing: ")" }),
                "DictionaryExpression DictionaryComprehensionExpression SetExpression SetComprehensionExpression": language.delimitedIndent({ closing: "}" }),
                "ArrayExpression ArrayComprehensionExpression": language.delimitedIndent({ closing: "]" }),
                Script: context => {
                    if (context.pos + /\s*/.exec(context.textAfter)[0].length >= context.node.to) {
                        let endBody = null;
                        for (let cur = context.node, to = cur.to;;) {
                            cur = cur.lastChild;
                            if (!cur || cur.to != to)
                                break;
                            if (cur.type.name == "Body")
                                endBody = cur;
                        }
                        if (endBody) {
                            let bodyIndent = indentBody(context, endBody);
                            if (bodyIndent != null)
                                return bodyIndent;
                        }
                    }
                    return context.continue();
                }
            }),
            language.foldNodeProp.add({
                "ArrayExpression DictionaryExpression": language.foldInside,
                Body: (node, state) => ({ from: node.from + 1, to: node.to - (node.to == state.doc.length ? 0 : 1) })
            }),
            highlight.styleTags({
                "async '*' '**' FormatConversion": highlight.tags.modifier,
                "for while if elif else try except finally return raise break continue with pass assert await yield": highlight.tags.controlKeyword,
                "in not and or is del": highlight.tags.operatorKeyword,
                "from def class global nonlocal lambda": highlight.tags.definitionKeyword,
                import: highlight.tags.moduleKeyword,
                "with as print": highlight.tags.keyword,
                self: highlight.tags.self,
                Boolean: highlight.tags.bool,
                None: highlight.tags.null,
                VariableName: highlight.tags.variableName,
                "CallExpression/VariableName": highlight.tags.function(highlight.tags.variableName),
                "FunctionDefinition/VariableName": highlight.tags.function(highlight.tags.definition(highlight.tags.variableName)),
                "ClassDefinition/VariableName": highlight.tags.definition(highlight.tags.className),
                PropertyName: highlight.tags.propertyName,
                "CallExpression/MemberExpression/PropertyName": highlight.tags.function(highlight.tags.propertyName),
                Comment: highlight.tags.lineComment,
                Number: highlight.tags.number,
                String: highlight.tags.string,
                FormatString: highlight.tags.special(highlight.tags.string),
                UpdateOp: highlight.tags.updateOperator,
                ArithOp: highlight.tags.arithmeticOperator,
                BitOp: highlight.tags.bitwiseOperator,
                CompareOp: highlight.tags.compareOperator,
                AssignOp: highlight.tags.definitionOperator,
                Ellipsis: highlight.tags.punctuation,
                At: highlight.tags.meta,
                "( )": highlight.tags.paren,
                "[ ]": highlight.tags.squareBracket,
                "{ }": highlight.tags.brace,
                ".": highlight.tags.derefOperator,
                ", ;": highlight.tags.separator
            })
        ],
    }),
    languageData: {
        closeBrackets: { brackets: ["(", "[", "{", "'", '"', "'''", '"""'] },
        commentTokens: { line: "#" },
        indentOnInput: /^\s*([\}\]\)]|else:|elif |except |finally:)$/
    }
});
/**
Python language support.
*/
function python() {
    return new language.LanguageSupport(pythonLanguage);
}

exports.python = python;
exports.pythonLanguage = pythonLanguage;
