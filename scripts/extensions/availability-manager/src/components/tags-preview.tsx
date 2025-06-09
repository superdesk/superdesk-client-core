import * as React from 'react';
import {TAGS_VOCABULARY_ID} from '../constants';
import {superdesk} from '../superdesk';
import {Label} from 'superdesk-ui-framework/react';
import {IPropsSpacer, Spacer} from '@sourcefabric/common';
import {IAvailabilityRecord} from '../interfaces';
import {ITreeNode, IVocabularyItem} from 'superdesk-api';
import {configuration} from '../configuration';

const {getVocabularyItemNameTranslated} = superdesk.entities.vocabulary;
const {assertNever} = superdesk.helpers;
const {buildTreeDictionary, arrayToTree, getTreeLeafs} = superdesk.utilities;

interface IProps {
    tags?: Array<{code: string}>;
    justifyContent?: IPropsSpacer['justifyContent']; // defaults to start
    status: IAvailabilityRecord['status'];

    /**
     * Which view tags are being previewed from.
     */
    origin: 'settings' | 'dashboard';
}

export function TagsPreview(props: IProps) {
    const {tags} = props;

    if (tags == null || tags.length < 1) {
        return null;
    }

    const allTagsFlat = superdesk.entities.vocabulary.getAll().get(TAGS_VOCABULARY_ID).items;
    const allTagsTree = arrayToTree(
        allTagsFlat,
        (item) => item.qcode,
        (item) => item.parent,
    ).result;

    const allTagsLookup = buildTreeDictionary(allTagsTree, (node) => node.value.qcode);
    const selectedTreeNodes: Array<ITreeNode<IVocabularyItem>> = tags.map(({code}) => allTagsLookup[code]);

    const tagsToShow: Array<IVocabularyItem> = (() => {
        const leafsOnly = (() => {
            if (props.origin === 'dashboard') {
                return configuration.dashboard?.tags?.leafsOnly ?? false;
            } else if (props.origin === 'settings') {
                return false;
            } else {
                return assertNever(props.origin);
            }
        })();

        if (leafsOnly === true) {
            return getTreeLeafs(selectedTreeNodes).map((node) => node.value);
        } else {
            return selectedTreeNodes.map((node) => node.value);
        }
    })();

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
            {tagsToShow.map((vocabularyItem, i) => {
                return (
                    <Label
                        key={i}
                        text={getVocabularyItemNameTranslated(vocabularyItem)}
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
