export { EditorState } from "./state.ts";
export type { EditorStateConfig } from "./state.ts";
export type {StateCommand} from "./extension.ts"
export { Facet,StateField,Prec,Compartment } from "./facet.ts";
export type { Extension } from "./facet.ts";
export {EditorSelection, SelectionRange} from "./selection.ts"
export { Transaction,Annotation,AnnotationType,StateEffect,StateEffectType } from "./transaction.ts";
export type { TransactionSpec } from "./transaction.ts";
export {Text} from "../../text/src/index.ts"
export {combineConfig} from "./config.ts"
export { ChangeSet,ChangeDesc,MapMode } from "./change.ts";
export type { ChangeSpec } from "./change.ts";
export {CharCategory} from "./charcategory.ts"
