import {OrderedMap} from 'immutable';
import {IArticle} from 'superdesk-api';
import ng from 'core/services/ng';

interface IFieldBase {
    id: string;
}

interface IFieldText extends IFieldBase {
    type: 'text';
}

interface IFieldDropdown extends IFieldBase {
    type: 'dropdown';
}

export type IAuthoringFieldV2 = IFieldText | IFieldDropdown;

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
                id: editorItem.name ?? 'hmtl',
                type: 'text',
            };

            if (editorItem.section === 'header') {
                headerFields = headerFields.set(field.id, field);
            } else if (editorItem.section === 'content') {
                contentFields = contentFields.set(field.id, field);
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
