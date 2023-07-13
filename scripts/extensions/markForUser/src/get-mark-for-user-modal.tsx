import * as React from 'react';

import {ISuperdesk, IUser} from 'superdesk-api';

import {
    Button,
    ButtonGroup,
    Modal,
} from 'superdesk-ui-framework/react';

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
                <Modal
                    visible
                    size="large"
                    position="top"
                    onHide={this.props.closeModal}
                    zIndex={1050}
                    headerTemplate={gettext('Mark for user')}
                    footerTemplate={
                        (
                            <ButtonGroup align="end">
                                <Button
                                    type="default"
                                    text={gettext('Cancel')}
                                    onClick={() => this.props.closeModal()}
                                    data-test-id="cancel"
                                />

                                {
                                    markedForUserInitial !== undefined
                                        ? (
                                            <Button
                                                type="warning"
                                                text={gettext('Unmark')}
                                                disabled={lockedInOtherSession}
                                                onClick={() => {
                                                    this.props.closeModal();
                                                    markForUser(null);
                                                }}
                                                data-test-id="unmark"
                                            />
                                        )
                                        : null
                                }

                                <Button
                                    type="primary"
                                    text={gettext('Mark for user')}
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
                                />

                                <Button
                                    type="primary"
                                    text={gettext('Mark and send')}
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
                                />
                            </ButtonGroup>
                        )
                    }
                >
                    {
                        message == null
                            ? null
                            : (
                                <div
                                    className="sd-alert sd-alert--hollow sd-alert--primary sd-alert--small"
                                >
                                    {message}
                                </div>
                            )
                    }

                    {
                        lockedInOtherSession === true
                            ? (
                                <div>
                                    <div
                                        className="sd-alert sd-alert--hollow sd-alert--primary sd-alert--small"
                                    >
                                        {gettext('Item is locked and marked user can not be changed.')}
                                    </div>
                                    <br />
                                </div>
                            )
                            : null
                    }

                    <SelectUser
                        disabled={lockedInOtherSession}
                        onSelect={(selectedUser) => this.setState({selectedUserId: selectedUser._id})}
                        selectedUserId={this.state.selectedUserId}
                        autoFocus={true}
                    />
                </Modal>
            );
        }
    };
}
