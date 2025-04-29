import * as React from 'react';
import {keyBy} from 'lodash';
import {TAGS_VOCABULARY_ID} from '../constants';
import {superdesk} from '../superdesk';
import {Label} from 'superdesk-ui-framework/react';
import {Spacer} from '@sourcefabric/common';

const {getVocabularyItemNameTranslated} = superdesk.entities.vocabulary;

export function TagsPreview(props: {tags?: Array<{code: string}>}) {
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
            justifyContent="start"
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
                    />
                );
            })}
        </Spacer>
    );
}
