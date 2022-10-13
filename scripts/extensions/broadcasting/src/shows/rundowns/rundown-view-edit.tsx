/* eslint-disable react/no-multi-comp */

import * as React from 'react';
import {
    IRundown,
    IRundownExportOption,
    IRundownExportResponse,
    IRundownItem,
    IRundownItemBase,
    IRundownItemTemplateInitial,
    IRundownTemplateBase,
} from '../../interfaces';
import {Button, Dropdown, IconButton, Input, SubNav} from 'superdesk-ui-framework/react';
import * as Nav from 'superdesk-ui-framework/react/components/Navigation';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';

interface IProps {
    rundownId: string;
    rundownItemAction: ICreate | IEdit | IPreview | null;
    onRundownActionChange(action: ICreate | IEdit | IPreview | null): void;
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
import {ICreate, IEdit, IPreview} from './template-edit';
import {prepareForCreation, prepareForEditing, prepareForPreview} from './prepare-create-edit';
import {CreateValidators, downloadFileAttachment, WithValidation} from '@superdesk/common';
import {stringNotEmpty} from '../../form-validation';
import {isEqual, noop} from 'lodash';
import {syncDurationWithEndTime} from './sync-duration-with-end-time';
import {rundownTemplateItemStorageAdapter} from './rundown-template-item-storage-adapter';
import {LANGUAGE} from '../../constants';
import {IPatchExtraFields, IRestApiResponse, ITopBarWidget} from 'superdesk-api';
import {computeStartEndTime} from '../../utils/compute-start-end-time';
import {handleUnsavedRundownChanges} from '../../utils/handle-unsaved-rundown-changes';
import {AiringInfoBlock} from './components/airing-info-block';
import {commentsWidget} from './rundown-items/widgets/comments';
const {gettext} = superdesk.localization;
const {httpRequestJsonLocal} = superdesk;
const {getAuthoringComponent, getLockInfoComponent, WithLiveResources, SpacerBlock, Spacer} = superdesk.components;
const {generatePatch, isLockedInOtherSession} = superdesk.utilities;
const {addWebsocketMessageListener} = superdesk;
const {fixPatchResponse} = superdesk.helpers;

const AuthoringReact = getAuthoringComponent<IRundownItemTemplateInitial>();
const LockInfo = getLockInfoComponent<IRundown>();

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

            /**
             * start/end times are generated from duration
             * they are present in the form only for making it easier for users to enter duration
             */
            delete itemCopy['start_time'];
            delete itemCopy['end_time'];

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

    /**
     * start/end times are generated from duration
     * they are present in the form only for making it easier for users to enter duration
     */
    delete copy['start_time'];
    delete copy['end_time'];

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
            throw new Error('invalid state'); // TODO: log error ?
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

    initiateCreation(initialData: Partial<IRundownItemBase>, skipUnsavedChangesCheck?: boolean) {
        handleUnsavedRundownChanges(this.props.rundownItemAction, skipUnsavedChangesCheck ?? false, () => {
            this.props.onRundownActionChange(
                prepareForCreation(this.props.rundownItemAction, initialData, (val) => {
                    if (!this.props.readOnly) {
                        const itemWithDuration: Partial<IRundownItemBase> = {
                            ...val.data,
                        };

                        const {rundown, rundownWithChanges} = this.state;

                        if (rundown == null || rundownWithChanges == null) {
                            throw new Error('disallowed state');
                        }

                        return httpRequestJsonLocal<IRundownItem>({
                            method: 'POST',
                            path: '/rundown_items',
                            payload: prepareRundownItemForSaving(itemWithDuration),
                        }).then((res) => {
                            return httpRequestJsonLocal<IRundown>({
                                method: 'PATCH',
                                path: `/rundowns/${this.props.rundownId}`,
                                payload: {
                                    items: (rundown.items ?? []).concat({_id: res._id}),
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

                                // needed so correct _etag can be used on next save
                                // also to exit creation mode so saving again wouldn't create another item
                                this.initiateEditing(res, true);

                                return val;
                            });
                        });
                    } else {
                        return Promise.resolve(val);
                    }
                }),
            );
        });
    }

    initiateEditing(item: IRundownItem, skipUnsavedChangesCheck?: boolean) {
        handleUnsavedRundownChanges(this.props.rundownItemAction, skipUnsavedChangesCheck ?? false, () => {
            this.props.onRundownActionChange(
                prepareForEditing(this.props.rundownItemAction, item._id, item, (val) => {
                    if (!this.props.readOnly) {
                        return httpRequestJsonLocal<IRundownItem & IPatchExtraFields>({
                            method: 'PATCH',
                            path: `/rundown_items/${item._id}`,
                            payload: prepareRundownItemForSaving(generatePatch(item, val, {undefinedEqNull: true})),
                            headers: {
                                'If-Match': item._etag,
                            },
                        }).then((patchRes) => {
                            const nextItem = fixPatchResponse(patchRes);

                            // needed so correct _etag can be used on next save
                            this.initiateEditing(nextItem, true);

                            return nextItem;
                        });
                    } else {
                        return Promise.resolve(item);
                    }
                }),
            );
        });
    }

    initiatePreview(item: IRundownItem, skipUnsavedChangesCheck?: boolean) {
        handleUnsavedRundownChanges(this.props.rundownItemAction, skipUnsavedChangesCheck ?? false, () => {
            this.props.onRundownActionChange(prepareForPreview(this.props.rundownItemAction, item._id, item));
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
                                                <LockInfo
                                                    entity={rundown}
                                                    endpoint={`/rundowns/${rundown._id}`}
                                                />
                                            )
                                            : (<span />) // needed for spacer
                                    }

                                    {
                                        this.props.readOnly
                                            ? (
                                                <Button
                                                    text={gettext('Edit')}
                                                    onClick={noop}
                                                    type="primary"
                                                />
                                            )
                                            : (
                                                <Spacer h gap="4" noGrow justifyContent="start">
                                                    <Button
                                                        text={gettext('Close')}
                                                        onClick={() => {
                                                            this.close(rundown);
                                                        }}
                                                    />

                                                    <Button
                                                        text={gettext('Save')}
                                                        onClick={() => {
                                                            const valid = validate(rundown);

                                                            if (valid) {
                                                                this.save();
                                                            }
                                                        }}
                                                        disabled={
                                                            isEqual(this.state.rundown, this.state.rundownWithChanges)
                                                        }
                                                        type="primary"
                                                    />

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
                                            )
                                    }
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
                                                    items={computeStartEndTime(rundown.airtime_time, rundownItems)}
                                                    initiateCreation={this.initiateCreation}
                                                    initiateEditing={this.initiateEditing}
                                                    initiatePreview={this.initiatePreview}
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
                                                // ID is not needed because authoringStorage is operating on array items
                                                // and not on database items via HTTP API
                                                itemId=""
                                                onClose={() => {
                                                    this.props.onRundownActionChange(null);
                                                }}
                                                fieldsAdapter={{}}
                                                authoringStorage={rundownItemAction.authoringStorage}
                                                storageAdapter={rundownTemplateItemStorageAdapter}
                                                getLanguage={() => LANGUAGE}
                                                getInlineToolbarActions={({
                                                    hasUnsavedChanges,
                                                    save,
                                                    discardChangesAndClose,
                                                }) => {
                                                    const actions: Array<ITopBarWidget<IRundownItemTemplateInitial>> = [
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

                                                    if (
                                                        rundownItemAction != null
                                                        && rundownItemAction.type !== 'preview'
                                                    ) {
                                                        actions.push({
                                                            availableOffline: false,
                                                            group: 'end',
                                                            priority: 0.1,
                                                            component: () => (
                                                                <Button
                                                                    text={gettext('Apply')}
                                                                    onClick={() => {
                                                                        save();
                                                                    }}
                                                                    type="primary"
                                                                    disabled={hasUnsavedChanges() !== true}
                                                                />
                                                            ),
                                                        });
                                                    }

                                                    return {
                                                        readOnly: rundownItemAction != null
                                                            && rundownItemAction.type === 'preview',
                                                        toolbarBgColor: 'var(--sd-colour-bg__sliding-toolbar)',
                                                        actions: actions,
                                                    };
                                                }}
                                                getAuthoringTopBarWidgets={() => []}
                                                topBar2Widgets={[]}
                                                onFieldChange={syncDurationWithEndTime}
                                                getSidebar={({toggleSideWidget}) => {
                                                    const sideWidgetsAllowed = sideWidgets.filter(
                                                        ({isAllowed}) => isAllowed(rundownItemAction.item),
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
                                                    contentProfile,
                                                    fieldsData,
                                                    handleFieldsDataChange,
                                                    fieldsAdapter,
                                                    storageAdapter,
                                                    authoringStorage,
                                                    handleUnsavedChanges,
                                                    sideWidget,
                                                }) => {
                                                    if (sideWidget == null) {
                                                        return null;
                                                    }

                                                    const widget = sideWidgets.find(({_id}) => _id === sideWidget);

                                                    if (widget == null) {
                                                        return null;
                                                    }

                                                    const Component = widget.component;

                                                    return (
                                                        <Component
                                                            entityId={rundownItemAction.item._id}
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
