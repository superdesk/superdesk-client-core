import {get} from 'lodash';
import {IArticle} from 'superdesk-interfaces/Article';

interface ILimitsService {
    minlength: (field: string, schema: any, item: IArticle) => number;
    maxlength: (field: string, schema: any, item: IArticle) => number;
}

export default function LimitsService(): ILimitsService {
    return {
        minlength: (field, schema, item) => get(schema, `${field}.minlength`),
        maxlength: (field, schema, item) => get(schema, `${field}.maxlength`),
    };
}
