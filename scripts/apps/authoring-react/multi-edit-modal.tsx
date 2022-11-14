import {sdApi} from 'api';
import {appConfig} from 'appConfig';
import {ITEM_STATE} from 'apps/archive/constants';
import {assertNever} from 'core/helpers/typescript-helpers';
import {Modal} from 'core/ui/components/Modal/Modal';
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import React, {ReactNode} from 'react';
import {IArticle, IAuthoringOptions, ITopBarWidget} from 'superdesk-api';
import {Button, IconButton, Menu} from 'superdesk-ui-framework/react';
import {IMenuItem} from 'superdesk-ui-framework/react/components/Menu';
import {AuthoringIntegrationWrapper} from './authoring-integration-wrapper';
import {DeskAndStage} from './subcomponents/desk-and-stage';
import {LockInfo} from './subcomponents/lock-info';

interface IProps {
    onClose(): void;
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

        const closeButton: ITopBarWidget<IArticle> = {
            group: 'end',
            priority: 0.1,
            component: () => (
                <Button
                    text={gettext('Close')}
                    style="hollow"
                    onClick={() => {
                        initiateClosing();
                    }}
                />
            ),
            availableOffline: true,
        };

        const hamburgerMenu: ITopBarWidget<IArticle> = {
            group: 'start',
            priority: 0.1,
            component: () => <this.MenuItems articles={articles} id={item._id} />,
            availableOffline: true,
        };

        switch (itemState) {
        case ITEM_STATE.DRAFT:
            return {
                readOnly: false,
                actions: [saveButton, hamburgerMenu],
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
            ];

            actions.push({
                group: 'start',
                priority: 0.2,
                component: ({entity}) => <DeskAndStage article={entity} />,
                availableOffline: false,
            });

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

            if (
                sdApi.article.isLockedInCurrentSession(item)
                && appConfig.features.customAuthoringTopbar.toDesk === true
                && sdApi.article.isPersonal(item) !== true
            ) {
                actions.push({
                    group: 'middle',
                    priority: 0.2,
                    component: () => (
                        <Button
                            text={gettext('TD')}
                            style="filled"
                            onClick={() => {
                                handleUnsavedChanges()
                                    .then(() => sdApi.article.sendItemToNextStage(item))
                                    .then(() => initiateClosing());
                            }}
                        />
                    ),
                    availableOffline: false,
                });
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
        this.componentRefs[currentId].prepareForUnmounting().then(() => {
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

    waitForAutosave(id: string) {
        this.componentRefs[id].prepareForUnmounting().then(() => {
            this.setState({
                articleIds: this.state.articleIds.map((x) => x === id ? null : id),
            });
        });
    }

    handleUnsavedChanges(id: string) {
        this.componentRefs[id].handleUnsavedChanges();
    }

    MenuItems: React.ComponentType<{articles: Array<IArticle>, id?: string}> = ({articles, id}) => {
        return (
            <Menu
                zIndex={2000}
                items={
                    articles.map((a) => {
                        const leaf: IMenuItem = {
                            onClick: () => id ? this.switchTo(id, a._id) : this.add(a._id),
                            label: a.slugline,
                        };

                        return leaf;
                    })}
            >
                {(toggle) => (
                    <IconButton
                        ariaValue="articles"
                        icon={id ? 'list-menu' : 'plus-large'}
                        onClick={(event) => {
                            toggle(event);
                        }}
                    />
                )}
            </Menu>
        );
    }

    render(): ReactNode {
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
                <ModalHeader onClose={this.props.onClose} />
                <ModalBody>
                    <Spacer h gap="32" justifyContent="start" alignItems="start" noWrap>
                        {
                            this.state.articleIds.map((_id) => {
                                return (
                                    <AuthoringIntegrationWrapper
                                        key={_id}
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
                                );
                            })
                        }
                        {
                            articles.length > 0 && (
                                <div style={{width: 20, alignItems: 'center'}}>
                                    <this.MenuItems articles={articles} />
                                </div>
                            )
                        }
                    </Spacer>
                </ModalBody>
            </Modal>
        );
    }
}
