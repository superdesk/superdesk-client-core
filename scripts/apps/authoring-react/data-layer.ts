import {OrderedMap} from 'immutable';
import {IArticle} from 'superdesk-api';
import ng from 'core/services/ng';

export interface IAuthoringFieldV2 {
    name: string;
    type: 'plain-text' | 'html' | 'dropdown';
}

export type IFieldsV2 = OrderedMap<string, IAuthoringFieldV2>;

export interface IContentProfileV2 {
    name: string;
    header: IFieldsV2;
    content: IFieldsV2;
}

export function getContentProfile(item: IArticle): Promise<IContentProfileV2> {
    interface IFakeScope {
        schema: any;
        editor: any;
        fields: any;
    }

    let fakeScope: Partial<IFakeScope> = {};

    /**
     * !!! The use of `setupAuthoring` outside of angular is experimental.
     * I'm only using for getting some test data on the screen.
     */
    return ng.get('content').setupAuthoring(item.profile, fakeScope, item).then(() => {
        const {editor} = fakeScope;
        const editorOrdered =
            Object.keys(editor)
                .map((key) => ({...editor[key], name: key}))
                .sort((a, b) => a.order - b.order);

        let headerFields: IFieldsV2 = OrderedMap<string, IAuthoringFieldV2>();
        let contentFields: IFieldsV2 = OrderedMap<string, IAuthoringFieldV2>();

        for (const editorItem of editorOrdered) {
            const field: IAuthoringFieldV2 = {
                name: editorItem.name,
                type: 'plain-text',
            };

            if (editorItem.section === 'header') {
                headerFields = headerFields.set(field.name, field);
            } else if (editorItem.section === 'content') {
                contentFields = contentFields.set(field.name, field);
            } else {
                throw new Error('invalid section');
            }
        }

        const profile: IContentProfileV2 = {
            name: 'test content profile',
            header: headerFields,
            content: contentFields,
        };

        return profile;
    });
}
