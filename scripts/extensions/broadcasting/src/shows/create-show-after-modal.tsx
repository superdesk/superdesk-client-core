import * as React from 'react';
import {Button, ButtonGroup, Icon, Modal, Text} from 'superdesk-ui-framework/react';
import {showModal} from '@superdesk/common';
import {IShow} from '../interfaces';

import {superdesk} from '../superdesk';
import {ManageRundownTemplates} from '../rundown-templates/manage-rundown-templates';

const {gettext} = superdesk.localization;
const {Center, SpacerBlock} = superdesk.components;

interface IProps {
    show: IShow;
    closeModal(): void;
}

export class CreateShowAfterModal extends React.PureComponent<IProps> {
    render() {
        const {show} = this.props;

        return (
            <Modal
                visible
                zIndex={1050}
                size="small"
                position="top"
                onHide={this.props.closeModal}
                headerTemplate={
                    gettext('Create rundown template')
                }
                footerTemplate={
                    (
                        <ButtonGroup align="end">
                            <Button
                                text={gettext('Cancel')}
                                onClick={() => this.props.closeModal()}
                            />
                            <Button
                                text={gettext('Yes, create a template')}
                                onClick={() => {
                                    this.props.closeModal();

                                    showModal(({closeModal}) => (
                                        <ManageRundownTemplates
                                            dialogTitle={gettext('Create new rundown template')}
                                            closeModal={closeModal}
                                            initialShow={{id: show._id, createNewTemplate: true}}
                                        />
                                    ));
                                }}
                                type="primary"
                            />
                        </ButtonGroup>
                    )
                }
            >
                <Center>
                    <Icon name="checkmark-circle" type="success" size="big" scale="3x" />
                </Center>

                <SpacerBlock v gap="16" />

                <Text align="center" size="medium">
                    {
                        gettext(
                            'The show {{name}} has been successfully created',
                            {
                                name: () => <strong>{show.title}</strong>,
                            },
                        )
                    }
                </Text>

                <Text align="center" size="medium">
                    {gettext('Do you want to create a rundown template for this show right away?')}
                </Text>

                <SpacerBlock v gap="16" />
            </Modal>
        );
    }
}
