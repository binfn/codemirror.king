import { NodeProp, NodeType, Parser, Tree, TreeFragment, Input, PartialParse, SyntaxNode } from '@lezer/common';
import { LRParser, ParserConfig } from '@lezer/lr';
import { Facet, Extension, EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

/**
Node prop stored in a grammar's top syntax node to provide the
facet that stores language data for that language.
*/
declare const languageDataProp: NodeProp<Facet<{
    [name: string]: any;
}, readonly {
    [name: string]: any;
}[]>>;
/**
Helper function to define a facet (to be added to the top syntax
node(s) for a language via
[`languageDataProp`](https://codemirror.net/6/docs/ref/#language.languageDataProp)), that will be
used to associate language data with the language. You
probably only need this when subclassing
[`Language`](https://codemirror.net/6/docs/ref/#language.Language).
*/
declare function defineLanguageFacet(baseData?: {
    [name: string]: any;
}): Facet<{
    [name: string]: any;
}, readonly {
    [name: string]: any;
}[]>;
/**
A language object manages parsing and per-language
[metadata](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt). Parse data is
managed as a [Lezer](https://lezer.codemirror.net) tree. You'll
want to subclass this class for custom parsers, or use the
[`LRLanguage`](https://codemirror.net/6/docs/ref/#language.LRLanguage) or
[`StreamLanguage`](https://codemirror.net/6/docs/ref/#stream-parser.StreamLanguage) abstractions for
[Lezer](https://lezer.codemirror.net/) or stream parsers.
*/
declare class Language {
    /**
    The [language data](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt) data
    facet used for this language.
    */
    readonly data: Facet<{
        [name: string]: any;
    }>;
    /**
    The node type of the top node of trees produced by this parser.
    */
    readonly topNode: NodeType;
    /**
    The extension value to install this provider.
    */
    readonly extension: Extension;
    /**
    The parser object. Can be useful when using this as a [nested
    parser](https://lezer.codemirror.net/docs/ref#common.Parser).
    */
    parser: Parser;
    /**
    Construct a language object. You usually don't need to invoke
    this directly. But when you do, make sure you use
    [`defineLanguageFacet`](https://codemirror.net/6/docs/ref/#language.defineLanguageFacet) to create
    the first argument.
    */
    constructor(
    /**
    The [language data](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt) data
    facet used for this language.
    */
    data: Facet<{
        [name: string]: any;
    }>, parser: Parser, 
    /**
    The node type of the top node of trees produced by this parser.
    */
    topNode: NodeType, extraExtensions?: Extension[]);
    /**
    Query whether this language is active at the given position.
    */
    isActiveAt(state: EditorState, pos: number, side?: -1 | 0 | 1): boolean;
    /**
    Find the document regions that were parsed using this language.
    The returned regions will _include_ any nested languages rooted
    in this language, when those exist.
    */
    findRegions(state: EditorState): {
        from: number;
        to: number;
    }[];
    /**
    Indicates whether this language allows nested languages. The
    default implementation returns true.
    */
    get allowsNesting(): boolean;
}
/**
A subclass of [`Language`](https://codemirror.net/6/docs/ref/#language.Language) for use with Lezer
[LR parsers](https://lezer.codemirror.net/docs/ref#lr.LRParser)
parsers.
*/
declare class LRLanguage extends Language {
    readonly parser: LRParser;
    private constructor();
    /**
    Define a language from a parser.
    */
    static define(spec: {
        /**
        The parser to use. Should already have added editor-relevant
        node props (and optionally things like dialect and top rule)
        configured.
        */
        parser: LRParser;
        /**
        [Language data](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt)
        to register for this language.
        */
        languageData?: {
            [name: string]: any;
        };
    }): LRLanguage;
    /**
    Create a new instance of this language with a reconfigured
    version of its parser.
    */
    configure(options: ParserConfig): LRLanguage;
    get allowsNesting(): boolean;
}
/**
Get the syntax tree for a state, which is the current (possibly
incomplete) parse tree of active [language](https://codemirror.net/6/docs/ref/#language.Language),
or the empty tree if there is no language available.
*/
declare function syntaxTree(state: EditorState): Tree;
/**
Try to get a parse tree that spans at least up to `upto`. The
method will do at most `timeout` milliseconds of work to parse
up to that point if the tree isn't already available.
*/
declare function ensureSyntaxTree(state: EditorState, upto: number, timeout?: number): Tree | null;
/**
Queries whether there is a full syntax tree available up to the
given document position. If there isn't, the background parse
process _might_ still be working and update the tree further, but
there is no guarantee of that???the parser will [stop
working](https://codemirror.net/6/docs/ref/#language.syntaxParserStopped) when it has spent a
certain amount of time or has moved beyond the visible viewport.
Always returns false if no language has been enabled.
*/
declare function syntaxTreeAvailable(state: EditorState, upto?: number): boolean;
/**
Tells you whether the language parser is planning to do more
parsing work (in a `requestIdleCallback` pseudo-thread) or has
stopped running, either because it parsed the entire document,
because it spent too much time and was cut off, or because there
is no language parser enabled.
*/
declare function syntaxParserRunning(view: EditorView): boolean | (() => void);
/**
A parse context provided to parsers working on the editor content.
*/
declare class ParseContext {
    private parser;
    /**
    The current editor state.
    */
    readonly state: EditorState;
    /**
    Tree fragments that can be reused by incremental re-parses.
    */
    fragments: readonly TreeFragment[];
    treeLen: number;
    /**
    The current editor viewport (or some overapproximation
    thereof). Intended to be used for opportunistically avoiding
    work (in which case
    [`skipUntilInView`](https://codemirror.net/6/docs/ref/#language.ParseContext.skipUntilInView)
    should be called to make sure the parser is restarted when the
    skipped region becomes visible).
    */
    viewport: {
        from: number;
        to: number;
    };
    private parse;
    private startParse;
    private withContext;
    private withoutTempSkipped;
    /**
    Notify the parse scheduler that the given region was skipped
    because it wasn't in view, and the parse should be restarted
    when it comes into view.
    */
    skipUntilInView(from: number, to: number): void;
    /**
    Returns a parser intended to be used as placeholder when
    asynchronously loading a nested parser. It'll skip its input and
    mark it as not-really-parsed, so that the next update will parse
    it again.
    
    When `until` is given, a reparse will be scheduled when that
    promise resolves.
    */
    static getSkippingParser(until?: Promise<unknown>): {
        createParse(input: Input, fragments: readonly TreeFragment[], ranges: readonly {
            from: number;
            to: number;
        }[]): PartialParse;
        startParse(input: string | Input, fragments?: readonly TreeFragment[] | undefined, ranges?: readonly {
            from: number;
            to: number;
        }[] | undefined): PartialParse;
        parse(input: string | Input, fragments?: readonly TreeFragment[] | undefined, ranges?: readonly {
            from: number;
            to: number;
        }[] | undefined): Tree;
    };
    /**
    Get the context for the current parse, or `null` if no editor
    parse is in progress.
    */
    static get(): ParseContext | null;
}
/**
The facet used to associate a language with an editor state.
*/
declare const language: Facet<Language, Language | null>;
/**
This class bundles a [language object](https://codemirror.net/6/docs/ref/#language.Language) with an
optional set of supporting extensions. Language packages are
encouraged to export a function that optionally takes a
configuration object and returns a `LanguageSupport` instance, as
the main way for client code to use the package.
*/
declare class LanguageSupport {
    /**
    The language object.
    */
    readonly language: Language;
    /**
    An optional set of supporting extensions. When nesting a
    language in another language, the outer language is encouraged
    to include the supporting extensions for its inner languages
    in its own set of support extensions.
    */
    readonly support: Extension;
    /**
    An extension including both the language and its support
    extensions. (Allowing the object to be used as an extension
    value itself.)
    */
    extension: Extension;
    /**
    Create a support object.
    */
    constructor(
    /**
    The language object.
    */
    language: Language, 
    /**
    An optional set of supporting extensions. When nesting a
    language in another language, the outer language is encouraged
    to include the supporting extensions for its inner languages
    in its own set of support extensions.
    */
    support?: Extension);
}
/**
Language descriptions are used to store metadata about languages
and to dynamically load them. Their main role is finding the
appropriate language for a filename or dynamically loading nested
parsers.
*/
declare class LanguageDescription {
    /**
    The name of this language.
    */
    readonly name: string;
    /**
    Alternative names for the mode (lowercased, includes `this.name`).
    */
    readonly alias: readonly string[];
    /**
    File extensions associated with this language.
    */
    readonly extensions: readonly string[];
    /**
    Optional filename pattern that should be associated with this
    language.
    */
    readonly filename: RegExp | undefined;
    private loadFunc;
    /**
    If the language has been loaded, this will hold its value.
    */
    support: LanguageSupport | undefined;
    private loading;
    private constructor();
    /**
    Start loading the the language. Will return a promise that
    resolves to a [`LanguageSupport`](https://codemirror.net/6/docs/ref/#language.LanguageSupport)
    object when the language successfully loads.
    */
    load(): Promise<LanguageSupport>;
    /**
    Create a language description.
    */
    static of(spec: {
        /**
        The language's name.
        */
        name: string;
        /**
        An optional array of alternative names.
        */
        alias?: readonly string[];
        /**
        An optional array of filename extensions associated with this
        language.
        */
        extensions?: readonly string[];
        /**
        An optional filename pattern associated with this language.
        */
        filename?: RegExp;
        /**
        A function that will asynchronously load the language.
        */
        load?: () => Promise<LanguageSupport>;
        /**
        Alternatively to `load`, you can provide an already loaded
        support object. Either this or `load` should be provided.
        */
        support?: LanguageSupport;
    }): LanguageDescription;
    /**
    Look for a language in the given array of descriptions that
    matches the filename. Will first match
    [`filename`](https://codemirror.net/6/docs/ref/#language.LanguageDescription.filename) patterns,
    and then [extensions](https://codemirror.net/6/docs/ref/#language.LanguageDescription.extensions),
    and return the first language that matches.
    */
    static matchFilename(descs: readonly LanguageDescription[], filename: string): LanguageDescription | null;
    /**
    Look for a language whose name or alias matches the the given
    name (case-insensitively). If `fuzzy` is true, and no direct
    matchs is found, this'll also search for a language whose name
    or alias occurs in the string (for names shorter than three
    characters, only when surrounded by non-word characters).
    */
    static matchLanguageName(descs: readonly LanguageDescription[], name: string, fuzzy?: boolean): LanguageDescription | null;
}

/**
Facet that defines a way to provide a function that computes the
appropriate indentation depth at the start of a given line, or
`null` to indicate no appropriate indentation could be determined.
*/
declare const indentService: Facet<(context: IndentContext, pos: number) => number | null, readonly ((context: IndentContext, pos: number) => number | null)[]>;
/**
Facet for overriding the unit by which indentation happens.
Should be a string consisting either entirely of spaces or
entirely of tabs. When not set, this defaults to 2 spaces.
*/
declare const indentUnit: Facet<string, string>;
/**
Return the _column width_ of an indent unit in the state.
Determined by the [`indentUnit`](https://codemirror.net/6/docs/ref/#language.indentUnit)
facet, and [`tabSize`](https://codemirror.net/6/docs/ref/#state.EditorState^tabSize) when that
contains tabs.
*/
declare function getIndentUnit(state: EditorState): number;
/**
Create an indentation string that covers columns 0 to `cols`.
Will use tabs for as much of the columns as possible when the
[`indentUnit`](https://codemirror.net/6/docs/ref/#language.indentUnit) facet contains
tabs.
*/
declare function indentString(state: EditorState, cols: number): string;
/**
Get the indentation at the given position. Will first consult any
[indent services](https://codemirror.net/6/docs/ref/#language.indentService) that are registered,
and if none of those return an indentation, this will check the
syntax tree for the [indent node prop](https://codemirror.net/6/docs/ref/#language.indentNodeProp)
and use that if found. Returns a number when an indentation could
be determined, and null otherwise.
*/
declare function getIndentation(context: IndentContext | EditorState, pos: number): number | null;
/**
Indentation contexts are used when calling [indentation
services](https://codemirror.net/6/docs/ref/#language.indentService). They provide helper utilities
useful in indentation logic, and can selectively override the
indentation reported for some lines.
*/
declare class IndentContext {
    /**
    The editor state.
    */
    readonly state: EditorState;
    /**
    The indent unit (number of columns per indentation level).
    */
    unit: number;
    /**
    Create an indent context.
    */
    constructor(
    /**
    The editor state.
    */
    state: EditorState, 
    /**
    @internal
    */
    options?: {
        /**
        Override line indentations provided to the indentation
        helper function, which is useful when implementing region
        indentation, where indentation for later lines needs to refer
        to previous lines, which may have been reindented compared to
        the original start state. If given, this function should
        return -1 for lines (given by start position) that didn't
        change, and an updated indentation otherwise.
        */
        overrideIndentation?: (pos: number) => number;
        /**
        Make it look, to the indent logic, like a line break was
        added at the given position (which is mostly just useful for
        implementing something like
        [`insertNewlineAndIndent`](https://codemirror.net/6/docs/ref/#commands.insertNewlineAndIndent)).
        */
        simulateBreak?: number;
        /**
        When `simulateBreak` is given, this can be used to make the
        simulate break behave like a double line break.
        */
        simulateDoubleBreak?: boolean;
    });
    /**
    Get a description of the line at the given position, taking
    [simulated line
    breaks](https://codemirror.net/6/docs/ref/#language.IndentContext.constructor^options.simulateBreak)
    into account. If there is such a break at `pos`, the `bias`
    argument determines whether the part of the line line before or
    after the break is used.
    */
    lineAt(pos: number, bias?: -1 | 1): {
        text: string;
        from: number;
    };
    /**
    Get the text directly after `pos`, either the entire line
    or the next 100 characters, whichever is shorter.
    */
    textAfterPos(pos: number, bias?: -1 | 1): string;
    /**
    Find the column for the given position.
    */
    column(pos: number, bias?: -1 | 1): number;
    /**
    Find the column position (taking tabs into account) of the given
    position in the given string.
    */
    countColumn(line: string, pos?: number): number;
    /**
    Find the indentation column of the line at the given point.
    */
    lineIndent(pos: number, bias?: -1 | 1): number;
    /**
    Returns the [simulated line
    break](https://codemirror.net/6/docs/ref/#language.IndentContext.constructor^options.simulateBreak)
    for this context, if any.
    */
    get simulatedBreak(): number | null;
}
/**
A syntax tree node prop used to associate indentation strategies
with node types. Such a strategy is a function from an indentation
context to a column number or null, where null indicates that no
definitive indentation can be determined.
*/
declare const indentNodeProp: NodeProp<(context: TreeIndentContext) => number | null>;
/**
Objects of this type provide context information and helper
methods to indentation functions.
*/
declare class TreeIndentContext extends IndentContext {
    private base;
    /**
    The position at which indentation is being computed.
    */
    readonly pos: number;
    /**
    The syntax tree node to which the indentation strategy
    applies.
    */
    readonly node: SyntaxNode;
    /**
    Get the text directly after `this.pos`, either the entire line
    or the next 100 characters, whichever is shorter.
    */
    get textAfter(): string;
    /**
    Get the indentation at the reference line for `this.node`, which
    is the line on which it starts, unless there is a node that is
    _not_ a parent of this node covering the start of that line. If
    so, the line at the start of that node is tried, again skipping
    on if it is covered by another such node.
    */
    get baseIndent(): number;
    /**
    Continue looking for indentations in the node's parent nodes,
    and return the result of that.
    */
    continue(): number | null;
}
/**
An indentation strategy for delimited (usually bracketed) nodes.
Will, by default, indent one unit more than the parent's base
indent unless the line starts with a closing token. When `align`
is true and there are non-skipped nodes on the node's opening
line, the content of the node will be aligned with the end of the
opening node, like this:

    foo(bar,
        baz)
*/
declare function delimitedIndent({ closing, align, units }: {
    closing: string;
    align?: boolean;
    units?: number;
}): (context: TreeIndentContext) => number;
/**
An indentation strategy that aligns a node's content to its base
indentation.
*/
declare const flatIndent: (context: TreeIndentContext) => number;
/**
Creates an indentation strategy that, by default, indents
continued lines one unit more than the node's base indentation.
You can provide `except` to prevent indentation of lines that
match a pattern (for example `/^else\b/` in `if`/`else`
constructs), and you can change the amount of units used with the
`units` option.
*/
declare function continuedIndent({ except, units }?: {
    except?: RegExp;
    units?: number;
}): (context: TreeIndentContext) => number;
/**
Enables reindentation on input. When a language defines an
`indentOnInput` field in its [language
data](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt), which must hold a regular
expression, the line at the cursor will be reindented whenever new
text is typed and the input from the start of the line up to the
cursor matches that regexp.

To avoid unneccesary reindents, it is recommended to start the
regexp with `^` (usually followed by `\s*`), and end it with `$`.
For example, `/^\s*\}$/` will reindent when a closing brace is
added at the start of a line.
*/
declare function indentOnInput(): Extension;

/**
A facet that registers a code folding service. When called with
the extent of a line, such a function should return a foldable
range that starts on that line (but continues beyond it), if one
can be found.
*/
declare const foldService: Facet<(state: EditorState, lineStart: number, lineEnd: number) => ({
    from: number;
    to: number;
} | null), readonly ((state: EditorState, lineStart: number, lineEnd: number) => ({
    from: number;
    to: number;
} | null))[]>;
/**
This node prop is used to associate folding information with
syntax node types. Given a syntax node, it should check whether
that tree is foldable and return the range that can be collapsed
when it is.
*/
declare const foldNodeProp: NodeProp<(node: SyntaxNode, state: EditorState) => ({
    from: number;
    to: number;
} | null)>;
/**
[Fold](https://codemirror.net/6/docs/ref/#language.foldNodeProp) function that folds everything but
the first and the last child of a syntax node. Useful for nodes
that start and end with delimiters.
*/
declare function foldInside(node: SyntaxNode): {
    from: number;
    to: number;
} | null;
/**
Check whether the given line is foldable. First asks any fold
services registered through
[`foldService`](https://codemirror.net/6/docs/ref/#language.foldService), and if none of them return
a result, tries to query the [fold node
prop](https://codemirror.net/6/docs/ref/#language.foldNodeProp) of syntax nodes that cover the end
of the line.
*/
declare function foldable(state: EditorState, lineStart: number, lineEnd: number): {
    from: number;
    to: number;
} | null;

export { IndentContext, LRLanguage, Language, LanguageDescription, LanguageSupport, ParseContext, TreeIndentContext, continuedIndent, defineLanguageFacet, delimitedIndent, ensureSyntaxTree, flatIndent, foldInside, foldNodeProp, foldService, foldable, getIndentUnit, getIndentation, indentNodeProp, indentOnInput, indentService, indentString, indentUnit, language, languageDataProp, syntaxParserRunning, syntaxTree, syntaxTreeAvailable };
