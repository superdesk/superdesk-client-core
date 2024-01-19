import React from 'react';
import {Button, ButtonGroup, Modal} from 'superdesk-ui-framework/react';

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
            <Modal
                visible
                zIndex={1050}
                size="medium"
                position="top"
                onHide={() => this.props.closeModal()}
                headerTemplate={this.props.title}
                footerTemplate={
                    this.props.footerButtons != null && (
                        <ButtonGroup align="end">
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
                        </ButtonGroup>
                    )
                }
            >
                <div>
                    {this.props.children}
                </div>
            </Modal>
        );
    }
}
