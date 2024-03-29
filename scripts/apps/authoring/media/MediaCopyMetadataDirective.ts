import {merge} from 'lodash';
import {IArticle} from 'superdesk-api';

function getMediaMetadata(metadata: Partial<IArticle>, fields): Partial<IArticle> {
    const output: Partial<IArticle> = {extra: {}};

    if (metadata == null) {
        return output;
    }

    fields.forEach((field) => {
        if (field.extra) {
            if (metadata.extra != null && metadata.extra[field.field] != null) {
                output.extra[field.field] = metadata.extra[field.field];
            }
        } else if (metadata[field.field] != null) {
            output[field.field] = metadata[field.field];
        } else if (field.cv != null && metadata.subject?.length > 0) {
            const alreadyAddedSubjectQcodes = new Set((output.subject ?? []).map(({qcode}) => qcode));
            const values = metadata.subject.filter(
                (subj) => subj.scheme === field.field && alreadyAddedSubjectQcodes.has(subj.qcode) !== true,
            );

            if (values.length) {
                output.subject = output.subject ? output.subject.concat(values) : values;
            }
        }
    });

    return output;
}

MediaCopyMetadataDirective.$inject = [];
export default function MediaCopyMetadataDirective() {
    return {
        scope: {
            metadata: '=',
            validator: '=',
            onChange: '&',
            fields: '=',
        },
        template: require('./views/media-copy-metadata-directive.html'),
        link: (scope) => {
            const METADATA_ITEMS = 'metadata:items';

            scope.metadataFromStorage = !!localStorage.getItem(METADATA_ITEMS);

            scope.copyMetadata = (metadata) => {
                scope.metadataFromStorage = true;
                localStorage.setItem(METADATA_ITEMS, JSON.stringify(getMediaMetadata(metadata, scope.fields)));
            };

            scope.pasteMetadata = () => {
                const metadataFromStorage = JSON.parse(localStorage.getItem(METADATA_ITEMS));

                scope.metadata = merge(scope.metadata, metadataFromStorage);
                scope.onChange();
            };

            scope.clearSavedMetadata = () => {
                localStorage.removeItem(METADATA_ITEMS);
                scope.metadataFromStorage = false;
            };
        },
    };
}
