import spellchecker from './spellchecker';
import editor3 from './editor3';

// custom combine of reducers because the data is needed in all reucers
const editorReducers = (state, action) => {
    var newState = spellchecker(state, action);

    return editor3(newState, action);
};

export default editorReducers;