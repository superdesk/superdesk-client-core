import * as React from 'react';
import {Button, Icon, Text} from 'superdesk-ui-framework/react';
import {IShow} from '../interfaces';

import {superdesk} from '../superdesk';
import {ManageRundownTemplates} from './rundowns/manage-rundown-templates';

const {gettext} = superdesk.localization;
const {Center, SpacerBlock} = superdesk.components;

const {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
} = superdesk.components;

interface IProps {
    show: IShow;
    closeModal(): void;
}

export class CreateShowAfterModal extends React.PureComponent<IProps> {
    render() {
        const {show} = this.props;

        return (
            <Modal>
                <ModalHeader onClose={this.props.closeModal}>
                    {gettext('Create rundown template')}
                </ModalHeader>

                <ModalBody>
                    <Center>
                        <Icon name="checkmark-circle" type="success" size="big" scale="3x" />
                    </Center>

                    <SpacerBlock v gap="16" />

                    <Text align="center" size="medium">
                        {
                            gettext(
                                'The show {{name}} has been successfully created',
                                {
                                    name: () => <strong>{show.name}</strong>,
                                },
                            )
                        }
                    </Text>

                    <Text align="center" size="medium">
                        {gettext('Do you want to create a rundown template for this show right away?')}
                    </Text>

                    <SpacerBlock v gap="16" />
                </ModalBody>

                <ModalFooter>
                    <Button
                        text={gettext('Cancel')}
                        onClick={() => this.props.closeModal()}
                    />
                    <Button
                        text={gettext('Yes, create a template')}
                        onClick={() => {
                            this.props.closeModal();

                            superdesk.ui.showModal(({closeModal}) => (
                                <ManageRundownTemplates
                                    closeModal={closeModal}
                                    initialShow={{id: show._id, createNewTemplate: true}}
                                />
                            ));
                        }}
                        type="primary"
                    />
                </ModalFooter>
            </Modal>
        );
    }
}