import React from 'react';
import {IArticle, IContentProfileV2} from 'superdesk-api';
import {showModal} from 'core/services/modalService';
import {Modal} from 'core/ui/components/Modal/Modal';
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {PreviewArticle} from './preview-article';

export function previewArticle(
    label: string,
    article: IArticle,
    profile: IContentProfileV2,
    fieldsData: Immutable.Map<string, any>,
) {
    showModal(({closeModal}) => (
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
    ));
}
