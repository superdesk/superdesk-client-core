import {IArticle, ISuperdesk, ISubject} from 'superdesk-api';
import {OrderedMap} from 'immutable';
import {ITagUi} from './types';
import {getServerResponseKeys, toServerFormat, ITagBase, ISubjectTag, IServerResponse} from './adapter';

export function createTagsPatch(
    article: IArticle,
    tags: OrderedMap<string, ITagUi>,
    superdesk: ISuperdesk,
): Partial<IArticle> {
    const serverFormat = toServerFormat(tags, superdesk);
    const patch: Partial<IArticle> = {};
    console.log('serverFormat', serverFormat);
    console.log('article', article);
    console.log('tags', tags);
    console.log('superdesk', superdesk);
    console.log('patch', patch);
    getServerResponseKeys().forEach((key) => {
        let oldValues = OrderedMap<string, ISubject>((article[key] || []).filter(_item => typeof _item.qcode === 'string').map((_item) => [_item.qcode, _item]));
        const newValues = serverFormat[key];
        let newValuesMap = OrderedMap<string, ISubject>();
        console.log('oldValues', oldValues);
        console.log('newValues', newValues);
        // Preserve tags with specific schemes
        oldValues?.forEach((tag, qcode) => {
            // Type assertion to ensure qcode is treated as a string
            const key = qcode as string;
            if (tag && (tag.scheme === 'subject_custom' || tag.scheme === 'destinations')) {
                newValuesMap = newValuesMap.set(key, tag);
            }
        });
        const wasRemoved = (tag: ISubject) => {
            if(oldValues.has(tag.qcode) && !newValuesMap.has(tag.qcode)) {
                console.log('wasRemoved', tag);
                return true;
            }
            else {
                return false;
            }
        }

        // Add new values to the map, ensuring tag is defined and has a qcode
        newValues?.forEach((tag) => {
            if (tag && tag.qcode) {
                newValuesMap = newValuesMap.set(tag.qcode, tag);
            }
        });

        // Has to be executed even if newValuesMap is empty in order
        // for removed groups to be included in the patch.
        patch[key] = oldValues
            .merge(newValuesMap)
            .filter((tag) => wasRemoved(tag) !== true)
            .toArray();
    });
    return patch;
}

export function getExistingTags(article: IArticle): IServerResponse {
    const result: IServerResponse = {};

    getServerResponseKeys().forEach((key) => {
        const values = article[key] ?? [];
        if (key === 'subject') {
            if (values.length > 0) {
                result[key] = values.map((subjectItem) => {
                    const {
                        name,
                        description,
                        qcode,
                        source,
                        altids,
                        scheme,
                        aliases,
                        original_source,
                        parent,
                    } = subjectItem;

                    if (scheme == null) {
                        throw new Error('Scheme must be defined for all semaphore tags stored in subject field.');
                    }

                    const subjectTag: ISubjectTag = {
                        name,
                        description,
                        qcode,
                        source,
                        altids: altids ?? {},
                        parent,
                        scheme,
                        aliases,
                        original_source,
                    };
                    return subjectTag;
                });
            }
        } else if (values.length > 0) {
            result[key] = values.map((entityItem) => {
                const {
                    name,
                    description,
                    qcode,
                    source,
                    altids,
                    scheme,
                    aliases,
                    original_source,
                    parent,
                } = entityItem;

                const entityTag: ITagBase = {
                    name,
                    description,
                    qcode,
                    source,
                    altids: altids ?? {},
                    parent,
                    scheme,
                    aliases,
                    original_source,
                };

                return entityTag;
            });
        }
    });

    return result;
}
