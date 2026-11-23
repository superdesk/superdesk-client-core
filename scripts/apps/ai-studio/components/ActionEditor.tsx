import React from 'react';
import {uniq} from 'lodash';
import {
    Alert,
    Button,
    ButtonGroup,
    FormLabel,
    Input,
    Label,
    Option,
    Select,
    SvgIconIllustration,
    Switch,
    Text,
    TextArea,
    TreeSelect,
} from 'superdesk-ui-framework/react';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import type {IContentProfile, IVocabulary} from 'superdesk-api';
import {gettext} from 'core/utils';
import {notify} from 'core/notify/notify';
import {TabList} from 'core/ui/components/tabs';
import {getLabelForFieldId} from 'apps/workspace/helpers/getLabelForFieldId';
import type {IAIProvider} from 'apps/ai-providers/interfaces';
import type {
    IAIAction,
    IAIActionDraft,
    IAIActionDraftErrors,
    IAIActionDraftField,
    IAIActionOptions,
    IAIActionType,
    ISelectOption,
} from '../interfaces';
import {AIStudioRequestError, createAction, patchAction} from '../api';
import {
    EXTRA_INSTRUCTIONS_MAX_LENGTH,
    SUGGESTIONS_COUNT_MAX,
    SUGGESTIONS_COUNT_MIN,
    actionToDraft,
    buildCreatePayload,
    buildPatch,
    getDefaultProvider,
    getNewDraft,
    isDraftDirty,
    numberInputToValue,
    validateDraft,
} from '../helpers/draft';
import {getFieldOptions, getProfileOptions, withSelectedOptions} from '../helpers/field-options';
import {getErrorMessage, mapIssues} from '../helpers/issues';
import {getActionTypeIllustration, getActionTypeLabel, getUserActionLabel} from '../helpers/labels';
import {PROVIDER_DEFAULT_MODEL, getModelOptions, getModelWarning, getProviderOptions} from '../helpers/model-options';
import './style.scss';

export type IActionEditorTab = 'configuration' | 'ai-settings';

const AI_PROVIDERS_URL = '#/settings/ai-providers';

const AI_SETTINGS_FIELDS: Array<IAIActionDraftField> = ['provider', 'model', 'extra_instructions'];

interface IProps {
    /** `null` when creating a new action */
    action: IAIAction | null;
    actionType: IAIActionType;
    options: IAIActionOptions;
    providers: Array<IAIProvider>;
    profiles: Array<IContentProfile>;
    customFieldVocabularies: Array<IVocabulary>;

    /** The form is remounted after every save, so the page keeps the tab the user was on */
    initialTab: IActionEditorTab;
    onTabChange(tab: IActionEditorTab): void;
    onDirtyChange(dirty: boolean): void;
    onCancel(): void;
    onSaved(action: IAIAction): void;

    /** On a `412`; the page reloads the action, which resets this form */
    onConflict(): void;
}

/** The number `Input` needs `''` when empty; `undefined` would keep showing the old number */
function toNumberInputValue(value: number | null): number {
    return value ?? ('' as unknown as number);
}

export function ActionEditor(props: IProps) {
    const {action, actionType, options, providers, profiles, customFieldVocabularies} = props;
    const typeOption = options.action_types.find(({action_type}) => action_type === actionType);

    // So an automatically picked provider does not count as a change
    const initialDraft = React.useRef(
        getNewDraft(typeOption?.uses_suggestions_count === true, getDefaultProvider(providers)),
    );
    const [draft, setDraft] = React.useState<IAIActionDraft>(
        () => action == null ? initialDraft.current : actionToDraft(action),
    );
    const [errors, setErrors] = React.useState<IAIActionDraftErrors>({});
    const [tab, setTab] = React.useState<IActionEditorTab>(props.initialTab);

    // Save errors arrive after the request, when the user may be on another tab
    const currentTab = React.useRef(tab);

    // The tab list only reads the selected tab on mount, so a switch from code remounts it
    const [tabListKey, setTabListKey] = React.useState(0);
    const [saving, setSaving] = React.useState(false);
    const mounted = React.useRef(false);

    React.useEffect(() => {
        mounted.current = true;

        return () => {
            mounted.current = false;
        };
    }, []);

    const dirty = isDraftDirty(draft, action == null ? initialDraft.current : actionToDraft(action));

    // Providers reload when the browser tab regains focus, so one added in another tab is picked too
    React.useEffect(() => {
        if (action == null && draft.provider == null) {
            const provider = getDefaultProvider(providers);

            if (provider != null) {
                initialDraft.current = {...initialDraft.current, provider};
                setDraft((current) => ({...current, provider, model: null}));
            }
        }
    }, [providers]);

    React.useEffect(() => {
        props.onDirtyChange(dirty);
    }, [dirty]);

    const getFieldLabel = (fieldId: string): string => {
        return getLabelForFieldId(fieldId, customFieldVocabularies);
    };

    const update = (changes: Partial<IAIActionDraft>) => {
        setDraft((current) => ({...current, ...changes}));
        setErrors((current) => Object.keys(changes).reduce<IAIActionDraftErrors>(
            (cleared, field) => ({...cleared, [field]: undefined}),
            current,
        ));
    };

    const changeTab = (next: IActionEditorTab) => {
        currentTab.current = next;
        setTab(next);
        props.onTabChange(next);
    };

    const showErrors = (nextErrors: IAIActionDraftErrors) => {
        const tabsWithErrors = uniq(
            (Object.keys(nextErrors) as Array<IAIActionDraftField>)
                .filter((field) => nextErrors[field] != null)
                .map((field): IActionEditorTab => AI_SETTINGS_FIELDS.includes(field) ? 'ai-settings' : 'configuration'),
        );

        setErrors(nextErrors);

        if (tabsWithErrors.length > 0 && !tabsWithErrors.includes(currentTab.current)) {
            changeTab(tabsWithErrors[0]);
            setTabListKey((key) => key + 1);
        }

        if (tabsWithErrors.length > 1) {
            notify.error(gettext('Some fields need attention on both the Configuration and AI Settings tabs.'));
        }
    };

    const handleSaveError = (error: unknown) => {
        if (!(error instanceof AIStudioRequestError)) {
            notify.error(gettext('The action could not be saved. Check your connection and try again.'));
            return;
        }

        if (error.status === 412 && action != null) {
            notify.warning(
                gettext('Someone else changed this action. It has been reloaded, so make your changes again.'),
            );
            props.onConflict();
            return;
        }

        const body = error.body as {_issues?: unknown} | null;
        const {fields, other} = mapIssues(body?._issues);

        if (Object.keys(fields).length > 0) {
            showErrors(fields);
        }

        if (other.length > 0) {
            notify.error(other.join('\n'));
        }

        if (Object.keys(fields).length < 1 && other.length < 1) {
            notify.error(getErrorMessage(error.body));
        }
    };

    const save = () => {
        const validationErrors = validateDraft(draft, typeOption);

        if (Object.keys(validationErrors).length > 0) {
            showErrors(validationErrors);
            return;
        }

        const request = action == null
            ? createAction(buildCreatePayload(actionType, draft))
            : patchAction(action, buildPatch(action, draft));

        setSaving(true);

        request
            .then((saved) => {
                notify.success(gettext('AI action saved.'));
                props.onSaved(saved);
            })
            .catch((error) => {
                if (mounted.current) {
                    handleSaveError(error);
                } else {
                    notify.error(gettext('The action could not be saved.'));
                }
            })
            .finally(() => {
                if (mounted.current) {
                    setSaving(false);
                }
            });
    };

    const renderConfiguration = () => {
        const profileOptions = getProfileOptions(profiles, draft.content_profiles);
        const fieldOptions = getFieldOptions({
            builtInTextFields: options.built_in_text_fields,
            customFieldVocabularies,
            profiles,
            selectedProfileIds: draft.content_profiles,
            getLabel: getFieldLabel,
        });
        const inputOptions = withSelectedOptions(fieldOptions.input, draft.input_fields, getFieldLabel);
        const outputOptions = withSelectedOptions(
            fieldOptions.output,
            draft.output_field == null ? [] : [draft.output_field],
            getFieldLabel,
        );
        const userActions = (typeOption?.user_actions ?? []).map(getUserActionLabel);

        const toNodes = (items: Array<ISelectOption>) => items.map((value) => ({value}));
        const pick = (items: Array<ISelectOption>, ids: Array<string>) =>
            ids.map((id) => items.find((option) => option.id === id)).filter((option) => option != null);

        return (
            <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
                <div data-test-id="ai-action-active">
                    <Switch
                        label={{content: gettext('Active')}}
                        value={draft.active}
                        onChange={(active) => update({active})}
                    />
                </div>

                <Input
                    type="text"
                    label={gettext('Name')}
                    required
                    value={draft.name}
                    error={errors.name}
                    onChange={(name) => update({name})}
                    data-test-id="ai-action-name"
                />

                <TreeSelect<ISelectOption>
                    kind="synchronous"
                    label={gettext('Content profiles')}
                    info={gettext('Leave empty to offer the action for every content profile.')}
                    allowMultiple
                    value={pick(profileOptions, draft.content_profiles)}
                    getOptions={() => toNodes(profileOptions)}
                    getId={({id}) => id}
                    getLabel={({label}) => label}
                    error={errors.content_profiles}
                    onChange={(selected) => update({content_profiles: selected.map(({id}) => id)})}
                    data-test-id="ai-action-content-profiles"
                />

                <TreeSelect<ISelectOption>
                    // Options are read once on mount and depend on the selected profiles
                    key={draft.content_profiles.join(',')}
                    kind="synchronous"
                    label={gettext('Input fields')}
                    info={gettext('Text fields enabled in at least one of the content profiles.')}
                    required
                    allowMultiple
                    value={pick(inputOptions, draft.input_fields)}
                    getOptions={() => toNodes(inputOptions)}
                    getId={({id}) => id}
                    getLabel={({label}) => label}
                    error={errors.input_fields}
                    onChange={(selected) => update({input_fields: selected.map(({id}) => id)})}
                    data-test-id="ai-action-input-fields"
                />

                <Select
                    label={gettext('Output field')}
                    info={
                        fieldOptions.output.length < 1
                            ? gettext('No text field is enabled in every one of the content profiles.')
                            : gettext('Text fields enabled in every one of the content profiles.')
                    }
                    required
                    value={draft.output_field ?? ''}
                    error={errors.output_field}
                    onChange={(value) => update({output_field: value === '' ? null : value})}
                    data-test-id="ai-action-output-field"
                >
                    {draft.output_field == null && <Option value="">{gettext('Select a field')}</Option>}
                    {outputOptions.map(({id, label}) => (
                        <Option key={id} value={id}>{label}</Option>
                    ))}
                </Select>

                <div style={{display: 'flex', gap: 16, alignItems: 'flex-start'}}>
                    <div style={{flex: 1}}>
                        <Input
                            type="number"
                            label={gettext('Max. characters')}
                            // eslint-disable-next-line max-len
                            info={gettext('Leave empty to use the maximum length of the output field in the content profile.')}
                            value={toNumberInputValue(draft.max_characters)}
                            error={errors.max_characters}
                            onChange={(value) => update({max_characters: numberInputToValue(value)})}
                            data-test-id="ai-action-max-characters"
                        />
                    </div>

                    {typeOption?.uses_suggestions_count === true && (
                        <div style={{flex: 1}}>
                            <Input
                                type="number"
                                label={gettext('No. of suggestions')}
                                info={gettext('From {{min}} to {{max}}.', {
                                    min: SUGGESTIONS_COUNT_MIN,
                                    max: SUGGESTIONS_COUNT_MAX,
                                })}
                                required
                                value={toNumberInputValue(draft.suggestions_count)}
                                error={errors.suggestions_count}
                                onChange={(value) => update({suggestions_count: numberInputToValue(value)})}
                                data-test-id="ai-action-suggestions-count"
                            />
                        </div>
                    )}
                </div>

                <div data-test-id="ai-action-user-actions">
                    <FormLabel text={gettext('User actions')} />
                    {typeOption == null ? (
                        <Text>{gettext('Editors are not offered actions of this type yet.')}</Text>
                    ) : (
                        <>
                            <div className="ai-studio-user-actions">
                                {userActions.map((label) => (
                                    <Label key={label} text={label} style="translucent" noTransform />
                                ))}
                            </div>
                            <div className="sd-input__hint">
                                {gettext('What editors can do with each answer. Set by the action type.')}
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    const renderAiSettings = () => {
        const provider = providers.find(({_id}) => _id === draft.provider) ?? null;
        const modelWarning = getModelWarning(provider, draft.model);
        const providerOptions = getProviderOptions(providers, draft.provider);
        const providersLink = (
            // A new tab, so the action being edited is not lost
            <a
                className="text-link"
                href={AI_PROVIDERS_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-test-id="ai-action-providers-link"
            >
                {gettext('Open AI Providers')}
            </a>
        );

        return (
            <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
                {providerOptions.length < 1 ? (
                    <div data-test-id="ai-action-no-providers">
                        <FormLabel text={gettext('Provider')} />
                        <Alert type="warning" style="hollow" size="small" margin="none">
                            <span>
                                {gettext('There are no active AI providers yet.')}{' '}
                                {providersLink}
                            </span>
                        </Alert>
                    </div>
                ) : (
                    <div>
                        <Select
                            label={gettext('Provider')}
                            required
                            value={draft.provider ?? ''}
                            error={errors.provider}
                            onChange={(value) => update({provider: value === '' ? null : value, model: null})}
                            data-test-id="ai-action-provider"
                        >
                            {draft.provider == null && <Option value="">{gettext('Select a provider')}</Option>}
                            {providerOptions.map(({id, label}) => (
                                <Option key={id} value={id}>{label}</Option>
                            ))}
                        </Select>
                        <div className="sd-input__hint ai-studio-providers-hint">
                            {gettext('Providers are managed in the settings.')}{' '}
                            {providersLink}
                        </div>
                    </div>
                )}

                {provider != null && (
                    <Select
                        label={gettext('Model')}
                        value={draft.model ?? PROVIDER_DEFAULT_MODEL}
                        error={errors.model}
                        onChange={(value) => update({model: value === PROVIDER_DEFAULT_MODEL ? null : value})}
                        data-test-id="ai-action-model"
                    >
                        {getModelOptions(provider, draft.model).map(({id, label}) => (
                            <Option key={id} value={id}>{label}</Option>
                        ))}
                    </Select>
                )}

                {modelWarning != null && (
                    <div data-test-id="ai-action-model-warning">
                        <Alert type="warning" size="small" margin="none">{modelWarning}</Alert>
                    </div>
                )}

                <TextArea
                    label={gettext('Extra instructions')}
                    info={gettext(
                        // eslint-disable-next-line max-len
                        'Added to the built-in instructions. The number of answers, their length and the output field are set in Configuration.',
                    )}
                    value={draft.extra_instructions ?? ''}
                    maxLength={EXTRA_INSTRUCTIONS_MAX_LENGTH}
                    rows={6}
                    autoHeight
                    maxRows={20}
                    error={errors.extra_instructions}
                    onChange={(value) => update({extra_instructions: value})}
                    data-test-id="ai-action-extra-instructions"
                />
            </div>
        );
    };

    return (
        <Layout.Panel
            side="right"
            size="large"
            open
            className="ai-studio-editor"
            data-test-id="ai-action-editor"
        >
            {/* Built from the panel header's classes, as `Layout.PanelHeader` only takes a text title */}
            <div className="side-panel__header side-panel__header--border-b side-panel__header--darker">
                <div className="side-panel__header-wrapper">
                    <div className="side-panel__header-inner ai-studio-editor__title">
                        <SvgIconIllustration illustration={getActionTypeIllustration(actionType)} />
                        <h3 className="side-panel__heading">{getActionTypeLabel(actionType)}</h3>
                    </div>
                    <ButtonGroup align="end" className="side-panel__btn-group">
                        <Button
                            text={dirty ? gettext('Cancel') : gettext('Close')}
                            type="default"
                            disabled={saving}
                            onClick={() => props.onCancel()}
                            data-test-id="ai-action-cancel"
                        />
                        <Button
                            text={gettext('Save')}
                            type="primary"
                            disabled={saving || !dirty}
                            isLoading={saving}
                            onClick={save}
                            data-test-id="ai-action-save"
                        />
                    </ButtonGroup>
                </div>
            </div>

            <Layout.PanelContent>
                <Layout.PanelContentBlock>
                    <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
                        <div className="ai-studio-segmented-tabs">
                            <TabList
                                key={tabListKey}
                                tabs={[
                                    {id: 'configuration', label: gettext('Configuration')},
                                    {id: 'ai-settings', label: gettext('AI Settings')},
                                ]}
                                selectedTabId={tab}
                                onChange={(next: IActionEditorTab) => changeTab(next)}
                                data-test-id="ai-action-tabs"
                            />
                        </div>

                        {tab === 'configuration' ? renderConfiguration() : renderAiSettings()}
                    </div>
                </Layout.PanelContentBlock>
            </Layout.PanelContent>
        </Layout.Panel>
    );
}
