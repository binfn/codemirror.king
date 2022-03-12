import {keymap, highlightSpecialChars, drawSelection, highlightActiveLine, dropCursor} from "../../view/src/index.ts"
import {Extension, EditorState} from "../../state/src/index.ts"
import {history, historyKeymap} from "../../history/src/history.ts"
import {foldGutter, foldKeymap} from "../../fold/src/fold.ts"
import {indentOnInput} from "../../language/src/index.ts"
import {lineNumbers, highlightActiveLineGutter} from "../../gutter/src/index.ts"
import {defaultKeymap} from "../../commands/src/commands.ts"
import {bracketMatching} from "../../matchbrackets/src/matchbrackets.ts"
import {closeBrackets, closeBracketsKeymap} from "../../closebrackets/src/closebrackets.ts"
import {searchKeymap, highlightSelectionMatches} from "../../search/src/search.ts"
import {autocompletion, completionKeymap} from "../../autocomplete/src/index.ts"
import {commentKeymap} from "../../comment/src/comment.ts"
import {rectangularSelection} from "../../rectangular-selection/src/rectangular-selection.ts"
import {defaultHighlightStyle} from "../../highlight/src/highlight.ts"
import {lintKeymap} from "../../lint/src/lint.ts"

/// This is an extension value that just pulls together a whole lot of
/// extensions that you might want in a basic editor. It is meant as a
/// convenient helper to quickly set up CodeMirror without installing
/// and importing a lot of packages.
///
/// Specifically, it includes...
///
///  - [the default command bindings](#commands.defaultKeymap)
///  - [line numbers](#gutter.lineNumbers)
///  - [special character highlighting](#view.highlightSpecialChars)
///  - [the undo history](#history.history)
///  - [a fold gutter](#fold.foldGutter)
///  - [custom selection drawing](#view.drawSelection)
///  - [drop cursor](#view.dropCursor)
///  - [multiple selections](#state.EditorState^allowMultipleSelections)
///  - [reindentation on input](#language.indentOnInput)
///  - [the default highlight style](#highlight.defaultHighlightStyle) (as fallback)
///  - [bracket matching](#matchbrackets.bracketMatching)
///  - [bracket closing](#closebrackets.closeBrackets)
///  - [autocompletion](#autocomplete.autocompletion)
///  - [rectangular selection](#rectangular-selection.rectangularSelection)
///  - [active line highlighting](#view.highlightActiveLine)
///  - [active line gutter highlighting](#gutter.highlightActiveLineGutter)
///  - [selection match highlighting](#search.highlightSelectionMatches)
///  - [search](#search.searchKeymap)
///  - [commenting](#comment.commentKeymap)
///  - [linting](#lint.lintKeymap)
///
/// (You'll probably want to add some language package to your setup
/// too.)
///
/// This package does not allow customization. The idea is that, once
/// you decide you want to configure your editor more precisely, you
/// take this package's source (which is just a bunch of imports and
/// an array literal), copy it into your own code, and adjust it as
/// desired.
export const basicSetup: Extension = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  defaultHighlightStyle.fallback,
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...commentKeymap,
    ...completionKeymap,
    ...lintKeymap
  ])
]

export {EditorView} from "../../view/src/index.ts"
export {EditorState} from "../../state/src/index.ts"
