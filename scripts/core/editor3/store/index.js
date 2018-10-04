import {EditorState, convertFromRaw, convertToRaw, ContentState} from 'draft-js';
import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import {pick} from 'lodash';

import {toHTML} from 'core/editor3/html';
import ng from 'core/services/ng';

import {Editor3} from '../components/Editor3';
import {PopupTypes, forceUpdate, setAbbreviations} from '../actions';
import {fieldsMetaKeys, setFieldMetadata, getFieldMetadata, FIELD_KEY_SEPARATOR} from '../helpers/fieldsMeta';
import {getContentStateFromHtml} from '../html/from-html';
import {getAnnotationsFromItem} from '../helpers/editor3CustomData';
import {
    initializeHighlights,
    prepareHighlightsForExport,
} from '../helpers/highlights';
import {removeInlineStyles} from '../helpers/removeFormat';
import reducers from '../reducers';

export const ignoreInternalAnnotationFields = (annotations) =>
    annotations.map(
        (annotation) => pick(annotation, ['id', 'type', 'body'])
    );

export const isEditorPlainText = (props) => props.singleLine || (props.editorFormat || []).length === 0;

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
    const showToolbar = !isEditorPlainText(props);

    const onChangeValue = isReact ? props.onChange : _.debounce(onChange.bind(props), props.debounce);

    const store = createStore(reducers, {
        editorState: EditorState.createWithContent(content, decorators),
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
        svc: props.svc,
        abbreviations: {},
    }, applyMiddleware(thunk));


    // after we have the dictionary, force update the editor to highlight typos
    dict.finally(() => store.dispatch(forceUpdate()));

    spellcheck.getAbbreviationsDict().then((abbreviations) => {
        store.dispatch(setAbbreviations(abbreviations || {}));
    });

    return store;
}

/**
 * Generate item annotations field
 *
 * @param {Object} item
 */
function generateAnnotations(item, logger) {
    item.annotations = ignoreInternalAnnotationFields(
        getAnnotationsFromItem(item, 'body_html', logger)
    );
}

/**
 * @name onChange
 * @params {ContentState} contentState New editor content state.
 * @params {Boolean} plainText If this is true, the editor content will be text instead of html
 * @description Triggered whenever the state of the editor changes. It takes the
 * current content states and updates the values of the host controller. This function
 * is bound to the controller, so 'this' points to controller attributes.
 */
export function onChange(contentState, {plainText = false} = {}) {
    const pathToValue = this.pathToValue;

    if (pathToValue == null || pathToValue.length < 1) {
        throw new Error('pathToValue is required');
    }

    const decorativeStyles = ['HIGHLIGHT', 'HIGHLIGHT_STRONG'];
    const contentStateCleaned = removeInlineStyles(contentState, decorativeStyles);
    const contentStateHighlightsReadyForExport = prepareHighlightsForExport(
        EditorState.createWithContent(contentStateCleaned)
    ).getCurrentContent();


    setFieldMetadata(
        this.item,
        pathToValue,
        fieldsMetaKeys.draftjsState,
        convertToRaw(contentStateHighlightsReadyForExport)
    );

    // example: "extra.customField"
    const pathToValueArray = pathToValue.split(FIELD_KEY_SEPARATOR);

    let objectToUpdate = pathToValueArray.length < 2 ?
        this.item :
        pathToValueArray.slice(0, -1).reduce((obj, pathSegment) => {
            const nextObj = obj[pathSegment];

            return nextObj;
        }, this.item);

    const fieldName = pathToValueArray[pathToValueArray.length - 1];
    const logger = ng.get('logger');

    if (plainText) {
        objectToUpdate[fieldName] = contentStateHighlightsReadyForExport.getPlainText();
    } else {
        objectToUpdate[fieldName] = toHTML(contentStateHighlightsReadyForExport, logger);
        generateAnnotations(this.item, logger);
    }

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
export function getInitialContent(props) {
    // support standalone instance of editor3 which is not connected to item field
    if (props.editorState != null) {
        var contentState = convertFromRaw(
            (props.editorState instanceof Array) ? props.editorState[0] : props.editorState
        );

        return initializeHighlights(EditorState.createWithContent(contentState)).getCurrentContent();
    }

    const draftjsRawState = getFieldMetadata(
        props.item,
        props.pathToValue,
        fieldsMetaKeys.draftjsState
    );

    if (draftjsRawState != null) {
        let contentState = convertFromRaw(draftjsRawState);

        return initializeHighlights(EditorState.createWithContent(contentState)).getCurrentContent();
    }

    if (props.value) {
        // we have only HTML (possibly legacy editor2 or ingested item)
        return getContentStateFromHtml(props.value, props.item.associations);
    }

    return ContentState.createFromText('');
}
