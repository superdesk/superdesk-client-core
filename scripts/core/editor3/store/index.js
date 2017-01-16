import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import {stateFromHTML} from 'draft-js-import-html';
import reducers from '../reducers';
import ng from 'core/services/ng';

import {SpellcheckerErrorComponent} from '../components/spellchecker';
import Toolbar from '../components/toolbar';
import {EditorState, CompositeDecorator} from 'draft-js';

export default function createEditorStore(ctrl) {
    const spellcheck = ng.get('spellcheck');

    spellcheck.setLanguage(ctrl.language);
    spellcheck.getDict();

    const singleLine = !!(!ctrl.editorFormat || ctrl.readOnly);
    const showToolbar = !singleLine;

    const onChange = (text) => {
        ctrl.value = ctrl.trim ? text.trim() : text;
        ctrl.onChange();
    };

    const initialValue = stateFromHTML(ctrl.value);
    const decorators = new CompositeDecorator(
        SpellcheckerErrorComponent.getDecorators().concat(Toolbar.getDecorators())
    );

    return createStore(reducers, {
        editorState: EditorState.createWithContent(initialValue, decorators),
        spellcheckerMenu: {visible: false, word: {}, suggetions: [], position: {}},
        readOnly: ctrl.readOnly,
        showToolbar: showToolbar,
        singleLine: singleLine,
        editorFormat: ctrl.editorFormat,
        onChangeValue: onChange
    }, applyMiddleware(thunk));
}
