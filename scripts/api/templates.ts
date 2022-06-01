import ng from 'core/services/ng';
import {ITemplate} from 'superdesk-api';

function getById(id: ITemplate['_id']): Promise<ITemplate> {
    return ng.get('templates').find(id);
}

export const templates = {
    getById,
};
