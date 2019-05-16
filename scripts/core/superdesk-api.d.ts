declare module 'superdesk-api' {
    // EXTENSIONS

    type IExtension = DeepReadonly<{
        activate: (superdesk: ISuperdesk) => Promise<void>;
        contribute?: {
            sideMenuItems?: (superdesk: ISuperdesk) => Promise<Array<ISideMenuItem>>;
            pages?: Array<IPage>;
        };
    }>;

    type IExtensionObject = {
        extension: IExtension;
        manifest: {
            [key: string]: any;
            main: string; // extension will be imported from here
            superdeskExtension?: {
                dependencies?: Array<string>;
            };
        };
        apiInstance?: ISuperdesk;
    };

    type IExtensions = {[key: string]: IExtensionObject};

    type ISideMenuItem = DeepReadonly<{
        label: string;
        url: string;
    }>;



    // PAGE

    type IPage = DeepReadonly<{
        url: string;
        component: React.ComponentClass<IPageComponentProps>;
    }>;

    interface IPageComponentProps {
        superdesk: ISuperdesk;
    }



    // REST API

    interface IDefaultApiFields {
        _created: string;
        _updated: string;
        _etag: string;
        _id: string;
    }



    // GENERIC FORM

    interface IPropsGenericForm<T extends IDefaultApiFields> {
        formConfig: IFormGroup;
        renderRow(key: string, item: T, page: GenericListPageComponent<T>): JSX.Element;
    
        // Allows creating an item with required fields which aren't editable from the GUI
        newItemTemplate?: {[key: string]: any};
    
        // connected
        items?: ICrudManager<T>;
        modal?: any;
    }

    enum FormFieldType {
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

    interface IFormField { // don't forget to update runtime type checks
        type: FormFieldType;
    
        required?: boolean;
    
        // custom components for some fields might not require a label or want include a custom one
        label?: string;
    
        field: string;
    
        // can be used to pass read-only fields or display specific flags
        // component theme, variant or initial state could be set using this
        component_parameters?: {[key: string]: any};
    }
    
    interface IFormGroupCollapsible { // don't forget to update runtime type checks
        label: string;
        openByDefault: boolean;
    }
    
    interface IFormGroup { // don't forget to update runtime type checks
        direction: 'vertical' | 'horizontal';
        type: 'inline' | IFormGroupCollapsible;
        form: Array<IFormField | IFormGroup>;
    }
    
    

    // REACT COMPONENTS

    interface IListItemProps {
        onClick?(): void;
        className?: string;
        inactive?: boolean;
        noHover?: boolean;
        'data-test-id'?: string;
    }

    interface IPropsListItemColumn {
        ellipsisAndGrow?: boolean;
        noBorder?: boolean;
    }


    interface IGenericListPageComponent<T extends IDefaultApiFields> {
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



    // EXPORTED API

    type ISuperdesk = DeepReadonly<{
        ui: {
            alert(message: string): Promise<void>;
            confirm(message: string): Promise<boolean>;
        };
        helpers: {
            getGenericListPageComponent<T extends IDefaultApiFields>(resource: string): React.ComponentType<IPropsGenericForm<T>>;
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
        };
        localization: {
            gettext(message: string): string;
        };
        extensions: {
            getExtension(id: string): Promise<Omit<IExtension, 'activate'>>;
        };
    }>;
}
