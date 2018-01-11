/**
 * @module highlights
 * @description The highlights module contains helpers that allow altering editor and
 * content states by adding, removing, changing and re-calculating the offsets of
 * inline highlights.
 */
export {repositionHighlights} from './offsets';
export {redrawHighlights, removeInlineStyles, applyInlineStyles} from './styles';
export {getHighlights, addHighlight, updateHighlight, removeHighlight, replaceHighlights} from './store';
export {updateHighlights} from './highlights';

// To add new highlight types, simply list them here. They must map one-to-one
// to their styles in core/editor3/components/customStylesMap.jsx.
// They must be in pairs and they must use the same naming pattern, for example:
// NAME and NAME_SELECTED
export const highlightTypes = [
    'COMMENT',
    'COMMENT_SELECTED',
    'ANNOTATION',
    'ANNOTATION_SELECTED'
];
