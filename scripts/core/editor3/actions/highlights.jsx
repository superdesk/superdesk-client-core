import ng from 'core/services/ng';

export function getAuthorInfo() {
    const date = new Date();
    const {display_name: author, email, picture_url: avatar} = ng.get('session').identity;

    return {
        author,
        email,
        date,
        avatar
    };
}