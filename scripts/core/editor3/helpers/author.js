import ng from 'core/services/ng';

export function getCurrentAuthor() {
    return ng.get('session').identity._id;
}