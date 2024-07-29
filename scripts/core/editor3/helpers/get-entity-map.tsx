import {ContentState} from 'draft-js';
import {Map} from 'immutable';
import {noop} from 'lodash';

// .getAllEntities isn't available in current draft-js version.
// .getEntityMap doesn't work
// .entityMap appears to be private and only works sometimes. Other times it returns what appears to be a entity class.

type DraftEntityInstance = ReturnType<ContentState['getEntity']>;

export function getEntityMap(contentState: ContentState): Map<string, DraftEntityInstance> {
    let entityMap = Map<string, DraftEntityInstance>();

    contentState.getBlockMap().forEach((block) => {
        block.findEntityRanges(
            (char) => {
                const entityKey = char.getEntity();

                if (entityKey != null) {
                    entityMap = entityMap.set(entityKey, contentState.getEntity(entityKey));
                }

                return false;
            },
            noop,
        );
    });

    return entityMap;
}