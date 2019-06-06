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
    onUpdate: (markedForUserId: string) => void,
    markedForUserId?: string,
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
                selectedUserId: markedForUserId,
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

                        <SelectUser
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

                        <button
                            className="btn btn--primary"
                            disabled={this.state.selectedUserId === undefined}
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
    }
}
