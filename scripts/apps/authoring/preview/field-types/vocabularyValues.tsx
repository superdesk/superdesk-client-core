import React from 'react';
import {IVocabulary, IVocabularyItem} from 'superdesk-api';
import {dataApi} from 'core/helpers/CrudManager';
import {Map} from 'immutable';
import {SmallTags} from 'core/ui/components/SmallTags';
import {getVocabularyItemNameTranslated} from 'core/utils';

interface IProps {
    vocabularyId: string;
    qcodes: Array<string>;
    language: string;
}

interface IState {
    vocabularyItems: Map<string, IVocabularyItem> | 'loading';
}

export class VocabularyValuePreview extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            vocabularyItems: 'loading',
        };
    }
    componentDidMount() {
        dataApi.findOne<IVocabulary>('vocabularies', this.props.vocabularyId).then((vocabulary) => {
            this.setState({
                vocabularyItems: Map(
                    vocabulary.items.map((item) => [item.qcode, item]),
                ),
            });
        });
    }
    render() {
        const {vocabularyItems} = this.state;
        const {qcodes, language} = this.props;

        if (vocabularyItems === 'loading') {
            return null;
        }

        return (
            <SmallTags
                tags={
                    qcodes.map((qcode) => {
                        const vocabularyItem = vocabularyItems.get(qcode);

                        return {
                            id: qcode,
                            label: vocabularyItem != null
                                ? getVocabularyItemNameTranslated(vocabularyItem, language)
                                : qcode,
                        };
                    })
                }
            />
        );
    }
}
