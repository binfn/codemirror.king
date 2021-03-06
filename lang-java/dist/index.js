import { parser } from '@lezer/java';
import { LRLanguage, indentNodeProp, continuedIndent, flatIndent, foldNodeProp, foldInside, LanguageSupport } from '@codemirror/language';
import { styleTags, tags } from '@codemirror/highlight';

/**
A language provider based on the [Lezer Java
parser](https://github.com/lezer-parser/java), extended with
highlighting and indentation information.
*/
const javaLanguage = /*@__PURE__*/LRLanguage.define({
    parser: /*@__PURE__*/parser.configure({
        props: [
            /*@__PURE__*/indentNodeProp.add({
                IfStatement: /*@__PURE__*/continuedIndent({ except: /^\s*({|else\b)/ }),
                TryStatement: /*@__PURE__*/continuedIndent({ except: /^\s*({|catch|finally)\b/ }),
                LabeledStatement: flatIndent,
                SwitchBlock: context => {
                    let after = context.textAfter, closed = /^\s*\}/.test(after), isCase = /^\s*(case|default)\b/.test(after);
                    return context.baseIndent + (closed ? 0 : isCase ? 1 : 2) * context.unit;
                },
                BlockComment: () => -1,
                Statement: /*@__PURE__*/continuedIndent({ except: /^{/ })
            }),
            /*@__PURE__*/foldNodeProp.add({
                ["Block SwitchBlock ClassBody ElementValueArrayInitializer ModuleBody EnumBody " +
                    "ConstructorBody InterfaceBody ArrayInitializer"]: foldInside,
                BlockComment(tree) { return { from: tree.from + 2, to: tree.to - 2 }; }
            }),
            /*@__PURE__*/styleTags({
                null: tags.null,
                instanceof: tags.operatorKeyword,
                this: tags.self,
                "new super assert open to with void": tags.keyword,
                "class interface extends implements enum": tags.definitionKeyword,
                "module package import": tags.moduleKeyword,
                "switch while for if else case default do break continue return try catch finally throw": tags.controlKeyword,
                ["requires exports opens uses provides public private protected static transitive abstract final " +
                    "strictfp synchronized native transient volatile throws"]: tags.modifier,
                IntegerLiteral: tags.integer,
                FloatLiteral: tags.float,
                "StringLiteral TextBlock": tags.string,
                CharacterLiteral: tags.character,
                LineComment: tags.lineComment,
                BlockComment: tags.blockComment,
                BooleanLiteral: tags.bool,
                PrimitiveType: /*@__PURE__*/tags.standard(tags.typeName),
                TypeName: tags.typeName,
                Identifier: tags.variableName,
                "MethodName/Identifier": /*@__PURE__*/tags.function(tags.variableName),
                Definition: /*@__PURE__*/tags.definition(tags.variableName),
                ArithOp: tags.arithmeticOperator,
                LogicOp: tags.logicOperator,
                BitOp: tags.bitwiseOperator,
                CompareOp: tags.compareOperator,
                AssignOp: tags.definitionOperator,
                UpdateOp: tags.updateOperator,
                Asterisk: tags.punctuation,
                Label: tags.labelName,
                "( )": tags.paren,
                "[ ]": tags.squareBracket,
                "{ }": tags.brace,
                ".": tags.derefOperator,
                ", ;": tags.separator
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
    return new LanguageSupport(javaLanguage);
}

export { java, javaLanguage };
