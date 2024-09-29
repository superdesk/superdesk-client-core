import React from 'react';
import {Modal} from 'superdesk-ui-framework/react';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {showModal} from '@superdesk/common';
import {authoringReactEnabledUserSelection, extensions} from 'appConfig';
import {flatMap} from 'lodash';

interface IError {
    title: string;
    content: React.ReactNode;
}

function getError(): Promise<IError | null> {
    const authoringHeaderComponentsFromExtensions = flatMap(
        Object.values(extensions),
        (extension) => extension.activationResult?.contributions?.authoringHeaderComponents ?? [],
    );

    if (authoringHeaderComponentsFromExtensions.length > 0 && authoringReactEnabledUserSelection === true) {
        return Promise.resolve({
            title: 'Incompatible extension detected',
            content: (
                <>
                    <p>
                        Unsupported extension point is being used: `contributions.authoringHeaderComponents`
                    </p>

                    <p>
                        You are likely running an outdated version of auto tagging extension.
                    </p>

                    <p>
                        Update or disable incompatible extensions.
                    </p>
                </>
            ),
        });
    }

    return ng.get('vocabularies').getAllActiveVocabularies().then((vocabularies) => {
        const categoriesMissing = vocabularies.find(({_id}) => _id === 'categories') == null;

        if (categoriesMissing) {
            return {
                title: 'Instance configuration is missing!',
                content: (
                    <>
                        <p>{gettext('Vocabulary with ID "categories" is required.')}</p>
                        <p>{gettext('Add it via Settings > Metadata')}</p>
                    </>
                ),
            };
        } else {
            return null;
        }
    });
}

export function maybeDisplayInvalidInstanceConfigurationMessage() {
    getError().then((error) => {
        if (error != null) {
            showModal(({closeModal}) => (
                <Modal
                    visible={true}
                    headerTemplate={(
                        <span
                            style={{background: 'red', color: 'white', padding: 4}}
                        >
                            {error.title}
                        </span>
                    )}
                    onHide={closeModal}
                    zIndex={9999}
                >
                    {error.content}
                </Modal>
            ));
        }
    });
}
