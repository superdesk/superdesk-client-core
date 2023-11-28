import {ITagUi} from './types';
import {OrderedMap} from 'immutable';
import {ISuperdesk} from 'superdesk-api';

export interface ITagBase {
    name: string;
    description?: string;
    qcode: string;
    parent?: string;
    scheme?: string;
    source?: string;
    altids: {[key: string]: string};
    aliases?: Array<string>;
    original_source?: string;
}

export interface ISubjectTag extends ITagBase {
    parent?: string;
}

export interface IServerResponse {
    subject?: Array<ISubjectTag>;
    organisation?: Array<ITagBase>;
    person?: Array<ITagBase>;
    event?: Array<ITagBase>;
    place?: Array<ITagBase>;
    object?: Array<ITagBase>;
}

export interface IServerAlterResponse {
    name: string;
    id: string;
    classes: Array<string>;
    facets: Array<Object>;
    values: Array<Object>;

}

export function getServerResponseKeys(): Array<keyof IServerResponse> {
    var obj: Required<IServerResponse> = {
        subject: [],
        organisation: [],
        person: [],
        event: [],
        place: [],
        object: [],
    };

    return Object.keys(obj) as Array<keyof IServerResponse>;
}
// export function toClientFormat2(data: IServerAlterResponse): OrderedMap<string, ITagUi> {
//     console.log('Received Server Response:', response);
//     let tags = OrderedMap<string, ITagUi>();
    
//     data.forEach((item) => {
//         if (item == null) {
//             throw new Error('Can not be nulish.');
//         }

//         const tag: ITagUi = {
//             name,
//             description,
//             qcode,
//             source,
//             altids,
//             aliases,
//             original_source,
//             scheme,
//             group: {
//                 kind: 'visual',
//                 value: group,
//             },
//         };
//         if (tags.has(tag.name)) {
//             console.log('Tags already has a tag with same name:', tag);
//         }else {
//             tags = tags.set(tag.name, tag);
//             console.log('Generated Group Tag:', tag);
//         }

//         const {name, id, classes, facets, values} = item;
//         const others: Array<{group: string; items: Array<ITagBase>}> = [];

//         if (response.organisation != null) {
//             others.push({group: 'organisation', items: response.organisation});
//         }
    
//         if (response.person != null) {
//             others.push({group: 'person', items: response.person});
//         }
    
//         if (response.event != null) {
//             others.push({group: 'event', items: response.event});
//         }
    
//         if (response.place != null) {
//             others.push({group: 'place', items: response.place});
//         }
    
//         if (response.object != null) {
//             others.push({group: 'object', items: response.object});
//         }
    
//     })
//     console.log('Generated Tags:', tags);
//     return tags;  
// }
export function toClientFormat(response: IServerResponse): OrderedMap<string, ITagUi> {
    console.log('Received Server Response:', response);
    let tags = OrderedMap<string, ITagUi>();

    console.log('Subject Array:', response.subject);
    response.subject?.forEach((item) => {
        console.log('Subject Item:', item);
        const {name, description, qcode, source, altids, aliases, original_source, parent} = item;


        const tag: ITagUi = {
            name,
            description,
            qcode,
            source,
            original_source,
            aliases,
            altids,
            parent,
            group: {
                kind: 'scheme',
                value: item.scheme || '',
            },
        };

        tags = tags.set(tag.qcode, tag);
        console.log('Generated Tag:', tag);
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
            const {name, description, qcode, source, altids, aliases, original_source, scheme} = item;
            

            const tag: ITagUi = {
                name,
                description,
                qcode,
                source,
                altids,
                aliases,
                original_source,
                scheme,
                group: {
                    kind: 'visual',
                    value: group,
                },
            };
            if (tags.has(tag.name)) {
                console.log('Tags already has a tag with same name:', tag);
            }else {
                tags = tags.set(tag.name, tag);
                console.log('Generated Group Tag:', tag);
            }
        });
    });
    console.log('Generated Tags:', tags);
    return tags;
}

export function toServerFormat(items: OrderedMap<string, ITagUi>, superdesk: ISuperdesk): IServerResponse {
    const {assertNever} = superdesk.helpers;
    const result: IServerResponse = {};

    items.forEach((item) => {
        if (item == null) {
            throw new Error('Can not be nulish.');
        }

        if (item.group.kind === 'scheme') {
            if (result.subject == null) {
                result.subject = [];
            }

            const {name, description, qcode, source, altids, aliases, original_source, parent} = item;

            const subjectTag: ISubjectTag = {
                name,
                description,
                qcode,
                source,
                altids,
                parent,
                scheme: item.group.value,
                aliases,
                original_source,
            };

            result.subject.push(subjectTag);
        } else if (item.group.kind === 'visual') {
            const groupValue = item.group.value as keyof Omit<IServerResponse, 'subject'>;

            if (result[groupValue] == null) {
                result[groupValue] = [];
            }

            const {name, description, qcode, source, altids, aliases, original_source, scheme} = item;

            const tagBase: ITagBase = {
                name,
                description,
                qcode,
                source,
                altids,
                aliases,
                original_source,
                scheme,
            };

            result[groupValue]!.push(tagBase);
        } else {
            assertNever(item.group.kind);
        }
    });

    return result;
}
