import ng from 'core/services/ng';

function get(key: string): {type: string; _id: string} {
    const preferencesService = ng.get('preferencesService');

    return preferencesService.getSync(key);
}

function update(key: string, value: any): void {
    const preferencesService = ng.get('preferencesService');

    preferencesService.update({[key]: value}, key);
}

export const preferences = {
    get,
    update,
};
