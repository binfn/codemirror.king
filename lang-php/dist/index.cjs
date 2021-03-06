'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var php$1 = require('@lezer/php');
var common = require('@lezer/common');
var langHtml = require('@codemirror/lang-html');
var language = require('@codemirror/language');
var highlight = require('@codemirror/highlight');

/**
A language provider based on the [Lezer PHP
parser](https://github.com/lezer-parser/php), extended with
highlighting and indentation information.
*/
const phpLanguage = language.LRLanguage.define({
    parser: php$1.parser.configure({
        props: [
            language.indentNodeProp.add({
                IfStatement: language.continuedIndent({ except: /^\s*({|else\b|elseif\b|endif\b)/ }),
                TryStatement: language.continuedIndent({ except: /^\s*({|catch\b|finally\b)/ }),
                SwitchBody: context => {
                    let after = context.textAfter, closed = /^\s*\}/.test(after), isCase = /^\s*(case|default)\b/.test(after);
                    return context.baseIndent + (closed ? 0 : isCase ? 1 : 2) * context.unit;
                },
                ColonBlock: cx => cx.baseIndent + cx.unit,
                "Block EnumBody DeclarationList": language.delimitedIndent({ closing: "}" }),
                ArrowFunction: cx => cx.baseIndent + cx.unit,
                "String BlockComment": () => -1,
                Statement: language.continuedIndent({ except: /^({|end(for|foreach|switch|while)\b)/ })
            }),
            language.foldNodeProp.add({
                "Block EnumBody DeclarationList SwitchBody ArrayExpression ValueList": language.foldInside,
                ColonBlock(tree) { return { from: tree.from + 1, to: tree.to }; },
                BlockComment(tree) { return { from: tree.from + 2, to: tree.to - 2 }; }
            }),
            highlight.styleTags({
                "Visibility abstract final static": highlight.tags.modifier,
                "for foreach while do if else elseif switch try catch finally return throw break continue default case": highlight.tags.controlKeyword,
                "endif endfor endforeach endswitch endwhile declare enddeclare goto match": highlight.tags.controlKeyword,
                "and or xor yield unset clone instanceof insteadof": highlight.tags.operatorKeyword,
                "function fn class trait implements extends const enum global interface use var": highlight.tags.definitionKeyword,
                "include include_once require require_once namespace": highlight.tags.moduleKeyword,
                "new from echo print array list as": highlight.tags.keyword,
                null: highlight.tags.null,
                Boolean: highlight.tags.bool,
                VariableName: highlight.tags.variableName,
                "NamespaceName/...": highlight.tags.namespace,
                "NamedType/...": highlight.tags.typeName,
                Name: highlight.tags.name,
                "CallExpression/Name": highlight.tags.function(highlight.tags.variableName),
                "LabelStatement/Name": highlight.tags.labelName,
                "MemberExpression/Name": highlight.tags.propertyName,
                "MemberExpression/VariableName": highlight.tags.special(highlight.tags.propertyName),
                "ScopedExpression/ClassMemberName/Name": highlight.tags.propertyName,
                "ScopedExpression/ClassMemberName/VariableName": highlight.tags.special(highlight.tags.propertyName),
                "CallExpression/MemberExpression/Name": highlight.tags.function(highlight.tags.propertyName),
                "CallExpression/ScopedExpression/ClassMemberName/Name": highlight.tags.function(highlight.tags.propertyName),
                "MethodDeclaration/Name": highlight.tags.function(highlight.tags.definition(highlight.tags.variableName)),
                "FunctionDefinition/Name": highlight.tags.function(highlight.tags.definition(highlight.tags.variableName)),
                "ClassDeclaration/Name": highlight.tags.definition(highlight.tags.className),
                UpdateOp: highlight.tags.updateOperator,
                ArithOp: highlight.tags.arithmeticOperator,
                LogicOp: highlight.tags.logicOperator,
                BitOp: highlight.tags.bitwiseOperator,
                CompareOp: highlight.tags.compareOperator,
                ControlOp: highlight.tags.controlOperator,
                AssignOp: highlight.tags.definitionOperator,
                "$ ConcatOp": highlight.tags.operator,
                LineComment: highlight.tags.lineComment,
                BlockComment: highlight.tags.blockComment,
                Integer: highlight.tags.integer,
                Float: highlight.tags.float,
                String: highlight.tags.string,
                ShellExpression: highlight.tags.special(highlight.tags.string),
                "=> ->": highlight.tags.punctuation,
                "( )": highlight.tags.paren,
                "#[ [ ]": highlight.tags.squareBracket,
                "${ { }": highlight.tags.brace,
                "-> ?->": highlight.tags.derefOperator,
                ", ; :: : \\": highlight.tags.separator,
                "PhpOpen PhpClose": highlight.tags.processingInstruction,
            })
        ]
    }),
    languageData: {
        commentTokens: { block: { open: "/*", close: "*/" }, line: "//" },
        indentOnInput: /^\s*(?:case |default:|end(?:if|for(?:each)?|switch|while)|else(?:if)?|\{|\})$/,
        wordChars: "$"
    }
});
/**
PHP language support.
*/
function php(config = {}) {
    let support = [], base;
    if (config.baseLanguage === null) ;
    else if (config.baseLanguage) {
        base = config.baseLanguage;
    }
    else {
        let htmlSupport = langHtml.html({ matchClosingTags: false });
        support.push(htmlSupport.support);
        base = htmlSupport.language;
    }
    return new language.LanguageSupport(phpLanguage.configure({
        wrap: base && common.parseMixed(node => {
            if (!node.type.isTop)
                return null;
            return {
                parser: base.parser,
                overlay: node => node.name == "Text"
            };
        }),
        top: config.plain ? "Program" : "Template"
    }), support);
}

exports.php = php;
exports.phpLanguage = phpLanguage;
