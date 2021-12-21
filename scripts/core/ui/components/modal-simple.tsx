import React from 'react';
import {Modal} from 'core/ui/components/Modal/Modal';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalFooter} from 'core/ui/components/Modal/ModalFooter';
import {Button} from 'superdesk-ui-framework/react';

export interface IModalSimpleAction {
    label: string;
    onClick(): void;
    primary?: boolean;
}

interface IProps {
    title: string;
    closeModal(): void;
    footerButtons?: Array<IModalSimpleAction>;
}

export class ModalSimple extends React.PureComponent<IProps> {
    render() {
        return (
            <Modal>
                <ModalHeader onClose={this.props.closeModal}>{this.props.title}</ModalHeader>

                <ModalBody>{this.props.children}</ModalBody>

                {
                    this.props.footerButtons != null && (
                        <ModalFooter>
                            {
                                this.props.footerButtons.map(({label, onClick, primary}) => (
                                    <Button
                                        key={label}
                                        text={label}
                                        onClick={onClick}
                                        type={primary === true ? 'primary' : 'default'}
                                    />
                                ))
                            }
                        </ModalFooter>
                    )
                }
            </Modal>
        );
    }
}
