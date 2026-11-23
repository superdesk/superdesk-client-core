import React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {Label} from 'superdesk-ui-framework/react';
import type {IContentProfile} from 'superdesk-api';
import type {IAIProvider} from 'apps/ai-providers/interfaces';
import type {IAIAction, IAIActionOptions, IAIActionType} from '../interfaces';
import ng from 'core/services/ng';
import {ActionEditor, IActionEditorTab} from './action-editor';

const options: IAIActionOptions = {
    action_types: [
        {action_type: 'suggestion', user_actions: ['apply', 'copy'], uses_suggestions_count: true},
        {action_type: 'summary', user_actions: ['apply', 'copy'], uses_suggestions_count: false},
    ],
    built_in_text_fields: ['headline', 'abstract', 'body_html'],
};

const providers = [
    {_id: 'provider-1', name: 'OpenRouter', active: true, available_models: ['m-1', 'm-2'], default_model: 'm-1'},
    {_id: 'provider-2', name: 'Local', active: true, available_models: [], default_model: 'local-model'},
] as Array<IAIProvider>;

const profiles = [
    {_id: 'text', label: 'Text', enabled: true, editor: {headline: {order: 1}, abstract: {order: 2}, body_html: {}}},
] as unknown as Array<IContentProfile>;

const summary = {
    _id: 'action-1',
    _etag: 'etag-1',
    name: 'Abstracts',
    action_type: 'summary',
    active: true,
    input_fields: ['body_html'],
    output_field: 'abstract',
    content_profiles: [],
    provider: 'provider-1',
    model: 'm-2',
    parameters: {suggestions_count: 1, max_characters: 300},
} as IAIAction;

function render(
    action: IAIAction | null,
    actionType: IAIActionType,
    initialTab: IActionEditorTab = 'configuration',
): ReactWrapper {
    return mount(
        <ActionEditor
            action={action}
            actionType={actionType}
            options={options}
            providers={providers}
            profiles={profiles}
            customFieldVocabularies={[]}
            initialTab={initialTab}
            onTabChange={() => undefined}
            onDirtyChange={() => undefined}
            onCancel={() => undefined}
            onSaved={() => undefined}
            onConflict={() => undefined}
        />,
    );
}

const byTestId = (wrapper: ReactWrapper, id: string) => wrapper.find(`[data-test-id="${id}"]`).hostNodes();

function openAiSettings(wrapper: ReactWrapper) {
    byTestId(wrapper, 'ai-action-tabs').find('button').at(1).simulate('click');
}

describe('ai studio: action editor', () => {
    it('asks for the number of suggestions on a suggestion only', () => {
        expect(byTestId(render(null, 'suggestion'), 'ai-action-suggestions-count').exists()).toBe(true);
        expect(byTestId(render(summary, 'summary'), 'ai-action-suggestions-count').exists()).toBe(false);
    });

    it('shows what editors can do with the answers, from the type', () => {
        const labels = byTestId(render(summary, 'summary'), 'ai-action-user-actions').find(Label);

        expect(labels.map((label) => label.prop('text'))).toEqual(['Apply', 'Copy']);
    });

    it('enables Save only once something changed', () => {
        const wrapper = render(summary, 'summary');

        expect(byTestId(wrapper, 'ai-action-save').prop('disabled')).toBe(true);

        byTestId(wrapper, 'ai-action-name').simulate('change', {target: {value: 'Short abstracts'}});

        expect(byTestId(wrapper, 'ai-action-save').prop('disabled')).toBe(false);
    });

    it('offers Close while nothing changed and Cancel once something did', () => {
        const wrapper = render(summary, 'summary');

        expect(byTestId(wrapper, 'ai-action-cancel').text()).toBe('Close');

        byTestId(wrapper, 'ai-action-name').simulate('change', {target: {value: 'Short abstracts'}});

        expect(byTestId(wrapper, 'ai-action-cancel').text()).toBe('Cancel');
    });

    it('shows the provider, model and extra instructions on the AI Settings tab', () => {
        const wrapper = render(summary, 'summary');

        openAiSettings(wrapper);

        expect(byTestId(wrapper, 'ai-action-provider').prop('value')).toBe('provider-1');
        expect(byTestId(wrapper, 'ai-action-model').prop('value')).toBe('m-2');
        expect(byTestId(wrapper, 'ai-action-extra-instructions').exists()).toBe(true);
        expect(byTestId(wrapper, 'ai-action-name').exists()).toBe(false);
    });

    it('falls back to the provider default model when the provider changes', () => {
        const wrapper = render(summary, 'summary');

        openAiSettings(wrapper);
        byTestId(wrapper, 'ai-action-provider').simulate('change', {target: {value: 'provider-2'}});

        expect(byTestId(wrapper, 'ai-action-model').prop('value')).toBe('');
        expect(byTestId(wrapper, 'ai-action-model').find('option').map((option) => option.text()))
            .toEqual(['Provider default (local-model)']);
    });

    it('opens on the tab it is given, so saving does not move the user to another tab', () => {
        const wrapper = render(summary, 'summary', 'ai-settings');

        expect(byTestId(wrapper, 'ai-action-provider').exists()).toBe(true);
    });

    it('moves to the tab with the errors when saving fails validation', () => {
        const wrapper = render(null, 'suggestion');

        openAiSettings(wrapper);
        byTestId(wrapper, 'ai-action-provider').simulate('change', {target: {value: 'provider-1'}});
        byTestId(wrapper, 'ai-action-save').simulate('click');

        expect(byTestId(wrapper, 'ai-action-name').exists()).toBe(true);
    });

    it('moves to the tab with a server error that arrives after the user changed tab', async () => {
        let respond: (response: Response) => void = () => undefined;

        spyOn(ng, 'getService').and.returnValue(Promise.resolve({token: 'token'}));
        spyOn(window, 'fetch').and.returnValue(new Promise<Response>((resolve) => {
            respond = resolve;
        }));

        const wrapper = render(summary, 'summary');

        byTestId(wrapper, 'ai-action-name').simulate('change', {target: {value: 'Short abstracts'}});
        byTestId(wrapper, 'ai-action-save').simulate('click');
        openAiSettings(wrapper);

        respond(new Response(JSON.stringify({_issues: {name: 'Name is taken'}}), {status: 400}));
        await new Promise((resolve) => setTimeout(resolve, 50));
        wrapper.update();

        expect(byTestId(wrapper, 'ai-action-name').exists()).toBe(true);
    });
});
