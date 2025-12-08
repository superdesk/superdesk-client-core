import * as React from 'react';
import {FormLabel} from 'superdesk-ui-framework';
import {TAGS_VOCABULARY_ID} from '../constants';
import {superdesk} from '../superdesk';

const {gettext} = superdesk.localization;

interface IProps {
    showWorkingHoursLabel?: boolean; // defaults to true
}

export const WorkingHoursGridLabels: React.FunctionComponent<IProps> = ({showWorkingHoursLabel = true}) => {
    const tagsVocabulary = superdesk.entities.vocabulary.getAll().get(TAGS_VOCABULARY_ID);

    return (
        <>
            <div style={{whiteSpace: 'nowrap'}} key="tags">
                <FormLabel text={tagsVocabulary.display_name} noMinHeight />
            </div>

            {
                showWorkingHoursLabel
                    ? (
                        <div style={{whiteSpace: 'nowrap'}} key="working hours">
                            <FormLabel text={gettext('Working hours')} noMinHeight />
                        </div>
                    )
                    : <span />
            }

            <span key="column-for-controls" />
        </>
    );
};
