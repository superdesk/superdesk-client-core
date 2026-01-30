import React from 'react';
import {Modal, Button, ButtonGroup, Text, Spacer} from 'superdesk-ui-framework/react';
import {gettext, gettextPlural} from 'core/utils';
import {IVocabulary} from 'superdesk-api';
import {sdApi} from 'api';

interface IProps {
    vocabulary: IVocabulary;
    onDelete: () => void;
    onCancel: () => void;
    closeModal: () => void;
    navigateToContentProfiles: () => void;
}

export class VocabularyDeletionModal extends React.PureComponent<IProps> {
    render() {
        const {vocabulary, onDelete, onCancel, navigateToContentProfiles, closeModal} = this.props;
        const profiles = sdApi.contentProfiles.getAll();
        const profilesWithVocabulary = profiles.filter((profile) => profile.editor[vocabulary._id] != null);

        if (profilesWithVocabulary.length > 0) {
            return (
                <Modal
                    visible
                    size="small"
                    position="center"
                    closeOnEscape
                    contentPadding="small"
                    headerTemplate={gettext('Cannot delete vocabulary')}
                    onHide={closeModal}
                    footerTemplate={(
                        <ButtonGroup align="end">
                            <Button
                                type="tertiary"
                                text={gettext('Go to content profiles')}
                                onClick={navigateToContentProfiles}
                            />
                            <Button
                                type="primary"
                                text={gettext('Go back')}
                                onClick={onCancel}
                            />
                        </ButtonGroup>
                    )}
                    data-test-id="vocabulary-deletion-modal--cannot-delete"
                >
                    <Spacer gap="8" v justifyContent="space-between" noWrap>
                        <Text>
                            {gettextPlural(
                                profilesWithVocabulary.length,
                                'The vocabulary {{name}} can\'t be deleted because it is currently used ' +
                                'in the following Content Profile:',
                                'The vocabulary {{name}} can\'t be deleted because it is currently used ' +
                                'in the following Content Profiles:',
                                {name: () => <strong>{vocabulary.display_name}</strong>},
                            )}
                        </Text>
                        <ul style={{listStyle: 'inside'}}>
                            {profilesWithVocabulary.map((profile) => (
                                <li key={profile._id}><strong>{profile.label}</strong></li>
                            ))}
                        </ul>
                        <Text>
                            {gettext(
                                'To delete this vocabulary, you must first remove it from all ' +
                                'Content Profiles listed above.',
                            )}
                        </Text>
                    </Spacer>
                </Modal>
            );
        } else {
            return (
                <Modal
                    visible
                    size="small"
                    position="center"
                    closeOnEscape
                    onHide={closeModal}
                    contentPadding="small"
                    headerTemplate={gettext('Delete vocabulary?')}
                    footerTemplate={(
                        <ButtonGroup align="end">
                            <Button
                                type="tertiary"
                                text={gettext('Cancel')}
                                onClick={onCancel}
                            />
                            <Button
                                type="primary"
                                text={gettext('Delete')}
                                onClick={onDelete}
                            />
                        </ButtonGroup>
                    )}
                    data-test-id="vocabulary-deletion-modal--can-delete"
                >
                    <>
                        <Text>
                            {gettext(
                                'You are about to delete the vocabulary {{name}}. This action can\'t be undone.',
                                {name: () => <strong>{vocabulary.display_name}</strong>},
                            )}
                        </Text>
                        <Text>
                            {gettext(
                                'This vocabulary is not currently used in any Content Profile ' +
                                'and can be safely removed.',
                            )}
                        </Text>
                    </>
                </Modal>
            );
        }
    }
}
