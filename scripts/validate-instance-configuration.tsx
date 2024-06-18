import React from 'react';
import {Modal} from 'superdesk-ui-framework/react';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {showModal} from '@superdesk/common';

const modalHeader = (
    <span
        style={{background: 'red', color: 'white', padding: 4}}
    >
        {gettext('Instance configuration is missing!')}
    </span>
);

export function maybeDisplayInvalidInstanceConfigurationMessage() {
    const issues: Array<React.ReactNode> = [];

    ng.get('vocabularies').getAllActiveVocabularies().then((vocabularies) => {
        const categoriesMissing = vocabularies.find(({_id}) => _id === 'categories') == null;

        if (categoriesMissing) {
            issues.push(
                (
                    <>
                        <p>{gettext('Vocabulary with ID "categories" is required.')}</p>
                        <p>{gettext('Add it via Settings > Metadata')}</p>
                    </>
                ),
            );
        }

        if (issues.length > 0) {
            showModal(({closeModal}) => (
                <Modal
                    visible={true}
                    headerTemplate={modalHeader}
                    onHide={closeModal}
                    zIndex={9999}
                >
                    {issues[0]}
                </Modal>
            ));
        }
    });
}
