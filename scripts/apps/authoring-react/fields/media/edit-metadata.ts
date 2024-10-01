import {IArticle} from 'superdesk-api';
import ng from 'core/services/ng';
import {cloneDeep} from 'lodash';

export function editMetadata(
    item: IArticle,
    mode: 'view' | 'image-edit' | 'crop',
): Promise<IArticle> {
    const cropOptions = {
        isNew: false,
        editable: true,
        isAssociated: true,
        defaultTab: mode,
        showMetadata: true,
    };


    /**
     * Image editing is being done using angularjs implementation that mutates data.
     * `deepClone` is used to ensure that mutations will not affect data stored in authoring-react.
     */
    return ng.get('renditions')
        .crop(cloneDeep(item), cropOptions, {immutable: true});
}
