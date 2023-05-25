/* eslint-disable complexity */
import {
    EditorState,
    convertFromRaw,
    convertToRaw,
    ContentState,
    RawDraftContentState,
    CompositeDecorator,
} from 'draft-js';
import {createStore, Store} from 'redux';
import {pick, get, debounce} from 'lodash';
import {
    PopupTypes,
    setAbbreviations,
    EditorLimit,
} from '../actions';
import {
    fieldsMetaKeys,
    setFieldMetadata,
    getFieldMetadata,
    FIELD_KEY_SEPARATOR,
} from '../helpers/fieldsMeta';
import {getContentStateFromHtml} from '../html/from-html';
import {getAnnotationsFromContentState, getAnnotationsFromItem} from '../helpers/editor3CustomData';
import {
    initializeHighlights,
    prepareHighlightsForExport,
} from '../helpers/highlights';
import {removeInlineStyles} from '../helpers/removeFormat';
import reducers from '../reducers';
import {editor3StateToHtml} from '../html/to-html/editor3StateToHtml';
import {LinkDecorator} from '../components/links/LinkDecorator';
import {
    getSpellcheckingDecorator,
    ISpellcheckWarningsByBlock,
} from '../components/spellchecker/SpellcheckerDecorator';
import {appConfig} from 'appConfig';
import {
    formattingOptionsUnsafeToParseFromHTML,
} from 'apps/workspace/content/components/get-content-profiles-form-config';
import {RICH_FORMATTING_OPTION, IActiveCell, IArticle} from 'superdesk-api';
import {
    CharacterLimitUiBehavior,
    DEFAULT_UI_FOR_EDITOR_LIMIT,
} from 'apps/authoring/authoring/components/CharacterCountConfigButton';
import {getMiddlewares} from 'core/redux-utils';
import {getTextLimitHighlightDecorator} from '../components/text-length-overflow-decorator';
import {CompositeDecoratorCustom} from './composite-decorator-custom';

export const ignoreInternalAnnotationFields = (annotations) =>
    annotations.map((annotation) => pick(annotation, ['id', 'type', 'body']));

interface IProps {
    editorState?: RawDraftContentState;
    language?: any;
    debounce?: any;
    onChange?: any;
    readOnly?: any;
    singleLine?: any;
    tabindex?: any;
    showTitle?: any;
    editorFormat?: Array<RICH_FORMATTING_OPTION>;
    item?: any;
    svc?: any;
    trim?: any;
    value?: any;
    limitBehavior?: CharacterLimitUiBehavior;
    limit?: number;
}

export interface IEditorStore {
    editorState: EditorState;
    searchTerm: { pattern: string; index: number; caseSensitive: boolean };
    popup: { type: any };
    readOnly: boolean;
    locked: boolean;
    showToolbar: any;
    singleLine: any;
    tabindex: any;
    showTitle: any;
    activeCell?: IActiveCell;
    customToolbarStyle?: 'table' | 'multiLineQuote';
    editorFormat: Array<RICH_FORMATTING_OPTION>;
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
    limitConfig?: EditorLimit;
}

let editor3Stores = [];

export const getDecorators = (
    language?: string,
    spellcheckWarnings?: ISpellcheckWarningsByBlock,
    limitConfig?: EditorLimit,
) => {
    const decorators: Array<{strategy: any, component: any}> = [LinkDecorator];

    if (spellcheckWarnings != null && language != null) {
        decorators.push(
            getSpellcheckingDecorator(language, spellcheckWarnings),
        );
    }

    if (limitConfig?.ui === 'highlight' && typeof limitConfig?.chars === 'number') {
        decorators.push(
            getTextLimitHighlightDecorator(limitConfig.chars),
        );
    }

    return new CompositeDecoratorCustom(decorators);
};

/**
 * @param spellcheck ng service or null
 */
export function getInitialSpellcheckerData(spellcheck, language: string): IEditorStore['spellchecking'] {
    const spellcheckerDisabledInConfig = appConfig.features?.useTansaProofing === true;

    if (spellcheck != null) {
        if (!spellcheckerDisabledInConfig) {
            spellcheck.setLanguage(language);
        }
    }

    return {
        language: language,
        enabled:
            !spellcheckerDisabledInConfig &&
            spellcheck &&
            spellcheck.isAutoSpellchecker,
        inProgress: false,
        warningsByBlock: {},
    };
}

export function initializeSpellchecker(store, spellcheck) {
    return new Promise<void>((resolve) => {
        if (spellcheck != null) {
            Promise.all([
                spellcheck.getAbbreviationsDict(),

                // after we have the dictionary, force update the editor to highlight typos
                // if another action is dispatched, `dispatch(forceUpdate())` isn't needed
                spellcheck.getDict(),
            ]).then((res) => {
                const [abbreviations] = res;

                store.dispatch(setAbbreviations(abbreviations || {}));

                setTimeout(() => {
                    resolve();
                });
            });
        }
    });
}

/**
 * @name createEditorStore
 * @description Returns a new redux store.
 * @param {Object} props The properties of the editor (for Angular, the controller instance).
 * @param {Boolean=} isReact True if the store is created for a React component.
 * @returns {Object} Redux store.
 */
export default function createEditorStore(
    props: IProps,
    spellcheck,
    isReact = false,
): Store<IEditorStore> {
    const content = getInitialContent(props);

    const onChangeValue = isReact
        ? props.onChange
        : debounce(onChange.bind(props), props.debounce);

    const limitConfig: EditorLimit | null = !props.limit
        ? null
        : {
            ui: props.limitBehavior || DEFAULT_UI_FOR_EDITOR_LIMIT,
            chars: props.limit,
        };

    let editorState = EditorState.createWithContent(
        content,
        getDecorators(),
    );

    const store: Store<IEditorStore> = createStore<IEditorStore, any, any, any>(
        reducers,
        {
            editorState,
            searchTerm: {pattern: '', index: -1, caseSensitive: false},
            popup: {type: PopupTypes.Hidden},
            readOnly: props.readOnly,
            locked: false, // when true, main editor is disabled (ie. when editing sub-components like tables or images)
            showToolbar: (props.editorFormat || []).length > 0,
            singleLine: props.singleLine,
            tabindex: props.tabindex,
            showTitle: props.showTitle,
            activeCell: null, // currently focused table cell
            editorFormat: props.editorFormat || [],
            onChangeValue: onChangeValue,
            item: props.item,
            spellchecking: getInitialSpellcheckerData(spellcheck, props.language),
            suggestingMode: false,
            invisibles: false,
            svc: props.svc,
            abbreviations: {},
            loading: false,
            limitConfig,
        },
        getMiddlewares(),
    );

    initializeSpellchecker(store, spellcheck);

    editor3Stores.push(store);

    return store;
}

export function getStores() {
    return editor3Stores;
}

export function unsetStore() {
    return editor3Stores = [];
}

export function getAnnotationsForField(item: IArticle, fieldId: string) {
    return ignoreInternalAnnotationFields(
        getAnnotationsFromItem(item, fieldId),
    );
}

export function getAnnotationsForStorage(contentState: ContentState) {
    return ignoreInternalAnnotationFields(
        getAnnotationsFromContentState(contentState),
    );
}

/**
 * Generate item annotations field
 *
 * @param {Object} item
 */
export function generateAnnotations(item) {
    item.annotations = ignoreInternalAnnotationFields(
        getAnnotationsFromItem(item, 'body_html'),
    );
}

export function prepareEditor3StateForExport(contentState: ContentState): ContentState {
    const decorativeStyles = ['HIGHLIGHT', 'HIGHLIGHT_STRONG'];
    const contentStateCleaned = removeInlineStyles(
        contentState,
        decorativeStyles,
    );

    return prepareHighlightsForExport(
        EditorState.createWithContent(contentStateCleaned),
    ).getCurrentContent();
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

    const contentStatePreparedForExport = prepareEditor3StateForExport(contentState);
    const rawState = convertToRaw(contentStatePreparedForExport);

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

    let objectToUpdate =
        pathToValueArray.length < 2
            ? this.item
            : pathToValueArray.slice(0, -1).reduce((obj, pathSegment) => {
                if (obj[pathSegment] == null) {
                    obj[pathSegment] = {};
                }

                return obj[pathSegment];
            }, this.item);

    const fieldName = pathToValueArray[pathToValueArray.length - 1];

    if (plainText) {
        objectToUpdate[
            fieldName
        ] = contentStatePreparedForExport.getPlainText();
    } else {
        objectToUpdate[fieldName] = editor3StateToHtml(
            contentStatePreparedForExport,
        );
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
 * @description Gets the initial content state of the editor based on available information.
 * If an editor state is available as saved in the DB, we use that, otherwise we attempt to
 * use available HTML. If none are available, an empty ContentState is created.
 */
export function getInitialContent(props): ContentState {
    // support standalone instance of editor3 which is not connected to item field
    if (props.editorState != null) {
        var contentState = convertFromRaw(
            props.editorState instanceof Array
                ? props.editorState[0]
                : props.editorState,
        );

        return initializeHighlights(
            EditorState.createWithContent(contentState),
        ).getCurrentContent();
    }

    const hasUnsafeFormattingOptions = props.editorFormat != null && props.editorFormat.some(
        (option: RICH_FORMATTING_OPTION) => formattingOptionsUnsafeToParseFromHTML.includes(option),
    );

    /**
     * To avoid synchronisation issues between html/plaintext values and draftjs object,
     * draftjs object is only used when there are formatting options enabled that can't be parsed from HTML.
     */
    if (hasUnsafeFormattingOptions) {
        const draftjsRawState = getFieldMetadata(
            props.item,
            props.pathToValue,
            fieldsMetaKeys.draftjsState,
        );

        if (draftjsRawState != null) {
            let initialContent = convertFromRaw(draftjsRawState);

            return initializeHighlights(
                EditorState.createWithContent(initialContent),
            ).getCurrentContent();
        }
    }

    const value =
        props.value ||
        get(props.item, props.pathToValue.replace(FIELD_KEY_SEPARATOR, '.'));

    if (value != null && value !== '') {
        // we have only HTML (possibly legacy editor2 or ingested item)
        return getContentStateFromHtml(value, props.item.associations);
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
        associations['editor_' + key] = get(
            rawState.entityMap[key],
            'data.media',
        );
    });

    item.associations = associations;
}
