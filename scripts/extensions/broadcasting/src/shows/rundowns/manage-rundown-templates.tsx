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
import {superdesk} from '../../superdesk';
import {IRundownTemplate, IRundownTemplateBase, IShow} from '../../interfaces';
import {RundownTemplateViewEdit} from './template-edit';

const {gettext} = superdesk.localization;
const {httpRequestJsonLocal, httpRequestRawLocal} = superdesk;
const {logger} = superdesk.utilities;
const {assertNever, stripBaseRestApiFields} = superdesk.helpers;

const {
    SpacerBlock,
    Spacer,
    VirtualListFromQuery,
    SelectFromEndpoint,
} = superdesk.components;

interface IProps {
    initialShow?: {
        id: IShow['_id'];
        createNewTemplate?: boolean;
    };
    closeModal(): void;
}

interface IState {
    showId: IShow['_id'] | null;
    template:
        {type: 'preview', value: IRundownTemplate}
        | {type: 'edit', value: IRundownTemplate}
        | {type: 'create', value: Partial<IRundownTemplateBase>}
        | null;
}

const showListItemStyle: React.CSSProperties = {margin: '4px 16px'};

export class ManageRundownTemplates extends React.PureComponent<IProps, IState> {
    private itemTemplate: React.ComponentType<{item: IRundownTemplate}>;

    constructor(props: IProps) {
        super(props);

        this.state = {
            showId: props.initialShow?.id ?? null,
            template: props.initialShow?.createNewTemplate === true ? {type: 'create', value: {}} : null,
        };

        this.itemTemplate = (templateProps) => {
            const template = templateProps.item;

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
                            <span>{template.name}</span>
                        </BoxedListContentRow>
                    </BoxedListItem>
                </div>
            );
        };
    }

    render() {
        const {template, showId} = this.state;

        return (
            <Modal
                visible
                headerTemplate={gettext('Create new template')}
                contentBg="medium"
                contentPadding="none"
                size="x-large"
                onHide={() => {
                    this.props.closeModal();
                }}
                zIndex={1050}
            >
                <Layout.LayoutContainer>
                    <Layout.LeftPanel open={template == null || template.type === 'preview'}>
                        <Layout.Panel side="left" background="grey">
                            <Layout.PanelHeader>
                                <Layout.Container className="sd-padding-x--2">
                                    <SelectFromEndpoint
                                        endpoint="/shows"
                                        sort={[['name', 'asc']]}
                                        value={this.state.showId}
                                        onChange={(val) => {
                                            this.setState({showId: val});
                                        }}
                                        itemTemplate={({item}: {item: IShow}) => (
                                            item == null
                                                ? (
                                                    <span>{gettext('Select show')}</span>
                                                ) : (
                                                    <span>{item.name}</span>
                                                )
                                        )}
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
                        {
                            template == null
                                ? (
                                    <EmptyState
                                        size="large"
                                        illustration="1"
                                        title={gettext('No template selected')}
                                        description={gettext('Select a template from the sidebar.')}
                                    />
                                )
                                : (
                                    <RundownTemplateViewEdit
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
                                            } else if (template.type === 'preview') {
                                                logger.error(new Error('changes are not allowed in preview mode'));
                                            } else {
                                                assertNever(template);
                                            }
                                        }}
                                        onCancel={() => {
                                            this.setState({template: null});
                                        }}
                                        onSave={() => {
                                            if (template.type === 'create') {
                                                httpRequestJsonLocal({
                                                    method: 'POST',
                                                    path: `/shows/${showId}/templates`,
                                                    payload: template.value,
                                                });

                                                this.setState({
                                                    template: null,
                                                });
                                            } else if (template.type === 'edit') {
                                                httpRequestJsonLocal<IRundownTemplate>({
                                                    method: 'PATCH',
                                                    path: `/shows/${showId}/templates/${template.value._id}`,
                                                    payload: stripBaseRestApiFields(template.value),
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
                                            } else if (template.type === 'preview') {
                                                logger.error(new Error('saving is not supported in preview mode'));
                                            } else {
                                                assertNever(template);
                                            }
                                        }}
                                        saveButtonLabel={
                                            template.type === 'create'
                                                ? gettext('Create template')
                                                : gettext('Save changes')
                                        }
                                        readOnly={template.type === 'preview'}
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
                                    />
                                )
                        }
                    </Layout.MainPanel>
                </Layout.LayoutContainer>
            </Modal>
        );
    }
}
