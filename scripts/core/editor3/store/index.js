import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import {stateFromHTML} from 'draft-js-import-html';
import reducers from '../reducers';
import ng from 'core/services/ng';
import {forceUpdate} from '../actions';
import {Editor3} from '../components/Editor3';
import {EditorState} from 'draft-js';

export default function createEditorStore(ctrl) {
    const spellcheck = ng.get('spellcheck');

    spellcheck.setLanguage(ctrl.language);
    const dict = spellcheck.getDict();

    const singleLine = !!(!ctrl.editorFormat || ctrl.readOnly);
    const showToolbar = !singleLine;

    const onChange = (text) => {
        ctrl.value = ctrl.trim ? text.trim() : text;
        ctrl.onChange();
    };

    const initialValue = stateFromHTML(ctrl.value);
    const decorators = Editor3.getDecorator();

    const store = createStore(reducers, {
        editorState: EditorState.createWithContent(initialValue, decorators),
        readOnly: ctrl.readOnly,
        showToolbar: showToolbar,
        singleLine: singleLine,
        editorFormat: ctrl.editorFormat,
        onChangeValue: onChange
    }, applyMiddleware(thunk));


    dict.finally(() => store.dispatch(forceUpdate()));

    return store;
}
