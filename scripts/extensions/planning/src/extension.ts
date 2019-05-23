import {IExtension, IArticle, ISuperdesk} from 'superdesk-api';

function onSpike(superdesk: ISuperdesk, item: IArticle) {
    const {gettext} = superdesk.localization;

    return superdesk.privileges.getOwnPrivileges()
        .then((privileges) => {
            if (privileges['planning'] != null && item.assignment_id != null) {
                return {
                    item,
                    warnings: [
                        {
                            text: gettext('This item is linked to in-progress planning coverage.'),
                        },
                    ],
                };
            } else {
                return {item};
            }
        });
}

const extension: IExtension = {
    activate: (superdesk: ISuperdesk) => {
        return Promise.resolve({
            contributions: {
                middlewares: {
                    archive: {
                        onSpike: (item: IArticle) => onSpike(superdesk, item),
                    },
                },
            },
        });
    },
};

export default extension;
