/* tslint:disable */

declare module 'superdesk-api' {
    // TYPESCRIPT TYPES

    type OrderedMap<K, V> = import('immutable').OrderedMap<K, V>;

    export interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {};

    export type DeepReadonlyObject<T> = {
        readonly [P in keyof T]: DeepReadonly<T[P]>;
    }

    export type DeepReadonly<T> =
        T extends Function
            ? T
            : T extends Array<infer U>
                ? DeepReadonlyArray<U>
                : DeepReadonlyObject<T>;

    export type Omit<K, V> = Pick<K, Exclude<keyof K, V>>;

    export type IArrayKeyed<T> = Array<{key: string; value: T}>;

    export type ICallable = (...args: Array<any>) => any;

    // FORMATS


    // AUTHORING-REACT

    export interface IAuthoringFieldV2 {
        id: string;
        name: string;
        fieldType: string;
        fieldConfig: unknown & Partial<ICommonFieldConfig>;
    }

    export type IFieldsV2 = OrderedMap<string, IAuthoringFieldV2>;

    export interface IContentProfileV2 {
        id: string;
        name: string;
        header: IFieldsV2;
        content: IFieldsV2;
    }

    export interface IFieldAdapter<T> {
        getFieldV2: (
            fieldEditor,
            fieldSchema,
        ) => IAuthoringFieldV2;

        /**
         * Allows to customize where values are stored.
         *
         * By default, custom fields are stored in IArticle['extra'].
         * Some fields may require a different storing strategy.
         * For example, editor3 fields need to store `RawDraftContentState` in `IArticle['fields_meta']`
         * HTML or plaintext version of the data in another location, and possibly annotations in third location.
         */
        storeValue?(value: unknown, article: T, config: unknown): T;

        /**
         * If defined, {@link ICustomFieldType.retrieveStoredValue} will not be used
         */
        retrieveStoredValue?(item: T, authoringStorage: IAuthoringStorage<T>): unknown;

        /**
         * Must return a value in operational format.
         */
        onToggledOn?: ICustomFieldType<unknown, unknown, unknown, unknown>['onToggledOn'];
    }

    export type IFieldsAdapter<T> = {[key: string]: IFieldAdapter<T>};

    export interface IStorageAdapter<T> {
        storeValue(value: unknown, fieldId: string, entity: T, config: unknown, fieldType: string): T;
        retrieveStoredValue(item: T, fieldId: string, fieldType: string): unknown;
    }

    export interface IAuthoringAutoSave<T> {
        get(id: string): Promise<T>;
        delete(id: string, etag: string): Promise<void>;
        cancel(): void;

        /**
         * A function that returns the article is used to improve performance.
         * In order to get the latest article, data has to be serialized. Using a function
         * allows to only do it once after timeout passes, instead of on every character change.
         */
        schedule(getItem: () => T, callback: (autosaved: T) => void): void;

        // TODO: add a comment on how flush works
        flush(): Promise<void>;
    }

    /**
     * {@link AuthoringReact} component will use this interface
     * instead of making network calls directly.
     * Alternative implementation can be used
     * to enable offline support.
     */
    export interface IAuthoringStorage<T> {
        forceLock(entity: T): Promise<T>;
        isLockedInCurrentSession(item: T): boolean;
        getEntity(id: string): Promise<{saved: T | null, autosaved: T | null}>;
        saveEntity(current: T, original: T): Promise<T>;
        closeAuthoring(
            current: T,
            original: T,
            cancelAutosave: () => Promise<void>,
            doClose: () => void,
        ): Promise<void>;
        getContentProfile(item: T, fieldsAdapter: IFieldsAdapter<T>): Promise<IContentProfileV2>;
        getUserPreferences(): Promise<any>;
        autosave: IAuthoringAutoSave<T>;
    }

    export type IFieldsData = import('immutable').Map<string, unknown>;

    export interface IExposedFromAuthoring<T> {
        item: T;
        sideWidget: string | null; // side widget name
        toggleSideWidget(name: string | null): void;
        contentProfile: IContentProfileV2;
        fieldsData: IFieldsData;
        authoringStorage: IAuthoringStorage<T>;
        storageAdapter: IStorageAdapter<T>;
        fieldsAdapter: IFieldsAdapter<T>;
        hasUnsavedChanges(): boolean;
        handleUnsavedChanges(): Promise<T>;
        handleFieldsDataChange(fieldsData: IFieldsData): void;
        save(): Promise<T>;
        initiateClosing(): void;
        keepChangesAndClose(): void;
        stealLock(): void;
    }

    export interface IAuthoringOptions<T> {
        readOnly: boolean;
        actions: Array<ITopBarWidget<T>>;
        toolbarBgColor?: React.CSSProperties['backgroundColor'];
    }

    export interface ITopBarWidget<T> {
        component: React.ComponentType<{entity: T}>;
        availableOffline: boolean;
        priority: IDisplayPriority;
        group: 'start' | 'middle' | 'end';
    }

    interface IPropsAuthoring<T> {
        itemId: string;

        /**
         * Used for listening for updates via web sockets.
         * An empty array may be passed if updates do not apply i.e. when an editing an item embedded inside another DB record
         */
        resourceNames: Array<string>;

        getLanguage(entity: T): string;
        onClose(): void;
        authoringStorage: IAuthoringStorage<T>;
        storageAdapter: IStorageAdapter<T>;
        fieldsAdapter: IFieldsAdapter<T>;
        getActions?(options: IExposedFromAuthoring<T>): Promise<Array<IAuthoringAction>>; // three dots menu actions
        getInlineToolbarActions(options: IExposedFromAuthoring<T>): IAuthoringOptions<T>;
        getAuthoringTopBarWidgets(
            options: IExposedFromAuthoring<T>,
        ): Array<ITopBarWidget<T>>;
        onEditingStart?(item: T): void;
        onEditingEnd?(item: T): void;
        getSidePanel?(options: IExposedFromAuthoring<T>, readOnly: boolean): React.ReactNode;
        getSidebar?(options: IExposedFromAuthoring<T>): JSX.Element;
        topBar2Widgets: Array<React.ComponentType<{item: T}>>;

        disableWidgetPinning?: boolean; // defaults to false

        // Runs before re-render.
        onFieldChange?(fieldId: string, fieldsData: IFieldsData): IFieldsData;

        validateBeforeSaving?: boolean; // will block saving if invalid. defaults to true
    }

    // AUTHORING-REACT FIELD TYPES - attachments

    export type IAttachmentsValueOperational = Array<{id: IAttachment['_id']}>;
    export type IAttachmentsValueStorage = IAttachmentsValueOperational;
    export type IAttachmentsUserPreferences = never;
    export type IAttachmentsConfig = ICommonFieldConfig;

    // AUTHORING-REACT FIELD TYPES - date

    export type IDateValueOperational = string;
    export type IDateValueStorage = IDateValueOperational;
    export type IDateUserPreferences = never;

    export interface IDateShortcut {
        label: string;
        value: number;
        term: 'days' | 'weeks' | 'months' | 'years';
    }

    export interface IDateFieldConfig extends ICommonFieldConfig {
        shortcuts?: Array<IDateShortcut>;
    }

    // AUTHORING-REACT FIELD TYPES - time

    export type ITimeValueOperational = string; // ISO 8601, 13:59:01.123
    export type ITimeValueStorage = ITimeValueOperational;
    export interface ITimeFieldConfig extends ICommonFieldConfig {
        allowSeconds?: boolean;
    };
    export type ITimeUserPreferences = never;

    // AUTHORING-REACT FIELD TYPES - duration

    export type IDurationValueOperational = number; // number of seconds
    export type IDurationValueStorage = IDurationValueOperational;
    export type IDurationFieldConfig = never;
    export type IDurationUserPreferences = never;

    // AUTHORING-REACT FIELD TYPES - dropdown

    export interface ITreeWithLookup<T> {
        nodes: Array<ITreeNode<T>>;
        lookup: {
            [id: string]: ITreeNode<T>;
        };
    }

    export type IDropdownValue = unknown;

    export interface IDropdownOption {
        id: string | number;
        label: string;
        parent?: IDropdownOption['id'];
        color?: string;
    }

    export interface IDropdownConfigVocabulary extends ICommonFieldConfig {
        source: 'vocabulary';
        vocabularyId: IVocabulary['_id'];
        multiple: boolean;
        filter?(vocabulary: IVocabularyItem): boolean;
    }

    export interface IDropdownConfigRemoteSource extends ICommonFieldConfig {
        source: 'remote-source';
        searchOptions(
            searchTerm: string,
            language: string,
            callback: (result: ITreeWithLookup<unknown>) => void,
        ): void;
        getLabel(item: unknown): string;
        getId(item: unknown): string;
        canSelectBranchWithChildren?(branch: ITreeNode<unknown>): boolean;
        optionTemplate?: React.ComponentType<{item: unknown}>;
        valueTemplate?: React.ComponentType<{item: unknown}>;
        multiple: boolean;
    }

    export interface IDropdownTreeConfig extends ICommonFieldConfig {
        source: 'dropdown-tree';
        getItems(): ITreeWithLookup<unknown>;
        getLabel(item: unknown): string;
        getId(item: unknown): string;
        canSelectBranchWithChildren?(branch: ITreeNode<unknown>): boolean;
        optionTemplate?: React.ComponentType<{item: unknown}>;
        valueTemplate?: React.ComponentType<{item: unknown}>;
        multiple: boolean;
    }

    export interface IDropdownConfigManualSource extends ICommonFieldConfig {
        source: 'manual-entry';
        type: 'text' | 'number';
        options: Array<IDropdownOption>;
        roundCorners: boolean;
        multiple: boolean;
    }

    export type IDropdownConfig =
        IDropdownConfigManualSource
        | IDropdownConfigVocabulary
        | IDropdownConfigRemoteSource
        | IDropdownTreeConfig;


    // AUTHORING-REACT FIELD TYPES - editor3

    export interface IEditor3ValueOperational {
        store: import('redux').Store<any>; // IEditorStore
        contentState: import('draft-js').ContentState;
    }

    export interface IEditor3ValueStorage {
        rawContentState: import('draft-js').RawDraftContentState;
    }

    export interface IEditor3Config extends ICommonFieldConfig {
        editorFormat?: Array<RICH_FORMATTING_OPTION>;
        minLength?: number;
        maxLength?: number;
        singleLine?: boolean; // also limits to plain text
        cleanPastedHtml?: boolean;
        disallowedCharacters?: Array<string>;

        /**
         * Value - field ID of editor3 field.
         *
         * When this field is toggled on, it will initialize with a value
         * copied from a field with ID specified in this config.
         *
         * Only plaintext value is copied to avoid target field containing
         * invalid formatting options that may be valid in source field.
         */
        copyFromFieldOnToggle?: string;
    }

    // AUTHORING-REACT FIELD TYPES - embed

    export interface IEmbedValueOperational {
        embed: string; // embed code
        description: string;
    }

    export type IEmbedValueStorage = IEmbedValueOperational;
    export type IEmbedUserPreferences = never;
    export type IEmbedConfig = ICommonFieldConfig;

    // AUTHORING-REACT FIELD TYPES - linked items

    interface ILinkedItem {
        id: IArticle['_id'];

        // type is only needed for compatibility with angular based authoring
        type: IArticle['type'];
    }

    export type ILinkedItemsValueOperational = Array<ILinkedItem>;
    export type ILinkedItemsValueStorage = ILinkedItemsValueOperational;
    export type ILinkedItemsUserPreferences = never;
    export type ILinkedItemsConfig = ICommonFieldConfig;

    // AUTHORING-REACT FIELD TYPES - media

    export type IMediaValueOperational = Array<IArticle>;
    export type IMediaValueStorage = IMediaValueOperational;
    export type IMediaUserPreferences = never;

    export interface IMediaConfig extends ICommonFieldConfig {
        maxItems?: number;
        allowPicture?: boolean;
        allowVideo?: boolean;
        allowAudio?: boolean;
        showPictureCrops?: boolean;
        showTitleEditingInput?: boolean;
        allowedWorkflows?: {
            inProgress?: boolean;
            published?: boolean;
        };
    }

    // AUTHORING-REACT FIELD TYPES - urls

    export interface IUrlObject {
        url: string;
        description: string;
    }

    export type IUrlsFieldValueOperational = Array<IUrlObject>;
    export type IUrlsFieldValueStorage = IUrlsFieldValueOperational;
    export type IUrlsFieldUserPreferences = never;
    export type IUrlsFieldConfig = ICommonFieldConfig;

    // EDITOR3

    export interface IEditor3Output {
        stringValue: string; // HTML or plain text (depending on config)
        annotations: Array<any>;
    }



    // EXTENSIONS

    export type onSpikeMiddlewareResult = {warnings?: Array<{text: string}>};
    export type onPublishMiddlewareResult= {warnings?: Array<{text: string}>};

    /**
     * float number 0 < x < 1. Larger the number, closer the component will be rendered to its side.
     * for example, if we had a list with 'start' positioned items with the following priorities [0.1, 0.2, 0.3]
     * we could add an item so it's the first in the list by setting priority to be less than 0.1, for example, 0.05.
     * to insert an item between 0.2 and 0.3 we could set its priority to 0.25
     * See [[sortByDisplayPriority]] for debug information.
     */
    export type IDisplayPriority = number;

    export interface IAuthoringAction {
        groupId?: string; // action lists can specify which groups they wanna render via an id
        priority?: IDisplayPriority;
        icon?: string;
        label: string;
        onTrigger(): void;
    }

    export interface IArticleActionBulk {
        priority?: IDisplayPriority;
        label: string;
        icon: string;
        group?: {label: string, icon: string};
        onTrigger(): void;
    }

    export interface IMonitoringFilter {
        label: string;
        query: {[key: string]: any};
        displayOptions?: {
            ignoreMatchesInSavedSearchMonitoringGroups?: boolean;
        };
    }

    export interface IPersonalSpaceSection {
        label: string;
        id: string,
        query: {[key: string]: any};
    }

    export interface IAuthoringWidgetLayoutProps {
        header?: JSX.Element;
        body: JSX.Element;
        footer?: JSX.Element;

        // only works react based authoring
        background?: 'light' | 'grey';
    }

    export interface IGenericSidebarComponentProps<T> {
        entityId: string;
        readOnly: boolean;
        contentProfile: IContentProfileV2;
        fieldsData: OrderedMap<string, unknown>;
        authoringStorage: IAuthoringStorage<T>;
        fieldsAdapter: IFieldsAdapter<T>;
        storageAdapter: IStorageAdapter<T>;

        onFieldsDataChange(fieldsData?: OrderedMap<string, unknown>): void;

        /**
         * Will prompt user to save changes. The promise will get rejected if user cancels saving.
         */
        handleUnsavedChanges(): Promise<T>;
    }

    export interface IGenericSideWidget<T> {
        _id: string; // required for configuring widget visibility in content profile
        label: string;
        order: number; // Integer. // NICE-TO-HAVE: manage order in the UI instead of here
        icon: string;
        component: React.ComponentType<IGenericSidebarComponentProps<T>>;
        isAllowed: (entity: T) => boolean;
    }

    /**
     * @deprecated: prefer {@link IGenericSideWidget}
     */
    export interface IArticleSideWidget {
        _id: string; // required for configuring widget visibility in content profile
        label: string;
        order: number; // Integer. // NICE-TO-HAVE: manage order in the UI instead of here
        icon: string;
        component: React.ComponentType<{
            article: IArticle;

            // other props below are specific to authoring-react implementation

            readOnly: boolean;
            contentProfile?: IContentProfileV2;
            fieldsData?: OrderedMap<string, unknown>;
            authoringStorage: IAuthoringStorage<IArticle>;
            fieldsAdapter: IFieldsAdapter<IArticle>;
            storageAdapter: IStorageAdapter<IArticle>;

            onFieldsDataChange?(fieldsData?: OrderedMap<string, unknown>): void;

            /**
             * Will prompt user to save changes. The promise will get rejected if user cancels saving.
             */
            handleUnsavedChanges(): Promise<IArticle>;
        }>;
        isAllowed?(article: IArticle): boolean; // enables limiting widgets depending on article data
    }

    export type IComment = {
        _id: string;
        text: string;
        item: string;
        user?: IUser;
        mentioned_users?: {[key: string]: IUser['_id']};
        mentioned_desks?: {[key: string]: IDesk['_id']};
        _updated?: string;
        _created: string;
    };

    export interface AuthoringHeaderItem {
        _id: string;
        label: string;
        order: number;
        component: React.ComponentType<{article: IArticle}>;
    }

    export interface IIngestRule<ExtraAttributes = {}> {
        name: string;
        handler: string;
        filter?: any;
        actions: A & {
            fetch?: Array<F>;
            publish?: Array<P>;
            exit?: boolean;
            preserve_desk?: boolean;
            extra?: ExtraAttributes;
        };
        schedule?: {
            day_of_week: Array<'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'>;
            hour_of_day_from?: string;
            hour_of_day_to?: string;
            time_zone?: string;
            _allDay: boolean;
        };
    }

    export interface IIngestRuleHandler extends IBaseRestApiResponse {
        name: string;
        supported_actions: {
            fetch_to_desk: boolean;
            publish_from_desk: boolean;
        };
        supported_configs: {
            exit: boolean;
            preserve_desk: boolean;
        };
        default_values: IIngestRule;
    }

    export interface IIngestRuleHandlerEditorProps<ExtraAttributes = {}> {
        rule: IIngestRule<ExtraAttributes>;
        updateRule(rule: IIngestRule<ExtraAttributes>): void;
    }

    export interface IIngestRuleHandlerPreviewProps<ExtraAttributes = {}> {
        rule: IIngestRule<ExtraAttributes>;
    }

    export interface IIngestRuleHandlerExtension {
        editor?: React.ComponentType<IIngestRuleHandlerEditorProps>;
        preview?: React.ComponentType<IIngestRuleHandlerPreviewProps>;
    }

    export interface IExtensionActivationResult {
        contributions?: {
            globalMenuHorizontal?: Array<React.ComponentType>;
            editor3?: {
                annotationInputTabs?: Array<IEditor3AnnotationInputTab>;
            }
            articleListItemWidgets?: Array<React.ComponentType<{article: IArticle}>>;
            articleGridItemWidgets?: Array<React.ComponentType<{article: IArticle}>>;

            /**
             * Display custom components at the top of authoring panel
             */
            authoringTopbarWidgets?: Array<{
                component: React.ComponentType<{article: IArticle}>;
                availableOffline: boolean;
                priority: IDisplayPriority;
                group: 'start' | 'middle' | 'end';
            }>;

            /**
             * Display custom components in the second toolbar in authoring panel
             */
            authoringTopbar2Widgets?: Array<React.ComponentType<{article: IArticle}>>;

            authoringSideWidgets?: Array<IArticleSideWidget>;
            authoringHeaderComponents?: Array<AuthoringHeaderItem>;

            getAuthoringActions?(
                article: IArticle,
                contentProfile: IContentProfileV2,
                fieldsData: import('immutable').Map<string, unknown>,
            ): Promise<Array<IAuthoringAction>>;

            mediaActions?: Array<React.ComponentType<{article: IArticle}>>;
            pages?: Array<IPage>;
            workspaceMenuItems?: Array<IWorkspaceMenuItem>;
            customFieldTypes?: Array<ICustomFieldType<unknown, unknown, unknown, unknown>>;
            notifications?: {
                [id: string]: (notification) => {
                    body: string;
                    actions: Array<{label: string; onClick(): void;}>;
                };
            };
            entities?: {
                article?: {
                    getActions?(article: IArticle): Promise<Array<IAuthoringAction>>;
                    getActionsBulk?(articles: Array<IArticle>): Promise<Array<IArticleActionBulk>>;
                    onPatchBefore?(id: IArticle['_id'], patch: Partial<IArticle>, dangerousOptions?: IDangerousArticlePatchingOptions,): Promise<Partial<IArticle>>; // can alter patch(immutably), can cancel patching
                    onSpike?(item: IArticle): Promise<onSpikeMiddlewareResult>;
                    onSpikeMultiple?(items: Array<IArticle>): Promise<onSpikeMiddlewareResult>;
                    onPublish?(item: IArticle): Promise<onPublishMiddlewareResult>;
                    onRewriteAfter?(item: IArticle): Promise<IArticle>;
                    onSendBefore?(items: Array<IArticle>, desk: IDesk): Promise<void>;
                };
                ingest?: {
                    ruleHandlers?: {[key: string]: IIngestRuleHandlerExtension};
                };
            };
            iptcMapping?(data: Partial<IPTCMetadata>, item: Partial<IArticle>, parent?: IArticle): Promise<Partial<IArticle>>;
            searchPanelWidgets?: Array<React.ComponentType<ISearchPanelWidgetProps<unknown>>>;
            authoring?: {
                /**
                 * Updates can be intercepted and modified. Return value will be used to compute a patch.
                 *
                 * Example: onUpdateBefore = (current, next) => ({...next, priority: next.headline.includes('important') ? 10 : 1})
                */
                onUpdateBefore?(current: IArticle, next: IArticle): Promise<IArticle>;

                /** Called after the update. */
                onUpdateAfter?(previous: IArticle, current: IArticle): void;

                onCloseAfter?(item: IArticle): void;
            };
            monitoring?: {
                getFilteringButtons?(deskId: string): Array<IMonitoringFilter>;
            };
            personalSpace?: {
                getSections?(): Array<IPersonalSpaceSection>;
            };

            /**
             * Extra vertical sections may be added to the publishing panel.
             */
            publishingSections?: Array<{component: React.ComponentType<{item: IArticle}>}>;
        }
    }

    export type ISearchPanelWidgetProps<T> = {
        provider: string;
        params: T;
        setParams: (params: Partial<T>) => void;
    };

    export type IExtension = DeepReadonly<{
        activate: (superdesk: ISuperdesk) => Promise<IExtensionActivationResult>;
        exposes?: {[key: string]: any};
    }>;

    export type IExtensionObject = {
        extension: IExtension;
        activationResult: IExtensionActivationResult;
        configuration: {[key: string]: {}};
    };

    export interface IExtensionModule {
        default: IExtension;
    };

    export type IExtensions = {[key: string]: IExtensionObject};

    export type ISideMenuItem = DeepReadonly<{
        label: string;
        url: string;
    }>;



    // ENTITIES

    export interface IAuthor {
        // !!! _id is optional. It will not be present in ingested items.
        _id?: [string, string]; // user id, role

        name: string;
        scheme: any | null;
        user: IUser;
        role?: string;
        parent?: string;
        sub_label?: string;
        private?: boolean; //Author wants to be publicly visible or hidden [SDBELGA-605]
    }

    // to use as a value, use enum inside 'scripts/apps/search/interfaces.ts'
    export enum ITEM_STATE {
        /**
         * ROOT STATE
         * DRAFT is the first state for manually created items. Drafts can only be autosaved.
         * When a draft is saved manually, the state switches to IN_PROGRESS.
         */
        DRAFT = 'draft',

        /**
         * READ-ONLY, ROOT STATE
         * Ingested item in ingest collection, not production.
         * The only action that can be performed on ingested items is to fetch them.
         * After fetching, state switches to FETCHED.
         */
        INGESTED = 'ingested',

        /**
         * Item manually fetched from ingest to desk.
         * Similar to ROUTED, except that fetching is manual and routing is automatic.
         * Same actions are available as for items that are IN_PROGRESS
         */
        FETCHED = 'fetched', // becomes IN_PROGRESS when you start editing it

        /**
         * Automatically ingested to desk.
         * Similar to FETCHED, except that routing is automatic and fetching is manual.
         * Same actions are available as for items that are IN_PROGRESS
         */
        ROUTED = 'routed',

        /**
         * Item is sent to a desk.
         * Same actions are available as for items that are IN_PROGRESS
         * becomes IN_PROGRESS when a change is saved
         */
        SUBMITTED = 'submitted',

        /**
         * Main workflow state.
         */
        IN_PROGRESS = 'in_progress',

        /**
         * Removed from a desk.
         * The only action that can be performed on SPIKED items is to un-spike.
         * SPIKED items may also be removed by the system after a certain period of time.
         */
        SPIKED = 'spiked',

        /**
         * Published.
         *
         * update - creates a copy -> IN_PROGRESS
         * correct - creates a new item with state CORRECTED, can only publish correction, can't get it back to workflow
         * takedown -> RECALLED
         * kill -> KILLED
         * unpublish -> UNPUBLISHED will go in workflow and become IN_PROGRESS when edited
         *
         */
        PUBLISHED = 'published',

        /**
         * Scheduled for publishing. Always displayed in output stage.
         * The only available action is to de-schedule. Item will then become IN_PROGRESS.
         * Unless de-scheduled, the item will become PUBLISHED at set date.
         */
        SCHEDULED = 'scheduled',

        /**
         * Correction is published.
         * Will only be displayed in output stage
         * Same actions are available as for items that are PUBLISHED
         */
        CORRECTED = 'corrected',

        /**
         * Only available when correction workflow is enabled.
         * BEING_CORRECTED state will be set for a formerly published item which is in the output.
         * The original item will remain in the output.
         * A new item will be created on a stage with status CORRECTION.
        */
        BEING_CORRECTED = 'being_corrected',

        /**
         * Only available when correction workflow is enabled.
         * Item with state CORRECTION will be displayed on a stage.
         * The original item that is being corrected will remain in the output with state BEING_CORRECTED.
         * When published, becomes CORRECTED.
        */
        CORRECTION = 'correction',

        /**
         * FINAL STATE
         * No actions are available.
         */
        KILLED = 'killed',

        /**
         * FINAL STATE
         * No actions are available.
         */
        RECALLED = 'recalled',

        /**
         * When unpublished, item goes back to workflow and will become IN_PROGRESS if changed and saved.
         */
        UNPUBLISHED = 'unpublished',
    }


    export interface IRelatedArticle {
        _id: IArticle['_id'];
        type: IArticle['type'];
        order: number,
    }

    export interface IRendition {
        href: string;
        mimetype: string;

        /** media storage id, set when item is stored in superdesk */
        media?: string;

        // picture and video only
        width?: number;
        height?: number;

        // video id, set when item is stored in video server
        video_editor_id?: string;
    };

    export interface ILockInfo {
        _lock: boolean;

        // write-only, used to update `_lock`
        _lock_action?: 'unlock' | 'lock' | 'force-lock'

        _lock_session?: string;
        _lock_expiry?: string;
        _lock_time?: string;
        _lock_user?: IUser['_id'];
    }

    export interface IPropsLockInfoHttp<T extends ILockInfo> {
        entity: T;

        /**
         * Relative path; will be used for unlocking
         */
        endpoint: string;
    }

    export interface IPropsLockInfo<T extends ILockInfo> {
        entity: T;
        forceUnlock: () => void;
    }

    export interface IArticle extends IBaseRestApiResponse {
        _id: string;
        _current_version: number;
        _type?: 'ingest' | 'archive' | 'archived' | 'published' | 'archived' | 'legal_archive' | 'externalsource' | string;
        uri?: string; // uri is external id which stays when image is fetched from provider/ingest
        guid: string;
        family_id: string;
        translated_from?: string;
        translation_id?: string; // if C is translated from B which is translated from A, all will have the same translation_id
        translations?: Array<IArticle['_id']>; // direct translations only, not all items with same translation_id
        usageterms?: any;
        keywords?: any;
        language: any;
        slugline: string;
        genre: Array<{qcode: string; name: string}>;
        anpa_take_key?: any;

        place: Array<ISubject>;
        object?: Array<ISubject>;
        person?: Array<ISubject>;
        organisation?: Array<ISubject>;
        event?: Array<ISubject>;

        priority?: any;
        urgency: any;
        anpa_category?: any;
        subject?: Array<ISubject>;
        company_codes?: Array<any>;
        ednote?: string;
        authors?: Array<IAuthor>;
        headline: string;
        sms?: string;
        abstract?: string;
        attachments?: Array<{attachment: string}>;
        byline: string;
        dateline?: {
            day?: string;
            date?: string;
            source?: string;
            located?: {
                dateline?: string;
                city?: string;
                city_code?: string;
                state_code?: string;
                country?: string;
                country_code?: string;
                tz?: string;
                state?: string;
            };
            text?: string;
        };
        body_html?: string;
        footer?: string;
        firstcreated: any;
        versioncreated: any;
        body_footer?: string;
        is_spiked?: any;
        expiry: any;
        copyrightholder?: string;
        copyrightnotice?: string;
        sign_off: string;
        feature_media?: any;
        media_description?: string;
        description_text?: string;

        associations?: {
            'featuremedia'?: IArticle;

            // IArticle is used for media galleries and IRelatedArticle for linking articles.
            [id: string]: IArticle | IRelatedArticle;
        };
        type:
            | 'text'
            | 'picture'
            | 'video'
            | 'audio'
            | 'preformatted'
            | 'graphic'
            | 'composite';
        firstpublished?: string;
        linked_in_packages?: Array<{
            package: string;
            package_type: string; // deprecated
        }>;
        gone?: any;
        lock_action: any;
        lock_user: any;
        lock_session: any;
        rewritten_by?: IArticle['_id'];
        rewrite_of?: IArticle['_id'];
        profile: string;
        word_count?: number;
        lines_count?: number;
        version_creator: string;
        state: ITEM_STATE;
        /** Internal embargoed datetime. */
        embargo?: string;
        /** Ingested embargoed datetime. */
        embargoed?: string;
        /** Ingested embargoed info. */
        embargoed_text?: string;
        signal?: Array<{
            name?: string;
            qcode: string;
        }>;
        broadcast?: {
            master_id?: any; // original story this broadcast version was created from
            status?: any;
        };
        flags: {
            marked_archived_only?: boolean;
            marked_for_legal?: boolean;
            marked_for_not_publication?: boolean;
            marked_for_sms?: boolean;
        };
        source: string;
        /** correction counter, is reset on rewrite */
        correction_sequence?: number;
        /** rewrite counter */
        rewrite_sequence?: number;
        fetch_endpoint?: any;
        task_id?: any;
        ingest_provider?: any;
        archive_item?: IArticle;
        item_id?: string; // id of corresponding item in 'published' collection
        marked_desks?: Array<{
            date_marked: string;
            desk_id: IDesk['_id'];
            user_marked: IUser['_id'];
        }>;

        highlights?: Array<string>;
        highlight?: any;
        sms_message?: string;

        // storage for custom fields created by users
        extra?: {[key: string]: any};

        task: {
            desk?: IDesk['_id'];
            stage?: IStage['_id'];
            user?: IUser['_id'];
        };

        // might be only used for client-side state
        created?: any;
        archived?: any;

        unique_name: any;
        pubstatus: any;
        schedule_settings?: {
            time_zone?: string;
            utc_embargo?: any
            utc_publish_schedule?: any
        };
        format: any;
        fields_meta?: {
            [key: string]: {
                draftjsState?: [import('draft-js').RawDraftContentState];
                annotations?: Array<any>;
            }
        };
        version: any;
        template: any;
        original_creator: string;
        unique_id: any;
        operation: any;
        lock_time: string;
        force_unlock?: boolean;
        order?: number;
        _status: any;
        _fetchable?: boolean;
        last_published_version?: any;
        publish_schedule?: string; // Stores local time. Timezone is stored in schedule_settings.time_zone

        /**
         * Wrapper for different renditions of non-textual content of the news object
         *
         * There can be multiple renditions for single item with different sizes/mimetypes.
         *
         * Picture renditions used in UI are generated automatically by Superdesk:
         * - **thumbnail** - used in lists
         * - **viewImage** - used in sidebar preview
         * - **baseImage** - used in media editor, full screen preview
         *
         * Video items can also provide **thumbnail** and **viewImage** renditions which will be
         * then used in list/preview. If there is **viewImage** it will use it for grid view/preview,
         * **thumbnail** will be used as poster when video is being loaded. When there is no **viewImage**
         * it will use **thumbnail** for both.
         */
        renditions?: {
            /** Original binary uploaded by user. */
            original?: IRendition;

            /**
             * Image rendition up to 220x120, used in lists.
             *
             * Could be bigger picture for video items, it's used as poster there.
             */
            thumbnail?: IRendition;

            /** Image rendition up to 640x640, used in preview/grid view. */
            viewImage?: IRendition;

            /** Image rendition up to 1400x1400, used for full screen preview. */
            baseImage?: IRendition;

            /** Other renditions, could be custom, video, audio etc. */
            [key: string]: IRendition;
        };

        // media fields
        alt_text?: any;

        // planning extension
        assignment_id?: string;
        event_id?: any;

        // markForUser extension
        marked_for_user?: string | null;

        // remove when SDESK-4343 is done.
        selected?: any;

        es_highlight?: any;

        used?: boolean;
        used_count?: number;
        used_updated?: string;

        target_subscribers?: Array<{_id: string; name: string}>;
        target_regions?: Array<{name: string; qcode: string; allow: boolean}>;
        target_types?: Array<{name: string; qcode: string; allow: boolean}>;

        // write-only on the client. Copy of body_html annotations. Original is in fields_meta['body_html']
        annotations?: Array<{id: number; type: string; body: string}>;

        // holds info on packages
        groups?: Array<any>;

        // other fields which don't exist in the database, don't belong to this entity and should be removed
        error?: any;
        _editable?: any;
        actioning?: {
            archive?: boolean;
            externalsource: boolean;
            archiveContent?: boolean;
        };
        _autosave?: any;
        _autosaved?: any;
        _locked?: boolean;
    }

    export interface IDangerousArticlePatchingOptions {
        // When this option is set, an HTTP request will be sent immediately
        // even if the article is locked and is being edited.
        // Data received from the server will overwrite values edited by a user in case of a conflict.
        patchDirectlyAndOverwriteAuthoringValues?: boolean;
    }

    export interface IPublishedArticle extends IArticle {

        /** id in published collection, different for each correction */
        item_id: string;

        /** item copy in archive collection, always the latest version of the item */
        archive_item: IArticle;
    }

    export interface IPublishedArticle extends IArticle {

        /** id in published collection, different for each correction */
        item_id: string;

        /** item copy in archive collection, always the latest version of the item */
        archive_item: IArticle;
    }

    export interface IUserRole extends IBaseRestApiResponse {
        _id: string;
        name: string;
        privileges?: {
            [privilege: string]: 1 | 0;
        };
        author_role: string;
        editor_role: string;
    }

    export interface IMonitoringGroup {
        _id: string;
        type: 'search' | 'stage' | 'scheduledDeskOutput' | 'deskOutput' | 'personal' | 'sentDeskOutput';
        max_items?: number;
        header?: string;
    }

    export interface IDesk extends IBaseRestApiResponse {
        name: string;
        description?: string;
        members: Array<IUser['_id']>;
        incoming_stage: IStage['_id'];
        working_stage: IStage['_id'];
        content_expiry?: number;
        source: string;
        monitoring_settings?: Array<IMonitoringGroup>;
        desk_type: 'authoring' | 'production';
        desk_metadata?: {[key: string]: any};
        content_profiles: {[key: IContentProfile['_id']]: any};
        desk_language?: string;
        monitoring_default_view?: 'list' | 'swimlane' | 'photogrid';
        default_content_profile: string;
        default_content_template: string;
        slack_channel_name?: string;
        preferred_cv_items: {[key: string]: any};
        preserve_published_content: boolean;
        sams_settings?: {
            allowed_sets?: Array<string>;
        };
    }

    export interface IStage extends IBaseRestApiResponse {
        name: string;
        description: string;
        working_stage: boolean;
        default_incoming: boolean;
        task_status: 'todo' | 'in_progress' | 'done';
        desk_order: number;
        desk: IDesk['_id'];
        content_expiry: number;
        is_visible: boolean;
        local_readonly: boolean;
        incoming_macro: string;
        outgoing_macro: string;
        onstage_macro: string;
    }

    export interface IUser extends IBaseRestApiResponse {
        session_preferences?: {[key: string]: any};
        _id: string;
        username: string;
        password: string;
        password_changed_on: string;
        first_name?: string; // not mandatory, empty when user is created programatically
        last_name?: string; // not mandatory, empty when user is created programatically
        display_name: string;
        email: string;
        phone: string;
        job_title: string;
        biography: string;
        facebook: string;
        instagram: string;
        twitter: string;
        jid: string;
        language: string;
        user_info: {};
        picture_url: string;
        avatar: string;
        avatar_renditions: {};
        role?: IUserRole['_id'];
        privileges: {};
        user_type: 'user' | 'administrator';
        is_support: boolean;
        is_author: boolean;
        is_active: boolean;
        is_enabled: boolean;
        needs_activation: boolean;
        desk: IDesk;
        sign_off: string;
        byline: string;
        invisible_stages: Array<any>;
        slack_username: string;
        slack_user_id: string;
        last_activity_at?: string;
    }

    export interface IVocabularyTag {
        text: string;
    }

    export interface IVocabularyItem {
        name: string;
        qcode: string;
        color?: string;
        is_active?: boolean;

        /**
         * `service` field enables dependent fields when selecting values from vocabularies in authoring.
         * Dependent fields mean that available values for one field depend on a value of another field.
         * The main field is anpa_category and it doesn't have `service` property.
         * Items in other vocabularies may specify which `anpa_category` needs to be selected
         * in order for certain vocabulary items to be selectable.
         * For example, if a vocabulary item has `service: {"arts": 1}`, it will only be available for selection
         * if authoring field with ID `anpa_category` has item with qcode "arts" selected.
         */
        service?: {
            [qcode: string]: 1;
        };

        parent?: string;
        translations?: {
            name?: {
                [key: string]: string;
            }
        };

        // vocabularies can have dynamic schema, thus field names can't be known statically
        [key: string]: any;
    }

    export interface IVocabulary extends IBaseRestApiResponse {
        _deleted: boolean;
        display_name: string;
        helper_text?: string;
        popup_width?: number;
        type: string;
        items: Array<IVocabularyItem>;
        single_value?: boolean;
        schema_field?: string;
        dependent?: boolean;
        service: {
            [key: string]: any;
        };
        priority?: number;
        unique_field: string;
        schema: {};
        field_type:
            | 'text'
            | 'media'
            | 'date'
            | 'embed'
            | 'urls'
            | 'related_content'
            | 'custom';
        field_options?: { // Used for related content fields
            allowed_types?: {
                picture?: boolean;
                audio?: boolean;
                video?: boolean;
            };
            allowed_workflows?: {
                in_progress?: boolean;
                published?: boolean;
            };
            multiple_items?: { enabled: boolean; max_items: number };
            single?: boolean; // used for custom text fields
        };
        custom_field_type?: string;
        custom_field_config?: { [key: string]: any };
        date_shortcuts?: Array<{ value: number; term: string; label: string }>;
        init_version?: number;
        preffered_items?: boolean;
        tags?: Array<IVocabularyTag>;
        disable_entire_category_selection?: boolean;
        selection_type?: any;
    }

    export type IContentProfileEditorConfig = {
        [key: string]: {
            single?: boolean;
            enabled?: boolean;
            order: number;
            field_name?: string;
            section?: 'header' | 'content';
            editor3?: boolean; // only for body_html
            required?: boolean;
            readonly?: boolean;
            sdWidth?: 'full' | 'half' | 'quarter';
            minlength?: number;
            maxlength?: number;
            hideDate?: boolean;
            preview?: boolean;
            cleanPastedHTML?: boolean;
            validate_characters?: boolean;
            formatOptions?: Array<string>;
            showCrops?: boolean;
            imageTitle?: boolean;
            sourceField?: string;
        }
    };

    export enum IContentProfileType {
        text = 'text',
        image = 'image',
        audio = 'audio',
        video = 'video',
        package = 'package',
    }

    export interface IContentProfile {
        _id: string;
        type: keyof typeof IContentProfileType;
        label: string;
        description: string;
        schema: Object;
        editor: IContentProfileEditorConfig;
        widgets_config: Array<{widget_id: string; is_displayed: boolean}>;
        priority: number;
        enabled: boolean;
        is_used: boolean;
        created_by: IUser['_id'];
        updated_by: IUser['_id'];
    }

    export interface IMedia {
        _id: string;
        md5: string;
        name: string;
        filename: string;
        content_type: string;
        length: number;
    }

    export interface IAttachment extends IBaseRestApiResponse{
        title: string;
        mimetype: string;
        filename: string;
        description: string;
        media: string | IMedia;
        internal: boolean;
    }


    // PAGE

    export type IPage = DeepReadonly<{
        title: string;
        url: string;
        component: React.ComponentType;
        priority?: number;

        /**
         * Controls whether top menu is shown when the page is open.
         * Does NOT add a link to the page to the top menu.
         */
        showTopMenu?: boolean;

        /**
         * Controls whether side menu is shown when the page is open.
         * Does NOT add a link to the page to the side menu.
         */
        showSideMenu?: boolean;

        /**
         * Controls whether a link to the page is added to the main menu.
         */
        addToMainMenu?: boolean; // defaults to true

        /**
         * Controls whether a link to the page is added to the side menu.
         */
        addToSideMenu?: {
            icon: string;
            order: number;
            keyBinding?: string;
        };
    }>;

    export type IWorkspaceMenuItem = DeepReadonly<{
        href: string;
        icon: string;
        label: string;
        order?: number;
        shortcut?: string;
    }>;


    // SUPERDESK QUERY FORMAT

    export type IComparisonOptions =
        {$eq: any}
        | {$ne: any}
        | {$gt: any}
        | {$gte: any}
        | {$lt: any}
        | {$lte: any}
        | {$in: any};
        // consider adding $inString for matching substrings

    export type IComparison = {[field: string]: IComparisonOptions};
    export type IAndOperator = {$and: Array<IComparison | ILogicalOperator>};
    export type IOrOperator = {$or: Array<IComparison | ILogicalOperator>};
    export type ILogicalOperator = IAndOperator | IOrOperator;

    /**
     * Universal query format that works with both - Elasticsearch and pyeve endpoints
     */
    export interface ISuperdeskQuery {
        filter: ILogicalOperator;
        fullTextSearch?: string;
        sort: Array<{[field: string]: 'asc' | 'desc'}>;
        page: number;
        max_results: number;
    }

    export interface ISuperdeskQueryWithoutPaging {
        endpoint: string,
        filter: ILogicalOperator;
        fullTextSearch?: string;
        sort: Array<{[field: string]: 'asc' | 'desc'}>;
    }


    /**
     * Collection name and a function that resolves to an ID string need to be provided.
     */
    export type JoinInstructions<IEntity, IEntitiesToJoin> = {
        [Property in keyof IEntitiesToJoin]: {
            endpoint: string | ((entity: IEntity) => string);
            getId: (entity: IEntity) => string;
        };
    };

    export interface IVirtualListQueryBase {
        endpoint: string;
        filter?: ILogicalOperator | undefined;
        fullTextSearch?: string; // only works with elastic endpoints
        sort: Array<{[field: string]: 'asc' | 'desc'}>;
    }

    export interface IVirtualListQueryWithJoins<T, IToJoin> extends IVirtualListQueryBase {
        join: JoinInstructions<T, IToJoin>;
    }

    type IsNeverType<T> = [T] extends [never] ? true : false; // TODO: move to superdesk-common

    export interface IPropsVirtualListFromQuery<T extends IBaseRestApiResponse, IToJoin extends {[key: string]: any}> {
        width: number;
        height: number;
        query: IsNeverType<IToJoin> extends true ? IVirtualListQueryBase : IVirtualListQueryWithJoins<T, IToJoin>;
        itemTemplate: React.ComponentType<{entity: T; joined: Partial<IToJoin>}>;
        noItemsTemplate: React.ComponentType;
    }

    export interface IPropsSelectFromRemote<T> {
        label?: string;
        endpoint: string | null;
        sort: Array<[keyof T, 'asc' | 'desc']>;
        value?: string | null; // ID
        onChange(value: string | null): void;
        itemTemplate: React.ComponentType<{entity: T}>;
        required?: boolean;
        readOnly?: boolean;
        validationError?: string | null | undefined;
        noGrow?: boolean; // if true, will not expand to 100% of parent element
    }



    // REST API

    export interface IHttpRequestOptions {
        method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
        url: string; // absolute url
        payload?: {};
        headers?: {[key: string]: any};
        urlParams?: {[key: string]: any};

        abortSignal?: AbortSignal;
    }

    export interface IHttpRequestOptionsLocal extends Omit<IHttpRequestOptions, 'url'> {
        path: string; // relative to application server
    }

    export interface IHttpRequestJsonOptionsLocal extends IHttpRequestOptionsLocal {
        // JSON not available with DELETE method
        method: 'GET' | 'POST' | 'PATCH' | 'PUT';
    }


    export interface IBaseRestApiResponse {
        _created: string;
        _updated: string;
        _etag: string;
        _links: {
            parent?: any;
            collection?: any;
            self?: any;
        };
        _id: string;
        _status?: string;
        _current_version?: number;
        _latest_version?: number;
    }

    export interface IRestApiLink {
        title: string;
        href: string;
    }

    // Eve properties
    export interface IRestApiResponse<T> {
        _items: Array<T & IBaseRestApiResponse>;
        _links: {
            last?: IRestApiLink;
            parent: IRestApiLink;
            next?: IRestApiLink;
            self: IRestApiLink;
            prev?: IRestApiLink;
        };
        _meta: {
            max_results: number;
            page: number;
            total: number;
        };
    }

    export interface IPatchResponseExtraFields {
        _status: string;
    }

    export interface IQueryElasticParameters {
        endpoint: string;
        page: {
            from: number;
            size: number;
        };
        sort: Array<{[field: string]: 'asc' | 'desc'}>;

        // can use deep references like {'a.b.c': []}
        filterValues: {[fieldName: string]: Array<string>};

        // can use deep references like {'a.b.c': []}
        // generates must_not statements
        filterValuesNegative?: {[fieldName: string]: Array<string>};

        aggregations: boolean;
    }

    interface IElasticSearchAggregationResult {
        buckets: Array<{key: string; doc_count: number}>;
        doc_count_error_upper_bound: number;
        sum_other_doc_count: number;
    }

    export type IArticleQuery = Omit<IQueryElasticParameters, 'endpoint'>;

    interface IArticleQueryResult extends IRestApiResponse<IArticle> {
        _aggregations: {
            category?: IElasticSearchAggregationResult;
            desk?: IElasticSearchAggregationResult;
            genre?: IElasticSearchAggregationResult;
            legal?: IElasticSearchAggregationResult;
            priority?: IElasticSearchAggregationResult;
            sms?: IElasticSearchAggregationResult;
            source?: IElasticSearchAggregationResult;
            type?: IElasticSearchAggregationResult;
            urgency?: IElasticSearchAggregationResult;
        };
    }



    // GENERIC FORM

    export interface IPropsGenericFormContainer<T> {
        page: IGenericListPageComponent<T>;
    }

    export interface IPropsGenericFormItemComponent<T> {
        item: T;
        page: IGenericListPageComponent<T>;
        inEditMode: boolean;
        index: number;
        getId(item: T): string;
    }

    export interface IPropsGenericForm<T, P> {
        getFormConfig(item?: Partial<T>): IFormGroup;
        defaultSortOption: ISortOption;
        additionalSortOptions?: Array<{label: string; field: string;}>;
        additionalProps?: P; // allows passing props which will be available in container and item components
        defaultFilters?: Partial<T>;
        ItemComponent: React.ComponentType<IPropsGenericFormItemComponent<T> & {additionalProps?: P}>;
        ItemsContainerComponent?: React.ComponentType<IPropsGenericFormContainer<T> & {additionalProps?: P}>;

        getId(item: T): string;

        // Allows initializing a new item with some fields already filled.
        getNewItemTemplate?(page: IGenericListPageComponent<T>): Partial<T>;

        getNoItemsPlaceholder?(page: IGenericListPageComponent<T>): JSX.Element;

        refreshOnEvents?: Array<string>;

        fieldForSearch?: IFormField; // must be present in formConfig
        disallowCreatingNewItem?: true;
        disallowFiltering?: true;
        disallowSorting?: true;
        hideItemsCount?: true;

        /**
         * Dynamic schema is supported in order to display additional fields depending on values of current fields.
         * All fields are removed which aren't present in the schema at the time of saving.
         * In some cases it is desirable to maintain a field even if it is not in the schema.
        */
        hiddenFields?: Array<string>;

        labelForItemSaveButton?: string;

        // styles
        contentMargin?: number;
    }

    export enum FormFieldType {
        plainText = 'plainText',
        duration = 'duration',
        textEditor3 = 'textEditor3',
        number = 'number',
        vocabularySingleValue = 'vocabularySingleValue',
        checkbox = 'checkbox',
        contentFilterSingleValue = 'contentFilterSingleValue',
        deskSingleValue = 'deskSingleValue',
        stageSingleValue = 'stageSingleValue',
        macroSingleValue = 'macroSingleValue',
        yesNo = 'yesNo',
        select = 'select',
        selectMultiple = 'selectMultiple',
    }

    export interface IFormField { // don't forget to update runtime type checks
        type: FormFieldType;

        required?: boolean;

        // custom components for some fields might not require a label or want include a custom one
        label?: string;

        field: string;

        // can be used to pass read-only fields or display specific flags
        // component theme, variant or initial state could be set using this
        component_parameters?: {[key: string]: any};
    }

    export interface IFormGroupCollapsible { // don't forget to update runtime type checks
        label: string;
        openByDefault: boolean;
    }

    export interface IFormGroup { // don't forget to update runtime type checks
        direction: 'vertical' | 'horizontal';
        type: 'inline' | IFormGroupCollapsible;
        form: Array<IFormField | IFormGroup>;
    }

    export interface IPropsGenericArrayListPage<T, P> extends IPropsGenericForm<T, P> {
        value: Array<T>;
        onChange(value: Array<T>): void;

        newItemIndex?: number;
    }

    // CRUD MANAGER

    export type ICrudManagerFilters = {[fieldName: string]: any};

    export interface ISortOption {
        field: string;
        direction: 'ascending' | 'descending';
    }

    export interface ICrudManagerData<T> {
        _items: Array<T>;
        _meta: {
            max_results: number;
            page: number;
            total: number;
        };
    }

    export interface ICrudManagerState<Entity> extends ICrudManagerData<Entity> {
        activeFilters: ICrudManagerFilters;
        activeSortOption?: ISortOption;
    }

    export interface ICrudManagerMethods<Entity> {
        read(
            page: number,
            sort: ISortOption,
            filterValues?: ICrudManagerFilters,
        ): Promise<ICrudManagerData<Entity>>;
        update(item: Entity): Promise<Entity>;
        create(item: Entity): Promise<Entity>;
        delete(item: Entity): Promise<void>;
        refresh(): Promise<ICrudManagerData<Entity>>;
        sort(nextSortOption: ISortOption): Promise<ICrudManagerData<Entity>>;
        removeFilter(fieldName: string): Promise<ICrudManagerData<Entity>>;
        goToPage(nextPage: number): Promise<ICrudManagerData<Entity>>;
    }


    export interface ICrudManager<Entity> extends ICrudManagerState<Entity>, ICrudManagerMethods<Entity> {
        // allow exposing it as one interface for consumer components
    }



    // REACT COMPONENTS

    export interface IConfigurableUiComponents {
        UserAvatar?: React.ComponentType<{user: Partial<IUser>}>;

        /**
         * // IMPROVE: it would be better to provide this as a `ICustomFieldType` from an extension
         * and write an upgrade script for it to be used where needed.
         * If there's an issue with colliding IDs, we could add a property in `ICustomFieldType`
         * that would allow replacing a field with specified ID.
         */
        AuthoringAttachmentsWidget?: React.ComponentType<IAttachmentsWidgetProps>;
        AuthoringAttachmentsDiffView?: React.ComponentType<{attachmentsPrevious: Array<IAttachment>; attachmentsCurrent: Array<IAttachment>}>;
    }

    export interface IConfigurableAlgorithms {
        countLines?(plainText: string, lineLength: number): number;
    }

    export interface IConfigurableAlgorithms {
        countLines?(plainText: string, lineLength: number): number;
    }

    export interface IListItemProps {
        onClick?(): void;
        className?: string;
        inactive?: boolean;
        noHover?: boolean;
        noShadow?: boolean;
        noBackground?: boolean;
        fullWidth?: boolean;
        'data-test-id'?: string;
    }

    export interface IPropsDateTime {
        dateTime: string;
        tooltip?: (dateLong: string, dateShort: string) => string;
    }

    export interface IPropsListItemColumn {
        ellipsisAndGrow?: boolean;
        grow?: boolean;
        noBorder?: boolean;
        noPadding?: boolean;
        justifyContent?: string;
        bold?: boolean;
        title?: string;
    }

    export interface IPropsListItemRow {
        justifyContent?: string;
    }

    export interface IPropsWidgetHeading {
        widgetName: string;
        editMode: boolean;

        // will only work for authoring-react
        customContent?: JSX.Element;
    }

    export interface IGridComponentProps {
        columns: number;
        boxed?: boolean;
        children: React.ReactNodeArray;
    }

    export interface IAlertComponentProps {
        type: 'info' | 'warning' | 'error';
        message: string;
        title?: string;

        /** actions will be rendered as small icon-buttons on the right */
        actions?: Array<{
            label: string;
            onClick(): void;
            icon?: string;
        }>;
        size?: 'small';
        hollow?: boolean;
    }

    export interface IFigureComponentProps {
        caption: string;
        onRemove?: () => void;
        children?: React.ReactNode;
    }

    export interface IDropZoneComponentProps {
        label?: string;
        className?: string;
        multiple?: boolean;
        onDrop: (event: DragEvent) => void;
        canDrop: (event?: DragEvent) => boolean;

        onFileSelect?: (files: Array<File>) => void;
        fileAccept?: string;
    }

    export interface IModalProps {
        'data-test-id'?: string;
        size?: 'large' | 'extra-large' | 'fill' | 'full-screen';
    }

    export interface IPropsModalHeader {
        onClose?(): void;
    }

    export interface IModalFooterProps {
        flex?: boolean;
    }

    export interface IGenericListPageComponent<T> {
        openPreview(id: string): void;
        startEditing(id: string): void;
        closePreview(): void;
        setFiltersVisibility(nextValue: boolean): void;
        handleFilterFieldChange(field: string, nextValue: any, callback): void;
        openNewItemForm(initialValues?: {[key: string]: any}): void;
        closeNewItemForm(): void;
        deleteItem(item: T): void;
        getActiveFilters(): Partial<T>;
        removeFilter(fieldName: string): void;
        getItemsCount(): number;
        itemIsBeingEdited(): boolean;
        itemIsBeingCreated(): boolean;
    }

    export interface IPropsSelectUser {
        onSelect(user: IUser): void;
        selectedUserId?: string;
        disabled?: boolean;
        autoFocus?: boolean;
        horizontalSpacing?: boolean;
    }

    export interface IDropdownTreeGroup<T> {
        render(): JSX.Element | null;
        items: Array<T | IDropdownTreeGroup<T>>;
    }

    export interface IPropsDropdownTree<T> {
        groups: Array<IDropdownTreeGroup<T>>;
        getToggleElement(isOpen: boolean, onClick: () => void): JSX.Element;
        renderItem(key: string, item: T, closeDropdown: () => void): JSX.Element;
        wrapperStyles?: React.CSSProperties;
        'data-test-id'?: string;
    }

    export interface ISpacingProps {
        margin?: number;
        marginTop?: number;
        marginRight?: number;
        marginBottom?: number;
        padding?: number;
        paddingTop?: number;
        paddingRight?: number;
        paddingBottom?: number;
    }

    interface IPropsBadge extends ISpacingProps {
        type: 'default' | 'primary' | 'success' | 'warning' | 'alert' | 'highlight' | 'light';
        square?: boolean;
    }

    export interface IPropsIcon {
        className: string;
        size?: number;
    }

    export interface IPropsIconBig {
        name: string;
    }

    export interface ISpacerBlock {
        h?: boolean; // horizontal
        v?: boolean; // vertical
        gap: '4' | '8' | '16' | '32' | '64';
    }

    export interface IPropsSpacerInlineFlex {
        h?: boolean; // horizontal
        v?: boolean; // vertical
        gap: '4' | '8' | '16' | '32' | '64';
        gapSecondary?: '4' | '8' | '16' | '32' | '64';
        style?: React.CSSProperties;
    }

    export interface IPropsSpacer {
        h?: boolean; // horizontal
        v?: boolean; // vertical
        gap: '4' | '8' | '16' | '32' | '64';
        justifyContent?: 'start' | 'end' | 'center' | 'space-around' | 'space-between' | 'space-evenly' | 'stretch';
        alignItems?: 'start' | 'end' | 'center' | 'stretch';
        noGrow?: boolean;

        /**
         * Will not wrap children in div elements.
         * `noGrow` prop would then not be relevant.
         */
        noWrap?: boolean;

        style?: React.CSSProperties;

        children: Array<React.ReactNode>;
    }

    export interface ILiveQueryProps<T extends IBaseRestApiResponse> {
        resource: string;
        query: ISuperdeskQuery;
        children: (result: IRestApiResponse<T>) => JSX.Element;
    }

    export interface ILiveResourcesProps {
        resources: Array<{resource: string, ids?: Array<string>}>;
        children: (result: Array<IRestApiResponse<any>>) => JSX.Element;
    }

    export interface IAttachmentsWidgetProps {
        attachments: Array<IAttachment>;
        readOnly?: boolean;
        isWidget: boolean;
        addAttachments(attachments: Array<IAttachment>): void;
        removeAttachment(attachment: IAttachment): void;
        isUploadValid(files: Array<File>): boolean;

        /**
         * Attachments are stored in a separate DB collections.
         * Components implementing this interface are responsible for updating attachment resources.
         * This method is meant for signalling the fact that an attachment has been updated,
         * so parent component can then reload UI to reflect latest attachment data.
         */
        onAttachmentUpdated(attachment: IAttachment): void;
    }

    export interface IIgnoreCancelSaveProps {
        title: string;
        body: React.ReactNode;
        hideIgnore?: boolean;
        hideCancel?: boolean;
        hideSave?: boolean;
    }

    export type IIgnoreCancelSaveResponse = 'ignore' | 'cancel' | 'save';
    // HELPERS

    export interface ITreeNode<T> {
        value: T;
        parent?: ITreeNode<T>;
        children?: Array<ITreeNode<T>>;
    }



    // EDITOR3
    export interface IEditor3AnnotationInputTab {
        label: string;
        selectedByDefault(annotationText: string, mode: 'create' | 'edit'): Promise<boolean>;
        component: React.ComponentType<IPropsAnnotationInputComponent>;
        onAnnotationCreate(language: string, annotationText: string, definitionHtml: string): void;
    }

    export interface IPropsAnnotationInputComponent {
        annotationText: string;
        annotationInputComponent: React.ReactElement<any>;
        annotationTypeSelect: JSX.Element;
        mode: 'create' | 'edit';
        onCancel(): void;
        onApplyAnnotation(html: string): void;
    }

    export type FORMATTING_OPTION =
        'h1' |
        'h2' |
        'h3' |
        'h4' |
        'h5' |
        'h6' |
        'justifyLeft' |
        'justifyCenter' |
        'justifyRight' |
        'justifyFull' |
        'outdent' |
        'indent' |
        'unordered list' |
        'ordered list' |
        'pre' |
        'quote' |
        'media' |
        'link' |
        'superscript' |
        'subscript' |
        'strikethrough' |
        'underline' |
        'italic' |
        'bold' |
        'table';

    export type PLAINTEXT_FORMATTING_OPTION = 'uppercase' | 'lowercase';

    export type RICH_FORMATTING_OPTION =
        PLAINTEXT_FORMATTING_OPTION |
        'h1' |
        'h2' |
        'h3' |
        'h4' |
        'h5' |
        'h6' |
        'ordered list' |
        'unordered list' |
        'quote' |
        'media' |
        'link' |
        'embed' |
        'underline' |
        'italic' |
        'bold' |
        'table' |
        'formatting marks' |
        'remove format' |
        'remove all format' |
        'annotation' |
        'comments' |
        'suggestions' |
        'pre' |
        'superscript' |
        'subscript' |
        'strikethrough' |
        'tab' |
        'tab as spaces' |
        'undo' |
        'redo';

    export interface IEditor3HtmlProps {
        value: string;
        onChange(value: string): void;
        readOnly: boolean;

        // If set, it will be used to make sure the toolbar is always
        // visible when scrolling. If not set, window object is used as reference.
        // Any valid jQuery selector will do.
        scrollContainer?: any;

        // Editor format options that are enabled and should be displayed
        // in the toolbar.
        editorFormat?: Array<RICH_FORMATTING_OPTION>;
    }



    // DATA API

    export interface IDataRequestParams {
        method: 'GET' | 'POST';
        endpoint: string;
        data?: any;
        params?: any;
    }

    type IRequestFactory = () => IDataRequestParams;

    type IResponseHandler = (res: IRestApiResponse<T>) => any;

    export interface IDataProvider {
        update: () => void;
        stop: () => void;
    }

    export interface IListenTo {
        [resource: string]: {
            create?: true;
            delete?: true;
            update?: true | Array<string>;
        } | true;
    }

    export interface IAbortablePromise<T> {
        response: Promise<T>;
        abort(): void;
    }

    export interface IDataApi {
        findOne<T>(endpoint: string, id: string): Promise<T>;
        create<T>(endpoint: string, item: Partial<T>, urlParams?: Dictionary<string, any>): Promise<T>;
        query<T extends IBaseRestApiResponse>(
            endpoint: string,
            page: number,
            sortOption: ISortOption,
            filterValues: ICrudManagerFilters,
            max_results?: number,
            formatFiltersForServer?: (filters: ICrudManagerFilters) => ICrudManagerFilters,
        ): Promise<IRestApiResponse<T>>;
        queryRawJson<T>(endpoint, params?: Dictionary<string, any>): Promise<T>;
        queryRaw<T>(endpoint, params?: Dictionary<string, any>): Promise<Response>;
        abortableQueryRaw(endpoint, params?: Dictionary<string, any>): IAbortablePromise<Response>;
        patch<T extends IBaseRestApiResponse>(endpoint, current: T, next: Partial<T>): Promise<T>;
        patchRaw<T extends IBaseRestApiResponse>(endpoint, id: T['_id'], etag: T['_etag'], patch: Partial<T>): Promise<T>;
        delete<T extends IBaseRestApiResponse>(endpoint, item: T): Promise<void>;
        uploadFileWithProgress<T>(endpoint: string, data: FormData, onProgress?: (event: ProgressEvent) => void): Promise<T>;
        createProvider: (requestFactory: IRequestFactory, responseHandler: IResponseHandler, listenTo?: IListenTo) => IDataProvider;
    }

    // EVENTS

    export interface IArticleUpdateEvent {
        user: string;
        items: {[itemId: string]: 1};
        desks: {[itemId: string]: 1};
        stages: {[itemId: string]: 1};
    }

    export interface IResourceUpdateEvent {
        fields: {[key: string]: 1};
        resource: string;
        _id: string;
    }

    export interface IResourceChange {
        changeType: 'created' | 'updated' | 'deleted';
        resource: string;
        itemId: string;
        fields?: {[key: string]: 1};
    }

    export interface IResourceCreatedEvent {
        resource: string;
        _id: string;
    }

    export interface IResourceDeletedEvent {
        resource: string;
        _id: string;
    }

    export interface IEvents {
        articleEditStart: IArticle;
        articleEditEnd: IArticle;

        articlePreviewStart: IArticle;
        articlePreviewEnd: IArticle;

        // Attachments
        attachmentsAdded: Array<IAttachment>;
        attachmentRemoved: IAttachment;
        attachmentUpdated: IAttachment;

        menuItemBadgeValueChange: {menuId: string; badgeValue: string};

        // Desks
        activeDeskChanged: {desk: IDesk['_id']; stage: IStage['_id'];}
    }

    export interface IWebsocketMessage<T> {
        event: string;
        extra: T;
        _created: string;
        _process: string;
    }

    export interface IPublicWebsocketMessages {
        'content:update': IWebsocketMessage<IArticleUpdateEvent>;
        'resource:created': IWebsocketMessage<IResourceCreatedEvent>;
        'resource:updated': IWebsocketMessage<IResourceUpdateEvent>;
        'resource:deleted': IWebsocketMessage<IResourceDeletedEvent>;
    }

    export interface INotifyMessageOptions {
        button?: {
            onClick(): void;
            label: string;
        }
    }

    export interface IElasticExistsQueryParams {
        field: string;
    }

    export interface IElasticExistsQuery {
        exists: IElasticExistsQueryParams;
    }

    export interface IElasticTermQueryParams {
        field: string;
        value: string;
        boost?: number; // Defaults to 1.0
    }

    export interface IElasticTermQuery {
        term: {[field: string]: Omit<IElasticTermQueryParams, 'field'>};
    }

    export interface IElasticTermsQueryParams {
        field: string;
        value: Array<string>;
        boost?: number; // Defaults to 1.0
    }

    export interface IElasticTermsQuery {
        terms: {
            [field: string]: IElasticTermsQuery['value'];
            boost?: IElasticTermsQuery['boost'];
        };
    }

    export interface IElasticMatchPhraseQueryParams {
        field: string;
        query: string;
        analyzer?: string; // Defaults to the default analyzer
    }

    export interface IElasticMatchPhraseQuery {
        match_phrase: {
            [field: string]: Omit<IElasticMatchPhraseQueryParams, 'field'>;
        }
    }

    export interface IElasticMatchQueryParams {
        field: string;
        query: string;
        analyzer?: string; // Defaults to default analyzer
        auto_generate_synonyms_phrase_query?: boolean; // Defaults to true
        fuzziness?: string;
        max_expansions?: number; // Defaults to 50
        prefix_length?: number; // Defaults to 0
        fuzzy_transpositions?: boolean; // Defaults to true
        fuzzy_rewrite?: string;
        lenient?: boolean; // Defaults to false
        operator?: 'OR' | 'AND'; // Defaults to `OR`
        minimum_should_match?: number | string;
        zero_terms_query?: 'none' | 'all'; // Defaults to `none`
    }

    export interface IElasticMatchQuery {
        match: {
            [field: string]: Omit<IElasticMatchQueryParams, 'field'>;
        };
    }

    export interface IElasticRangeQueryParams {
        field: string;
        gt?: string | number;
        gte?: string | number;
        lt?: string | number;
        lte?: string | number;
        format?: string;
        relation?: 'INTERSECTS' | 'CONTAINS' | 'WITHIN'; // Defaults to `INTERSECTS`
        time_zone?: string;
        boost?: number; // Defaults to 1.0
    }

    export interface IElasticRangeQuery {
        range: {
            [field: string]: Omit<IElasticRangeQueryParams, 'field'>;
        }
    }

    export interface IElasticQueryStringParams {
        query: string;
        default_field?: string;
        allow_leading_wildcard?: boolean; // Defaults to true
        analyze_wildcard?: boolean; // Defaults to false
        analyzer?: string; // Defaults to default analyzer
        auto_generate_synonyms_phrase_query?: boolean; // Defaults to true
        boost?: number; // Defaults to 1.0
        default_operator?: 'OR' | 'AND'; // Defaults to 'OR'
        enable_position_increments?: boolean; // Defaults to true
        fields?: Array<string>;
        fuzziness?: string;
        fuzzy_max_expansions?: number; // Defaults to 50
        fuzzy_prefix_length?: number; // Defaults to 0
        fuzzy_transpositions?: boolean; // Defaults to true
        lenient?: boolean; // Defaults to false
        max_determinized_states?: number; // Defaults to 10000
        minimum_should_match?: string;
        quote_analyzer?: string;
        phrase_slop?: number; // Defaults to 0
        quote_field_suffix?: string;
        rewrite?: string;
        time_zone?: string;
    }

    export interface IElasticQueryStringQuery {
        query_string: IElasticQueryStringParams;
    }

    export type IElasticQuery = IElasticExistsQuery |
        IElasticTermQuery |
        IElasticTermsQuery |
        IElasticMatchPhraseQuery |
        IElasticMatchQuery |
        IElasticRangeQuery |
        IElasticQueryStringQuery;


    export interface IElasticBoolQueryParams {
        must: Array<IElasticQuery>;
        must_not: Array<IElasticQuery>;
        filter?: Array<IElasticQuery>;
        should?: Array<IElasticQuery>;
        minimum_should_match?: string;
        boost?: number; // Defaults to 1.0
    }

    export interface IElasticBoolQuery {
        bool: IElasticBoolQueryParams;
    }

    export interface IRootElasticQuery {
        query: {
            bool: IElasticBoolQueryParams;
        };
        size?: number;
        from?: number;
    }

    export interface IElasticSearchApi {
        exists(params: IElasticExistsQueryParams): IElasticExistsQuery;
        term(params: IElasticTermQueryParams): IElasticTermQuery;
        terms(params: IElasticTermsQueryParams): IElasticTermsQuery;
        matchPhrase(params: IElasticMatchPhraseQueryParams): IElasticMatchPhraseQuery;
        match(params: IElasticMatchQueryParams): IElasticMatchQuery;
        range(params: IElasticRangeQueryParams): IElasticRangeQuery;
        queryString(params: IElasticQueryStringParams): IElasticQueryStringQuery;
        bool(params: IElasticBoolQueryParams): IElasticBoolQuery;
    }

    // Copied from 'superdesk-ui-framework/react/components/DatePicker.tsx
    // Otherwise we have to import it here, which causes issues with extensions
    export interface DatePickerLocaleSettings {
        firstDayOfWeek?: number;
        dayNames: string[];
        dayNamesShort: string[];
        dayNamesMin: string[];
        monthNames: string[];
        monthNamesShort: string[];
    }

    // APPLICATION API

    export interface IAttachmentsApi {
        byArticle(article: IArticle): Promise<Array<IAttachment>>;
        byId(id: IAttachment['_id']): Promise<IAttachment>;
        create(attachment: Partial<IAttachment>): Promise<IAttachment>;
        save(original: IAttachment, updates: Partial<IAttachment>): Promise<IAttachment>;
        delete(attachment: IAttachment): Promise<void>;
        upload(attachment: Partial<IAttachment>, file: File, onProgress?: (event: ProgressEvent) => void): Promise<IAttachment>;
        download(attachment: IAttachment): void;
        getMediaId(attachment: IAttachment): IMedia['_id'];
    }

    export interface IPatchingOptions {
        /**
         * If current value is `undefined` and next value is `null`,
         * treat it as equal.
         */
        undefinedEqNull: boolean;
    }

    export type ISuperdesk = DeepReadonly<{
        dataApi: IDataApi,
        dataApiByEntity: {
            article: {
                query(parameters: IArticleQuery): Promise<IArticleQueryResult>;
            };
        };
        elasticsearch: IElasticSearchApi;
        httpRequestJsonLocal<T>(options: IHttpRequestJsonOptionsLocal): Promise<T>;
        httpRequestRawLocal<T>(options: IHttpRequestOptionsLocal): Promise<Response>;
        state: {
            articleInEditMode?: IArticle['_id'];
        };
        instance: {
            config: ISuperdeskGlobalConfig;
        };

        /** Retrieves configuration options passed when registering an extension. */
        getExtensionConfig(): {[key: string]: any};

        ui: {
            article: {
                view(id: IArticle['_id']): void;

                // This isn't implemented for all fields accepting images.
                addImage(field: string, image: IArticle): void;

                /**
                 * Programatically triggers saving of an article in edit mode.
                 * Runs the same code as if "save" button was clicked manually.
                */
                save(): void;
            };
            alert(message: string): Promise<void>;
            confirm(message: string, title?: string): Promise<boolean>;
            showIgnoreCancelSaveDialog(props: IIgnoreCancelSaveProps): Promise<IIgnoreCancelSaveResponse>;
            notify: {
                info(text: string, displayDuration?: number, options?: INotifyMessageOptions): void;
                success(text: string, displayDuration?: number, options?: INotifyMessageOptions): void;
                warning(text: string, displayDuration?: number, options?: INotifyMessageOptions): void;
                error(text: string, displayDuration?: number, options?: INotifyMessageOptions): void;
            },
            framework: {
                getLocaleForDatePicker(targetLocale?: string): DatePickerLocaleSettings;
            };
        };
        entities: {
            article: {
                isLocked(article: IArticle): boolean; // returns true if locked by anyone, including the current user
                isLockedInCurrentSession(article: IArticle): boolean;
                isLockedInOtherSession(article: IArticle): boolean;

                isPersonal(article: IArticle): boolean;
                patch(
                    article: IArticle,
                    patch: Partial<IArticle>,
                    dangerousOptions?: IDangerousArticlePatchingOptions,
                ): Promise<void>;

                isArchived(article: IArticle): boolean;
                isPublished(article: IArticle): boolean;
            };
            contentProfile: {
                get(id: string): Promise<IContentProfile>;
            };
            vocabulary: {
                getIptcSubjects(): Promise<Array<ISubject>>;
                getVocabulary(id: string): IVocabulary;
            };
            desk: {
                getStagesOrdered(deskId: IDesk['_id']): Promise<Array<IStage>>;
                getActiveDeskId(): IDesk['_id'] | null;
                waitTilReady(): Promise<void>;
            };
            attachment: IAttachmentsApi;
            users: {
                getUsersByIds(ids: Array<IUser['_id']>): Promise<Array<IUser>>;
            };
        };
        helpers: {
            assertNever(x: never): never;
            stripBaseRestApiFields<T extends IBaseRestApiResponse>(entity: T): Omit<T, keyof IBaseRestApiResponse>;
            fixPatchResponse<T extends IBaseRestApiResponse>(entity: T & {_status: string}): T;
            fixPatchRequest<T extends {}>(entity: T): T;
            filterUndefined<T>(values: Partial<T>): Partial<T>;
            filterKeys<T>(original: T, keys: Array<keyof T>): Partial<T>;
            stringToNumber(value?: string, radix?: number): number | undefined;
            numberToString(value?: number): string | undefined;
            notNullOrUndefined<T>(x: null | undefined | T): x is T;
            isNullOrUndefined<T>(x: null | undefined | T): x is null | undefined;
            nameof<T>(name: keyof T): string;
            tryLocking<T extends ILockInfo & IBaseRestApiResponse>(
                endpoint: string,
                entityId: string,
                force: boolean = false,
            ): Promise<{success: boolean; latestEntity: T}>;
            tryUnlocking<T extends ILockInfo & IBaseRestApiResponse>(
                endpoint: string,
                entityId: string,
            ): Promise<void>;
            computeEditor3Output(
                rawContentState: import('draft-js').RawDraftContentState,
                config: IEditor3Config,
                language: string,
            ): IEditor3Output;
            getContentStateFromHtml(html: string): import('draft-js').ContentState;
        },
        components: {
            UserHtmlSingleLine: React.ComponentType<{html: string}>;
            getGenericHttpEntityListPageComponent<T extends IBaseRestApiResponse, P>(
                resource: string,
                formConfig: IFormGroup,
                defaultSortOption?: ISortOption,
                additionalProps?: P,
            ): React.ComponentType<IPropsGenericForm<T, P>>;
            getGenericArrayListPageComponent<T, P>(): React.ComponentType<IPropsGenericArrayListPage<T, P>>;
            connectCrudManagerHttp<Props, PropsToConnect, Entity extends IBaseRestApiResponse>(
                WrappedComponent: React.ComponentType<Props & PropsToConnect>,
                name: string,
                endpoint: string,
                defaultSortOption?: ISortOption,
                formatFiltersForServer?: (filters: ICrudManagerFilters) => ICrudManagerFilters,
            ): React.ComponentType<Props>;
            getVirtualListFromQuery<IEntity extends IBaseRestApiResponse, IEntitiesToJoin>(): React.ComponentType<IPropsVirtualListFromQuery<IEntity, IEntitiesToJoin>>;
            SelectFromEndpoint: React.ComponentClass<IPropsSelectFromRemote<any>>
            ListItem: React.ComponentType<IListItemProps>;
            ListItemColumn: React.ComponentType<IPropsListItemColumn>;
            ListItemRow: React.ComponentType<IPropsListItemRow>;
            ListItemActionsMenu: React.ComponentType;
            List: {
                Item: React.ComponentType<{onClick: any}>;
                Row: React.ComponentType;
                Column: React.ComponentType<{grow: boolean}>;
            },
            Grid: React.ComponentType<IGridComponentProps>;
            Alert: React.ComponentType<IAlertComponentProps>;
            Figure: React.ComponentType<IFigureComponentProps>;
            DropZone: React.ComponentType<IDropZoneComponentProps>;
            Modal: React.ComponentType<IModalProps>;
            ModalHeader: React.ComponentType<IPropsModalHeader>;
            ModalBody: React.ComponentType;
            ModalFooter: React.ComponentType<IModalFooterProps>;
            Badge: React.ComponentType<IPropsBadge>;
            SelectUser: React.ComponentType<IPropsSelectUser>;
            UserAvatar: React.ComponentType<{userId: string}>;
            ArticleItemConcise: React.ComponentType<{article: IArticle}>;
            GroupLabel: React.ComponentType<ISpacingProps>;
            InputLabel: React.ComponentType<{text: string}>;
            Icon: React.ComponentType<IPropsIcon>;
            IconBig: React.ComponentType<IPropsIconBig>;
            TopMenuDropdownButton: React.ComponentType<{onClick: () => void; disabled?: boolean; active: boolean; pulsate?: boolean; 'data-test-id'?: string; tooltip?:string}>;

            // TODO: move the component with all its dependencies to a separate project and use via npm package
            getAuthoringComponent: <T extends IBaseRestApiResponse>() => React.ComponentType<IPropsAuthoring<T>>;

            getLockInfoHttpComponent: <T>() => React.ComponentType<IPropsLockInfoHttp<T>>;
            getLockInfoComponent: <T>() => React.ComponentType<IPropsLockInfo<T>>;
            getDropdownTree: <T>() => React.ComponentType<IPropsDropdownTree<T>>;
            getLiveQueryHOC: <T extends IBaseRestApiResponse>() => React.ComponentType<ILiveQueryProps<T>>;
            WithLiveResources: React.ComponentType<ILiveResourcesProps>;
            Spacer: React.ComponentType<IPropsSpacer>;
            SpacerBlock: React.ComponentType<ISpacerBlock>;
            SpacerInlineFlex: React.ComponentType<IPropsSpacerInlineFlex>;
            Center: React.ComponentType;
            Editor3Html: React.ComponentType<IEditor3HtmlProps>;
            AuthoringWidgetHeading: React.ComponentType<IPropsWidgetHeading>;
            AuthoringWidgetLayout: React.ComponentType<IAuthoringWidgetLayoutProps>;
            DateTime: React.ComponentType<IPropsDateTime>;
        };
        authoringGeneric: {
            sideWidgets: {
                comments: <T>(
                    getComments: (entityId: string) => Promise<Array<IComment>>,
                    addComment: (entityId: string, text: string) => Promise<void>,
                    isAllowed: (entity: T) => boolean,
                ) => IGenericSideWidget<T>;
                inlineComments: IGenericSideWidget<T>;
            };
        };
        forms: {
            FormFieldType: typeof FormFieldType;
            generateFilterForServer(type: FormFieldType, value: any): any;
            isIFormGroupCollapsible(x: "inline" | IFormGroupCollapsible): x is IFormGroupCollapsible;
            isIFormGroup(x: IFormGroup | IFormField): x is IFormGroup;
            isIFormField(x: IFormGroup | IFormField): x is IFormField;
            getFormFieldPreviewComponent(
                item: {
                    readonly [key: string]: any;
                },
                formFieldConfig: any,
                options: {showAsPlainText?: boolean} = {}
            ): JSX.Element;
        };
        localization: {
            gettext(message: string, params?: {[placeholder: string]: string | number | React.ComponentType}): string;
            gettextPlural(count: number, singular: string, plural: string, params?: {[placeholder: string]: string | number | React.ComponentType}): string;
            formatDate(date: Date | string): string;
            formatDateTime(date: Date): string;
            longFormatDateTime(date: Date | string): string;
            getRelativeOrAbsoluteDateTime(
                datetimeString: string,
                format: string,
                relativeDuration?: number, // = 1
                relativeUnit?: string, // = 'days'
            ): string;
        };
        privileges: {
            hasPrivilege(privilege: string): boolean;
        };
        preferences: {
            get(key: string): Promise<any | null>;
            set(
                key: string,
                value: any,
            ): Promise<void>;
        };
        session: {
            getToken(): string;
            getCurrentUser(): Promise<IUser>;
            getSessionId(): String;
            getCurrentUserId(): String;
        };
        browser: {
            location: {
                getPage(): string;
                setPage(page: string);
                urlParams: {
                    // Strings
                    getString(field: string, defaultValue?: string): string | undefined;
                    setString(field: string, value?: string);

                    // Tags
                    getStringArray(field: string): Array<string> | undefined;
                    setStringArray(field: string, value: Array<string>): void;

                    // Numbers
                    getNumber(field: string, defaultValue?: number): number | undefined;
                    setNumber(field: string, value?: number);

                    // Booleans
                    getBoolean(field: string, defaultValue?: boolean): boolean | undefined;
                    setBoolean(field: string, value?: boolean);

                    // Dates
                    getDate(field: string, defaultValue?: Date): Date | undefined;
                    setDate(field: string, value?: Date);

                    // JSON
                    getJson<T = any>(field: string, defaultValue?: T): T | undefined;
                    setJson<T>(field: string, value?: T);
                };
            };
        };
        utilities: {
            CSS: {
                getClass(originalName: string): string;
                getId(originalName: string): string;
            };
            logger: {
                error(error: Error): void;
                warn(message: string, json: {[key: string]: any}): void;
            };
            dateToServerString(date: Date): string; // outputs a string for parsing by the server
            memoize<T extends ICallable>(func: T, maxCacheEntryCount?: number): T; // maxCacheEntryCount = 1
            generatePatch<T>(a: Partial<T>, b: Partial<T>, options?: IPatchingOptions): Partial<T>;
            stripHtmlTags(htmlString: string): string;
            getLinesCount(plainText: string): number | null;

            /**
             * When throttled function is called more frequently than specified via `wait` param,
             * it stores the arrays in memory and after the wait times out
             * it then invokes the handler function with all stored values.
             */
            throttleAndCombineArray<T>(
                fn: IHandler<Array<T>>,
                wait: number,
                options?: import('lodash').ThrottleSettings,
            );

            querySelectorParent(
                element: HTMLElement,
                selector: string,
                options?: {
                    self: boolean; // will check the current element too if set to true
                },
            ): HTMLElement | null;

            arrayToTree<T>(
                itemsFlat: Array<T>,
                getId: (item: T) => string,
                getParentId: (item: T) => string | undefined | null,
            ): {result: Array<ITreeNode<T>>, errors: Array<T>};
            treeToArray<T>(tree: Array<ITreeNode<T>>): Array<T>;

            // generic method - works on all enabled endpoints
            isLockedInCurrentSession<T extends ILockInfo>(entity: T): boolean;
            isLockedInOtherSession<T extends ILockInfo>(entity: T): boolean;
        };
        addWebsocketMessageListener<T extends string>(
            eventName: T,
            handler: (event: T extends keyof IPublicWebsocketMessages
                ? CustomEvent<IPublicWebsocketMessages[T]>
                : CustomEvent<IWebsocketMessage<any>>
            ) => void
        ): () => void; // returns a function to remove event listener
        addEventListener<T extends keyof IEvents>(eventName: T, fn: (arg: IEvents[T]) => void): void;
        removeEventListener<T extends keyof IEvents>(eventName: T, fn: (arg: IEvents[T]) => void): void;
        dispatchEvent<T extends keyof IEvents>(eventName: T, payload: IEvents[T]): void;
    }>;

    export interface IAuthorsFieldOptions {
        displayField: keyof IUser;
        includeRoles: Array<string>; // qcodes
    }

    // Use a union type to add more fields. Listing them explicitly here will help to get static typing in the instance config file.
    export type IListViewFieldWithOptions =
        {
            field: 'authors';
            options: IAuthorsFieldOptions;
        };


    export interface ISuperdeskGlobalConfig {
        // FROM SERVER
        default_language: string;
        disallowed_characters: Array<string>; // applies to slugline
        schema: any;
        editor: {
            vidible?: any;
            picture?: any;
        };
        feedback_url: any;
        override_ednote_for_corrections: any;
        override_ednote_template: any;
        default_genre: any;
        japanese_characters_per_minute: any;
        validator_media_metadata: any;
        publish_content_expiry_minutes: any;
        high_priority_queue_enabled: any;
        attachments_max_size: any;
        attachments_max_files: any;
        ingest_expiry_minutes: any;
        content_expiry_minutes: any;
        xmpp_auth: any;
        saml_auth: any;
        google_auth: any;
        saml_label: any;
        oidc_auth: any;
        keycloak_config: any;

        /**
         * Enable autocomplete for supported text fields in authoring.
         * Values of published items are used for autocomplete suggestions.
         */
        archive_autocomplete: boolean;

        /** allow updates for items which aren't published yet */
        workflow_allow_multiple_updates: boolean;

        /** allow users who are not members of a desk to duplicate its content */
        workflow_allow_duplicate_non_members: boolean;

        /** allow users to copy from desk to personal space */
        workflow_allow_copy_to_personal: boolean;

        allow_updating_scheduled_items: boolean;

        corrections_workflow: boolean;

        default_timezone: string;

        // TANSA SERVER CONFIG
        tansa?: {
            base_url: string;
            app_id: string;
            app_version: string;
            user_id: string;
            profile_id: number;
            license_key: string;
            profiles: {[language: string]: number};
        },

        // FROM CLIENT

        importApps: Array<string>; // paths are relative to client/dist

        server: {
            url: string;
            ws: any;
        };
        apps: any;
        defaultRoute: string;
        startingDay: any;
        features: {
            swimlane?: {
                defaultNumberOfColumns: number;
            };
            qumu?: boolean;
            editorAttachments?: boolean;
            editorInlineComments?: boolean;
            editorSuggestions?: boolean;
            useTansaProofing?: boolean;
            editFeaturedImage?: any;
            validatePointOfInterestForImages?: any;
            autopopulateByline?: any;
            noPublishOnAuthoringDesk?: any;
            confirmMediaOnUpdate?: any;
            noMissingLink?: any;
            hideRoutedDesks?: any;

            /**
             * If set to false, a refresh icon will be displayed
             * instead of reloading the list automatically
             * when items are created/deleted
             */
            autorefreshContent?: boolean;

            elasticHighlight?: any;
            nestedItemsInOutputStage?: boolean;
            keepMetaTermsOpenedOnClick?: boolean;
            showCharacterLimit?: number;
            sendToPersonal?: boolean;
            publishFromPersonal?: boolean;
            customAuthoringTopbar?: {
                toDesk?: boolean;
                publish?: boolean;
                closeAndContinue?: boolean;
                publishAndContinue?: boolean;
            },
            showPublishSchedule?: boolean
            hideCreatePackage?: boolean;
            confirmDueDate?: boolean;
        };
        auth: {
            google: boolean
        };
        ingest: {
            PROVIDER_DASHBOARD_DEFAULTS: {
                show_log_messages: boolean;
                show_ingest_count: boolean;
                show_time: boolean;
                log_messages: 'error';
                show_status: boolean;
            }
            DEFAULT_SCHEDULE: {
                minutes: number;
                seconds: number;
            }
            DEFAULT_IDLE_TIME: {
                hours: number;
                minutes: number;
            };
        };
        confirm_spike: boolean;
        search: {
            useDefaultTimezone: any;
        };
        search_cvs: any;
        view: {
            dateformat: string; // a combination of YYYY, MM, and DD with a custom separator e.g. 'MM/DD/YYYY'
            timeformat: string;
        };
        user: {
            sign_off_mapping?: string;
            username_pattern?: string;
        };
        infoRemovedFields: {};
        previewSubjectFilterKey: any;
        authoring?: {
            timeToRead?: any;
            lineLength?: number;
            preview?: {
                hideContentLabels: boolean;
            };
        };
        ui: {
            /**
             * Can set embargo in publishing pane. Defaults to true;
             */
            publishEmbargo?: boolean;

            /**
             * Allows sending item to another desk before publishing.
             * The button is labeled "publish from".
             */
            sendAndPublish?: any;

            italicAbstract?: any;
            sendPublishSchedule?: boolean;

            /**
             * Can set embargo in "send to" pane. Defaults to true;
             */
            sendEmbargo?: boolean;

            sendDefaultStage?: 'working' | 'incoming';
            authoring?: {
                firstLine?: {
                    wordCount?: boolean;
                };
            };
        };
        list: {
            narrowView?: any;
            singleLineView?: any;
            singleLine?: any;
            priority?: Array<string>;
            firstLine?: Array<string | IListViewFieldWithOptions>,
            secondLine?: Array<string | IListViewFieldWithOptions>,
            relatedItems?: {
                firstLine: Array<string | IListViewFieldWithOptions>,
                secondLine: Array<string | IListViewFieldWithOptions>,
            };
        };
        gridViewFields: Array<string>;
        gridViewFooterFields: {
            left: Array<string>;
            right: Array<string>;
        };
        swimlaneViewFields: any;
        item_profile: {
            change_profile: any;
        };
        model: {
            timeformat: string;
            dateformat: string;
        };
        monitoring: {
            scheduled: any;
        };
        defaultSearch: any;
        profile: any;
        profileLanguages: Array<any>;
        subscriptionLevel: any;
        workspace: any;
        activity: any;
        analytics: {
            piwik: {
                url: any;
            };
            ga: {
                id: any;
            };
        };
        longDateFormat: any;
        shortTimeFormat: any;
        shortDateFormat: any;
        shortWeekFormat: any;
        ArchivedDateFormat: any;
        ArchivedDateOnCalendarYear: any;
        iframely: {
            key: any;
        };
        raven: {
            dsn: any;
        };
        version: any;
        releaseDate: any;
        isTestEnvironment: any;
        environmentName: any;
        paths: {
            superdesk: any;
        };
        editor3: {
            browserSpellCheck: boolean;
        };
        pictures?: {
            minWidth?: number;
            minHeight?: number;
        }
        langOverride: {[langCode: string]: {[originalString: string]: string}};
        transmitter_types: Array<{
            type: string;
            name: string;
            config: any;
            template_url?: string;
        }>;

        userOnlineMinutes: number;

        iMatricsFields: {
            entities: {
                [key: string]: {
                    name: string;
                    order: number;
                };
            },
            others: {
                [key: string]: {
                    name: string;
                    order: number;
                };
            }
        };

        media: {
            renditions: {
                [media_type: string]: {
                    [rendition_name: string]: {
                        width: number;
                        height: number;
                    };
                };
            };
        };
    }

    export interface ITemplate extends IBaseRestApiResponse {
        data: IArticle,
        is_public: boolean,
        next_run?: any;
        schedule?: any;
        template_desks: Array<IDesk['_id']>,
        template_name: string,
        template_type: 'create' | 'kill' | string,
        user: IUser['_id']
    }


    // CUSTOM FIELD TYPES

    export interface IEditorComponentContainerProps {
        /**
         * miniToolbar is meant for displaying a small amount of details like character count.
         * It's implemented as a separate prop, in order to allow flexible layout options.
         * (it will be rendered in different DOM locations depending if field is in header or content section)
         */
        miniToolbar?: JSX.Element;
    }

    export interface IEditorComponentProps<IValue, IConfig, IEditorPreferences> {
        /**
         * editorId is needed in order for certain actions to only be applied to
         * a particular editor in case many are present at once e.g. find and replace
         */
        editorId: string;

        /**
         * All editor components must return a container(or null) from a render method. (main content goes as props.children)
         * This is required to:
         *   - allow parent component to control the location of toolbar in the DOM
         *   - allows editors to hide an editor entirely in certain cases. (needed for anpa_category)
         */
        container: React.ComponentType<IEditorComponentContainerProps>;

        value: IValue;
        onChange: (value: IValue) => void;
        readOnly: boolean;
        language: string;
        config: IConfig;

        fieldsData: IFieldsData;

        /**
         * Allow persisting editor-specific settings,
         * for example whether to highlight characters that exceed the limit or block further typing.
         */
        editorPreferences: IEditorPreferences | undefined;
        onEditorPreferencesChange(userPreferences: IEditorPreferences): void;

        /**
         * Returns a subset of vocabulary items that are available for use.
         * This is required to implement dependent fields.
         * At the moment, there are only dependent fields based on anpa_category.
         */
        getVocabularyItems(vocabularyId: string): Array<IVocabularyItem>;
    }

    export interface ITemplateEditorComponentProps<IValue, IConfig> {
        language: string;
        value: IValue;
        setValue: (value: IValue) => void;
        readOnly: boolean;
        config: IConfig;
    }

    export interface IPreviewComponentProps<IValue, IConfig> {
        value: IValue;
        config: IConfig;
    }

    export interface IDifferenceComponentProps<IValue, IConfig> {
        config: IConfig;
        value1: IValue;
        value2: IValue;
    }

    export interface ICommonFieldConfig {
        readOnly?: boolean;
        required?: boolean;
        allow_toggling?: boolean;
    }

    export interface IConfigComponentProps<IConfig extends ICommonFieldConfig> {
        config: IConfig | null;
        onChange(config: IConfig): void;
    }

    export interface ICustomFieldRuntimeData<IConfig, IUserPreferences> {
        language: string;
        config: IConfig;
        editorPreferences: IUserPreferences;
        fieldsData: Immutable.Map<string, unknown>;
    }

    export interface ICustomFieldType<IValueOperational, IValueStorage, IConfig, IUserPreferences> {
        id: string;
        label: string;

        editorComponent: React.ComponentClass<IEditorComponentProps<IValueOperational, IConfig, IUserPreferences>>;
        previewComponent: React.ComponentType<IPreviewComponentProps<IValueOperational, IConfig>>;

        /**
         * Must return `true` if not empty.
         */
        hasValue(valueOperational: IValueOperational): boolean;

        /**
         * Must return a value that will be considered empty by `hasValue` function.
         */
        getEmptyValue(config: IConfig, language: string): IValueOperational;


        /**
         * Enables initializing with a custom value when field visibility is toggled from "off" to "on".
         *
         * Also available in field adapters.
         */
        onToggledOn?(options: ICustomFieldRuntimeData<IConfig, IUserPreferences>): IValueOperational;

        configComponent?: React.ComponentType<IConfigComponentProps<IConfig>>;
        templateEditorComponent?: React.ComponentType<ITemplateEditorComponentProps<IValueOperational, IConfig>>;
        differenceComponent?: React.ComponentType<IDifferenceComponentProps<IValueOperational, IConfig>>;

        // may intercept template creation and return modified value
        onTemplateCreate?(value: any, config: IConfig): any;

        /**
         * Allows to use different formats for storage and operation.
         * For example, draft-js uses EditorState for operation, and RawDraftContentState for storage.
         */

        toStorageFormat?(valueOperational: IValueOperational, config: IConfig): IValueStorage;
        toOperationalFormat?(valueStorage: IValueStorage, config: IConfig, language: string): IValueOperational;

        /**
         * Allows custom fields to hook into extension points API.
         */
        contributions?: IExtensionActivationResult['contributions'];
    }


    // IPTC picture metadata

    export interface IPTCMetadata {
        // envelope
        Destination: string;
        ServiceIdentifier: string;
        ProductID: string;
        DateSent: string;
        TimeSent: string;

        // application
        ObjectName: string;
        EditStatus: string;
        Urgency: string;
        SubjectReference: string;
        Category: string;
        SupplementalCategories: string;
        Keywords: string;
        ContentLocationCode: string;
        ContentLocationName: string;
        ReleaseDate: string;
        ReleaseTime: string;
        ExpirationDate: string;
        ExpirationTime: string;
        SpecialInstructions: string;
        DateCreated: string;
        TimeCreated: string;
        'By-line': string;
        'By-lineTitle': string;
        City: string;
        'Sub-location': string;
        'Province-State': string;
        'Country-PrimaryLocationCode': string;
        'Country-PrimaryLocationName': string;
        OriginalTransmissionReference: string;
        Headline: string;
        Credit: string;
        Source: string;
        CopyrightNotice: string;
        Contact: string;
        'Caption-Abstract': string;
        'Writer-Editor': string;
        LanguageIdentifier: string;
    }

    export interface ISubject {
        name: string;
        description?: string;
        qcode: string;
        scheme?: string;
        translations?: {};
        altids?: {[key: string]: string};
        aliases?: Array<string>;

        /** provider name, eg. imatrics */
        source?: string;

        /** original source of the data, eg. wikidata */
        original_source?: string;
        parent?: string;
    }
}
