import * as React from 'react';

import {ISuperdesk} from 'superdesk-api';
import {ISamsAPI, ISetItem, IStorageDestinationItem, CONTENT_PANEL_STATE} from '../../interfaces';
import {EVENTS} from '../../constants';

import {Button, ButtonGroup, SubNav} from 'superdesk-ui-framework/react';
import {
    HeaderPanel,
    LayoutContainer,
    MainPanel,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Portal,
} from '../../ui';

import {getSetContentPanel} from './setContentPanel';
import {getSetListPanel} from './setListPanel';

interface IProps {
    closeModal(): void;
}

interface IState {
    contentPanel?: {
        state: CONTENT_PANEL_STATE;
        set?: ISetItem;
    };

    storage?: {
        destinations: Array<IStorageDestinationItem>;
        destinationsById: {[key: string]: IStorageDestinationItem};
    };
    deleting?: boolean;
}

export function getManageSetsModalComponent(superdesk: ISuperdesk, api: ISamsAPI) {
    const {gettext} = superdesk.localization;
    const {notify} = superdesk.ui;
    const SetContentPanel = getSetContentPanel(superdesk, api);
    const SetListPanel = getSetListPanel(superdesk, api);

    return class ManageSetsModal extends React.Component<IProps, IState> {
        constructor(props: IProps) {
            super(props);

            this.state = {
                contentPanel: {
                    state: CONTENT_PANEL_STATE.CLOSED,
                },
                deleting: false,
            };

            this.setContentPanelState = this.setContentPanelState.bind(this);
            this.itemClicked = this.itemClicked.bind(this);
            this.previewSet = this.previewSet.bind(this);
            this.editSet = this.editSet.bind(this);
            this.deleteSet = this.deleteSet.bind(this);
            this.closeContentPanel = this.closeContentPanel.bind(this);
            this.createSet = this.createSet.bind(this);
            this.loadStorageDestinations = this.loadStorageDestinations.bind(this);
            this.onSetUpdated = this.onSetUpdated.bind(this);
        }

        setContentPanelState(state: CONTENT_PANEL_STATE, set?: ISetItem) {
            this.setState({
                contentPanel: {
                    state: state,
                    set: set,
                },
            });
        }

        itemClicked(set: ISetItem) {
            if (set?._id === this.state.contentPanel?.set?._id) {
                this.closeContentPanel();
            } else {
                this.previewSet(set);
            }
        }

        previewSet(set: ISetItem) {
            this.setContentPanelState(CONTENT_PANEL_STATE.PREVIEW, set);
        }

        editSet(set: ISetItem) {
            this.setContentPanelState(CONTENT_PANEL_STATE.EDIT, set);
        }

        deleteSet(set: ISetItem) {
            this.setState({deleting: true});

            api.sets.confirmAndDelete(set)
                .then(() => {
                    this.setState({deleting: false});
                });
        }

        closeContentPanel() {
            this.setContentPanelState(CONTENT_PANEL_STATE.CLOSED);
        }

        createSet() {
            this.setContentPanelState(CONTENT_PANEL_STATE.CREATE);
        }

        componentDidMount() {
            this.loadStorageDestinations();
            window.addEventListener(EVENTS.SET_UPDATED, this.onSetUpdated as EventListener);
        }

        componentWillUnmount() {
            window.removeEventListener(EVENTS.SET_UPDATED, this.onSetUpdated as EventListener);
        }

        loadStorageDestinations() {
            api.storageDestinations.getAll()
                .then((destinations: Array<IStorageDestinationItem>) => {
                    this.setState({
                        storage: {
                            destinations: destinations,
                            destinationsById: destinations.reduce(
                                (items, destination: IStorageDestinationItem) => {
                                    items[destination._id] = destination;

                                    return items;
                                },
                                {} as {[key: string]: IStorageDestinationItem},
                            ),
                        },
                    });
                })
                .catch(() => {
                    notify.error(gettext('Failed to load Storage Destinations'));
                    this.props.closeModal();
                });
        }

        onSetUpdated(event: CustomEvent<ISetItem>) {
            if (event.detail?._id === this.state.contentPanel?.set?._id) {
                this.setState({
                    contentPanel: {
                        ...this.state.contentPanel,
                        set: event.detail,
                    },
                });
            }
        }

        render() {
            const addButtonDisabled = this.state.contentPanel?.state === CONTENT_PANEL_STATE.EDIT ||
                this.state.contentPanel?.state === CONTENT_PANEL_STATE.CREATE;

            return (
                <Modal
                    id="ManageSetsModal"
                    size="x-large"
                    closeModal={this.props.closeModal}
                    closeOnEsc={true}
                >
                    <ModalHeader onClose={this.props.closeModal}>
                        {gettext('Manage Sets')}
                    </ModalHeader>
                    <ModalBody noPadding={true}>
                        <LayoutContainer>
                            <HeaderPanel>
                                <SubNav zIndex={2}>
                                    <ButtonGroup align="right">
                                        <Button
                                            type="primary"
                                            text={gettext('Add New')}
                                            icon="plus-sign"
                                            disabled={addButtonDisabled}
                                            onClick={this.createSet}
                                        />
                                    </ButtonGroup>
                                </SubNav>
                            </HeaderPanel>
                            <MainPanel className="sd-padding--2">
                                {this.state.storage?.destinationsById && (
                                    <SetListPanel
                                        storageDestinations={this.state.storage?.destinationsById}
                                        currentSetId={this.state.contentPanel?.set?._id}
                                        onItemClicked={this.itemClicked}
                                        onDelete={this.deleteSet}
                                        onEdit={this.editSet}
                                    />
                                )}
                            </MainPanel>
                            <SetContentPanel
                                state={this.state.contentPanel?.state ?? CONTENT_PANEL_STATE.CLOSED}
                                currentSet={this.state.contentPanel?.set}
                                destinations={this.state.storage?.destinations ?? []}
                                key={this.state.contentPanel?.set?._id}
                                onEdit={this.editSet}
                                onClose={this.closeContentPanel}
                                onDelete={this.deleteSet}
                                previewSet={this.previewSet}
                            />
                        </LayoutContainer>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            text={gettext('Close')}
                            onClick={this.props.closeModal}
                        />
                    </ModalFooter>
                    {!this.state.deleting ? null : (
                        <Portal id="deleteModalOverlay">
                            <div
                                className="modal__backdrop fade in"
                                style={{zIndex: 1050}}
                            />
                        </Portal>
                    )}
                </Modal>
            );
        }
    };
}
