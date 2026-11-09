import {IArticle, IAuthoringFieldV2, IContentProfile, IFieldAdapter, IFieldsAdapter} from 'superdesk-api';
import {getPackageContentProfile} from '../data-layer';
import {PACKAGE_ITEMS_FIELD_ID} from '../fields/package-items';

function getAdapter(fieldId: string): IFieldAdapter<IArticle> {
    return {
        getFieldV2: (fieldEditor, fieldSchema) => {
            const field: IAuthoringFieldV2 = {
                id: fieldId,
                name: fieldId,
                fieldType: 'editor3',
                fieldConfig: {readOnly: fieldSchema.readonly === true},
            };

            return field;
        },
    };
}

const fieldsAdapter: IFieldsAdapter<IArticle> = {
    slugline: getAdapter('slugline'),
    headline: getAdapter('headline'),
    genre: getAdapter('genre'),
    keywords: getAdapter('keywords'),
    abstract: getAdapter('abstract'),
    groups: getAdapter('groups'),
    sms_message: getAdapter('sms_message'),
};

// shaped like the `composite` profile superdesk-core creates, which has no `section` on any field
const compositeProfile = {
    _id: 'composite',
    type: 'composite',
    label: 'Package',
    schema: {
        slugline: {type: 'string', maxlength: 24, readonly: true},
        headline: {type: 'string', maxlength: 64},
        genre: {type: 'list'},
        keywords: {type: 'list'},
        abstract: {type: 'string'},
    },
    editor: {
        slugline: {order: 1, sdWidth: 'full', enabled: true},
        keywords: {order: 2, sdWidth: 'full', enabled: false},
        genre: {order: 5, sdWidth: 'half', enabled: true},
        headline: {order: 15, formatOptions: [], enabled: true},
        abstract: {order: 17, editor3: true, enabled: true},
        sms: {order: 16, enabled: true}, // has an adapter, but is not one of the package fields
        footer: null,
    },
} as unknown as IContentProfile;

describe('package content profile', () => {
    it('puts the fields of the composite profile in the header, ordered as configured', () => {
        const profile = getPackageContentProfile(compositeProfile, fieldsAdapter, (id) => id);

        expect(profile.header.keySeq().toArray()).toEqual(['slugline', 'genre']);
        expect(profile.header.get('genre').fieldConfig.width).toBe(50);
        expect(profile.header.get('slugline').fieldConfig.readOnly).toBe(true);
    });

    it('puts the headline in the content, above the package items', () => {
        const profile = getPackageContentProfile(compositeProfile, fieldsAdapter, (id) => id);

        expect(profile.content.keySeq().toArray()).toEqual(['headline', 'groups']);
        expect(profile.content.get('groups').fieldType).toBe(PACKAGE_ITEMS_FIELD_ID);
    });

    it('leaves out disabled fields and fields angular does not show for a package', () => {
        const profile = getPackageContentProfile(compositeProfile, fieldsAdapter, (id) => id);
        const allFields = profile.header.merge(profile.content);

        expect(allFields.has('keywords')).toBe(false);
        expect(allFields.has('abstract')).toBe(false);
        expect(allFields.has('sms_message')).toBe(false);
    });

    it('falls back to the headline when there is no composite profile', () => {
        const profile = getPackageContentProfile(null, fieldsAdapter, (id) => id);

        expect(profile.header.keySeq().toArray()).toEqual([]);
        expect(profile.content.keySeq().toArray()).toEqual(['headline', 'groups']);
    });
});
