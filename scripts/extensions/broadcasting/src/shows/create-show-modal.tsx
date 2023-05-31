import * as React from 'react';
import {Button, Modal, Spinner} from 'superdesk-ui-framework/react';
import {showModal} from '@superdesk/common';
import {CreateShowAfterModal} from './create-show-after-modal';
import {superdesk} from '../superdesk';
import {IShow, IShowBase} from '../interfaces';
import {WithShow} from './create-show';

const {gettext} = superdesk.localization;
const {Spacer} = superdesk.components;
const {httpRequestJsonLocal} = superdesk;

interface IProps {
    closeModal(): void;
}

interface IState {
    show: IShowBase;
    inProgress: boolean;
}

export class CreateShowModal extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            show: {
                title: '',
                description: '',
                planned_duration: 3600,
            },
            inProgress: false,
        };

        this.updateShowProperty = this.updateShowProperty.bind(this);
        this.cancel = this.cancel.bind(this);
        this.doSave = this.doSave.bind(this);
    }

    private updateShowProperty(update: Partial<IShow>) {
        this.setState({
            ...this.state,
            show: {
                ...this.state.show,
                ...update,
            },
        });
    }

    private cancel() {
        this.props.closeModal();
    }

    private doSave() {
        this.setState({inProgress: true});

        httpRequestJsonLocal<IShow>({
            method: 'POST',
            path: '/shows',
            payload: this.state.show,
        }).then((show) => {
            this.setState({inProgress: false}, () => {
                this.props.closeModal();

                showModal(({closeModal}) => (
                    <CreateShowAfterModal
                        closeModal={closeModal}
                        show={show}
                    />
                ));
            });
        });
    }

    render() {
        return (
            <WithShow show={this.state.show}>
                {(form, save) => (
                    <Modal
                        visible
                        zIndex={1050}
                        size="small"
                        position="top"
                        onHide={this.props.closeModal}
                        headerTemplate={
                            gettext('Create new show')
                        }
                        footerTemplate={
                            (
                                <Spacer h gap="32" justifyContent="space-between" noWrap>
                                    <div>
                                        {
                                            this.state.inProgress && (
                                                <Spinner />
                                            )
                                        }
                                    </div>

                                    <div>
                                        <Spacer h gap="8" noWrap>
                                            <Button
                                                text={gettext('Cancel')}
                                                onClick={this.cancel}
                                                disabled={this.state.inProgress}
                                            />
                                            <Button
                                                text={gettext('Save')}
                                                onClick={() => {
                                                    save().then((savedShow) => {
                                                        this.props.closeModal();

                                                        showModal(({closeModal}) => (
                                                            <CreateShowAfterModal
                                                                closeModal={closeModal}
                                                                show={savedShow}
                                                            />
                                                        ));
                                                    }).catch(() => {
                                                        // noop, validation failed
                                                    });
                                                }}
                                                type="primary"
                                                disabled={this.state.inProgress}
                                            />
                                        </Spacer>
                                    </div>
                                </Spacer>
                            )
                        }
                    >
                        {form}
                    </Modal>
                )}
            </WithShow>
        );
    }
}
