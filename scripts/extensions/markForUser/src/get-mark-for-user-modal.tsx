import * as React from 'react';

import {ISuperdesk, IUser, IArticle} from 'superdesk-api';

interface IProps {
    closeModal(): void;
}

interface IState {
    selectedUserId?: string;
    fetchedUsers?: Array<IUser>;
}

export function getMarkForUserModal(superdesk: ISuperdesk, articleNext: IArticle): React.ComponentType<IProps> {
    const {gettext} = superdesk.localization;
    const {
        Modal,
        ModalHeader,
        ModalBody,
        ModalFooter,
        SelectUser,
    } = superdesk.components;

    return class MarkForUserModalComponent extends React.Component<IProps, IState> {
        constructor(props: IProps) {
            super(props);

            this.state = {
                selectedUserId: articleNext.marked_for_user != null ? articleNext.marked_for_user : undefined,
            };
        }
        render() {
            return (
                <Modal>
                    <ModalHeader onClose={this.props.closeModal}>{gettext('Mark for user')}</ModalHeader>
                    <ModalBody>
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

                                superdesk.entities.article.update({
                                    ...articleNext,
                                    marked_for_user: this.state.selectedUserId,
                                });
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
