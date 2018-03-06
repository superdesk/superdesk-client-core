import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import reducers from '../reducers';
import ng from 'core/services/ng';
import {forceUpdate} from '../actions';
import {Editor3} from '../components/Editor3';
import {EditorState, convertFromRaw, convertToRaw, ContentState} from 'draft-js';
import {toHTML, fromHTML} from 'core/editor3/html';
import {PopupTypes} from '../actions';
import {editor3DataKeys, getCustomDataFromEditor, setCustomDataForEditor} from '../helpers/editor3CustomData';
import {highlightsConfig} from '../highlightsConfig';

// depended upon by find-and-replace.
import {removeInlineStyles} from '../reducers/highlights';

function addCommentsForServer(contentState) {
    const editorState = EditorState.createWithContent(contentState);

    const multipleHighlights = getCustomDataFromEditor(editorState, editor3DataKeys.MULTIPLE_HIGHLIGHTS);
    const highlightsData = multipleHighlights === undefined ? {} : multipleHighlights['highlightsData'];
    const comments = Object.keys(highlightsData)
        .filter((key) => key.indexOf(highlightsConfig.COMMENT.type) === 0)
        .map((key) => highlightsData[key]);

    return setCustomDataForEditor(editorState, editor3DataKeys.__PUBLIC_API__comments, comments).getCurrentContent();
}

/**
 * @name createEditorStore
 * @description Returns a new redux store.
 * @param {Object} props The properties of the editor (for Angular, the controller instance).
 * @param {Boolean=} isReact True if the store is created for a React component.
 * @returns {Object} Redux store.
 */
export default function createEditorStore(props, isReact = false) {
    const spellcheck = ng.get('spellcheck');

    if (!props.disableSpellchecker) {
        spellcheck.setLanguage(props.language);
    }

    const dict = spellcheck.getDict();
    const content = getInitialContent(props);

    const decorators = Editor3.getDecorator(props.disableSpellchecker || !spellcheck.isAutoSpellchecker);
    const showToolbar = !props.singleLine && (props.editorFormat || []).length > 0;
    const onChangeValue = isReact ? props.onChange : _.debounce(onChange.bind(props), props.debounce);

    const store = createStore(reducers, {
        editorState: EditorState.createWithContent(content, decorators),
        allowsHighlights: props.highlights,
        searchTerm: {pattern: '', index: -1, caseSensitive: false},
        popup: {type: PopupTypes.Hidden},
        readOnly: props.readOnly,
        locked: false, // when true, main editor is disabled (ie. when editing sub-components like tables or images)
        showToolbar: showToolbar,
        singleLine: props.singleLine,
        tabindex: props.tabindex,
        showTitle: props.showTitle,
        activeCell: null, // currently focused table cell
        editorFormat: props.editorFormat || [],
        onChangeValue: onChangeValue,
        item: props.item,
        spellcheckerEnabled: !props.disableSpellchecker,
        suggestingMode: false,
        invisibles: false,
        svc: props.svc
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
    const decorativeStyles = ['HIGHLIGHT', 'HIGHLIGHT_STRONG'];
    const cleanedContent = removeInlineStyles(content, decorativeStyles);

    const contentWithCommentsAdded = addCommentsForServer(cleanedContent);

    // sync controller to scope
    this.$scope.$apply(() => {
        // to avoid merge of dictionaries in backend, editorState is wrapped in a list
        this.editorState = [convertToRaw(contentWithCommentsAdded)];
        this.value = toHTML(contentWithCommentsAdded);
    });

    // call on change with scope updated
    this.$rootScope.$applyAsync(() => {
        this.onChange();
    });
}

/**
 * @name getInitialContent
 * @param {Object} props Controller hosting the editor
 * @returns {ContentState} DraftJS ContentState object.
 * @description Gets the initial content state of the editor based on available information.
 * If an editor state is available as saved in the DB, we use that, otherwise we attempt to
 * use available HTML. If none are available, an empty ContentState is created.
 */
function getInitialContent(props) {
    // we have an editor state stored in the DB
    if (props.editorState) {
        // suport for both regular and list wrapper versions of editor state
        var editorState = (props.editorState instanceof Array) ? props.editorState[0] : props.editorState;

        return convertFromRaw(editorState);
    }

    // we have only HTML (possibly legacy editor2 or ingested item)
    if (props.value) {
        return fromHTML(props.value);
    }

    return ContentState.createFromText('');
}
