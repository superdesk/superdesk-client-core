import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import reducers from '../reducers';
import ng from 'core/services/ng';
import {forceUpdate} from '../actions';
import {Editor3} from '../components/Editor3';
import {EditorState, convertFromRaw, convertToRaw, ContentState} from 'draft-js';
import {clearHighlights} from '../reducers/find-replace';
import {toHTML, fromHTML} from 'core/editor3/html';

/**
 * @name createEditorStore
 * @description Returns a new redux store.
 * @returns {Object} Redux store.
 */
export default function createEditorStore(ctrl) {
    const spellcheck = ng.get('spellcheck');

    spellcheck.setLanguage(ctrl.language);

    const dict = spellcheck.getDict();
    const content = getInitialContent(ctrl);
    const decorators = Editor3.getDecorator();

    const store = createStore(reducers, {
        editorState: EditorState.createWithContent(content, decorators),
        searchTerm: {pattern: '', index: -1, caseSensitive: false},
        readOnly: ctrl.readOnly,
        showToolbar: !ctrl.singleLine,
        singleLine: ctrl.singleLine,
        activeCell: null,
        editorFormat: ctrl.editorFormat || [],
        onChangeValue: onChange.bind(ctrl)
    }, applyMiddleware(thunk));


    // after we have the dictionary, force update the editor to highlight typos
    dict.finally(() => store.dispatch(forceUpdate()));

    return store;
}

/**
 * @name onChange
 * @params {ContentState} content New editor content state.
 * @description Triggered whenever the state of the editor changes. It takes the
 * current content states and updates the values of the host controller. This function
 * is bound to the controller, so 'this' points to controller attributes.
 */
function onChange(content) {
    // clear find & replace highlights
    const cleanedContent = clearHighlights(content).content;
    const newValue = toHTML(cleanedContent);

    this.value = this.value || '<p><br></p>';
    if (newValue.localeCompare(this.value) === 0) {
        this.value = newValue;
        return;
    }

    this.editorState = convertToRaw(cleanedContent);
    this.value = newValue;
    this.onChange();
}

/**
 * @name getInitialContent
 * @param {Object} ctrl Controller hosting the editor
 * @returns {ContentState} DraftJS ContentState object.
 * @description Gets the initial content state of the editor based on available information.
 * If an editor state is available as saved in the DB, we use that, otherwise we attempt to
 * use available HTML. If none are available, an empty ContentState is created.
 */
function getInitialContent(ctrl) {
    // we have an editor state stored in the DB
    if (typeof ctrl.editorState === 'object') {
        return convertFromRaw(ctrl.editorState);
    }

    // we have only HTML (possibly legacy editor2 or ingested item)
    if (ctrl.value) {
        return fromHTML(ctrl.value);
    }

    return ContentState.createFromText('');
}
