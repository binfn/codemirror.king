import { parser } from '@lezer/php';
import { parseMixed } from '@lezer/common';
import { html } from '@codemirror/lang-html';
import { LRLanguage, indentNodeProp, continuedIndent, delimitedIndent, foldNodeProp, foldInside, LanguageSupport } from '@codemirror/language';
import { styleTags, tags } from '@codemirror/highlight';

/**
A language provider based on the [Lezer PHP
parser](https://github.com/lezer-parser/php), extended with
highlighting and indentation information.
*/
const phpLanguage = /*@__PURE__*/LRLanguage.define({
    parser: /*@__PURE__*/parser.configure({
        props: [
            /*@__PURE__*/indentNodeProp.add({
                IfStatement: /*@__PURE__*/continuedIndent({ except: /^\s*({|else\b|elseif\b|endif\b)/ }),
                TryStatement: /*@__PURE__*/continuedIndent({ except: /^\s*({|catch\b|finally\b)/ }),
                SwitchBody: context => {
                    let after = context.textAfter, closed = /^\s*\}/.test(after), isCase = /^\s*(case|default)\b/.test(after);
                    return context.baseIndent + (closed ? 0 : isCase ? 1 : 2) * context.unit;
                },
                ColonBlock: cx => cx.baseIndent + cx.unit,
                "Block EnumBody DeclarationList": /*@__PURE__*/delimitedIndent({ closing: "}" }),
                ArrowFunction: cx => cx.baseIndent + cx.unit,
                "String BlockComment": () => -1,
                Statement: /*@__PURE__*/continuedIndent({ except: /^({|end(for|foreach|switch|while)\b)/ })
            }),
            /*@__PURE__*/foldNodeProp.add({
                "Block EnumBody DeclarationList SwitchBody ArrayExpression ValueList": foldInside,
                ColonBlock(tree) { return { from: tree.from + 1, to: tree.to }; },
                BlockComment(tree) { return { from: tree.from + 2, to: tree.to - 2 }; }
            }),
            /*@__PURE__*/styleTags({
                "Visibility abstract final static": tags.modifier,
                "for foreach while do if else elseif switch try catch finally return throw break continue default case": tags.controlKeyword,
                "endif endfor endforeach endswitch endwhile declare enddeclare goto match": tags.controlKeyword,
                "and or xor yield unset clone instanceof insteadof": tags.operatorKeyword,
                "function fn class trait implements extends const enum global interface use var": tags.definitionKeyword,
                "include include_once require require_once namespace": tags.moduleKeyword,
                "new from echo print array list as": tags.keyword,
                null: tags.null,
                Boolean: tags.bool,
                VariableName: tags.variableName,
                "NamespaceName/...": tags.namespace,
                "NamedType/...": tags.typeName,
                Name: tags.name,
                "CallExpression/Name": /*@__PURE__*/tags.function(tags.variableName),
                "LabelStatement/Name": tags.labelName,
                "MemberExpression/Name": tags.propertyName,
                "MemberExpression/VariableName": /*@__PURE__*/tags.special(tags.propertyName),
                "ScopedExpression/ClassMemberName/Name": tags.propertyName,
                "ScopedExpression/ClassMemberName/VariableName": /*@__PURE__*/tags.special(tags.propertyName),
                "CallExpression/MemberExpression/Name": /*@__PURE__*/tags.function(tags.propertyName),
                "CallExpression/ScopedExpression/ClassMemberName/Name": /*@__PURE__*/tags.function(tags.propertyName),
                "MethodDeclaration/Name": /*@__PURE__*/tags.function(/*@__PURE__*/tags.definition(tags.variableName)),
                "FunctionDefinition/Name": /*@__PURE__*/tags.function(/*@__PURE__*/tags.definition(tags.variableName)),
                "ClassDeclaration/Name": /*@__PURE__*/tags.definition(tags.className),
                UpdateOp: tags.updateOperator,
                ArithOp: tags.arithmeticOperator,
                LogicOp: tags.logicOperator,
                BitOp: tags.bitwiseOperator,
                CompareOp: tags.compareOperator,
                ControlOp: tags.controlOperator,
                AssignOp: tags.definitionOperator,
                "$ ConcatOp": tags.operator,
                LineComment: tags.lineComment,
                BlockComment: tags.blockComment,
                Integer: tags.integer,
                Float: tags.float,
                String: tags.string,
                ShellExpression: /*@__PURE__*/tags.special(tags.string),
                "=> ->": tags.punctuation,
                "( )": tags.paren,
                "#[ [ ]": tags.squareBracket,
                "${ { }": tags.brace,
                "-> ?->": tags.derefOperator,
                ", ; :: : \\": tags.separator,
                "PhpOpen PhpClose": tags.processingInstruction,
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
        let htmlSupport = html({ matchClosingTags: false });
        support.push(htmlSupport.support);
        base = htmlSupport.language;
    }
    return new LanguageSupport(phpLanguage.configure({
        wrap: base && parseMixed(node => {
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

export { php, phpLanguage };
