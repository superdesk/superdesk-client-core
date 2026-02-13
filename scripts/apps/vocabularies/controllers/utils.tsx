import React from 'react';
import {showModal} from '@sourcefabric/common';
import {IVocabulary} from 'superdesk-api';
import {VocabularyDeletionModal} from '../components/VocabularyDeletionModal';
import {sdApi} from 'api';

export const showVocabularyDeletionModal = (
    vocabulary: IVocabulary,
    handleVocabularyRemoved: () => void,
    handleError: (error: any) => void,
    navigateToContentProfiles: () => void,
) => {
    showModal(({closeModal}) => {
        const handleDelete = () => {
            sdApi.vocabularies.deleteVocabulary(vocabulary)
                .then(handleVocabularyRemoved)
                .catch(handleError)
                .finally(closeModal);
        };

        const handleGoToContentProfiles = () => {
            closeModal();
            navigateToContentProfiles();
        };

        return (
            <VocabularyDeletionModal
                vocabulary={vocabulary}
                onDelete={handleDelete}
                onCancel={closeModal}
                closeModal={closeModal}
                navigateToContentProfiles={handleGoToContentProfiles}
            />
        );
    });
};
