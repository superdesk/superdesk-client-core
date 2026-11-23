import React, {useEffect, useRef, useState} from 'react';
import {
    ButtonGroup,
    CreateButton,
    Dropdown,
    EmptyState,
    Loader,
    RadioButtonGroup,
    SubNav,
} from 'superdesk-ui-framework/react';
import {BoxedList} from 'superdesk-ui-framework/react/components/Lists';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import {sdApi} from 'api';
import {dataStore} from 'data-store';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {notify} from 'core/notify/notify';
import {showConfirmationPrompt} from 'core/ui/show-confirmation-prompt';
import type {IAIProvider} from 'apps/ai-providers/interfaces';
import type {IAIAction, IAIActionOptions, IAIActionType} from '../interfaces';
import {AIStudioRequestError, deleteAction, getAction, getActionOptions, getActions, getProviders} from '../api';
import {getErrorMessage} from '../helpers/issues';
import {getActionTypeFilterLabel, getActionTypeLabel} from '../helpers/labels';
import {ActionEditor, IActionEditorTab} from './ActionEditor';
import {ActionListItem} from './ActionListItem';

const ALL_TYPES = 'all';

interface IEditing {
    /** `null` when creating a new action */
    action: IAIAction | null;
    actionType: IAIActionType;

    /** Changes for each new form, so a second "new" starts blank */
    newFormId?: number;
}

interface IState {
    loading: boolean;
    loadError: string | null;
    options: IAIActionOptions | null;
    actions: Array<IAIAction>;
    providers: Array<IAIProvider>;
    filter: IAIActionType | typeof ALL_TYPES;
    editing: IEditing | null;
    dirty: boolean;
}

function sortByName(actions: Array<IAIAction>): Array<IAIAction> {
    return [...actions].sort((a, b) => a.name.localeCompare(b.name));
}

function toErrorMessage(error: unknown): string {
    return error instanceof AIStudioRequestError
        ? getErrorMessage(error.body)
        : gettext('The server could not be reached.');
}

const INITIAL_STATE: IState = {
    loading: true,
    loadError: null,
    options: null,
    actions: [],
    providers: [],
    filter: ALL_TYPES,
    editing: null,
    dirty: false,
};

export function EditorialActionsPage() {
    const [state, setState] = useState<IState>(INITIAL_STATE);
    const lastNewFormId = useRef(0);
    const editorTab = useRef<IActionEditorTab>('configuration');

    // For handlers that run after a prompt or a request, when the state may have changed
    const stateRef = useRef(state);

    stateRef.current = state;

    const updateState = (changes: Partial<IState>) => {
        setState((previous) => ({...previous, ...changes}));
    };

    useEffect(() => {
        Promise.all([
            getActionOptions(),
            getActions(),
            getProviders(),
            // Both are preloaded on startup, which does not always run before the first page
            dataStore.initialize(),
            ng.get('vocabularies').getAllActiveVocabularies(),
        ])
            .then(([options, actions, providers]) => {
                updateState({loading: false, options, actions: sortByName(actions), providers});
            })
            .catch((error) => {
                updateState({loading: false, loadError: toErrorMessage(error)});
            });

        const reloadProviders = () => {
            getProviders()
                .then((providers) => updateState({providers}))
                .catch((error) => notify.error(toErrorMessage(error)));
        };

        // So a provider added in another tab shows up on return
        window.addEventListener('focus', reloadProviders);

        return () => {
            window.removeEventListener('focus', reloadProviders);
        };
    }, []);

    const reloadActions = () => {
        return getActions()
            .then((actions) => updateState({actions: sortByName(actions)}))
            .catch((error) => notify.error(toErrorMessage(error)));
    };

    /** Asks first when the open form has unsaved changes */
    const openEditor = (editing: IEditing | null) => {
        const current = stateRef.current.editing?.action;

        if (current != null && editing?.action != null && current._id === editing.action._id) {
            return;
        }

        const proceed = stateRef.current.editing != null && stateRef.current.dirty
            ? showConfirmationPrompt({
                title: gettext('Discard changes?'),
                message: gettext('The action you are editing has unsaved changes.'),
                primaryActionText: gettext('Discard'),
            })
            : Promise.resolve(true);

        proceed.then((confirmed) => {
            if (confirmed) {
                editorTab.current = 'configuration';
                updateState({editing, dirty: false});
            }
        });
    };

    const replaceAction = (action: IAIAction) => {
        setState((previous) => {
            const exists = previous.actions.some(({_id}) => _id === action._id);

            return {
                ...previous,
                actions: sortByName(
                    exists
                        ? previous.actions.map((item) => item._id === action._id ? action : item)
                        : [...previous.actions, action],
                ),
            };
        });
    };

    const removeAction = (id: IAIAction['_id']) => {
        setState((previous) => ({
            ...previous,
            actions: previous.actions.filter(({_id}) => _id !== id),
            editing: previous.editing?.action?._id === id ? null : previous.editing,
            dirty: previous.editing?.action?._id === id ? false : previous.dirty,
        }));
    };

    const reloadEditedAction = () => {
        const action = stateRef.current.editing?.action;

        if (action == null) {
            return;
        }

        getAction(action._id)
            .then((fresh) => {
                replaceAction(fresh);
                updateState({editing: {action: fresh, actionType: fresh.action_type}, dirty: false});
            })
            .catch((error) => {
                if (error instanceof AIStudioRequestError && error.status === 404) {
                    notify.error(gettext('The action has been deleted.'));
                    removeAction(action._id);
                } else {
                    notify.error(toErrorMessage(error));
                }
            });
    };

    const deleteWithPrompt = (action: IAIAction) => {
        showConfirmationPrompt({
            title: gettext('Delete AI action'),
            message: gettext('Delete "{{name}}"? Editors will no longer be offered it.', {name: action.name}),
            primaryActionText: gettext('Delete'),
        }).then((confirmed) => {
            if (!confirmed) {
                return;
            }

            deleteAction(action)
                .then(() => {
                    notify.success(gettext('AI action deleted.'));
                    removeAction(action._id);
                })
                .catch((error) => {
                    if (error instanceof AIStudioRequestError && error.status === 412) {
                        notify.warning(
                            // eslint-disable-next-line max-len
                            gettext('Someone else changed this action, so it was not deleted. The list has been reloaded.'),
                        );
                        reloadActions();
                    } else {
                        notify.error(toErrorMessage(error));
                    }
                });
        });
    };

    const renderHeader = () => {
        const {options, filter} = state;
        const types = options?.action_types ?? [];

        return (
            <SubNav data-test-id="ai-studio-subnav">
                <div style={{flexGrow: 1, paddingInline: 16, display: 'flex', alignItems: 'center'}}>
                    <RadioButtonGroup
                        value={filter}
                        options={[
                            {value: ALL_TYPES, label: gettext('All')},
                            ...types.map(({action_type}) => ({
                                value: action_type,
                                label: getActionTypeFilterLabel(action_type),
                            })),
                        ]}
                        onChange={(value: IAIActionType | typeof ALL_TYPES) => updateState({filter: value})}
                        data-test-id="ai-action-type-filter"
                    />
                </div>

                {types.length > 0 && (
                    <ButtonGroup align="end">
                        <div data-test-id="ai-action-create">
                            <Dropdown
                                align="right"
                                items={types.map(({action_type}) => ({
                                    label: (
                                        <span data-test-id="ai-action-create-type" data-test-value={action_type}>
                                            {getActionTypeLabel(action_type)}
                                        </span>
                                    ),
                                    onSelect: () => openEditor({
                                        action: null,
                                        actionType: action_type,
                                        newFormId: ++lastNewFormId.current,
                                    }),
                                }))}
                            >
                                <CreateButton
                                    ariaValue={gettext('Create AI action')}
                                    onClick={() => undefined}
                                />
                            </Dropdown>
                        </div>
                    </ButtonGroup>
                )}
            </SubNav>
        );
    };

    const renderList = () => {
        const {actions, filter, editing, loading, loadError} = state;

        if (loading) {
            return <Loader overlay={false} />;
        }

        if (loadError != null) {
            return (
                <EmptyState
                    size="large"
                    illustration="2"
                    title={gettext('Editorial actions could not be loaded')}
                    description={loadError}
                />
            );
        }

        const visible = filter === ALL_TYPES ? actions : actions.filter(({action_type}) => action_type === filter);

        if (visible.length < 1) {
            return (
                <EmptyState
                    size="large"
                    illustration="1"
                    title={
                        filter === ALL_TYPES
                            ? gettext('No editorial actions yet')
                            : gettext('No {{type}} yet', {type: getActionTypeFilterLabel(filter).toLowerCase()})
                    }
                    description={gettext('Use the + button to create one.')}
                />
            );
        }

        return (
            <div data-test-id="ai-action-list" style={{padding: 16}}>
                <BoxedList>
                    {visible.map((action) => (
                        <ActionListItem
                            key={action._id}
                            action={action}
                            profiles={sdApi.contentProfiles.getAll()}
                            selected={editing?.action?._id === action._id}
                            onEdit={() => openEditor({action, actionType: action.action_type})}
                            onDelete={() => deleteWithPrompt(action)}
                        />
                    ))}
                </BoxedList>
            </div>
        );
    };

    const {editing, options, providers} = state;

    return (
        <div
            data-test-id="ai-studio-editorial-actions"
            style={{display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0}}
        >
            <Layout.PageLayout
                fullHeight
                header={renderHeader()}
                main={renderList()}
                rightPanelOpen={editing != null}
                rightPanel={editing != null && options != null && (
                    <ActionEditor
                        // A new key resets the form, after a save or a reload
                        key={editing.action == null
                            ? `new-${editing.newFormId}`
                            : `${editing.action._id}-${editing.action._etag}`}
                        action={editing.action}
                        actionType={editing.actionType}
                        options={options}
                        providers={providers}
                        profiles={sdApi.contentProfiles.getAll()}
                        customFieldVocabularies={sdApi.vocabularies.getCustomFieldVocabularies()}
                        initialTab={editorTab.current}
                        onTabChange={(tab) => {
                            editorTab.current = tab;
                        }}
                        onDirtyChange={(dirty) => updateState({dirty})}
                        onCancel={() => updateState({editing: null, dirty: false})}
                        onSaved={(saved) => {
                            replaceAction(saved);

                            // The user may have discarded this form and opened another while it saved
                            if (stateRef.current.editing === editing) {
                                updateState({editing: {action: saved, actionType: saved.action_type}, dirty: false});
                            }
                        }}
                        onConflict={reloadEditedAction}
                    />
                )}
            />
        </div>
    );
}
