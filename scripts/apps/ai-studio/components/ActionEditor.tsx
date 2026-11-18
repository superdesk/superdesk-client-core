import React from 'react';
import {
    Alert,
    Button,
    ButtonGroup,
    FormLabel,
    Input,
    Option,
    Select,
    SvgIconIllustration,
    Switch,
    Text,
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
import {AIStudioRequestError, createAction, getAction, patchAction} from '../api';
import {
    EXTRA_INSTRUCTIONS_MAX_LENGTH,
    SUGGESTIONS_COUNT_MAX,
    SUGGESTIONS_COUNT_MIN,
    actionToDraft,
    buildCreatePayload,
    buildPatch,
    getNewDraft,
    isNewDraftDirty,
    numberInputToValue,
    validateDraft,
    withProvider,
} from '../helpers/draft';
import {getFieldOptions, getProfileOptions, withSelectedOptions} from '../helpers/field-options';
import {getErrorMessage, mapIssues} from '../helpers/issues';
import {getActionTypeIllustration, getActionTypeLabel, getUserActionLabel} from '../helpers/labels';
import {PROVIDER_DEFAULT_MODEL, getModelOptions, getModelWarning, getProviderOptions} from '../helpers/model-options';
import {TextAreaInput} from './TextAreaInput';
import './style.scss';

type ITab = 'configuration' | 'ai-settings';

const AI_SETTINGS_FIELDS: Array<IAIActionDraftField> = ['provider', 'model', 'extra_instructions'];

interface IProps {
    /** `null` when creating a new action */
    action: IAIAction | null;
    actionType: IAIActionType;
    options: IAIActionOptions;
    providers: Array<IAIProvider>;
    profiles: Array<IContentProfile>;
    customFieldVocabularies: Array<IVocabulary>;
    onDirtyChange(dirty: boolean): void;
    onCancel(): void;
    onSaved(action: IAIAction): void;

    /** Someone else saved the action first; the page reloads it, which resets this form */
    onConflict(): void;
}

interface IState {
    draft: IAIActionDraft;
    errors: IAIActionDraftErrors;
    tab: ITab;
    saving: boolean;
}

/**
 * ui-framework's number `Input` types its value as a number, but an empty field needs `''`;
 * `undefined` would turn it into an uncontrolled input that keeps showing the old number.
 */
function toNumberInputValue(value: number | null): number {
    return value ?? ('' as unknown as number);
}

export class ActionEditor extends React.PureComponent<IProps, IState> {
    private mounted = false;

    constructor(props: IProps) {
        super(props);

        this.state = {
            draft: props.action == null ? getNewDraft() : actionToDraft(props.action),
            errors: {},
            tab: 'configuration',
            saving: false,
        };

        this.getFieldLabel = this.getFieldLabel.bind(this);
        this.save = this.save.bind(this);
    }

    componentDidMount() {
        this.mounted = true;
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    componentDidUpdate(_prevProps: IProps, prevState: IState) {
        if (prevState.draft !== this.state.draft) {
            this.props.onDirtyChange(this.isDirty());
        }
    }

    private getTypeOption() {
        return this.props.options.action_types.find(({action_type}) => action_type === this.props.actionType);
    }

    private isDirty(): boolean {
        const {action} = this.props;

        return action == null
            ? isNewDraftDirty(this.state.draft)
            : Object.keys(buildPatch(action, this.state.draft, this.getTypeOption())).length > 0;
    }

    private getFieldLabel(fieldId: string): string {
        return getLabelForFieldId(fieldId, this.props.customFieldVocabularies);
    }

    private update(changes: Partial<IAIActionDraft>) {
        const cleared = Object.keys(changes).reduce<IAIActionDraftErrors>(
            (errors, field) => ({...errors, [field]: undefined}),
            this.state.errors,
        );

        this.setState({draft: {...this.state.draft, ...changes}, errors: cleared});
    }

    private showErrors(errors: IAIActionDraftErrors) {
        const fields = Object.keys(errors).filter((field) => errors[field] != null) as Array<IAIActionDraftField>;
        const onConfiguration = fields.some((field) => !AI_SETTINGS_FIELDS.includes(field));
        const onAiSettings = fields.some((field) => AI_SETTINGS_FIELDS.includes(field));
        const visibleOnCurrentTab = this.state.tab === 'configuration' ? onConfiguration : onAiSettings;

        this.setState({
            errors,
            tab: visibleOnCurrentTab ? this.state.tab : (onConfiguration ? 'configuration' : 'ai-settings'),
        });

        if (onConfiguration && onAiSettings) {
            notify.error(gettext('Some fields need attention on both the Configuration and AI Settings tabs.'));
        }
    }

    private handleSaveError(error: unknown) {
        if (!(error instanceof AIStudioRequestError)) {
            notify.error(gettext('The action could not be saved. Check your connection and try again.'));
            return;
        }

        if (error.status === 412 && this.props.action != null) {
            notify.warning(
                gettext('Someone else changed this action. It has been reloaded, so make your changes again.'),
            );
            this.props.onConflict();
            return;
        }

        const body = error.body as {_issues?: unknown} | null;
        const {fields, other} = mapIssues(body?._issues);

        if (Object.keys(fields).length > 0) {
            this.showErrors(fields);
        }

        if (other.length > 0) {
            notify.error(other.join('\n'));
        }

        if (Object.keys(fields).length < 1 && other.length < 1) {
            notify.error(getErrorMessage(error.body));
        }
    }

    save() {
        const {action, actionType} = this.props;
        const {draft} = this.state;
        const typeOption = this.getTypeOption();
        const errors = validateDraft(draft, typeOption);

        if (Object.keys(errors).length > 0) {
            this.showErrors(errors);
            return;
        }

        const request = action == null
            ? createAction(buildCreatePayload(actionType, draft, typeOption))
            : patchAction(action, buildPatch(action, draft, typeOption));

        this.setState({saving: true});

        request
            .then((saved) => {
                // The stored action is read back whole, so nothing is merged with what the form held
                return getAction(saved._id).catch(() => saved);
            })
            .then((saved) => {
                notify.success(gettext('AI action saved.'));
                this.props.onSaved(saved);
            })
            .catch((error) => {
                this.handleSaveError(error);
            })
            .finally(() => {
                if (this.mounted) {
                    this.setState({saving: false});
                }
            });
    }

    private renderConfiguration() {
        const {draft, errors} = this.state;
        const {options, profiles, customFieldVocabularies} = this.props;
        const typeOption = this.getTypeOption();

        const profileOptions = getProfileOptions(profiles, draft.content_profiles);
        const fieldOptions = getFieldOptions({
            builtInTextFields: options.built_in_text_fields,
            customFieldVocabularies,
            profiles,
            selectedProfileIds: draft.content_profiles,
            getLabel: this.getFieldLabel,
        });
        const inputOptions = withSelectedOptions(fieldOptions.input, draft.input_fields, this.getFieldLabel);
        const outputOptions = withSelectedOptions(
            fieldOptions.output,
            draft.output_field == null ? [] : [draft.output_field],
            this.getFieldLabel,
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
                        onChange={(active) => this.update({active})}
                    />
                </div>

                <Input
                    type="text"
                    label={gettext('Name')}
                    required
                    value={draft.name}
                    error={errors.name}
                    onChange={(name) => this.update({name})}
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
                    onChange={(selected) => this.update({content_profiles: selected.map(({id}) => id)})}
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
                    onChange={(selected) => this.update({input_fields: selected.map(({id}) => id)})}
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
                    onChange={(value) => this.update({output_field: value === '' ? null : value})}
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
                            onChange={(value) => this.update({max_characters: numberInputToValue(value)})}
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
                                onChange={(value) => this.update({suggestions_count: numberInputToValue(value)})}
                                data-test-id="ai-action-suggestions-count"
                            />
                        </div>
                    )}
                </div>

                <div data-test-id="ai-action-user-actions">
                    <FormLabel text={gettext('User actions')} />
                    <Text>
                        {
                            typeOption == null
                                ? gettext('Editors are not offered actions of this type yet.')
                                : gettext('Editors can: {{actions}}', {actions: userActions.join(', ')})
                        }
                    </Text>
                </div>
            </div>
        );
    }

    private renderAiSettings() {
        const {draft, errors} = this.state;
        const {providers} = this.props;
        const provider = providers.find(({_id}) => _id === draft.provider) ?? null;
        const modelWarning = getModelWarning(provider, draft.model);

        return (
            <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
                <Select
                    label={gettext('Provider')}
                    required
                    value={draft.provider ?? ''}
                    error={errors.provider}
                    onChange={(value) => {
                        this.setState({
                            draft: withProvider(this.state.draft, value === '' ? null : value),
                            errors: {...this.state.errors, provider: undefined, model: undefined},
                        });
                    }}
                    data-test-id="ai-action-provider"
                >
                    {draft.provider == null && <Option value="">{gettext('Select a provider')}</Option>}
                    {getProviderOptions(providers, draft.provider).map(({id, label}) => (
                        <Option key={id} value={id}>{label}</Option>
                    ))}
                </Select>

                {provider != null && (
                    <Select
                        label={gettext('Model')}
                        value={draft.model ?? PROVIDER_DEFAULT_MODEL}
                        error={errors.model}
                        onChange={(value) => this.update({model: value === PROVIDER_DEFAULT_MODEL ? null : value})}
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

                <TextAreaInput
                    label={gettext('Extra instructions')}
                    info={gettext(
                        // eslint-disable-next-line max-len
                        'Added to the built-in instructions. The number of answers, their length and the output field are set in Configuration.',
                    )}
                    value={draft.extra_instructions ?? ''}
                    maxLength={EXTRA_INSTRUCTIONS_MAX_LENGTH}
                    rows={6}
                    error={errors.extra_instructions}
                    onChange={(value) => this.update({extra_instructions: value})}
                    data-test-id="ai-action-extra-instructions"
                />
            </div>
        );
    }

    render() {
        const {actionType} = this.props;
        const {tab, saving} = this.state;

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
                                text={gettext('Cancel')}
                                type="default"
                                onClick={() => this.props.onCancel()}
                                data-test-id="ai-action-cancel"
                            />
                            <Button
                                text={gettext('Save')}
                                type="primary"
                                disabled={saving || !this.isDirty()}
                                isLoading={saving}
                                onClick={this.save}
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
                                    // The tab list only reads the selected tab on mount
                                    key={tab}
                                    tabs={[
                                        {id: 'configuration', label: gettext('Configuration')},
                                        {id: 'ai-settings', label: gettext('AI Settings')},
                                    ]}
                                    selectedTabId={tab}
                                    onChange={(next: ITab) => this.setState({tab: next})}
                                    data-test-id="ai-action-tabs"
                                />
                            </div>

                            {tab === 'configuration' ? this.renderConfiguration() : this.renderAiSettings()}
                        </div>
                    </Layout.PanelContentBlock>
                </Layout.PanelContent>
            </Layout.Panel>
        );
    }
}
