import ng from 'core/services/ng';

function getPath(): string {
    return ng.get('$location').path();
}

function currentPathStartsWith(
    sections: Array<string>, // example: ['workspace', 'personal'] or ['settings', 'content-profiles']
): boolean {
    const path = getPath();
    const pathSections = path.split('/').slice(1); // remove "/" at the start

    for (let i = 0; i < sections.length; i++) {
        if (sections[i] !== pathSections[i]) {
            return false;
        }
    }

    return true;
}

function isPersonalSpace(): boolean {
    return !(ng.get('$location').path() === '/workspace/personal');
}

export const navigation = {
    getPath,
    currentPathStartsWith,
    isPersonalSpace,
};
