declare const $ : any; // jquery
declare const gettext: any;
declare const KV: any; // qumu widgets

// angular
declare const angular: any;
declare const inject: any;

// testing
declare const jasmine: any;
declare const spyOn: any;
declare const describe: any;
declare const beforeEach: any;
declare const expect: any;
declare const it: any;

// draft-js types
// https://github.com/DefinitelyTyped/DefinitelyTyped/pull/28620
declare type EditorChangeType =
  | 'adjust-depth'
  | 'apply-entity'
  | 'backspace-character'
  | 'change-block-data'
  | 'change-block-type'
  | 'change-inline-style'
  | 'delete-character'
  | 'insert-characters'
  | 'insert-fragment'
  | 'redo'
  | 'remove-range'
  | 'spellcheck-change'
  | 'split-block'
  | 'undo';
