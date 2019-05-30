import {IArticle} from 'superdesk-interfaces/Article';

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

interface IFieldTypeOptions {
    label: string;
    editorComponent: React.ComponentClass<IEditorComponentProps>;
    previewComponent: React.ComponentClass<IPreviewComponentProps>;
}

export const fields: {[key: string]: IFieldTypeOptions} = {};

export const addFieldType = (fieldId: string, options: IFieldTypeOptions) => {
    fields[fieldId] = options;
};
