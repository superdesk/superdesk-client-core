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

export class CustomFields {
    fields: {[key: string]: IFieldOptions};

    constructor() {
        this.fields = {};
    }

    add(fieldId: string, options: IFieldOptions) {
        this.fields[fieldId] = options;
    }
}

export const fields = new CustomFields();
