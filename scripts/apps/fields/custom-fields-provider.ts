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

interface IFieldOptions {
    label: string;
    editorComponent: React.ComponentClass<IEditorComponentProps>;
    previewComponent: React.ComponentClass<IPreviewComponentProps>;
}

export const fields: {[key: string]: IFieldOptions} = {};

export const customField = (fieldId: string, options: IFieldOptions) => {
    fields[fieldId] = options;
};
