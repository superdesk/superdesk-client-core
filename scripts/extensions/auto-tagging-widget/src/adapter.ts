import {ITagUi} from './types';
import {OrderedMap} from 'immutable';

export interface ITagBase {
    name: string;
    description?: string;
    qcode: string;
    source: string;
    altids: {[key: string]: string};
}

interface ISubjectTag extends ITagBase {
    scheme: string;
}

export interface IServerResponse {
    subject?: Array<ISubjectTag>;
    organisation?: Array<ITagBase>;
    person?: Array<ITagBase>;
    event?: Array<ITagBase>;
    place?: Array<ITagBase>;
    object?: Array<ITagBase>;
}

export function toClientFormat(response: IServerResponse): OrderedMap<string, ITagUi> {
    let tags = OrderedMap<string, ITagUi>();

    response.subject?.forEach((item) => {
        const {name, description, qcode, source, altids} = item;

        const tag: ITagUi = {
            name,
            description,
            qcode,
            source,
            altids,
            group: {
                kind: 'scheme',
                label: item.scheme,
                value: item.scheme,
            },
        };

        tags = tags.set(tag.qcode, tag);
    });

    const others: Array<{group: string; items: Array<ITagBase>}> = [];

    if (response.organisation != null) {
        others.push({group: 'organisation', items: response.organisation});
    }

    if (response.person != null) {
        others.push({group: 'person', items: response.person});
    }

    if (response.event != null) {
        others.push({group: 'event', items: response.event});
    }

    if (response.place != null) {
        others.push({group: 'place', items: response.place});
    }

    if (response.object != null) {
        others.push({group: 'object', items: response.object});
    }

    others.forEach(({group, items}) => {
        items.forEach((item) => {
            const {name, description, qcode, source, altids} = item;

            const tag: ITagUi = {
                name,
                description,
                qcode,
                source,
                altids,
                group: {
                    kind: 'visual',
                    label: group,
                    value: group,
                },
            };

            tags = tags.set(tag.qcode, tag);
        });
    });

    return tags;
}
