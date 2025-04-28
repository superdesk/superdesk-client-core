import * as React from 'react';
import {FormLabel} from 'superdesk-ui-framework/react';
import {TAGS_VOCABULARY_ID} from '../constants';
import {superdesk} from '../superdesk';

const {gettext} = superdesk.localization;

export const WorkingHoursGridLabels: React.FunctionComponent = () => {
    const tagsVocabulary = superdesk.entities.vocabulary.getAll().get(TAGS_VOCABULARY_ID);

    return (
        <>
            <div style={{whiteSpace: 'nowrap'}} key="working hours">
                <FormLabel text={gettext('Working hours')} noMinHeight />
            </div>

            <div style={{whiteSpace: 'nowrap'}} key="tags">
                <FormLabel text={tagsVocabulary.display_name} noMinHeight />
            </div>

            <span key="column-for-controls" />
        </>
    );
};
