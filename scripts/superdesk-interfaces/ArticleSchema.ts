
export interface IArticleSchema {
    [field: string]: {
        type: string;
        required: boolean;
        minlength: number;
        maxlength: number;
    }
}