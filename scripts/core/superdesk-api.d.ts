declare module 'superdesk-api' {
    // EXTENSIONS

    export interface IExtensionActivationResult {
        contributions?: {
            editor3?: {
                annotationInputTabs?: Array<IEditor3AnnotationInputTab>;
            }
            pages?: Array<IPage>;
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
            selft: IRestApiLink;
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
        renderRow(key: string, item: T, page: GenericListPageComponent<T>): JSX.Element;
    
        // Allows creating an item with required fields which aren't editable from the GUI
        newItemTemplate?: {[key: string]: any};
    
        // connected
        items?: ICrudManager<T>;
        modal?: any;
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



    // EDITOR3

    export interface IEditor3AnnotationInputTab {
        label: string;
        selectedByDefault(annotationText: string): Promise<boolean>;
        component: React.ComponentType<IPropsAnnotationInputComponent>;
    }

    export interface IPropsAnnotationInputComponent {
        annotationText: string;
        annotationTypeSelect: JSX.Element;
        onCancel(): void;
        onApplyAnnotation(html: string): void;
    }



    // DATA API

    interface IDataApi {
        create<T>(endpoint: string, item: T): Promise<T>;
        query<T extends IBaseRestApiResponse>(
            endpoint: string,
            page: number,
            sortOption: ISortOption,
            filterValues: ICrudManagerFilters = {},
            formatFiltersForServer?: (filters: ICrudManagerFilters) => ICrudManagerFilters,
        ): Promise<IRestApiResponse<T>>;
        patch<T>(endpoint, item1: T, item2: T): Promise<T>;
        delete<T>(endpoint, item1: T): Promise<void>;
    }



    // APPLICATION API

    export type ISuperdesk = DeepReadonly<{
        dataApi: IDataApi,
        ui: {
            alert(message: string): Promise<void>;
            confirm(message: string): Promise<boolean>;
        };
        helpers: {
            getGenericListPageComponent<T extends IBaseRestApiResponse>(resource: string): React.ComponentType<IPropsGenericForm<T>>;
            isIFormGroupCollapsible(x: "inline" | IFormGroupCollapsible): x is IFormGroupCollapsible;
            isIFormGroup(x: IFormGroup | IFormField): x is IFormGroup;
            isIFormField(x: IFormGroup | IFormField): x is IFormField;
            getFormFieldPreviewComponent(
                item: {
                    readonly [key: string]: any;
                },
                formFieldConfig: any,
            ): JSX.Element;
            ListItem: React.ComponentType<IListItemProps>;
            ListItemColumn: React.ComponentType<IPropsListItemColumn>;
            ListItemActionsMenu: React.ComponentType;
            FormFieldType: typeof FormFieldType;
            UserHtmlSingleLine: React.ComponentType<{html: string}>;
            connectCrudManager<Props, Entity extends IBaseRestApiResponse>(
                WrappedComponent: React.ComponentType<Props>,
                name: string,
                endpoint: string,
            ): React.ComponentType<Props>
            List: {
                Item: React.ComponentType<{onClick: any}>;
                Row: React.ComponentType;
                Column: React.ComponentType<{grow: boolean}>;
            }
            generateFilterForServer(type: FormFieldType, value: any): any;
        };
        localization: {
            gettext(message: string): string;
        };
        extensions: {
            getExtension(id: string): Promise<Omit<IExtension, 'activate'>>;
        };
    }>;
}
