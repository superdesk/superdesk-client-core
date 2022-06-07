import ng from 'core/services/ng';

function getItem(key: string) {
    return ng.get('storage').getItem(key);
}

function setItem(key: string, data: any) {
    return ng.get('storage').setItem(key, data);
}

function removeItem(key: string) {
    return ng.get('storage').removeItem(key);
}

function clear() {
    return ng.get('storage').clear();
}

export const localStorage = {
    getItem,
    setItem,
    removeItem,
    clear,
};
