import ng from 'core/services/ng';

function featureEnabled(name: string): boolean {
    return ng.get('features')[name] != null;
}

export const config = {
    featureEnabled,
};
