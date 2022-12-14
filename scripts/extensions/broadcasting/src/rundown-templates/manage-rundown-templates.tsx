import * as React from 'react';
import {
    Button,
    IconButton,
    Tooltip,
    Modal,
    Menu,
    EmptyState,
    WithSizeObserver,
} from 'superdesk-ui-framework/react';
import {BoxedListItem, BoxedListContentRow} from 'superdesk-ui-framework/react/components/Lists';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import {superdesk} from '../superdesk';
import {IRundownTemplate, IRundownTemplateBase, IShow} from '../interfaces';
import {IRundownItemAction, RundownTemplateViewEdit} from './template-edit';
import {IRestApiResponse, IUser} from 'superdesk-api';
import {prepareRundownTemplateForSaving} from '../rundowns/rundown-view-edit';
import {SelectShow} from '../rundowns/components/select-show';

const {gettext} = superdesk.localization;
const {httpRequestJsonLocal, httpRequestRawLocal} = superdesk;
const {WithLiveResources, DateTime} = superdesk.components;
const {assertNever, stripBaseRestApiFields} = superdesk.helpers;

const {
    SpacerBlock,
    Spacer,
    getVirtualListFromQuery,
} = superdesk.components;

const VirtualListFromQuery = getVirtualListFromQuery<IRundownTemplate, never>();

interface IProps {
    dialogTitle: string;
    initialShow?: {
        id: IShow['_id'];
        createNewTemplate?: boolean;
    };
    closeModal(): void;
}

interface IState {
    showId: IShow['_id'] | null;
    rundownItemAction: IRundownItemAction;
    template:
        {type: 'preview', value: IRundownTemplate}
        | {type: 'edit', value: IRundownTemplate}
        | {type: 'create', value: Partial<IRundownTemplateBase>}
        | null;
}

const showListItemStyle: React.CSSProperties = {margin: '4px 16px'};

export class ManageRundownTemplates extends React.PureComponent<IProps, IState> {
    private itemTemplate: React.ComponentType<{entity: IRundownTemplate; joined: never}>;

    constructor(props: IProps) {
        super(props);

        this.state = {
            showId: props.initialShow?.id ?? null,
            template: props.initialShow?.createNewTemplate === true ? {type: 'create', value: {}} : null,
            rundownItemAction: null,
        };

        this.itemTemplate = (templateProps) => {
            const template = templateProps.entity;

            return (
                <div style={showListItemStyle}>
                    <BoxedListItem
                        alignVertical="center"
                        density="compact"
                        selected={(() => {
                            const selectedTemplate = this.state.template;

                            if (selectedTemplate == null || selectedTemplate.type === 'create') {
                                return false;
                            } else {
                                return selectedTemplate.value._id === template._id;
                            }
                        })()}
                        clickable={false}
                        actions={(
                            <span>
                                <Menu
                                    items={[
                                        {
                                            label: gettext('Edit'),
                                            icon: 'icon-pencil',
                                            onClick: () => {
                                                this.setState({
                                                    template: {
                                                        type: 'edit',
                                                        value: template,
                                                    },
                                                });
                                            },
                                        },
                                        {
                                            label: 'Delete',
                                            icon: 'icon-trash',
                                            onClick: () => {
                                                httpRequestRawLocal({
                                                    method: 'DELETE',
                                                    path: `/shows/${this.state.showId}/templates/${template._id}`,
                                                    headers: {
                                                        'If-Match': template._etag,
                                                    },
                                                });
                                            },
                                        },
                                    ]}
                                >
                                    {(toggle) => (
                                        <IconButton
                                            icon="dots-vertical"
                                            onClick={(event) => toggle(event)}
                                            ariaValue={gettext('Actions')}
                                        />
                                    )}
                                </Menu>
                            </span>
                        )}
                        onClick={() => {
                            this.setState({
                                template: {type: 'preview', value: template},
                            });
                        }}
                    >
                        <BoxedListContentRow>
                            <span>{template.title}</span>
                        </BoxedListContentRow>
                    </BoxedListItem>
                </div>
            );
        };
    }

    render() {
        const {template, showId} = this.state;

        const viewEditToolbar = template == null || template.type === 'create' ? null : (
            <WithLiveResources
                resources={[{
                    resource: 'users',
                    ids: [template.value.created_by, template.value.updated_by].filter((x) => x != null),
                }]}
            >
                {([users]: Array<IRestApiResponse<IUser>>) => {
                    const userCreator = users._items.find(({_id}) => _id === template.value.created_by) as IUser;

                    return (
                        <div style={{fontSize: '1.3rem', color: 'var(--color-text-light)'}}>
                            {
                                gettext('Created at {{time}} by {{user}}', {
                                    time: () => <DateTime dateTime={template.value._created} />,
                                    user: () => <strong>{userCreator.display_name}</strong>,
                                })
                            }

                            {
                                template.value.updated_by != null && (() => {
                                    const userUpdater = users._items.find(
                                        ({_id}) => _id === template.value.updated_by,
                                    ) as IUser;

                                    return (
                                        <span>
                                            <span>&nbsp;|&nbsp;</span>

                                            {
                                                gettext('Modified at {{time}} by {{user}}', {
                                                    time: () => <DateTime dateTime={template.value._updated} />,
                                                    user: () => <strong>{userUpdater.display_name}</strong>,
                                                })
                                            }
                                        </span>
                                    );
                                })()
                            }
                        </div>
                    );
                }}
            </WithLiveResources>
        );

        return (
            <Modal
                visible
                headerTemplate={this.props.dialogTitle}
                contentBg="medium"
                contentPadding="none"
                size="x-large"
                onHide={() => {
                    if (template != null && (template.type === 'create' || template.type === 'edit')) {
                        superdesk.ui.confirm(gettext('Discard unsaved changes?')).then((confirmed) => {
                            if (confirmed) {
                                this.props.closeModal();
                            }
                        });
                    } else {
                        this.props.closeModal();
                    }
                }}
                zIndex={1050}
            >
                <Layout.LayoutContainer>
                    <Layout.LeftPanel open={template == null || template.type === 'preview'}>
                        <Layout.Panel side="left" background="grey">
                            <Layout.PanelHeader>
                                <Layout.Container className="sd-padding-x--2">
                                    <SelectShow
                                        value={this.state.showId}
                                        onChange={(val) => {
                                            this.setState({showId: val});
                                        }}
                                        required={true}
                                        showLabel={false}
                                    />
                                </Layout.Container>
                            </Layout.PanelHeader>

                            <Layout.PanelContent>
                                {
                                    this.state.showId == null
                                        ? (
                                            <EmptyState
                                                size="small"
                                                illustration="1"
                                                title={gettext('No show selected')}
                                                description={gettext('Select a show from the dropdown above.')}
                                            />
                                        )
                                        : (
                                            <Spacer v gap="8" noWrap style={{height: '100%'}}>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        width: '100%',
                                                        justifyContent: 'end',
                                                        paddingInlineEnd: 16,
                                                    }}
                                                >
                                                    <div>
                                                        <SpacerBlock v gap="8" />

                                                        <Tooltip text={gettext('New template')} flow="left">
                                                            <Button
                                                                type="primary"
                                                                size="small"
                                                                icon="plus-large"
                                                                text={gettext('Create new template')}
                                                                shape="round"
                                                                iconOnly={true}
                                                                onClick={() => {
                                                                    this.setState({
                                                                        template: {
                                                                            type: 'create',
                                                                            value: {},
                                                                        },
                                                                    });
                                                                }}
                                                                disabled={!(
                                                                    this.state.template == null
                                                                    || this.state.template.type === 'preview'
                                                                )}
                                                            />
                                                        </Tooltip>
                                                    </div>
                                                </div>

                                                <WithSizeObserver style={{display: 'flex'}}>
                                                    {({width, height}) => (
                                                        <VirtualListFromQuery
                                                            width={width}
                                                            height={height}
                                                            query={{
                                                                endpoint: `/shows/${showId}/templates`,
                                                                sort: [{name: 'asc'}],
                                                            }}
                                                            itemTemplate={this.itemTemplate}
                                                            noItemsTemplate={
                                                                () => (
                                                                    <div style={showListItemStyle}>
                                                                        {gettext('No items yet')}
                                                                    </div>
                                                                )
                                                            }
                                                        />
                                                    )}
                                                </WithSizeObserver>

                                            </Spacer>
                                        )
                                }
                            </Layout.PanelContent>
                        </Layout.Panel>
                    </Layout.LeftPanel>

                    <Layout.MainPanel padding="none">
                        {(() => {
                            if (template == null) {
                                return (
                                    <EmptyState
                                        size="large"
                                        illustration="1"
                                        title={gettext('No template selected')}
                                        description={gettext('Select a template from the sidebar.')}
                                    />
                                );
                            } else if (template.type === 'preview') {
                                return (
                                    <RundownTemplateViewEdit
                                        readOnly={true}
                                        templateFields={template.value}
                                        initiateEditing={() => {
                                            if (template.type === 'preview') {
                                                this.setState({
                                                    template: {
                                                        type: 'edit',
                                                        value: template.value,
                                                    },
                                                });
                                            }
                                        }}
                                        toolbar={viewEditToolbar}
                                        rundownItemAction={this.state.rundownItemAction}
                                        onRundownItemActionChange={(rundownItemAction) => {
                                            this.setState({rundownItemAction});
                                        }}
                                    />
                                );
                            } else {
                                return (
                                    <RundownTemplateViewEdit
                                        readOnly={false}
                                        templateFields={{...template.value}}
                                        onChange={(templateData) => {
                                            if (template.type === 'edit') {
                                                this.setState({
                                                    template: {
                                                        ...template,
                                                        value: {
                                                            ...template.value,
                                                            ...templateData,
                                                        },
                                                    },
                                                });
                                            } else if (template.type === 'create') {
                                                this.setState({
                                                    template: {
                                                        ...template,
                                                        value: {
                                                            ...template.value,
                                                            ...templateData,
                                                        },
                                                    },
                                                });
                                            } else {
                                                assertNever(template);
                                            }
                                        }}
                                        toolbar={viewEditToolbar}
                                        onCancel={() => {
                                            this.setState({template: null});
                                        }}
                                        onSave={() => {
                                            if (template.type === 'create') {
                                                httpRequestJsonLocal({
                                                    method: 'POST',
                                                    path: `/shows/${showId}/templates`,
                                                    payload: prepareRundownTemplateForSaving(template.value),
                                                }).then(() => {
                                                    this.setState({
                                                        template: null,
                                                    });
                                                }).catch((res) => {
                                                    if (typeof res.error === 'string') {
                                                        superdesk.ui.notify.error(res.error);
                                                    }
                                                });
                                            } else if (template.type === 'edit') {
                                                httpRequestJsonLocal<IRundownTemplate>({
                                                    method: 'PATCH',
                                                    path: `/shows/${showId}/templates/${template.value._id}`,
                                                    payload: prepareRundownTemplateForSaving(
                                                        stripBaseRestApiFields(template.value),
                                                    ),
                                                    headers: {
                                                        'If-Match': template.value._etag,
                                                    },
                                                }).then((templateUpdated) => {
                                                    this.setState({
                                                        template: {
                                                            type: 'preview',
                                                            value: templateUpdated,
                                                        },
                                                    });
                                                });
                                            } else {
                                                assertNever(template);
                                            }
                                        }}
                                        saveButtonLabel={
                                            template.type === 'create'
                                                ? gettext('Create template')
                                                : gettext('Save changes')
                                        }
                                        rundownItemAction={this.state.rundownItemAction}
                                        onRundownItemActionChange={(rundownItemAction) => {
                                            this.setState({rundownItemAction});
                                        }}
                                    />
                                );
                            }
                        })()}
                    </Layout.MainPanel>
                </Layout.LayoutContainer>
            </Modal>
        );
    }
}
