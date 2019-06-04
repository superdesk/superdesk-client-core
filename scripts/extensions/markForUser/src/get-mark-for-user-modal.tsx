import * as React from 'react';

import {ISuperdesk, IUser, IArticle} from 'superdesk-api';

interface IProps {
    closeModal(): void;
}

interface IState {
    selectedUser?: IUser;
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

            this.state = {};
        }
        render() {
            return (
                <Modal>
                    <ModalHeader onClose={this.props.closeModal}>{gettext('Mark for user')}</ModalHeader>
                    <ModalBody>
                        <SelectUser
                            onSelect={(selectedUser) => this.setState({selectedUser})}
                            value={this.state.selectedUser}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <button
                            className="btn btn--primary"
                            disabled={this.state.selectedUser == null}
                            onClick={() => {
                                this.props.closeModal();

                                if (this.state.selectedUser !== undefined) {
                                    superdesk.entities.article.update({
                                        ...articleNext,
                                        marked_for_user: this.state.selectedUser._id,
                                    });
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
