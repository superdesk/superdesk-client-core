import {sdApi} from 'api';
import {ITEM_STATE} from 'apps/archive/constants';
import {assertNever} from 'core/helpers/typescript-helpers';
import {Spacer} from 'core/ui/components/Spacer';
import {getItemLabel, gettext} from 'core/utils';
import React from 'react';
import {IArticle, IAuthoringOptions, ITopBarWidget} from 'superdesk-api';
import {Button, IconButton, Menu, Modal, NavButton} from 'superdesk-ui-framework/react';
import {AuthoringIntegrationWrapper} from './authoring-integration-wrapper';
import {LockInfo} from './subcomponents/lock-info';
import {IMenuItem} from 'superdesk-ui-framework/react/components/Menu';
import {article} from 'api/article';

interface IProps {
    onClose(): void;

    // Changing props won't affect the component, because we assign this.state.articleIds
    // to initiallySelectedArticles only initial props matter
    initiallySelectedArticles: Array<IArticle>;
}

interface IState {
    articleIds: Array<string> | null;
    workQueueItems: Array<IArticle> | null;
}

export class MultiEditModal extends React.PureComponent<IProps, IState> {
    private componentRefs: Dictionary<string, AuthoringIntegrationWrapper>;

    constructor(props: IProps) {
        super(props);

        this.state = {
            articleIds: this.props.initiallySelectedArticles.map(({_id}) => _id),
            workQueueItems: sdApi.article.getWorkQueueItems(),
        };

        this.componentRefs = {};
    }

    getInlineToolbarActions(
        {
            item,
            hasUnsavedChanges,
            save,
            initiateClosing,
            stealLock,
        },
        availableArticles: Array<IArticle>,
    ): IAuthoringOptions<IArticle> {
        const saveButton: ITopBarWidget<IArticle> = {
            group: 'end',
            priority: 0.2,
            component: () => (
                <Button
                    text={gettext('Save')}
                    style="filled"
                    type="primary"
                    disabled={!hasUnsavedChanges()}
                    onClick={() => {
                        save();
                    }}
                />
            ),
            availableOffline: true,
        };
        const hamburgerMenu: ITopBarWidget<IArticle> = {
            group: 'start',
            priority: 0.1,
            component: () => (
                <Menu
                    zIndex={1050}
                    items={
                        availableArticles.map((article) => {
                            const leaf: IMenuItem = {
                                onClick: () => this.switchTo(item._id, article._id),
                                label: getItemLabel(article),
                            };

                            return leaf;
                        })}
                >
                    {(toggle) => (
                        <Button
                            type="primary"
                            icon="list-menu"
                            text={gettext('Switch article')}
                            style="filled"
                            shape="round"
                            iconOnly={true}
                            onClick={(event) => toggle(event)}
                        />
                    )}
                </Menu>
            ),
            availableOffline: true,
        };
        const closeButton: ITopBarWidget<IArticle> = {
            group: 'start',
            priority: 0.2,
            component: () => (
                <IconButton
                    ariaValue={gettext('Remove article')}
                    icon="close-small"
                    size="small"
                    onClick={() => {
                        initiateClosing();
                    }}
                />
            ),
            availableOffline: true,
        };
        const collapseSidebarButton: ITopBarWidget<IArticle> = {
            group: 'end',
            priority: 100,
            component: () => {
                const reference = this.componentRefs[item._id];

                if (reference == null) {
                    return null;
                } else {
                    return (
                        <NavButton
                            icon={(this.componentRefs[item._id])?.isSidebarCollapsed() ? 'chevron-left' : 'chevron-right'}
                            iconSize="big"
                            text={gettext('Collapse widgets')}
                            onClick={() => (this.componentRefs[item._id])?.toggleSidebar()}
                        />
                    );
                }
            },
            availableOffline: true,
        };
        const lockButton: ITopBarWidget<IArticle> = {
            group: 'start',
            priority: 0.1,
            component: ({entity}) => (
                <LockInfo
                    article={entity}
                    unlock={() => {
                        stealLock();
                    }}
                />
            ),
            availableOffline: false,
        };
        const topBarWidgets: Array<ITopBarWidget<IArticle>> = [collapseSidebarButton, lockButton, saveButton];

        /**
         * If there are items in the workQueueItems which are not
         * present in the multi edit view we display the hamburgerMenu.
         */
        if (availableArticles.length > 0) {
            topBarWidgets.push(hamburgerMenu);
        }

        /**
         * Don't show close button if only two panes are present in the view.
         */
        if (this.state.articleIds.length > 2) {
            topBarWidgets.push(closeButton);
        }

        return {
            readOnly: false,
            actions: topBarWidgets,
        };
    }

    switchTo(currentId: string, nextId: string) {
        (this.componentRefs[currentId])?.prepareForUnmounting().then(() => {
            this.setState({
                // setting nextId in place of currentId
                articleIds: this.state.articleIds.map((id) => id === currentId ? nextId : id),
            });
        });
    }

    add(id: string): void {
        this.setState({
            articleIds: [...this.state.articleIds, id],
        });
    }

    render(): JSX.Element {
        /**
         * From workQueueItems remove articles which were
         * initially selected so they don't repeat the same
         * article twice, then filter if the result
         * contains articles which the user is currently editing.
         */
        const availableArticles = [
            ...this.state.workQueueItems.filter(
                (item) => this.props.initiallySelectedArticles
                    .map((article) => article._id)
                    .includes(item._id) !== true,
            ),
            ...this.props.initiallySelectedArticles,
        ].filter((article) => !this.state.articleIds.includes(article._id));

        return (
            <Modal contentPadding="none" zIndex={1050} maximized onHide={this.props.onClose} visible headerTemplate={gettext('Multi Edit')} >
                <Spacer h gap="0" alignItems="stretch" noWrap style={{height: '100%'}}>
                    <Spacer h gap="0" noWrap style={{height: '100%'}}>
                        {
                            this.state.articleIds.map((_id, i) => {
                                return (
                                    <Spacer h gap="0" alignItems="stretch" noWrap style={{height: '100%'}} key={_id}>
                                        {i !== 0 && (<div style={{width: 4, background: 'var(--sd-colour-bg--10)'}} />) /** divider */ }
                                        <div style={{width: '100%'}}>
                                            <AuthoringIntegrationWrapper
                                                sidebarInitiallyVisible={true}
                                                ref={(component) => {
                                                    this.componentRefs[_id] = component;
                                                }}
                                                onClose={() => {
                                                    this.setState({
                                                        articleIds: this.state.articleIds.filter((id) => id !== _id),
                                                    });
                                                }}
                                                itemId={_id}
                                                getInlineToolbarActions={(options) =>
                                                    this.getInlineToolbarActions(options, availableArticles)
                                                }
                                            />
                                        </div>
                                    </Spacer>
                                );
                            })
                        }
                    </Spacer>
                    {
                        availableArticles.length > 0 && (
                            <div className="multi-edit-add-button">
                                <Menu
                                    zIndex={1050}
                                    items={availableArticles.map((a) => {
                                        const leaf: IMenuItem = {
                                            onClick: () => this.add(a._id),
                                            label: getItemLabel(a),
                                        };

                                        return leaf;
                                    })}
                                >
                                    {(toggle) => (
                                        <Button
                                            type="primary"
                                            icon="plus-large"
                                            text={gettext('Add article')}
                                            style="filled"
                                            size="small"
                                            shape="round"
                                            iconOnly={true}
                                            onClick={(event) => toggle(event)}
                                        />
                                    )}
                                </Menu>
                            </div>
                        )
                    }
                </Spacer>
            </Modal>
        );
    }
}
