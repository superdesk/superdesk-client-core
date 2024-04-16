import {ContentState} from 'draft-js';
import {Map} from 'immutable';

// .getEntityMap doesn't work
// .entityMap appears to be private and only works sometimes. Other times it returns what appears to be a entity class.

type DraftEntityInstance = ReturnType<ContentState['getEntity']>;

export function getEntityMap(contentState: ContentState): Map<string, DraftEntityInstance> {
    let entityMap = Map<string, DraftEntityInstance>();

    let endReached = false;
    let i = 1;

    while (!endReached) {
        try {
            const entity = contentState.getEntity(i.toString());

            entityMap = entityMap.set(i.toString(), entity);

            i++;
        } catch (e) {
            endReached = true;
        }
    }

    return entityMap;
}