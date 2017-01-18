import spellchecker from './spellchecker';
import editor3 from './editor3';
import toolbar from './toolbar';

// Returns a new reducer which chains the state and action throught the given
// list of reducers.
const chainReduce = (...reducers) => (state = {}, action) => {
    let newState = {...state};

    reducers.forEach((r) => {
        newState = r(newState, action);
    });

    return newState;
};

const editorReducers = chainReduce(
    spellchecker,
    toolbar,
    editor3
);

export default editorReducers;
