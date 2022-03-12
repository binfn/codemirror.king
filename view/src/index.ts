export { EditorView } from "./editorview.ts";
export type { DOMEventMap,DOMEventHandlers } from "./editorview.ts";
export { ViewPlugin,PluginFieldProvider,PluginField,ViewUpdate,logException } from "./extension.ts";
export type { Command,PluginValue,PluginSpec } from "./extension.ts";
export { Decoration,WidgetType,BlockType } from "./decoration.ts";
export type { DecorationSet } from "./decoration.ts";
export {BlockInfo} from "./heightmap.ts"
export type {MouseSelectionStyle} from "./input.ts"
export {BidiSpan, Direction} from "./bidi.ts"
export { keymap,runScopeHandlers } from "./keymap.ts";
export type { KeyBinding } from "./keymap.ts";
export {drawSelection} from "./draw-selection.ts"
export {dropCursor} from "./dropcursor.ts"
export {highlightSpecialChars} from "./special-chars.ts"
export {scrollPastEnd} from "./scrollpastend.ts"
export {highlightActiveLine} from "./active-line.ts"
export {placeholder} from "./placeholder.ts"
export type {Rect} from "./dom.ts"
export {MatchDecorator} from "./matchdecorator.ts"
export {Range} from "../../rangeset/src/rangeset.ts"

import {HeightMap, HeightOracle, MeasuredHeights, QueryType} from "./heightmap.ts"
import {ChangedRange} from "./extension.ts"
import {computeOrder, moveVisually} from "./bidi.ts"
/// @internal
export const __test = {HeightMap, HeightOracle, MeasuredHeights, QueryType, ChangedRange, computeOrder, moveVisually}
