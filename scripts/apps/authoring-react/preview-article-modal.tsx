import React from 'react';
import {IArticle} from 'superdesk-api';
import {authoringStorage} from './data-layer';
import {preferences} from 'api/preferences';
import {AUTHORING_FIELD_PREFERENCES} from 'core/constants';
import {getFieldsData} from './authoring-react';
import {showModal} from 'core/services/modalService';
import {Modal} from 'core/ui/components/Modal/Modal';
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {PreviewArticle} from './preview-article';

function getContentProfileAndFieldsData(article: IArticle) {
    return authoringStorage.getContentProfile(article).then((profile) => {
        const allFields = profile.header.merge(profile.content).toOrderedMap();
        const userPreferencesForFields = preferences.get(AUTHORING_FIELD_PREFERENCES);
        const fieldsData = getFieldsData(
            article,
            allFields,
            userPreferencesForFields,
        );

        return {
            profile,
            fieldsData,
        };
    });
}

export function previewArticle(label: string, article: IArticle) {
    getContentProfileAndFieldsData(article).then(({profile, fieldsData}) => showModal(({closeModal}) => (
        <Modal size="large">
            <ModalHeader onClose={closeModal}>
                {label}
            </ModalHeader>

            <ModalBody>
                <PreviewArticle
                    article={article}
                    profile={profile}
                    fieldsData={fieldsData}
                />
            </ModalBody>
        </Modal>
    )));
}
