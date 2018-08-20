import ng from 'core/services/ng';

export function getAuthorInfo() {
    const date = new Date();
    const {_id: authorId, display_name: author, email, picture_url: avatar} = ng.get('session').identity;

    return {
        authorId,
        author,
        email,
        date,
        avatar,
    };
}
