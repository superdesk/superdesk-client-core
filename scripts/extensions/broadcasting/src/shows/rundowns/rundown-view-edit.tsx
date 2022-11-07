/* eslint-disable react/no-multi-comp */

import * as React from 'react';
import {
    IRundown,
    IRundownExportOption,
    IRundownExportResponse,
    IRundownItem,
    IRundownItemBase,
    IRundownTemplateBase,
} from '../../interfaces';
import {Button, Dropdown, IconButton, Input, SubNav} from 'superdesk-ui-framework/react';
import * as Nav from 'superdesk-ui-framework/react/components/Navigation';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';

export type IRundownAction = null | {mode: 'view'; id: string} | {mode: 'edit'; id: string};

interface IProps {
    rundownId: string;
    rundownItemAction: IRundownItemActionNext;
    onRundownItemActionChange(action: IRundownItemActionNext): void;
    onRundownActionChange(action: IRundownAction): void;
    readOnly: boolean;
    onClose(rundown: IRundown): void;
}

interface IState {
    rundown: IRundown | null;
    rundownWithChanges: IRundown | null;
    exportOptions: Array<IRundownExportOption>;
}

import {superdesk} from '../../superdesk';

import {ManageRundownItems} from './manage-rundown-items';
import {arrayInsertAtIndex, CreateValidators, downloadFileAttachment, WithValidation} from '@superdesk/common';
import {stringNotEmpty} from '../../form-validation';
import {isEqual, noop} from 'lodash';
import {rundownItemStorageAdapter} from './rundown-template-item-storage-adapter';
import {LANGUAGE} from '../../constants';
import {IRestApiResponse, ITopBarWidget} from 'superdesk-api';
import {AiringInfoBlock} from './components/airing-info-block';
import {commentsWidget} from './rundown-items/widgets/comments';
import {
    IRundownItemActionNext,
    prepareForCreation,
    prepareForEditing,
    prepareForPreview,
} from './prepare-create-edit-rundown-item';
const {gettext} = superdesk.localization;
const {httpRequestJsonLocal} = superdesk;
const {
    getAuthoringComponent,
    getLockInfoHttpComponent,
    getLockInfoComponent,
    WithLiveResources,
    SpacerBlock,
    Spacer,
} = superdesk.components;
const {generatePatch, isLockedInOtherSession} = superdesk.utilities;
const {addWebsocketMessageListener} = superdesk;
const {tryUnlocking, tryLocking} = superdesk.helpers;

const AuthoringReact = getAuthoringComponent<IRundownItem>();
const RundownLockInfo = getLockInfoHttpComponent<IRundown>();
const RundownItemLockInfo = getLockInfoComponent<IRundownItem>();

function handleUnsavedRundownChanges(
    mode: IRundownItemActionNext,
    skipUnsavedChangesCheck: boolean,
    onSuccess: () => void,
) {
    if (skipUnsavedChangesCheck === true) {
        onSuccess();

        return;
    }

    if (mode == null) {
        onSuccess();
    } else if (mode.type === 'preview') {
        onSuccess();
    } else {
        superdesk.ui.confirm(gettext('There is an item open in editing mode. Discard changes?')).then((confirmed) => {
            if (confirmed) {
                onSuccess();
            }
        });
    }
}

const sideWidgets = [
    superdesk.authoringGeneric.sideWidgets.inlineComments,
    commentsWidget,
];

const rundownValidator: CreateValidators<Partial<IRundown>> = {
    title: stringNotEmpty,
};

export function prepareRundownTemplateForSaving<T extends IRundownTemplateBase | Partial<IRundownTemplateBase>>(
    template: T,
): T {
    const copy = {...template};

    const items = copy.items ?? [];

    if (items.length > 0) {
        copy.items = items.map((item) => {
            const itemCopy = {...item};

            if (item.duration == null) {
                item.duration = item.planned_duration;
            }

            return itemCopy;
        });
    }

    return copy;
}

export function prepareRundownItemForSaving(item: Partial<IRundownItemBase>): Partial<IRundownItemBase> {
    const copy = {...item};

    if (item.duration == null) {
        item.duration = item.planned_duration;
    }

    return copy;
}

export class RundownViewEditComponent extends React.PureComponent<IProps, IState> {
    private eventListenersToRemoveBeforeUnmounting: Array<() => void>;

    constructor(props: IProps) {
        super(props);

        this.state = {
            rundown: null,
            rundownWithChanges: null,
            exportOptions: [],
        };

        this.setRundownField = this.setRundownField.bind(this);
        this.initiateCreation = this.initiateCreation.bind(this);
        this.initiateEditing = this.initiateEditing.bind(this);
        this.initiatePreview = this.initiatePreview.bind(this);
        this.save = this.save.bind(this);
        this.close = this.close.bind(this);
        this.initializeData = this.initializeData.bind(this);

        this.eventListenersToRemoveBeforeUnmounting = [];
    }

    setRundownField(data: Partial<IRundown>, callback?: () => void) {
        const {rundownWithChanges} = this.state;

        if (rundownWithChanges == null) {
            throw new Error('invalid operation');
        }

        this.setState({
            rundownWithChanges: {
                ...rundownWithChanges,
                ...data,
            },
        }, callback);
    }

    save(): void {
        if (this.state.rundownWithChanges == null || this.state.rundown == null) {
            throw new Error('invalid state');
        }

        httpRequestJsonLocal<IRundown>({
            method: 'PATCH',
            path: `/rundowns/${this.props.rundownId}`,
            payload: generatePatch(this.state.rundown, this.state.rundownWithChanges, {undefinedEqNull: true}),
            headers: {
                'If-Match': this.state.rundown._etag,
            },
        }).then((rundown) => {
            this.setState({
                rundown: rundown,
                rundownWithChanges: rundown,
            });
        });
    }

    close(rundown: IRundown) {
        if (!isEqual(rundown, this.state.rundownWithChanges)) {
            superdesk.ui.confirm(gettext('Discard unsaved changes?')).then((confirmed) => {
                if (confirmed) {
                    this.props.onClose(rundown);
                }
            });
        } else {
            this.props.onClose(rundown);
        }
    }

    initiateCreation(
        rundownId: IRundown['_id'],
        initialData: Partial<IRundownItemBase>,
        insertAtIndex?: number,
        skipUnsavedChangesCheck?: boolean,
    ) {
        handleUnsavedRundownChanges(this.props.rundownItemAction, skipUnsavedChangesCheck ?? false, () => {
            this.props.onRundownItemActionChange(
                prepareForCreation(rundownId, this.props.rundownItemAction, initialData, (val) => {
                    const itemWithDuration: Partial<IRundownItemBase> = val;

                    const {rundown, rundownWithChanges} = this.state;

                    if (rundown == null || rundownWithChanges == null) {
                        throw new Error('disallowed state');
                    }

                    return httpRequestJsonLocal<IRundownItem>({
                        method: 'POST',
                        path: '/rundown_items',
                        payload: prepareRundownItemForSaving(itemWithDuration),
                    }).then((res) => {
                        const currentItems = rundown.items ?? [];

                        return httpRequestJsonLocal<IRundown>({
                            method: 'PATCH',
                            path: `/rundowns/${this.props.rundownId}`,
                            payload: {
                                items: arrayInsertAtIndex(
                                    currentItems,
                                    {_id: res._id},
                                    insertAtIndex ?? currentItems.length,
                                ),
                            },
                            headers: {
                                'If-Match': rundown._etag,
                            },
                        }).then((rundownNext) => {
                            this.setState({
                                rundown: {
                                    ...rundown,
                                    items: rundownNext.items,
                                    _etag: rundownNext._etag,
                                },
                                rundownWithChanges: {
                                    ...rundownWithChanges,
                                    items: rundownNext.items,
                                    _etag: rundownNext._etag,
                                },
                            });

                            // needed to exit creation mode so saving again wouldn't create another item
                            this.initiateEditing(res._id, true);

                            return val;
                        });
                    });
                }),
            );
        });
    }

    initiateEditing(id: IRundownItem['_id'], skipUnsavedChangesCheck?: boolean) {
        handleUnsavedRundownChanges(this.props.rundownItemAction, skipUnsavedChangesCheck ?? false, () => {
            const action = this.props.rundownItemAction;
            const rundownItemIdToUnlock = action != null && action.type === 'edit' ? action.itemId : null;

            Promise.all([
                rundownItemIdToUnlock != null
                    ? tryUnlocking<IRundownItem>('/rundown_items', rundownItemIdToUnlock)
                    : Promise.resolve(),
                tryLocking<IRundownItem>('/rundown_items', id),
            ]).then(() => {
                /**
                 * Starting editing even if item can't be locked at the moment.
                 * There will be a button in the UI to force-unlock.
                 */
                this.props.onRundownItemActionChange(
                    prepareForEditing(this.props.rundownItemAction, id),
                );
            });
        });
    }

    initiatePreview(id: IRundownItem['_id'], skipUnsavedChangesCheck?: boolean) {
        handleUnsavedRundownChanges(this.props.rundownItemAction, skipUnsavedChangesCheck ?? false, () => {
            this.props.onRundownItemActionChange(prepareForPreview(this.props.rundownItemAction, id));
        });
    }

    private initializeData() {
        Promise.all([
            httpRequestJsonLocal<IRundown>({
                method: 'GET',
                path: `/rundowns/${this.props.rundownId}`,
            }),
            httpRequestJsonLocal<IRestApiResponse<IRundownExportOption>>({
                method: 'GET',
                path: '/rundown_export',
            }),
        ]).then(([rundown, exportOptions]) => {
            this.setState({
                rundown: rundown,
                rundownWithChanges: rundown,
                exportOptions: exportOptions._items,
            });
        });
    }

    componentDidMount() {
        this.initializeData();

        this.eventListenersToRemoveBeforeUnmounting.push(
            addWebsocketMessageListener('resource:updated', ({detail}) => {
                if (
                    detail.event === 'resource:updated'
                    && detail.extra.resource === 'rundowns'
                    && detail.extra._id === this.state.rundown?._id
                ) {
                    this.initializeData();
                }
            }),
        );
    }

    componentWillUnmount(): void {
        for (const fn of this.eventListenersToRemoveBeforeUnmounting) {
            fn();
        }
    }

    render() {
        const rundown = this.state.rundownWithChanges;
        const lockedInOtherSession = rundown == null ? true : isLockedInOtherSession(rundown);
        const editingDisallowed = lockedInOtherSession || this.props.readOnly;

        if (rundown == null) {
            return null;
        }

        const {rundownItemAction} = this.props;

        const closeBtn = (
            <Button
                text={gettext('Close')}
                onClick={() => {
                    this.close(rundown);
                }}
            />
        );

        return (
            <WithValidation validators={rundownValidator}>
                {(validate, validationErrors) => (
                    <Layout.LayoutContainer>
                        <Layout.HeaderPanel>
                            <SubNav>
                                <Spacer
                                    h
                                    gap="16"
                                    justifyContent="space-between"
                                    noWrap
                                    style={{paddingLeft: 16, paddingRight: 16}}
                                >
                                    {
                                        lockedInOtherSession
                                            ? (
                                                <RundownLockInfo
                                                    entity={rundown}
                                                    endpoint={`/rundowns/${rundown._id}`}
                                                />
                                            )
                                            : (<span />) // needed for spacer
                                    }

                                    <Spacer h gap="4" noGrow justifyContent="start" noWrap>
                                        {(() => {
                                            if (lockedInOtherSession) {
                                                return closeBtn;
                                            } else if (this.props.readOnly) {
                                                return (
                                                    <React.Fragment>
                                                        <div>
                                                            <Button
                                                                text={gettext('Edit')}
                                                                onClick={() => {
                                                                    this.props.onRundownActionChange({
                                                                        id: this.props.rundownId,
                                                                        mode: 'edit',
                                                                    });
                                                                }}
                                                                type="primary"
                                                            />
                                                        </div>

                                                        <div>
                                                            {closeBtn}
                                                        </div>
                                                    </React.Fragment>
                                                );
                                            } else {
                                                return (
                                                    <React.Fragment>
                                                        <div>
                                                            <Button
                                                                text={gettext('Save')}
                                                                onClick={() => {
                                                                    const valid = validate(rundown);

                                                                    if (valid) {
                                                                        this.save();
                                                                    }
                                                                }}
                                                                disabled={
                                                                    isEqual(
                                                                        this.state.rundown,
                                                                        this.state.rundownWithChanges,
                                                                    )
                                                                }
                                                                type="primary"
                                                            />
                                                        </div>

                                                        <div>{closeBtn}</div>
                                                    </React.Fragment>
                                                );
                                            }
                                        })()}

                                        <Dropdown
                                            items={[
                                                {
                                                    type: 'submenu',
                                                    label: gettext('Export'),
                                                    items: this.state.exportOptions.map((exportOption) => ({
                                                        label: exportOption.name,
                                                        onSelect: () => {
                                                            httpRequestJsonLocal<IRundownExportResponse>({
                                                                method: 'POST',
                                                                path: '/rundown_export',
                                                                payload: {
                                                                    rundown: rundown._id,
                                                                    format: exportOption._id,
                                                                },
                                                            }).then((res) => {
                                                                downloadFileAttachment(res.href);
                                                            });
                                                        },
                                                    })),
                                                },
                                            ]}
                                        >

                                            <IconButton
                                                ariaValue={gettext('Actions')}
                                                icon="dots-vertical"
                                                onClick={noop}
                                            />
                                        </Dropdown>
                                    </Spacer>
                                </Spacer>
                            </SubNav>
                        </Layout.HeaderPanel>

                        <Layout.MainPanel padding="none">
                            <Layout.AuthoringMain
                                headerPadding="medium"
                                authoringHeader={(
                                    <AiringInfoBlock
                                        value={rundown}
                                        onChange={this.setRundownField}
                                        readOnly={editingDisallowed}
                                        validationErrors={validationErrors}
                                    />
                                )}
                                headerCollapsed={true}
                            >
                                <div>
                                    <Input
                                        type="text"
                                        value={rundown.title}
                                        onChange={(val) => {
                                            this.setRundownField({title: val});
                                        }}
                                        label={gettext('Headline')}
                                        disabled={editingDisallowed}
                                        labelHidden
                                        inlineLabel
                                        size="large"
                                        boxedStyle
                                        error={validationErrors.title ?? undefined}
                                        invalid={validationErrors.title != null}
                                    />

                                    <SpacerBlock v gap="16" />

                                    <WithLiveResources
                                        resources={[
                                            {
                                                resource: 'rundown_items',
                                                ids: rundown.items.map(({_id: id}) => id),
                                            },
                                        ]}
                                    >
                                        {(res) => {
                                            const rundownItems: Array<IRundownItem> = res[0]._items;

                                            return (
                                                <ManageRundownItems
                                                    rundown={rundown}
                                                    readOnly={editingDisallowed}
                                                    items={rundownItems}
                                                    initiateCreation={(initialData, insertAtIndex) => {
                                                        this.initiateCreation(
                                                            this.props.rundownId,
                                                            initialData,
                                                            insertAtIndex,
                                                        );
                                                    }}
                                                    initiateEditing={({_id}) => this.initiateEditing(_id)}
                                                    initiatePreview={({_id}) => this.initiatePreview(_id)}
                                                    onChange={(val) => {
                                                        this.setRundownField({
                                                            items: val.map(({_id}) => ({_id: _id})),
                                                        });
                                                    }}
                                                    onDelete={(_item) => {
                                                        this.setRundownField({
                                                            items: rundown.items.filter(
                                                                ({_id}) => _id !== _item._id,
                                                            ),
                                                        });
                                                    }}
                                                />
                                            );
                                        }}
                                    </WithLiveResources>
                                </div>
                            </Layout.AuthoringMain>
                        </Layout.MainPanel>

                        <Layout.RightPanel open={rundownItemAction != null}>
                            <Layout.Panel side="right" background="grey" size="x-large">
                                <Layout.PanelContent>
                                    {
                                        rundownItemAction != null && (
                                            <AuthoringReact
                                                key={rundownItemAction.authoringReactKey}
                                                itemId=""
                                                resourceNames={['rundown_items']}
                                                onClose={() => {
                                                    if (rundownItemAction.type !== 'create') {
                                                        tryUnlocking<IRundown>(
                                                            '/rundown_items',
                                                            rundownItemAction.itemId,
                                                        );
                                                    }

                                                    this.props.onRundownItemActionChange(null);
                                                }}
                                                fieldsAdapter={{}}
                                                authoringStorage={rundownItemAction.authoringStorage}
                                                storageAdapter={rundownItemStorageAdapter}
                                                getLanguage={() => LANGUAGE}
                                                getInlineToolbarActions={({
                                                    item,
                                                    hasUnsavedChanges,
                                                    save,
                                                    discardChangesAndClose,
                                                    stealLock,
                                                }) => {
                                                    const actions: Array<ITopBarWidget<IRundownItem>> = [
                                                        {
                                                            availableOffline: true,
                                                            group: 'start',
                                                            priority: 0.1,
                                                            component: () => (
                                                                <IconButton
                                                                    ariaValue={gettext('Close')}
                                                                    icon="close-small"
                                                                    onClick={() => {
                                                                        discardChangesAndClose();
                                                                    }}
                                                                />
                                                            ),
                                                        },
                                                    ];

                                                    if (rundownItemAction.type !== 'preview') {
                                                        actions.push({
                                                            availableOffline: false,
                                                            group: 'start',
                                                            priority: 0.2,
                                                            component: () => (
                                                                <RundownItemLockInfo
                                                                    entity={item}
                                                                    forceUnlock={stealLock}
                                                                />
                                                            ),
                                                        });

                                                        actions.push({
                                                            availableOffline: false,
                                                            group: 'end',
                                                            priority: 0.1,
                                                            component: () => (
                                                                <Button
                                                                    text={gettext('Save')}
                                                                    onClick={() => {
                                                                        save();
                                                                    }}
                                                                    type="primary"
                                                                    disabled={hasUnsavedChanges() !== true}
                                                                />
                                                            ),
                                                        });
                                                    }

                                                    if (rundownItemAction.type === 'preview') {
                                                        actions.push({
                                                            availableOffline: false,
                                                            group: 'end',
                                                            priority: 0.1,
                                                            component: () => (
                                                                <Button
                                                                    text={gettext('Edit')}
                                                                    onClick={() => {
                                                                        this.initiateEditing(item._id);
                                                                    }}
                                                                    type="primary"
                                                                />
                                                            ),
                                                        });
                                                    }

                                                    return {
                                                        readOnly: rundownItemAction.type === 'preview'
                                                            || isLockedInOtherSession(item),
                                                        toolbarBgColor: 'var(--sd-colour-bg__sliding-toolbar)',
                                                        actions: actions,
                                                    };
                                                }}
                                                getAuthoringTopBarWidgets={() => []}
                                                topBar2Widgets={[]}
                                                getSidebar={({item, toggleSideWidget}) => {
                                                    const sideWidgetsAllowed = sideWidgets.filter(
                                                        ({isAllowed}) => isAllowed(
                                                            item,
                                                        ),
                                                    );

                                                    if (sideWidgetsAllowed.length < 1) {
                                                        return <span />;
                                                    }

                                                    return (
                                                        <Nav.SideBarTabs
                                                            items={sideWidgetsAllowed.map(({icon, _id}) => ({
                                                                size: 'big',
                                                                icon,
                                                                onClick: () => {
                                                                    toggleSideWidget(_id);
                                                                },
                                                            }))}
                                                        />
                                                    );
                                                }}
                                                getSidePanel={({
                                                    item,
                                                    contentProfile,
                                                    fieldsData,
                                                    handleFieldsDataChange,
                                                    fieldsAdapter,
                                                    storageAdapter,
                                                    authoringStorage,
                                                    handleUnsavedChanges,
                                                    sideWidget,
                                                }) => {
                                                    if (
                                                        sideWidget == null

                                                        // TODO: allow widgets in creation mode?
                                                        || item._id == null
                                                    ) {
                                                        return null;
                                                    }

                                                    const widget = sideWidgets.find(({_id}) => _id === sideWidget);

                                                    if (widget == null) {
                                                        return null;
                                                    }

                                                    const Component = widget.component;

                                                    return (
                                                        <Component
                                                            entityId={item._id}
                                                            readOnly={editingDisallowed}
                                                            contentProfile={contentProfile}
                                                            fieldsData={fieldsData}
                                                            authoringStorage={authoringStorage}
                                                            fieldsAdapter={fieldsAdapter}
                                                            storageAdapter={storageAdapter}
                                                            handleUnsavedChanges={handleUnsavedChanges}
                                                            onFieldsDataChange={handleFieldsDataChange}
                                                        />
                                                    );
                                                }}
                                                disableWidgetPinning
                                            />
                                        )
                                    }
                                </Layout.PanelContent>
                            </Layout.Panel>
                        </Layout.RightPanel>
                    </Layout.LayoutContainer>
                )}
            </WithValidation>
        );
    }
}

// wrap it and use key so the component re-mounts if rundownId changes
export const RundownViewEdit: React.ComponentType<IProps> =
    (props) => <RundownViewEditComponent {...props} key={props.rundownId} />;
