import spellchecker from './spellchecker';
import editor3 from './editor3';
import toolbar from './toolbar';

// Returns a new reducer which chains the state and action throught the given
// list of reducers.
const chainReduce = (...reducers) =>
    (startState = {}, action) =>
        reducers.reduce((newState, r) => r(newState, action), startState);

const editorReducers = chainReduce(
    spellchecker,
    toolbar,
    editor3
);

export default editorReducers;
