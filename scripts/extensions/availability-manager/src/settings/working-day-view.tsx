import {Spacer, SpacerBlock} from '@sourcefabric/common';
import {keyBy} from 'lodash';
import * as React from 'react';
import {Icon, IconButton, Label, Text} from 'superdesk-ui-framework/react';
import {TAGS_VOCABULARY_ID} from '../constants';
import {IAvailabilityRecord} from '../interfaces';
import {Separator} from '../separator';
import {superdesk} from '../superdesk';
import {getLocalizedDateString} from '../utils';

const {locale, gettext} = superdesk.localization;
const {getVocabularyItemNameTranslated} = superdesk.entities.vocabulary;

interface IProps {
    day: IAvailabilityRecord;
    onRemove(): void;
    onEdit(): void;
    onClose(): void;
}

export class WorkingDayView extends React.PureComponent<IProps> {
    render() {
        const workingHours: IAvailabilityRecord['working_hours'] = this.props.day?.working_hours ?? [];
        const tagsById = keyBy(
            superdesk.entities.vocabulary.getAll().get(TAGS_VOCABULARY_ID).items,
            (item) => item.qcode,
        );

        return (
            <>
                <Spacer h gap="0" justifyContent="end" noWrap>
                    <IconButton
                        icon="pencil"
                        ariaValue={gettext('Edit')}
                        onClick={() => {
                            this.props.onEdit();
                        }}
                    />

                    <IconButton
                        icon="trash"
                        ariaValue={gettext('Remove')}
                        onClick={() => {
                            this.props.onRemove();
                        }}
                    />

                    <SpacerBlock h gap="4" />

                    <Separator length="50%" color="var(--color-text-light)" />

                    <SpacerBlock h gap="4" />

                    <IconButton
                        icon="close-small"
                        ariaValue={gettext('Close')}
                        onClick={() => {
                            this.props.onClose();
                        }}
                    />
                </Spacer>

                <Text size="small">
                    {getLocalizedDateString(locale.code, new Date(this.props.day.date))}
                </Text>

                <div>
                    {workingHours.map((entry, i) => (
                        <Spacer key={i} h gap="4" noWrap alignItems="center" justifyContent="start">
                            <Icon name="time" />

                            <div style={{whiteSpace: 'nowrap'}}>
                                {entry.start_time} - {entry.end_time}
                            </div>

                            {
                                (entry.tags ?? []).map((tag, i) => {
                                    const vocabularyItem = tagsById[tag.code];

                                    return (
                                        <Label
                                            key={i}
                                            text={vocabularyItem != null ? getVocabularyItemNameTranslated(vocabularyItem) : tag.code}
                                            size="small"
                                        />
                                    );
                                })
                            }
                        </Spacer>
                    ))}
                </div>

                <div>
                    <span>
                        {gettext('Language')}:
                    </span>

                    <span>
                        {/* PR-TODO: use value from database */}
                        English
                    </span>
                </div>
            </>
        );
    }
}
