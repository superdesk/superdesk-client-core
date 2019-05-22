import {IExtension, IArticle, ISuperdesk} from 'superdesk-api';

function onSpike(superdesk: ISuperdesk, item: IArticle) {
    const {gettext} = superdesk.localization;

    if (item.assignment_id != null) {
        return Promise.resolve({
            item,
            warnings: [
                {
                    text: gettext('This item is linked to in-progress planning coverage, spike anyway?'),
                },
            ],
        });
    } else {
        return Promise.resolve({item});
    }
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
