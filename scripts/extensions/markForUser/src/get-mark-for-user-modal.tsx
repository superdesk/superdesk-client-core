import * as React from 'react';

import {ISuperdesk, IUser} from 'superdesk-api';

interface IProps {
    closeModal(): void;
}

interface IState {
    selectedUserId?: string;
    fetchedUsers?: Array<IUser>;
}

export function getMarkForUserModal(options: {
    superdesk: ISuperdesk,
    markForUser: (markedForUserId: string | null) => void,
    markForUserAndSend: (markedForUserId: string | null) => void,
    locked: boolean;
    lockedInOtherSession: boolean,
    markedForUserInitial?: string,
    message?: string,
}): React.ComponentType<IProps> {
    const {
        superdesk,
        markForUser,
        markForUserAndSend,
        locked,
        lockedInOtherSession,
        markedForUserInitial,
        message,
    } = options;

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
                <Modal data-test-id="mark-for-user-modal" size="large">
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
                            lockedInOtherSession === true ? (
                                <div>
                                    <div
                                        className="sd-alert sd-alert--hollow sd-alert--primary sd-alert--small"
                                    >
                                        {gettext('Item is locked and marked user can not be changed.')}
                                    </div>
                                    <br />
                                </div>
                            ) : null
                        }

                        <SelectUser
                            disabled={lockedInOtherSession}
                            onSelect={(selectedUser) => this.setState({selectedUserId: selectedUser._id})}
                            selectedUserId={this.state.selectedUserId}
                            autoFocus={true}
                            clearable={false}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <button
                            className="btn"
                            onClick={() => this.props.closeModal()}
                            data-test-id="cancel"
                        >
                            {gettext('Cancel')}
                        </button>

                        {
                            markedForUserInitial !== undefined ? (
                                <button
                                    className="btn btn--warning"
                                    disabled={lockedInOtherSession}
                                    onClick={() => {
                                        this.props.closeModal();
                                        markForUser(null);
                                    }}
                                    data-test-id="unmark"
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
                                || lockedInOtherSession
                            }
                            onClick={() => {
                                this.props.closeModal();

                                if (this.state.selectedUserId !== undefined) {
                                    markForUser(this.state.selectedUserId);
                                } else {
                                    logger.error(new Error('selectedUserId can not be undefined'));
                                }
                            }}
                            data-test-id="confirm"
                        >
                            {gettext('Mark for user')}
                        </button>

                        <button
                            className="btn btn--primary"
                            disabled={
                                this.state.selectedUserId === undefined // no user selected
                                || this.state.selectedUserId === markedForUserInitial // user hasn't changed
                                || locked // can't send to another stage even if locked by current user
                            }
                            onClick={() => {
                                this.props.closeModal();

                                if (this.state.selectedUserId !== undefined) {
                                    markForUserAndSend(this.state.selectedUserId);
                                } else {
                                    logger.error(new Error('selectedUserId can not be undefined'));
                                }
                            }}
                            data-test-id="mark-and-send"
                        >
                            {gettext('Mark and send')}
                        </button>
                    </ModalFooter>
                </Modal>
            );
        }
    };
}
