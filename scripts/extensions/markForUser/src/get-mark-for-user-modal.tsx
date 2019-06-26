import * as React from 'react';

import {ISuperdesk, IUser} from 'superdesk-api';

interface IProps {
    closeModal(): void;
}

interface IState {
    selectedUserId?: string;
    fetchedUsers?: Array<IUser>;
}

export function getMarkForUserModal(
    superdesk: ISuperdesk,
    onUpdate: (markedForUserId: string | null) => void,
    locked?: boolean,
    markedForUserInitial?: string,
    message?: string,
): React.ComponentType<IProps> {
    const {gettext} = superdesk.localization;
    const {
        Modal,
        ModalHeader,
        ModalBody,
        ModalFooter,
        SelectUser,
    } = superdesk.components;
    const {logger} = superdesk.utilities;

    return class MarkForUserModalComponent extends React.Component<IProps, IState> {
        constructor(props: IProps) {
            super(props);

            this.state = {
                selectedUserId: markedForUserInitial,
            };
        }
        render() {
            return (
                <Modal>
                    <ModalHeader onClose={this.props.closeModal}>{gettext('Mark for user')}</ModalHeader>
                    <ModalBody>
                        {
                            message == null ? null : (
                                <div
                                    className="sd-alert sd-alert--hollow sd-alert--primary sd-alert--small"
                                >
                                    {message}
                                </div>
                            )
                        }

                        {
                            locked === true ? (
                                <div
                                    className="sd-alert sd-alert--hollow sd-alert--primary sd-alert--small"
                                >
                                    {gettext('Item is locked and marked user can not be changed.')}
                                </div>
                            ) : null
                        }

                        <SelectUser
                            disabled={locked}
                            onSelect={(selectedUser) => this.setState({selectedUserId: selectedUser._id})}
                            selectedUserId={this.state.selectedUserId}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <button
                            className="btn"
                            onClick={() => this.props.closeModal()}
                        >
                            {gettext('Cancel')}
                        </button>

                        {
                            markedForUserInitial !== undefined ? (
                                <button
                                    className="btn btn--warning"
                                    disabled={locked}
                                    onClick={() => {
                                        this.props.closeModal();
                                        onUpdate(null);
                                    }}
                                >
                                    {gettext('Unmark')}
                                </button>
                            ) : null
                        }

                        <button
                            className="btn btn--primary"
                            disabled={
                                this.state.selectedUserId === undefined // no user selected
                                || this.state.selectedUserId === markedForUserInitial // user hasn't changed
                                || locked
                            }
                            onClick={() => {
                                this.props.closeModal();

                                if (this.state.selectedUserId !== undefined) {
                                    onUpdate(this.state.selectedUserId);
                                } else {
                                    logger.error(new Error('selectedUserId can not be undefined'));
                                }
                            }}
                        >
                            {gettext('Confirm')}
                        </button>
                    </ModalFooter>
                </Modal>
            );
        }
    };
}
