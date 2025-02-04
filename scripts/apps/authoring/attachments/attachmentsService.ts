import {IArticle, IAttachment, IAttachmentsApi} from 'superdesk-api';
import {dataApi} from 'core/helpers/CrudManager';
import ng from 'core/services/ng';

const RESOURCE = 'attachments';
const _byIdCache = {};

function clearCache(file: IAttachment) {
    if (_byIdCache[file._id] != null) {
        delete _byIdCache[file._id];
    }
}

export const attachmentsApi: IAttachmentsApi = {
    byArticle(article: IArticle) {
        const attachments: IArticle['attachments'] = article.attachments ?? [];
        const ids = attachments.map((ref) => ref.attachment);

        return dataApi.query<IAttachment>(
            RESOURCE,
            1,
            {field: 'title', direction: 'ascending'},
            {_id: {$in: ids}},
        )
            .then((response) => {
                response._items.forEach(
                    (attachment) => {
                        _byIdCache[attachment._id] = attachment;
                    },
                );

                return response._items;
            });
    },

    byId(id: IAttachment['_id']) {
        if (_byIdCache[id] != null) {
            return Promise.resolve(_byIdCache[id]);
        }

        return dataApi.findOne<IAttachment>(RESOURCE, id)
            .then((attachment) => {
                _byIdCache[attachment._id] = attachment;

                return attachment;
            });
    },

    create(attachment: Partial<IAttachment>) {
        const mediaId = attachment.media;

        delete attachment.media;

        return dataApi.create<IAttachment>(RESOURCE, attachment, {media: mediaId});
    },

    save(original: IAttachment, updates: Partial<IAttachment>) {
        clearCache(original);
        return dataApi.patch<IAttachment>(RESOURCE, original, updates);
    },

    delete(attachment: IAttachment) {
        clearCache(attachment);
        return dataApi.delete(RESOURCE, attachment);
    },

    upload(attachment: IAttachment, file: File, onProgress?: (event: ProgressEvent) => void) {
        const formData = new FormData();

        formData.append('media', file);
        formData.append('title', attachment.title);
        formData.append('description', attachment.description);

        if (attachment.internal === true) {
            formData.append('internal', 'true');
        }

        return dataApi.uploadFileWithProgress(
            '/' + RESOURCE,
            formData,
            onProgress,
        );
    },

    download(attachment: IAttachment) {
        const urls = ng.get('urls');

        window.open(urls.media(attachment.media, 'attachments'), '_blank');
    },

    getMediaId(attachment: IAttachment) {
        if (typeof attachment.media !== 'string') {
            return attachment.media._id;
        }

        return attachment.media;
    },
};
