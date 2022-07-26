import React from 'react';
import {showModal} from '@superdesk/common';
import {Modal} from 'core/ui/components/Modal/Modal';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalFooter} from 'core/ui/components/Modal/ModalFooter';
import classNames from 'classnames';
import {Loader} from './Loader';
import {Spacer} from './Spacer';

interface IOption {
    label: string;
    highlightOption?: boolean;
    onSelect(closeModalFn: () => void): void;
}

interface IProps {
    closeModal(): void;
}

interface IState {
    loading: boolean;
}

export function showOptionsModal(title: string, message: string, options: Array<IOption>): void {
    class OptionsModal extends React.PureComponent<IProps, IState> {
        constructor(props: IProps) {
            super(props);

            this.state = {
                loading: false,
            };
        }

        render() {
            return (
                <Modal>
                    <ModalHeader>{title}</ModalHeader>

                    <ModalBody>
                        <div>{message}</div>
                    </ModalBody>

                    <ModalFooter flex>
                        {
                            this.state.loading && (
                                <Loader grow={false} />
                            )
                        }

                        <Spacer h gap="4" justifyContent="start" noGrow>
                            {
                                options.map(({label, highlightOption, onSelect}) => (
                                    <button
                                        key={label}
                                        className={classNames('btn', {'btn--primary': highlightOption})}
                                        onClick={() => {
                                            this.setState({loading: true});
                                            const closeModalFn = () => this.props.closeModal();

                                            onSelect(closeModalFn);
                                        }}
                                        disabled={this.state.loading}
                                    >
                                        {label}
                                    </button>
                                ))
                            }
                        </Spacer>
                    </ModalFooter>
                </Modal>
            );
        }
    }

    showModal(OptionsModal);
}
