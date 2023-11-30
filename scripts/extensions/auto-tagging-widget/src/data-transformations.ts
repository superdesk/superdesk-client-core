import {IArticle, ISuperdesk, ISubject} from 'superdesk-api';
import {OrderedMap} from 'immutable';
import {ITagUi} from './types';
import {getServerResponseKeys, toServerFormat, ITagBase, ISubjectTag, IServerResponse} from './adapter';
import {SOURCE_IMATRICS} from './constants';

export function createTagsPatch(
    article: IArticle,
    tags: OrderedMap<string, ITagUi>,
    superdesk: ISuperdesk,
): Partial<IArticle> {
    const serverFormat = toServerFormat(tags, superdesk);
    const patch: Partial<IArticle> = {};

    getServerResponseKeys().forEach((key) => {
        let oldValues = OrderedMap<string, ISubject>((article[key] || []).map((_item) => [_item.qcode, _item]));
        const newValues = serverFormat[key];
        let newValuesMap = OrderedMap<string, ISubject>();

        const wasRemoved = (tag: ISubject) =>
            tag.source === SOURCE_IMATRICS
            && oldValues.has(tag.qcode)
            && !newValuesMap.has(tag.qcode);

        newValues?.forEach((tag) => {
            newValuesMap = newValuesMap.set(tag.qcode, tag);
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
                        throw new Error('Scheme must be defined for all imatrics tags stored in subject field.');
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

                const subjectTag: ITagBase = {
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
    });

    return result;
}
