import spellchecker from './spellchecker';
import editor3 from './editor3';
import toolbar from './toolbar';
import table from './table';
import suggestions from './suggestions';
import findReplace from './find-replace';

// Returns a new reducer which chains the state and action throught the given
// list of reducers.
const chainReduce = (...reducers) =>
    (startState = {}, action) =>
        reducers.reduce((newState, r) => r(newState, action), startState);

const editorReducers = chainReduce(
    spellchecker,
    toolbar,
    table,
    editor3,
    findReplace,
    suggestions
);

export default editorReducers;
