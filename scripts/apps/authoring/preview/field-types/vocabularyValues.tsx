import React from 'react';
import {IVocabulary, IVocabularyItem} from 'superdesk-api';
import {dataApi} from 'core/helpers/CrudManager';
import {Map} from 'immutable';
import {SmallTags} from 'core/ui/components/SmallTags';

interface IProps {
    vocabularyId: string;
    qcodes: Array<string>;
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
        const {qcodes} = this.props;

        if (vocabularyItems === 'loading') {
            return null;
        }

        return (
            <SmallTags
                tags={
                    qcodes.map((qcode) => ({
                        id: qcode,
                        label: vocabularyItems.get(qcode)?.name ?? qcode,
                    }))
                }
            />
        );
    }
}
