import * as React from 'react';
import {
    Button,
    IconButton,
    Tooltip,
    Modal,
    Menu,
    EmptyState,
    WithSizeObserver,
    SubNav,
    ButtonGroup,
} from 'superdesk-ui-framework/react';
import {BoxedListItem, BoxedListContentRow} from 'superdesk-ui-framework/react/components/Lists';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import {superdesk} from '../superdesk';
import {IShow} from '../interfaces';
import {WithShow} from './create-show';

const {gettext} = superdesk.localization;
const {httpRequestRawLocal} = superdesk;
const {assertNever} = superdesk.helpers;

const {
    SpacerBlock,
    Spacer,
    getVirtualListFromQuery,
} = superdesk.components;

const VirtualListFromQuery = getVirtualListFromQuery<IShow, never>();

interface IProps {
    dialogTitle: string;
    closeModal(): void;
}

interface IShowCreate {
    mode: 'create';
}

interface IShowPreview {
    mode: 'preview';
    show: IShow;
}

interface IShowEdit {
    mode: 'edit';
    show: IShow;
}

interface IState {
    showSelected: null | IShowCreate | IShowPreview | IShowEdit;
}

const showListItemStyle: React.CSSProperties = {margin: '4px 16px'};

export class ManageShows extends React.PureComponent<IProps, IState> {
    private itemTemplate: React.ComponentType<{entity: IShow; joined: never}>;

    constructor(props: IProps) {
        super(props);

        this.state = {
            showSelected: null,
        };

        this.itemTemplate = (showProps) => {
            const show = showProps.entity;
            const {showSelected} = this.state;

            return (
                <div style={showListItemStyle}>
                    <BoxedListItem
                        alignVertical="center"
                        density="compact"
                        selected={
                            showSelected != null
                            && (showSelected.mode === 'edit' || showSelected.mode === 'preview')
                            && showSelected.show._id === show._id
                        }
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
                                                    showSelected: {
                                                        show: show,
                                                        mode: 'edit',
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
                                                    path: `/shows/${show._id}`,
                                                    headers: {
                                                        'If-Match': show._etag,
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
                                showSelected: {
                                    show: show,
                                    mode: 'preview',
                                },
                            });
                        }}
                    >
                        <BoxedListContentRow>
                            <span>{show.title}</span>
                        </BoxedListContentRow>
                    </BoxedListItem>
                </div>
            );
        };
    }

    render() {
        const {showSelected} = this.state;

        return (
            <Modal
                visible
                headerTemplate={this.props.dialogTitle}
                contentBg="medium"
                contentPadding="none"
                size="large"
                onHide={() => {
                    if (showSelected != null && (showSelected.mode === 'create' || showSelected.mode === 'edit')) {
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
                    <Layout.LeftPanel open={showSelected == null || showSelected.mode === 'preview'}>
                        <Layout.Panel side="left" background="grey">
                            <Layout.PanelContent>
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
                                                    text={gettext('Create new show')}
                                                    shape="round"
                                                    iconOnly={true}
                                                    onClick={() => {
                                                        this.setState({
                                                            showSelected: {
                                                                mode: 'create',
                                                            },
                                                        });
                                                    }}
                                                    disabled={showSelected != null && showSelected.mode !== 'preview'}
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
                                                    endpoint: '/shows',
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
                            </Layout.PanelContent>
                        </Layout.Panel>
                    </Layout.LeftPanel>

                    <Layout.MainPanel padding="none">
                        {(() => {
                            if (showSelected == null) {
                                return (
                                    <EmptyState
                                        size="large"
                                        illustration="1"
                                        title={gettext('No show selected')}
                                        description={gettext('Select a show from the sidebar.')}
                                    />
                                );
                            } else if (showSelected.mode === 'preview') {
                                return (
                                    <WithShow
                                        show={showSelected.show}
                                        readOnly={true}
                                        key={showSelected.show._id + showSelected.mode}
                                    >
                                        {(form) => (
                                            <div>
                                                <SubNav>
                                                    <ButtonGroup align="end" padded>
                                                        <Button
                                                            text={gettext('Edit')}
                                                            onClick={() => {
                                                                this.setState({
                                                                    showSelected: {
                                                                        ...showSelected,
                                                                        mode: 'edit',
                                                                    },
                                                                });
                                                            }}
                                                            type="primary"
                                                        />
                                                    </ButtonGroup>
                                                </SubNav>

                                                <div style={{padding: 20}}>
                                                    {form}
                                                </div>
                                            </div>
                                        )}
                                    </WithShow>
                                );
                            } else if (showSelected.mode === 'edit') {
                                return (
                                    <WithShow
                                        show={showSelected.show}
                                        key={showSelected.show._id + showSelected.mode}
                                    >
                                        {(form, save) => (
                                            <div>
                                                <SubNav>
                                                    <ButtonGroup align="end" padded>
                                                        <Button
                                                            text={gettext('Cancel')}
                                                            onClick={() => {
                                                                this.setState({showSelected: {
                                                                    ...showSelected,
                                                                    mode: 'preview',
                                                                }});
                                                            }}
                                                            type="default"
                                                        />

                                                        <Button
                                                            text={gettext('Save')}
                                                            onClick={() => {
                                                                save()
                                                                    .then((show) => {
                                                                        this.setState({
                                                                            showSelected: {
                                                                                mode: 'preview',
                                                                                show: show,
                                                                            },
                                                                        });
                                                                    })
                                                                    .catch(() => {
                                                                        // validation unsuccessful,
                                                                        // errors shown in the UI
                                                                    });
                                                            }}
                                                            type="primary"
                                                        />
                                                    </ButtonGroup>
                                                </SubNav>

                                                <div style={{padding: 20}}>
                                                    {form}
                                                </div>
                                            </div>
                                        )}
                                    </WithShow>
                                );
                            } else if (showSelected.mode === 'create') {
                                return (
                                    <WithShow show={{}}>
                                        {(form, save) => (
                                            <div>
                                                <SubNav>
                                                    <ButtonGroup align="end" padded>
                                                        <Button
                                                            text={gettext('Cancel')}
                                                            onClick={() => {
                                                                this.setState({showSelected: null});
                                                            }}
                                                            type="default"
                                                        />

                                                        <Button
                                                            text={gettext('Create')}
                                                            onClick={() => {
                                                                save()
                                                                    .then((show) => {
                                                                        this.setState({
                                                                            showSelected: {
                                                                                mode: 'preview',
                                                                                show: show,
                                                                            },
                                                                        });
                                                                    }).catch(() => {
                                                                        // validation unsuccessful,
                                                                        // errors shown in the UI
                                                                    });
                                                            }}
                                                            type="primary"
                                                        />
                                                    </ButtonGroup>
                                                </SubNav>

                                                <div style={{padding: 20}}>
                                                    {form}
                                                </div>
                                            </div>
                                        )}
                                    </WithShow>
                                );
                            } else {
                                return assertNever(showSelected);
                            }
                        })()}
                    </Layout.MainPanel>
                </Layout.LayoutContainer>
            </Modal>
        );
    }
}
