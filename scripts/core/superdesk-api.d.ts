/* tslint:disable */

declare module 'superdesk-api' {
    // TYPESCRIPT TYPES

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

    export interface IArticleAction {
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

    export interface IExtensionActivationResult {
        contributions?: {
            globalMenuHorizontal?: Array<React.ComponentType>;
            editor3?: {
                annotationInputTabs?: Array<IEditor3AnnotationInputTab>;
            }
            articleListItemWidgets?: Array<React.ComponentType<{article: IArticle}>>;
            articleGridItemWidgets?: Array<React.ComponentType<{article: IArticle}>>;
            authoringTopbarWidgets?: Array<React.ComponentType<{article: IArticle}>>;
            pages?: Array<IPage>;
            customFieldTypes?: Array<ICustomFieldType>;
            notifications?: {
                [id: string]: (notification) => {
                    body: string;
                    actions: Array<{label: string; onClick(): void;}>;
                };
            };
            entities?: {
                article?: {
                    getActions?(article: IArticle): Promise<Array<IArticleAction>>;
                    getActionsBulk?(articles: Array<IArticle>): Promise<Array<IArticleActionBulk>>;
                    onPatchBefore?(id: IArticle['_id'], patch: Partial<IArticle>, dangerousOptions?: IDangerousArticlePatchingOptions,): Promise<Partial<IArticle>>; // can alter patch(immutably), can cancel patching
                    onSpike?(item: IArticle): Promise<onSpikeMiddlewareResult>;
                    onSpikeMultiple?(items: Array<IArticle>): Promise<onSpikeMiddlewareResult>;
                    onPublish?(item: IArticle): Promise<onPublishMiddlewareResult>;
                    onRewriteAfter?(item: IArticle): Promise<IArticle>;
                    onSendBefore?(items: Array<IArticle>, desk: IDesk): Promise<void>;
                };
            };
            iptcMapping?(data: Partial<IPTCMetadata>, item: Partial<IArticle>, parent?: IArticle): Promise<Partial<IArticle>>;
            searchPanelWidgets?: Array<React.ComponentType<ISearchPanelWidgetProps>>;
            authoring?: {
                /**
                 * Updates can be intercepted and modified. Return value will be used to compute a patch.
                 *
                 * Example: onUpdateBefore = (current, next) => ({...next, priority: next.headline.includes('important') ? 10 : 1})
                */
                onUpdateBefore?(current: IArticle, next: IArticle): Promise<IArticle>;

                /** Called after the update. */
                onUpdateAfter?(previous: IArticle, current: IArticle): void;
            };
            monitoring?: {
                getFilteringButtons?(deskId: string): Promise<Array<IMonitoringFilter>>;
            };
        }
    }

    export type ISearchPanelWidgetProps<T> = {
        provider: string;
        params: T;
        setParams: (params: Partial<T>) => void;
    };

    export type IExtension = DeepReadonly<{
        id: string;
        activate: (superdesk: ISuperdesk) => Promise<IExtensionActivationResult>;
        exposes?: {[key: string]: any};
    }>;

    export type IExtensionObject = {
        extension: IExtension;
        activationResult: IExtensionActivationResult;
    };

    export type IExtensions = {[key: string]: IExtensionObject};

    export type ISideMenuItem = DeepReadonly<{
        label: string;
        url: string;
    }>;



    // ENTITIES

    export interface IAuthor {
        role: string;
        parent: string;
    }

    // to use as a value, use enum inside 'scripts/apps/search/interfaces.ts'
    export enum ITEM_STATE {
        /**
         * Item created in user workspace.
         */
        DRAFT = 'draft',

        /**
         * Ingested item in ingest collection, not production.
         */
        INGESTED = 'ingested',

        /**
         * Automatically ingested to desk.
         */
        ROUTED = 'routed',

        /**
         * Item manually fetched from ingest to desk.
         */
        FETCHED = 'fetched',

        /**
         * Item is sent to a desk.
         */
        SUBMITTED = 'submitted',

        /**
         * Work started on a desk.
         */
        IN_PROGRESS = 'in_progress',

        /**
         * Removed from a desk.
         */
        SPIKED = 'spiked',

        /**
         * Published.
         */
        PUBLISHED = 'published',

        /**
         * Scheduled for publishing.
         */
        SCHEDULED = 'scheduled',

        /**
         * Correction is published.
         */
        CORRECTED = 'corrected',

        /**
         * Killed, never publish again.
         */
        KILLED = 'killed',

        /**
         * Sort of killed, never publish again.
         */
        RECALLED = 'recalled',

        /**
         * Unpublished, might be published again.
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
    };

    export interface IArticle extends IBaseRestApiResponse {
        _id: string;
        _current_version: number;
        _type?: 'ingest' | 'archive' | 'published' | 'archived' | 'legal_archive' | string;
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
        genre: any;
        anpa_take_key?: any;
        place: any;
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
        byline: string;
        dateline?: any;
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
        associations?: {[id: string]: IArticle | IRelatedArticle};
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
        version_creator: string;
        state: ITEM_STATE;
        embargo?: any;
        signal?: any;
        broadcast?: {
            master_id?: any; // original story this broadcast version was created from
            status?: any;
        };
        flags: any;
        source: string;
        /** correction counter, is reset on rewrite */
        correction_sequence?: number;
        /** rewrite counter */
        rewrite_sequence?: number;
        fetch_endpoint?: any;
        task_id?: any;
        ingest_provider?: any;
        archive_item?: any;
        item_id?: string; // id of corresponding item in 'published' collection
        marked_desks?: any;

        highlights?: Array<string>;
        highlight?: any;
        sms_message?: any;

        // storage for custom fields created by users
        extra?: {[key: string]: any};

        task: {
            desk: IDesk['_id'];
            stage: IStage['_id'];
            user: IUser['_id'];
        };

        // might be only used for client-side state
        created?: any;
        archived?: any;

        unique_name: any;
        pubstatus: any;
        schedule_settings: any;
        format: any;
        fields_meta?: {
            [key: string]: {
                draftjsState?: any;
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

        // other fields which don't exist in the database, don't belong to this entity and should be removed
        error?: any;
        _editable?: any;
        actioning?: {
            archive?: boolean;
            externalsource: boolean;
            archiveContent?: boolean;
        };
        _autosave?: any;
        _locked?: boolean;
    }

    export interface IDangerousArticlePatchingOptions {
        // when this option is set, an HTTP request will be sent and item patched immediately
        // otherwise, the patch will get applied to authoring view
        // and will get saved together with the rest of the article changes by the user
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
        privileges: any;
        author_role: string;
        editor_role: string;
    }

    export interface IDesk extends IBaseRestApiResponse {
        incoming_stage: IStage['_id'];
        members: Array<IUser['_id']>;
        name: string;
        desk_type: 'authoring' | 'production';
        working_stage: IStage['_id'];
    }

    export interface IStage extends IBaseRestApiResponse {
        name: string;
        description: string;
        working_stage: boolean;
        default_incoming: boolean;
        task_status: 'todo' | 'in_progress' | 'done';
        desk_order: number;
        desk: any;
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
    }

    export interface IVocabularyTag {
        text: string;
    }

    export interface IVocabularyItem {
        name?: string;
        qcode?: string;
        is_active?: boolean;
        translations?: {
            name?: {
                [key: string]: string;
            }
        };
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
        service: {};
        priority?: number;
        unique_field: string;
        schema: {};
        field_type:
            | 'text'
            | 'media'
            | 'date'
            | 'embed'
            | 'related_content'
            | 'custom';
        field_options?: { // Used for related content fields
            allowed_types?: any;
            allowed_workflows?: {
                in_progress?: boolean;
                published?: boolean;
            };
            multiple_items?: { enabled: boolean; max_items: number };
        };
        custom_field_type?: string;
        custom_field_config?: { [key: string]: any };
        date_shortcuts?: Array<{ value: number; term: string; label: string }>;
        init_version?: number;
        preffered_items?: boolean;
        tags?: Array<IVocabularyTag>;
        disable_entire_category_selection?: boolean;
    }

    export interface IArticleField extends IVocabulary {
        single?: boolean;
        preview?: boolean;
    }

    export type IContentProfileEditorConfig = {[key: string]: IArticleField};

    export interface IContentProfile {
        _id: string;
        label: string;
        description: string;
        schema: Object;
        editor: IContentProfileEditorConfig;
        widgets_config: Array<{widget_id: string; is_displayed: boolean}>;
        priority: number;
        enabled: boolean;
        is_used: boolean;
        created_by: string;
        updated_by: string;
    }




    // PAGE

    export type IPage = DeepReadonly<{
        title: string;
        url: string;
        component: React.ComponentClass;
    }>;



    // REST API

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

    export interface IQueryElasticParameters {
        endpoint: string;
        page: {
            from: number;
            size: number;
        };
        sort: Array<{[field: string]: 'asc' | 'desc'}>;

        // can use deep references like {'a.b.c': []}
        filterValues: {[fieldName: string]: Array<string>};

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

    export interface IPropsGenericForm<T extends IBaseRestApiResponse, TBase = Omit<T, keyof IBaseRestApiResponse>> {
        formConfig: IFormGroup;
        defaultSortOption: ISortOption;
        defaultFilters?: Partial<TBase>;
        renderRow(key: string, item: T, page: IGenericListPageComponent<T>): JSX.Element;

        // Allows initializing a new item with some fields already filled.
        getNewItemTemplate?(page: IGenericListPageComponent<T>): Partial<TBase>;

        refreshOnEvents?: Array<string>;

        fieldForSearch?: IFormField; // must be present in formConfig
        disallowCreatingNewItem?: true;
        disallowFiltering?: true;
    }

    export enum FormFieldType {
        textSingleLine = 'textSingleLine',
        textEditor3 = 'textEditor3',
        vocabularySingleValue = 'vocabularySingleValue',
        checkbox = 'checkbox',
        contentFilterSingleValue = 'contentFilterSingleValue',
        deskSingleValue = 'deskSingleValue',
        stageSingleValue = 'stage_singstageSingleValuele_value',
        macroSingleValue = 'macroSingleValue',
        yesNo = 'yesNo',
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




    // CRUD MANAGER

    export type ICrudManagerFilters = {[fieldName: string]: any};

    export interface ISortOption {
        field: string;
        direction: 'ascending' | 'descending';
    }


    export interface ICrudManagerState<Entity extends IBaseRestApiResponse> extends IRestApiResponse<Entity> {
        activeFilters: ICrudManagerFilters;
        activeSortOption?: ISortOption;
    }

    export interface ICrudManagerMethods<Entity extends IBaseRestApiResponse> {
        read(
            page: number,
            sort: ISortOption,
            filterValues?: ICrudManagerFilters,
        ): Promise<IRestApiResponse<Entity>>;
        update(item: Entity): Promise<Entity>;
        create(item: Entity): Promise<Entity>;
        delete(item: Entity): Promise<void>;
        refresh(): Promise<IRestApiResponse<Entity>>;
        sort(nextSortOption: ISortOption): Promise<IRestApiResponse<Entity>>;
        removeFilter(fieldName: string): Promise<IRestApiResponse<Entity>>;
        goToPage(nextPage: number): Promise<IRestApiResponse<Entity>>;
    }


    export interface ICrudManager<Entity extends IBaseRestApiResponse> extends ICrudManagerState<Entity>, ICrudManagerMethods<Entity> {
        // allow exposing it as one interface for consumer components
    }



    // REACT COMPONENTS

    export interface IConfigurableUiComponents {
        UserAvatar?: React.ComponentType<{user: Partial<IUser>}>;
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

    export interface IPropsListItemColumn {
        ellipsisAndGrow?: boolean;
        noBorder?: boolean;
        justifyContent?: string;
        bold?: boolean;
    }

    export interface IGridComponentProps {
        columns: number;
        boxed?: boolean;
        children: React.ReactNodeArray;
    }

    export interface IAlertComponentProps {
        type: 'info' | 'warning' | 'error';
        hollow?: boolean;
        children?: React.ReactNode;
    }

    export interface IFigureComponentProps {
        caption: string;
        onRemove?: () => void;
        children?: React.ReactNode;
    }

    export interface IDropZoneComponentProps {
        label: string;
        className?: string;
        onDrop: (event: DragEvent) => void;
        canDrop: (event: DragEvent) => boolean;

        onFileSelect?: (files: FileList) => void;
        fileAccept?: string;
    }

    export interface IModalProps {
        'data-test-id'?: string;
        size?: 'large' | 'extra-large' | 'fill' | 'full-screen';
    }

    export interface IPropsModalHeader {
        onClose?(): void;
    }

    export interface IGenericListPageComponent<T extends IBaseRestApiResponse, TBase = Omit<T, keyof IBaseRestApiResponse>> {
        openPreview(id: string): void;
        startEditing(id: string): void;
        closePreview(): void;
        setFiltersVisibility(nextValue: boolean): void;
        handleFilterFieldChange(field: string, nextValue: any, callback): void;
        openNewItemForm(): void;
        closeNewItemForm(): void;
        deleteItem(item: T): void;
        getActiveFilters(): Partial<TBase>;
        removeFilter(fieldName: string): void;
    }

    export interface IPropsSelectUser {
        onSelect(user: IUser): void;
        selectedUserId?: string;
        disabled?: boolean;
        autoFocus?: boolean | {initializeWithDropdownHidden: boolean};
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
        inline?: boolean;
        wrapperStyles?: React.CSSProperties;
        'data-test-id'?: string;
    }

    export interface ISpacingProps {
        margin?: number;
        marginTop?: number;
        marginRight?: number;
        marginBottom?: number;
        marginTop?: number;
        padding?: number;
        paddingTop?: number;
        paddingRight?: number;
        paddingBottom?: number;
        paddingTop?: number;
    }

    interface IPropsBadge extends ISpacingProps {
        type: 'default' | 'primary' | 'success' | 'warning' | 'alert' | 'highlight' | 'light';
        square?: boolean;
    }

    export interface IPropsIcon {
        className: string;
        size?: number;
    }

    export interface IPropsSpacer {
        type: 'horizontal' | 'vertical';
        spacing: 'medium';
        align?: 'start' | 'end' | 'center' | 'stretch';
        children: Array<React.ReactNode>;
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



    // DATA API

    export interface IDataApi {
        findOne<T>(endpoint: string, id: string): Promise<T>;
        create<T>(endpoint: string, item: T): Promise<T>;
        query<T extends IBaseRestApiResponse>(
            endpoint: string,
            page: number,
            sortOption: ISortOption,
            filterValues: ICrudManagerFilters,
            max_results?: number,
            formatFiltersForServer?: (filters: ICrudManagerFilters) => ICrudManagerFilters,
        ): Promise<IRestApiResponse<T>>;
        patch<T extends IBaseRestApiResponse>(endpoint, current: T, next: T): Promise<T>;
        patchRaw<T extends IBaseRestApiResponse>(endpoint, id: T['_id'], etag: T['_etag'], patch: Partial<T>): Promise<T>;
        delete<T extends IBaseRestApiResponse>(endpoint, item: T): Promise<void>;
    }



    // EVENTS

    export interface IArticleUpdateEvent {
        user: string;
        items: {[itemId: string]: 1};
        desks: {[itemId: string]: 1};
        stages: {[itemId: string]: 1};
    }

    export interface IEvents {
        articleEditStart: IArticle;
        articleEditEnd: IArticle;
    }

    export interface IWebsocketMessage<T> {
        event: string;
        extra: T;
        _created: string;
        _process: string;
    }

    export interface IPublicWebsocketMessages {
        'content:update': IWebsocketMessage<IArticleUpdateEvent>;
    }



    // APPLICATION API

    export type ISuperdesk = DeepReadonly<{
        dataApi: IDataApi,
        dataApiByEntity: {
            article: {
                query(parameters: IArticleQuery): Promise<IArticleQueryResult>;
            };
        };
        state: {
            articleInEditMode?: IArticle['_id'];
        };
        instance: {
            config: ISuperdeskGlobalConfig
        };
        ui: {
            article: {
                view(id: string): void;

                // This isn't implemented for all fields accepting images.
                addImage(field: string, image: IArticle): void;

                /**
                 * Programatically triggers saving of an article in edit mode.
                 * Runs the same code as if "save" button was clicked manually.
                */
                save(): void;
            };
            alert(message: string): Promise<void>;
            confirm(message: string): Promise<boolean>;
            showModal(component: React.ComponentType<{closeModal(): void}>): Promise<void>;
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
                ): void;

                isArchived(article: IArticle): boolean;
                isPublished(article: IArticle): boolean;
            };
            contentProfile: {
                get(id: string): Promise<IContentProfile>;
            };
            vocabulary: {
                getIptcSubjects(): Promise<Array<ISubject>>;
                getVocabulary(id: string): Promise<Array<ISubject>>;
            };
            desk: {
                getStagesOrdered(deskId: IDesk['_id']): Promise<Array<IStage>>;
            };
        };
        helpers: {
            assertNever(x: never): never;
        },
        components: {
            UserHtmlSingleLine: React.ComponentType<{html: string}>;
            getGenericListPageComponent<T extends IBaseRestApiResponse>(resource: string, formConfig: IFormGroup): React.ComponentType<IPropsGenericForm<T>>;
            connectCrudManager<Props, PropsToConnect, Entity extends IBaseRestApiResponse>(
                WrappedComponent: React.ComponentType<Props & PropsToConnect>,
                name: string,
                endpoint: string,
                formatFiltersForServer?: (filters: ICrudManagerFilters) => ICrudManagerFilters,
            ): React.ComponentType<Props>;
            ListItem: React.ComponentType<IListItemProps>;
            ListItemColumn: React.ComponentType<IPropsListItemColumn>;
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
            ModalFooter: React.ComponentType;
            Badge: React.ComponentType<IPropsBadge>;
            SelectUser: React.ComponentType<IPropsSelectUser>;
            UserAvatar: React.ComponentType<{userId: string}>;
            ArticleItemConcise: React.ComponentType<{article: IArticle}>;
            GroupLabel: React.ComponentType<ISpacingProps>;
            Icon: React.ComponentType<IPropsIcon>;
            TopMenuDropdownButton: React.ComponentType<{onClick: () => void; disabled?: boolean; active: boolean; pulsate?: boolean; 'data-test-id'?: string;}>;
            getDropdownTree: <T>() => React.ComponentType<IPropsDropdownTree<T>>;
            Spacer: React.ComponentType<IPropsSpacer>;
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
            gettext(message: string, params?: {[key: string]: string | number}): string;
            gettextPlural(count: number, singular: string, plural: string, params?: {[key: string]: string | number}): string;
            formatDate(date: Date): string;
            formatDateTime(date: Date): string;
        };
        privileges: {
            getOwnPrivileges(): Promise<any>;
            hasPrivilege(privilege: string): boolean;
        };
        session: {
            getToken(): string;
            getCurrentUser(): Promise<IUser>;
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
    }>;


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
        default_language: string;
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
        archive_autocomplete: boolean;

        /** allow updates for items which aren't published yet */
        workflow_allow_multiple_updates: boolean;

        /** allow users who are not members of a desk to duplicate its content */
        workflow_allow_duplicate_non_members: boolean;

        /** allow users to copy from desk to personal space */
        workflow_allow_copy_to_personal: boolean;

        allow_updating_scheduled_items: boolean;

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
            editor3?: boolean;
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
            autorefreshContent?: any;
            elasticHighlight?: any;
            onlyEditor3?: any;
            nestedItemsInOutputStage?: boolean;
            keepMetaTermsOpenedOnClick?: boolean;
            showCharacterLimit?: number;
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
        defaultTimezone: any;
        search: {
            useDefaultTimezone: any;
        };
        search_cvs: any;
        view: {
            dateformat: string; // a combination of YYYY, MM, and DD with a custom separator e.g. 'MM/DD/YYYY'
            timeformat: string;
        };
        user: {
            sign_off_mapping: any;
            username_pattern?: string;
        };
        infoRemovedFields: {};
        previewSubjectFilterKey: any;
        authoring?: {
            timeToRead?: any;
        };
        ui: {
            publishEmbargo?: any;
            sendAndPublish?: any;
            italicAbstract?: any;
            sendPublishSchedule?: boolean;
            sendEmbargo?: boolean;
            sendDefaultStage?: 'working' | 'incoming';
        };
        list: {
            narrowView: any;
            singleLineView: any;
            singleLine: any;
            priority: any;
            firstLine: Array<string>,
            secondLine: Array<string>,
            relatedItems: {
                firstLine: Array<string>,
                secondLine: Array<string>,
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
        workspace: any;
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
        }>;
    }


    // CUSTOM FIELD TYPES

    export interface IEditorComponentProps<IValue, IConfig> {
        item: IArticle;
        value: IValue;
        setValue: (value: IValue) => void;
        readOnly: boolean;
        config: IConfig;
    }

    export interface IPreviewComponentProps {
        item: IArticle;
        value: any;
    }

    // IConfig must be a plain object
    export interface IConfigComponentProps<IConfig extends {}> {
        config: IConfig | null;
        onChange(config: IConfig): void;
    }

    export interface ICustomFieldType<IConfig> {
        id: string;
        label: string;
        editorComponent: React.ComponentType<IEditorComponentProps<IConfig>>;
        previewComponent: React.ComponentType<IPreviewComponentProps>;
        configComponent?: React.ComponentType<IConfigComponentProps<IConfig>>;
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
        qcode: string;
        scheme?: string;
        translations?: {};
    }
}
