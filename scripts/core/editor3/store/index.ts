import {
    EditorState,
    convertFromRaw,
    convertToRaw,
    ContentState,
    RawDraftContentState,
    CompositeDecorator
} from 'draft-js';
import {createStore, applyMiddleware} from 'redux';
import {createLogger} from 'redux-logger';
import thunk from 'redux-thunk';
import {pick, get, debounce} from 'lodash';
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
import {editor3StateToHtml} from '../html/to-html/editor3StateToHtml';
import {LinkDecorator} from '../components/links';
import {getSpellcheckingDecorator, ISpellcheckWarningsByBlock} from '../components/spellchecker/SpellcheckerDecorator';
import {appConfig} from 'appConfig';

export const ignoreInternalAnnotationFields = (annotations) =>
    annotations.map(
        (annotation) => pick(annotation, ['id', 'type', 'body']),
    );

export const isEditorPlainText = (props) => props.singleLine || (props.editorFormat || []).length === 0;

interface IProps {
    editorState?: RawDraftContentState;
    language?: any;
    debounce?: any;
    onChange?: any;
    readOnly?: any;
    singleLine?: any;
    tabindex?: any;
    showTitle?: any;
    editorFormat?: any;
    item?: any;
    svc?: any;
    trim?: any;
    value?: any;
}

export interface IEditorStore {
    editorState: EditorState;
    searchTerm: {pattern: string, index: number, caseSensitive: boolean};
    popup: {type: any};
    readOnly: any;
    locked: boolean;
    showToolbar: any;
    singleLine: any;
    tabindex: any;
    showTitle: any;
    activeCell: any;
    editorFormat: any;
    onChangeValue: any;
    item: any;
    spellchecking: {
        language: string;
        enabled: boolean;
        inProgress: boolean;
        warningsByBlock: ISpellcheckWarningsByBlock;
    };
    suggestingMode: any;
    invisibles: any;
    svc: any;
    abbreviations: any;
    loading: boolean;
}

export const getCustomDecorator = (language?: string, spellcheckWarnings: ISpellcheckWarningsByBlock = null) => {
    const decorators: any = [
        LinkDecorator,
    ];

    if (spellcheckWarnings != null && language != null) {
        decorators.push(getSpellcheckingDecorator(language, spellcheckWarnings));
    }

    return new CompositeDecorator(decorators);
};

/**
 * @name createEditorStore
 * @description Returns a new redux store.
 * @param {Object} props The properties of the editor (for Angular, the controller instance).
 * @param {Boolean=} isReact True if the store is created for a React component.
 * @returns {Object} Redux store.
 */
export default function createEditorStore(props: IProps, spellcheck, isReact = false) {
    const spellcheckerDisabledInConfig = get(appConfig, 'features.useTansaProofing') === true;
    let disableSpellchecker = true;

    if (spellcheck != null) {
        disableSpellchecker = spellcheckerDisabledInConfig || !spellcheck.isAutoSpellchecker;

        if (!spellcheckerDisabledInConfig) {
            spellcheck.setLanguage(props.language);
        }
    }

    const content = getInitialContent(props);

    const showToolbar = !isEditorPlainText(props);

    const onChangeValue = isReact ? props.onChange : debounce(onChange.bind(props), props.debounce);

    const middlewares = [thunk];

    const devtools = localStorage.getItem('devtools');
    const reduxLoggerEnabled = devtools == null ? false : JSON.stringify(devtools).includes('redux-logger');

    if (reduxLoggerEnabled) {
        // (this should always be the last middleware)
        middlewares.push(createLogger());
    }

    const store = createStore<IEditorStore>(reducers, {
        editorState: EditorState.createWithContent(content),
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
        spellchecking: {
            language: props.language,
            enabled: !spellcheckerDisabledInConfig && spellcheck && spellcheck.isAutoSpellchecker,
            inProgress: false,
            warningsByBlock: {},
        },
        suggestingMode: false,
        invisibles: false,
        svc: props.svc,
        abbreviations: {},
        loading: false,
    }, applyMiddleware(...middlewares));

    if (spellcheck != null) {
        // after we have the dictionary, force update the editor to highlight typos
        spellcheck.getDict().finally(() => store.dispatch(forceUpdate()));

        spellcheck.getAbbreviationsDict().then((abbreviations) => {
            store.dispatch(setAbbreviations(abbreviations || {}));
        });
    }

    return store;
}

/**
 * Generate item annotations field
 *
 * @param {Object} item
 */
function generateAnnotations(item) {
    item.annotations = ignoreInternalAnnotationFields(
        getAnnotationsFromItem(item, 'body_html'),
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
        EditorState.createWithContent(contentStateCleaned),
    ).getCurrentContent();
    const rawState = convertToRaw(contentStateHighlightsReadyForExport);

    setFieldMetadata(
        this.item,
        pathToValue,
        fieldsMetaKeys.draftjsState,
        rawState,
    );

    if (pathToValue === 'body_html') {
        syncAssociations(this.item, rawState);
    }

    // example: "extra.customField"
    const pathToValueArray = pathToValue.split(FIELD_KEY_SEPARATOR);

    let objectToUpdate = pathToValueArray.length < 2 ?
        this.item :
        pathToValueArray.slice(0, -1).reduce((obj, pathSegment) => {
            if (obj[pathSegment] == null) {
                obj[pathSegment] = {};
            }

            return obj[pathSegment];
        }, this.item);

    const fieldName = pathToValueArray[pathToValueArray.length - 1];

    if (plainText) {
        objectToUpdate[fieldName] = contentStateHighlightsReadyForExport.getPlainText();
    } else {
        objectToUpdate[fieldName] = editor3StateToHtml(contentStateHighlightsReadyForExport);
        generateAnnotations(this.item);
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
            (props.editorState instanceof Array) ? props.editorState[0] : props.editorState,
        );

        return initializeHighlights(EditorState.createWithContent(contentState)).getCurrentContent();
    }

    const draftjsRawState = getFieldMetadata(
        props.item,
        props.pathToValue,
        fieldsMetaKeys.draftjsState,
    );

    if (draftjsRawState != null) {
        let initialContent = convertFromRaw(draftjsRawState);

        return initializeHighlights(EditorState.createWithContent(initialContent)).getCurrentContent();
    }

    if (props.value) {
        // we have only HTML (possibly legacy editor2 or ingested item)
        return getContentStateFromHtml(props.value, props.item.associations);
    }

    return ContentState.createFromText('');
}

/**
 * Sync editor embeds in item.associations
 *
 * @param {Object} item
 * @param {RawDraftContentState} rawState
 */
function syncAssociations(item, rawState) {
    const associations = Object.assign({}, item.associations);

    Object.keys(associations).forEach((key) => {
        if (key.startsWith('editor_')) {
            associations[key] = null;
        }
    });

    Object.keys(rawState.entityMap).forEach((key) => {
        associations['editor_' + key] = get(rawState.entityMap[key], 'data.media');
    });

    item.associations = associations;
}
