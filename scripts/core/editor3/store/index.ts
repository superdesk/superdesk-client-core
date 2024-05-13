/* eslint-disable complexity */
import {
    EditorState,
    convertFromRaw,
    ContentState,
    RawDraftContentState,
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
import {LinkDecorator} from '../components/links/LinkDecorator';
import {
    getSpellcheckingDecorator,
    ISpellcheckWarningsByBlock,
} from '../components/spellchecker/SpellcheckerDecorator';
import {appConfig} from 'appConfig';
import {
    formattingOptionsUnsafeToParseFromHTML,
} from 'apps/workspace/content/components/get-content-profiles-form-config';
import {RICH_FORMATTING_OPTION, IActiveCell, IArticle, IDesk} from 'superdesk-api';
import {
    CharacterLimitUiBehavior,
    DEFAULT_UI_FOR_EDITOR_LIMIT,
} from 'apps/authoring/authoring/components/CharacterCountConfigButton';
import {getMiddlewares} from 'core/redux-utils';
import {getTextLimitHighlightDecorator} from '../components/text-length-overflow-decorator';
import {CompositeDecoratorCustom} from './composite-decorator-custom';
import {IAcceptSuggestion} from '../components/spellchecker/SpellcheckerContextMenu';

export const ignoreInternalAnnotationFields = (annotations) =>
    annotations.map((annotation) => pick(annotation, ['id', 'type', 'body']));

interface IProps {
    editorState?: RawDraftContentState;
    language?: any;
    debounce?: any;
    onChange?: any;
    readOnly?: any;
    singleLine?: any;
    plainText?: any;
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
    plainText: boolean;
    tabindex: any;
    showTitle: any;
    activeCell?: IActiveCell;
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

interface IOptions {
    spellchecker: {
        acceptSuggestion: IAcceptSuggestion,
        enabled?: boolean,
        language?: string,
        warnings?: ISpellcheckWarningsByBlock,
    };
    limitConfig?: EditorLimit,
}

export const getDecorators = (options: IOptions) => {
    const {limitConfig} = options;
    const {spellchecker} = options;

    // improve performance by not replacing decorators when possible.
    let mustReApplyDecorators = false;

    const decorators: Array<{strategy: any, component: any}> = [LinkDecorator];

    if (spellchecker.enabled === true && spellchecker.warnings != null && spellchecker.language != null) {
        mustReApplyDecorators = true;

        decorators.push(
            getSpellcheckingDecorator(spellchecker.language, spellchecker.warnings, spellchecker.acceptSuggestion),
        );
    }

    if (limitConfig?.ui === 'highlight' && typeof limitConfig?.chars === 'number') {
        mustReApplyDecorators = true;

        decorators.push(
            getTextLimitHighlightDecorator(limitConfig.chars),
        );
    }

    return {
        decorator: new CompositeDecoratorCustom(decorators),
        mustReApplyDecorators,
    };
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

export function initializeSpellchecker(dispatch, spellcheck): Promise<void> {
    return new Promise<void>((resolve) => {
        if (spellcheck != null) {
            Promise.all([
                spellcheck.getAbbreviationsDict(),

                // after we have the dictionary, force update the editor to highlight typos
                // if another action is dispatched, `dispatch(forceUpdate())` isn't needed
                spellcheck.getDict(),
            ]).then((res) => {
                const [abbreviations] = res;

                dispatch(setAbbreviations(abbreviations || {}));

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
        getDecorators({spellchecker: {acceptSuggestion: 'store-based'}}).decorator,
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
            plainText: props.plainText,
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

    initializeSpellchecker(store.dispatch, spellcheck);

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

// `this` points to Editor3Directive
export function onChange() {
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
     * To avoid synchronization issues between html/plaintext values and draftjs object,
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
 */
export function syncAssociations(item: IArticle, rawState: RawDraftContentState): void {
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
