import {Spacer, SpacerBlock, Divider} from '@sourcefabric/common';
import {keyBy} from 'lodash';
import * as React from 'react';
import {Icon, IconButton, Label, Tooltip} from 'superdesk-ui-framework/react';
import {TAGS_VOCABULARY_ID} from '../constants';
import {IAvailabilityRecord} from '../interfaces';
import {superdesk} from '../superdesk';
import {getLabelForStatus, getLocalizedDateString, getStylesForStatusDot} from '../utils';

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
        const tagsById = keyBy(
            superdesk.entities.vocabulary.getAll().get(TAGS_VOCABULARY_ID).items,
            (item) => item.qcode,
        );

        return (
            <>
                <Spacer h gap="0" justifyContent="end" noWrap style={{paddingInline: 4, paddingBlockStart: 4}}>
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

                    {/** PR-TODO: exact color variable needed */}
                    <Divider length="50%" color="var(--color-text-light)" />

                    <SpacerBlock h gap="4" />

                    <IconButton
                        icon="close-small"
                        ariaValue={gettext('Close')}
                        onClick={() => {
                            this.props.onClose();
                        }}
                    />
                </Spacer>

                <div
                    style={{
                        padding: 'calc(var(--base-increment) * 2)',
                        paddingInlineEnd: 'calc(var(--base-increment) * 5)',
                        paddingBlockStart: 'var(--base-increment) * 0.5',
                    }}
                >
                    <Spacer h gap="8" justifyContent="start" noWrap style={{paddingBlock: 'var(--base-increment)'}}>
                        <Tooltip text={getLabelForStatus(this.props.day.status)}>
                            <div
                                style={{
                                    ...getStylesForStatusDot(this.props.day.status),
                                    marginBlockStart: -2, // fixing vertical alignment
                                }}
                            />
                        </Tooltip>

                        <h3 style={{fontWeight: 'normal', fontSize: '1.6rem', lineHeight: '1em'}}>
                            {getLocalizedDateString(locale.code, new Date(this.props.day.date))}
                        </h3>
                    </Spacer>

                    {
                        this.props.day.status === 'partial' && (() => {
                            const workingHours: IAvailabilityRecord['working_hours'] =
                                this.props.day.working_hours ?? [];

                            if (workingHours.length < 1) {
                                return null;
                            }

                            return (
                                <Spacer v gap="8" noWrap>
                                    {workingHours.map((entry, i) => {
                                        const tags = entry.tags ?? [];

                                        return (
                                            <Spacer v gap="4" key={i}>
                                                <Spacer
                                                    key={i}
                                                    h
                                                    gap="4"
                                                    noWrap
                                                    alignItems="center"
                                                    justifyContent="start"
                                                >
                                                    <Icon name="time" />

                                                    <div style={{whiteSpace: 'nowrap'}}>
                                                        {entry.start_time} - {entry.end_time}
                                                    </div>
                                                </Spacer>

                                                {
                                                    tags.length < 1 ? null : (
                                                        <Spacer
                                                            h gap="4"
                                                            noWrap
                                                            justifyContent="start"
                                                            style={{
                                                                maxWidth: 300,
                                                                flexWrap: 'wrap',
                                                            }}
                                                        >
                                                            {tags.map((tag, i) => {
                                                                const vocabularyItem = tagsById[tag.code];

                                                                // PR-TODO: color code required
                                                                return (
                                                                    <Label
                                                                        key={i}
                                                                        text={
                                                                            vocabularyItem != null
                                                                                ? getVocabularyItemNameTranslated(
                                                                                    vocabularyItem,
                                                                                )
                                                                                : tag.code
                                                                        }
                                                                        size="small"
                                                                    />
                                                                );
                                                            })}
                                                        </Spacer>
                                                    )
                                                }
                                            </Spacer>
                                        );
                                    })}
                                </Spacer>
                            );
                        })()
                    }
                </div>
            </>
        );
    }
}
