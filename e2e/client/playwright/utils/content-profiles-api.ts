import {assertOk, withApiContext} from './api';

interface IProfileField {
    id: string;
    section: 'header' | 'content';
    formatOptions?: Array<string>;
}

/**
 * Creates an enabled text content profile. The server also creates a template named after it
 * (lower-cased) that uses the profile. The app reads content profiles once on load, so call this
 * before navigating.
 */
export function createContentProfile(label: string, fields: Array<IProfileField>): Promise<{profileId: string}> {
    return withApiContext(async (api) => {
        const editor: {[fieldId: string]: unknown} = {};
        const schema: {[fieldId: string]: unknown} = {};

        fields.forEach((field, order) => {
            editor[field.id] = {
                order,
                enabled: true,
                required: false,
                section: field.section,
                sdWidth: 'full',
                ...(field.formatOptions == null ? {} : {formatOptions: field.formatOptions}),
            };
            schema[field.id] = {type: 'string', required: false};
        });

        const profile = await api.post('content_types', {data: {label, type: 'text', enabled: true, editor, schema}});

        await assertOk(profile, `creating the "${label}" content profile`);

        const profileId: string = (await profile.json())._id;

        return {profileId};
    });
}
