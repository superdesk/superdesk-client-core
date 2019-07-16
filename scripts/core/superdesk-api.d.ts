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

    export type onSpikeMiddlewareResult= {warnings?: Array<{text: string}>};

    /**
     * float number 0 < x < 1. Larger the number, closer the component will be rendered to its side.
     * for example, if we had a list with 'start' positioned items with the following priorities [0.1, 0.2, 0.3]
     * we could add an item so it's the first in the list by setting priority to be less than 0.1, for example, 0.05.
     * to insert an item between 0.2 and 0.3 we could set its priority to 0.25
     * See [[sortByDisplayPriority]] for debug information.
     */
    export type IDisplayPriority = number;

    export interface IArticleAction {
        labelForGroup?: string;
        priority?: IDisplayPriority;
        icon?: string;
        label: string;
        onTrigger(): void;
    }
    
    export interface IArticleActionBulk {
        priority?: IDisplayPriority;
        label: string;
        icon: string;
        onTrigger(): void;
    }

    export interface IExtensionActivationResult {
        contributions?: {
            editor3?: {
                annotationInputTabs?: Array<IEditor3AnnotationInputTab>;
            }
            articleListItemWidgets?: Array<React.ComponentType<{article: IArticle}>>;
            authoringTopbarWidgets?: Array<React.ComponentType<{article: IArticle}>>;
            pages?: Array<IPage>;
            customFieldTypes?: Array<ICustomFieldType>;
            entities?: {
                article?: {
                    getActions?(article: IArticle): Promise<Array<IArticleAction>>;
                    getActionsBulk?(articles: Array<IArticle>): Promise<Array<IArticleActionBulk>>;
                    onUpdateBefore?(article: IArticle): Promise<IArticle>; // can alter item(immutably), can cancel update
                    onUpdateAfter?(article: IArticle): void; // can't alter item, can't cancel
                    onSpike?(item: IArticle): Promise<onSpikeMiddlewareResult>;
                    onSpikeMultiple?(items: Array<IArticle>): Promise<onSpikeMiddlewareResult>;
                };
            };
        }
    }


    export type IExtension = DeepReadonly<{
        activate: (superdesk: ISuperdesk) => Promise<IExtensionActivationResult>;
    }>;

    export type IExtensionObject = {
        extension: IExtension;
        manifest: {
            [key: string]: any;
            main: string; // extension will be imported from here
            superdeskExtension?: {
                dependencies?: Array<string>;
            };
        };
        activationResult: IExtensionActivationResult;
    };

    export type IExtensions = {[key: string]: IExtensionObject};

    export type ISideMenuItem = DeepReadonly<{
        label: string;
        url: string;
    }>;




    // ENTITIES

    // this is a subset of the main IArticle interface found in the core
    // a subset is used in order expose things gradually as needed
    export interface IArticle extends IBaseRestApiResponse {
        _id: string;
        slugline: string;

        task: {
            desk: IDesk['_id'];
            stage: IStage['_id'];
            user: IUser['_id'];
        };

        // remove when SDESK-4343 is done.
        selected: boolean;

        // planning extension
        assignment_id?: string;

        // markForUser extension
        marked_for_user?: string | null;
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
        SIGN_OFF: string;
        BYLINE: string;
        invisible_stages: Array<any>;
        slack_username: string;
        slack_user_id: string;
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
        };
        _id: string;
    }

    export interface IRestApiLink {
        title: string;
        href: string;
    }
    
    // Eve properties
    export interface IRestApiResponse<T extends IBaseRestApiResponse> {
        _items: Array<T>;
        _links: {
            parent: IRestApiLink;
            self: IRestApiLink;
        };
        _meta: {
            max_results: number;
            page: number;
            total: number;
        };
    }



    // GENERIC FORM

    export interface IPropsGenericForm<T extends IBaseRestApiResponse> {
        formConfig: IFormGroup;
        defaultSortOption: ISortOption;
        renderRow(key: string, item: T, page: IGenericListPageComponent<T>): JSX.Element;
    
        // Allows creating an item with required fields which aren't editable from the GUI
        newItemTemplate?: {[key: string]: any};
    
        modal?: any;

        disallowCreatingNewItem?: true;
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
            formatFiltersForServer?: (filters: ICrudManagerFilters) => ICrudManagerFilters,
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

    export interface IListItemProps {
        onClick?(): void;
        className?: string;
        inactive?: boolean;
        noHover?: boolean;
        'data-test-id'?: string;
    }

    export interface IPropsListItemColumn {
        ellipsisAndGrow?: boolean;
        noBorder?: boolean;
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
        onDrop: (event: DragEvent) => void;
        canDrop: (event: DragEvent) => boolean;
    }

    export interface IPropsModalHeader {
        onClose?(): void;
    }

    export interface IGenericListPageComponent<T extends IBaseRestApiResponse> {
        openPreview(id: string): void;
        startEditing(id: string): void;
        closePreview(): void;
        setFiltersVisibility(nextValue: boolean): void;
        handleFilterFieldChange(field: string, nextValue: any, callback): void;
        openNewItemForm(): void;
        closeNewItemForm(): void;
        deleteItem(item: T): void;
        removeFilter(fieldName: string): void;
    }

    interface IPropsSelectUser {
        onSelect(user: IUser): void;
        selectedUserId?: string;
        disabled?: boolean;
    }



    // EDITOR3

    export interface IEditor3AnnotationInputTab {
        label: string;
        selectedByDefault(annotationText: string, mode: 'create' | 'edit'): Promise<boolean>;
        component: React.ComponentType<IPropsAnnotationInputComponent>;
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
            formatFiltersForServer?: (filters: ICrudManagerFilters) => ICrudManagerFilters,
        ): Promise<IRestApiResponse<T>>;
        patch<T extends IBaseRestApiResponse>(endpoint, current: T, next: T): Promise<T>;
        delete<T extends IBaseRestApiResponse>(endpoint, item: T): Promise<void>;
    }



    // APPLICATION API

    export type ISuperdesk = DeepReadonly<{
        dataApi: IDataApi,
        ui: {
            alert(message: string): Promise<void>;
            confirm(message: string): Promise<boolean>;
            showModal(component: React.ComponentType<{closeModal(): void}>): Promise<void>;
        };
        entities: {
            article: {
                // returns true if locked by anyone, including the current user
                isLocked(article: IArticle): boolean;

                isLockedByCurrentUser(article: IArticle): boolean;

                isPersonal(article: IArticle): boolean;
                update(nextArticle: IArticle): void;
            };
        };
        helpers: {
            assertNever(x: never): never;
        },
        components: {
            UserHtmlSingleLine: React.ComponentType<{html: string}>;
            getGenericListPageComponent<T extends IBaseRestApiResponse>(resource: string): React.ComponentType<IPropsGenericForm<T>>;                        
            connectCrudManager<Props, PropsToConnect, Entity extends IBaseRestApiResponse>(
                WrappedComponent: React.ComponentType<Props & PropsToConnect>,
                name: string,
                endpoint: string,
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
            Modal: React.ComponentType;
            ModalHeader: React.ComponentType<IPropsModalHeader>;
            ModalBody: React.ComponentType;
            ModalFooter: React.ComponentType;
            SelectUser: React.ComponentType<IPropsSelectUser>;
            UserAvatar: React.ComponentType<{userId: string}>;
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
            ): JSX.Element;
        };
        localization: {
            gettext(message: string): string;
        };
        extensions: {
            getExtension(id: string): Promise<Omit<IExtension, 'activate'>>;
        };
        privileges: {
            getOwnPrivileges(): Promise<any>;
        };
        utilities: {
            logger: {
                error(error: Error): void;
                warn(message: string, json: {[key: string]: any}): void;
            },
        },
    }>;



    // CUSTOM FIELD TYPES

    export interface IEditorComponentProps {
        item: IArticle;
        value: any;
        setValue: (value: any) => void;
        readOnly: boolean;
    }

    export interface IPreviewComponentProps {
        item: IArticle;
        value: any;
    }

    export interface ICustomFieldType {
        id: string;
        label: string;
        editorComponent: React.ComponentType<IEditorComponentProps>;
        previewComponent: React.ComponentType<IPreviewComponentProps>;
    }



    // SUPERDESK ENTITIES

    export interface IAuthor {
        role: string;
        parent: string;
    }

    export interface IArticle extends IBaseRestApiResponse {
        _id: string;
        _current_version: number;
        guid: string;
        translated_from: string;
        translation_id: string;
        usageterms: any;
        keywords: any;
        language: any;
        slugline: any;
        genre: any;
        anpa_take_key: any;
        place: any;
        priority: any;
        urgency: any;
        anpa_category: any;
        subject: any;
        company_codes: Array<any>;
        ednote: string;
        authors: Array<IAuthor>;
        headline: string;
        sms: string;
        abstract: string;
        byline: string;
        dateline: string;
        body_html: string;
        footer: string;
        firstcreated: any;
        versioncreated: any;
        body_footer: string;
        sign_off: string;
        feature_media: any;
        media_description: string;
        associations: { string: IArticle };
        type: 'text' | 'picture' | 'video' | 'audio' | 'preformatted' | 'graphic' | 'composite';
        firstpublished?: string;
        linked_in_packages: any;
        gone: any;
        lock_action: any;
        lock_user: any;
        lock_session: any;
        rewritten_by?: string;

        highlights?: Array<string>;

        // storage for custom fields created by users
        extra?: {[key: string]: any};

        task: {
            desk: IDesk['_id'];
            stage: IStage['_id'];
            user: IUser['_id'];
        };

        // might be only used for client-side state
        created: any;
        archived: any;

        // remove when SDESK-4343 is done.
        selected: any;

        // planning extension
        assignment_id?: string;

        // markForUser extension
        marked_for_user?: string;
    }

}
