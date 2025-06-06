import * as React from 'react';
import {keyBy} from 'lodash';
import {TAGS_VOCABULARY_ID} from '../constants';
import {superdesk} from '../superdesk';
import {Label} from 'superdesk-ui-framework/react';
import {IPropsSpacer, Spacer} from '@sourcefabric/common';
import {IAvailabilityRecord} from '../interfaces';

const {getVocabularyItemNameTranslated} = superdesk.entities.vocabulary;
const {assertNever} = superdesk.helpers;

interface IProps {
    tags?: Array<{code: string}>;
    justifyContent?: IPropsSpacer['justifyContent']; // defaults to start
    status: IAvailabilityRecord['status'];
}

export function TagsPreview(props: IProps) {
    const {tags} = props;
    const tagsById = keyBy(
        superdesk.entities.vocabulary.getAll().get(TAGS_VOCABULARY_ID).items,
        (item) => item.qcode,
    );

    if (tags == null || tags.length < 1) {
        return null;
    }

    return (
        <Spacer
            h
            gap="4"
            noWrap
            justifyContent={props.justifyContent ?? 'start'}
            style={{
                maxWidth: 300,
                flexWrap: 'wrap',
            }}
            data-test-id="tags"
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
                        data-test-id="tag"
                        type={(() => {
                            switch (props.status) {
                                case 'available':
                                    return 'success';
                                case 'partial':
                                    return 'warning';
                                case 'unavailable':
                                    return 'alert';
                                default:
                                    return assertNever(props.status);
                            }
                        })()}
                    />
                );
            })}
        </Spacer>
    );
}
