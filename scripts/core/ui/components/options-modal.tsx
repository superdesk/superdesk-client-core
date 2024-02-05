import React from 'react';
import {showModal} from '@superdesk/common';
import classNames from 'classnames';
import {Loader} from './Loader';
import {Spacer} from './Spacer';
import {Modal} from 'superdesk-ui-framework/react';

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
                <Modal
                    visible
                    zIndex={1050}
                    size="small"
                    position="top"
                    data-test-id='options-modal'
                    headerTemplate={title}
                    data-test-id='options-modal'
                    footerTemplate={
                        (
                            <div>
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
                            </div>
                        )
                    }
                >
                    <div>{message}</div>
                </Modal>
            );
        }
    }

    showModal(OptionsModal);
}
