import { parser } from '@lezer/rust';
import { LRLanguage, indentNodeProp, continuedIndent, foldNodeProp, foldInside, LanguageSupport } from '@codemirror/language';
import { styleTags, tags } from '@codemirror/highlight';

/**
A syntax provider based on the [Lezer Rust
parser](https://github.com/lezer-parser/rust), extended with
highlighting and indentation information.
*/
const rustLanguage = /*@__PURE__*/LRLanguage.define({
    parser: /*@__PURE__*/parser.configure({
        props: [
            /*@__PURE__*/indentNodeProp.add({
                IfExpression: /*@__PURE__*/continuedIndent({ except: /^\s*({|else\b)/ }),
                "String BlockComment": () => -1,
                "Statement MatchArm": /*@__PURE__*/continuedIndent()
            }),
            /*@__PURE__*/foldNodeProp.add(type => {
                if (/(Block|edTokens|List)$/.test(type.name))
                    return foldInside;
                if (type.name == "BlockComment")
                    return tree => ({ from: tree.from + 2, to: tree.to - 2 });
                return undefined;
            }),
            /*@__PURE__*/styleTags({
                "const macro_rules struct union enum type fn impl trait let static": tags.definitionKeyword,
                "mod use crate": tags.moduleKeyword,
                "pub unsafe async mut extern default move": tags.modifier,
                "for if else loop while match continue break return await": tags.controlKeyword,
                "as in ref": tags.operatorKeyword,
                "where _ crate super dyn": tags.keyword,
                "self": tags.self,
                String: tags.string,
                RawString: /*@__PURE__*/tags.special(tags.string),
                Boolean: tags.bool,
                Identifier: tags.variableName,
                "CallExpression/Identifier": /*@__PURE__*/tags.function(tags.variableName),
                BoundIdentifier: /*@__PURE__*/tags.definition(tags.variableName),
                LoopLabel: tags.labelName,
                FieldIdentifier: tags.propertyName,
                "CallExpression/FieldExpression/FieldIdentifier": /*@__PURE__*/tags.function(tags.propertyName),
                Lifetime: /*@__PURE__*/tags.special(tags.variableName),
                ScopeIdentifier: tags.namespace,
                TypeIdentifier: tags.typeName,
                "MacroInvocation/Identifier MacroInvocation/ScopedIdentifier/Identifier": tags.macroName,
                "MacroInvocation/TypeIdentifier MacroInvocation/ScopedIdentifier/TypeIdentifier": tags.macroName,
                "\"!\"": tags.macroName,
                UpdateOp: tags.updateOperator,
                LineComment: tags.lineComment,
                BlockComment: tags.blockComment,
                Integer: tags.integer,
                Float: tags.float,
                ArithOp: tags.arithmeticOperator,
                LogicOp: tags.logicOperator,
                BitOp: tags.bitwiseOperator,
                CompareOp: tags.compareOperator,
                "=": tags.definitionOperator,
                ".. ... => ->": tags.punctuation,
                "( )": tags.paren,
                "[ ]": tags.squareBracket,
                "{ }": tags.brace,
                ".": tags.derefOperator,
                "&": tags.operator,
                ", ; ::": tags.separator,
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
    return new LanguageSupport(rustLanguage);
}

export { rust, rustLanguage };
