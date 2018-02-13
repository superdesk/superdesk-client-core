import {Modifier} from 'draft-js';

/**
 * @ngdoc method
 * @name getEntityKey
 * @param {Object} content
 * @param {String} key
 * @param {String} types
 * @return {Object} returns an entity key for an entity of one of types
 * @description Extract from a possible composite entity the key for an entity
 * with the type in types.
 */
export function getEntityKey(content, key, types) {
    if (key == null) {
        return null;
    }

    const entity = content.getEntity(key);
    const crtType = entity.get('type');

    if (crtType !== 'COMPOSITE' && types.indexOf(crtType) !== -1) {
        return key;
    }

    if (crtType === 'COMPOSITE') {
        types.forEach((type) => {
            if (entity.get(type) != null) {
                return entity.get(type);
            }
        });
    }

    return null;
}

/**
 * @ngdoc method
 * @name getEntity
 * @param {Object} content
 * @param {String} key
 * @param {String} types
 * @return {Object} returns an entity for an entity of one of types
 * @description Extract from a possible composite entity an entity
 * with the type in types.
 */
export function getEntity(content, key, types) {
    const entityKey = getEntityKey(content, key, types);

    if (entityKey == null) {
        return null;
    }

    return content.getEntity(entityKey);
}

/**
 * @ngdoc method
 * @name setEntity
 * @param {Object} content
 * @param {Object} selection
 * @param {String} key
 * @param {String} types
 * @return {Object} returns a new content
 * @description Set an entity for the selection and create a
 * composite entity if an entity of different type is already set.
 */
export function setEntity(content, selection, key, type) {
    const offset = selection.getStartOffset();
    const block = content.getBlockForKey(selection.getStartKey());
    const entityKey = block.getEntityAt(offset);
    const entity = entityKey ? content.getEntity(entityKey) : null;
    let newContent;
    let newEntityKey;
    let crtType;

    if (entity == null || entity.get('type') === type) {
        return Modifier.applyEntity(content, selection, key);
    }

    crtType = entity.get('type');
    if (crtType === 'COMPOSITE') {
        return content.replaceEntityData(selection.getStartKey(), {type: key});
    }

    newContent = content.createEntity('COMPOSITE', 'MUTABLE', {
        crtType: entityKey,
        type: key
    });

    newEntityKey = newContent.getLastCreatedEntityKey();
    newContent = Modifier.applyEntity(newContent, selection, newEntityKey);

    return newContent;
}

/**
 * @ngdoc method
 * @name deleteEntity
 * @param {Object} content
 * @param {Object} selection
 * @param {String} type
 * @return {Object} returns a new content
 * @description Delete from a possible composite entity an entity
 * of type 'type' and delete composite entity if not needed.
 */
export function deleteEntity(content, selection, type) {
    const offset = selection.getStartOffset();
    const blockKey = selection.getStartKey();
    const block = content.getBlockForKey(blockKey);
    const entityKey = block.getEntityAt(offset);
    const entity = entityKey ? content.getEntity(entityKey) : null;
    let data;

    if (entity == null || entity.get('type') === type) {
        return Modifier.applyEntity(content, selection, null);
    }

    data = entity.getData();
    if (entity.get('type') === 'COMPOSITE' && data[type] != null) {
        if (data.length() === 2) {
            // don't use anymore composite entity, set directly the remaining entity
            // TODO: clean unused composite entities
            data.forEach((crtType, entityKey) => {
                if (crtType !== type) {
                    return Modifier.applyEntity(content, selection, entityKey);
                }
            });
        }

        return content.replaceEntityData(entityKey,
            data.filter((crtType) => crtType !== type)
        );
    }

    return content;
}
