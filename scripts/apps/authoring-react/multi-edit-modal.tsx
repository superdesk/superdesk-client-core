import {sdApi} from 'api';
import {ITEM_STATE} from 'apps/archive/constants';
import {assertNever} from 'core/helpers/typescript-helpers';
import {Modal} from 'core/ui/components/Modal/Modal';
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import React from 'react';
import {IArticle, IAuthoringOptions, ITopBarWidget} from 'superdesk-api';
import {Button, IconButton, Menu, NavButton} from 'superdesk-ui-framework/react';
import {AuthoringIntegrationWrapper} from './authoring-integration-wrapper';
import {LockInfo} from './subcomponents/lock-info';
import {IMenuItem} from 'superdesk-ui-framework/react/components/Menu';

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

    getInlineToolbarActions({
        item,
        hasUnsavedChanges,
        handleUnsavedChanges,
        save,
        initiateClosing,
        keepChangesAndClose,
        stealLock,
    }, articles: Array<IArticle>): IAuthoringOptions<IArticle> {
        const itemState: ITEM_STATE = item.state;

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
                    zIndex={2000}
                    items={
                        articles.map((a) => {
                            const leaf: IMenuItem = {
                                onClick: () => this.switchTo(item._id, a._id),
                                label: a.slugline,
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

        const collapseButton: ITopBarWidget<IArticle> = {
            group: 'end',
            priority: 100,
            component: () => (
                <NavButton
                    icon={this.componentRefs[item._id].state.isSidebarCollapsed ? 'chevron-left' : 'chevron-right'}
                    iconSize="big"
                    text={gettext('Collapse widgets')}
                    onClick={() => this.componentRefs[item._id].toggleSidebar()}
                />
            ),
            availableOffline: true,
        };

        switch (itemState) {
        case ITEM_STATE.DRAFT:
            return {
                readOnly: false,
                actions: [saveButton, hamburgerMenu, collapseButton],
            };

        case ITEM_STATE.SUBMITTED:
        case ITEM_STATE.IN_PROGRESS:
        case ITEM_STATE.ROUTED:
        case ITEM_STATE.FETCHED:
        case ITEM_STATE.UNPUBLISHED:
            // eslint-disable-next-line no-case-declarations
            const actions: Array<ITopBarWidget<IArticle>> = [
                closeButton,
                hamburgerMenu,
                collapseButton,
            ];

            // FINISH: ensure locking is available in generic version of authoring
            actions.push({
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
            });

            if (sdApi.article.isLockedInCurrentSession(item)) {
                actions.push(saveButton);
            }

            return {
                readOnly: sdApi.article.isLockedInCurrentSession(item) !== true,
                actions: actions,
            };

        case ITEM_STATE.INGESTED:
            return {
                readOnly: true,
                actions: [], // fetch
            };

        case ITEM_STATE.SPIKED:
            return {
                readOnly: true,
                actions: [], // un-spike
            };

        case ITEM_STATE.SCHEDULED:
            return {
                readOnly: true,
                actions: [], // un-schedule
            };

        case ITEM_STATE.PUBLISHED:
        case ITEM_STATE.CORRECTED:
            return {
                readOnly: true,
                actions: [], // correct update kill takedown
            };

        case ITEM_STATE.BEING_CORRECTED:
            return {
                readOnly: true,
                actions: [], // cancel correction
            };

        case ITEM_STATE.CORRECTION:
            return {
                readOnly: false,
                actions: [], // cancel correction, save, publish
            };

        case ITEM_STATE.KILLED:
        case ITEM_STATE.RECALLED:
            return {
                readOnly: true,
                actions: [], // NONE
            };
        default:
            assertNever(itemState);
        }
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
        const articles = [
            ...this.state.workQueueItems.filter(
                (item) => this.props.initiallySelectedArticles
                    .map((article) => article._id)
                    .includes(item._id) !== true,
            ),
            ...this.props.initiallySelectedArticles,
        ].filter((article) => !this.state.articleIds.includes(article._id));

        return (
            <Modal size="full-screen">
                <ModalHeader onClose={this.props.onClose} >
                    {gettext('Multi Edit')}
                </ModalHeader>
                <ModalBody style={{padding: 0}}>
                    <Spacer h gap="0" justifyContent="stretch" noWrap>
                        <Spacer h gap="4">
                            {
                                this.state.articleIds.map((_id) => {
                                    return (
                                        <React.Fragment key={_id}>
                                            <div />
                                            <AuthoringIntegrationWrapper
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
                                                    this.getInlineToolbarActions(options, articles)
                                                }
                                            />
                                        </React.Fragment>
                                    );
                                })
                            }
                        </Spacer>
                        {
                            articles.length > 0 && (
                                <div className="multi-edit-add-button">
                                    <Menu
                                        zIndex={2000}
                                        items={articles.map((a) => {
                                            const leaf: IMenuItem = {
                                                onClick: () => this.add(a._id),
                                                label: a.slugline,
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
                </ModalBody>
            </Modal>
        );
    }
}
