import {getVocabularyItemNameTranslated} from 'core/utils';
import React from 'react';
import {IArticle, IArticleField} from 'superdesk-api';

interface IProps {
    item: IArticle;
    fields: Array<IArticleField>;
}

export class PreviewSubject extends React.PureComponent<IProps> {
    render() {
        if (this.props.item.subject == null) {
            return null;
        }

        const subjects = [];

        this.props.fields.forEach((field) => {
            this.props.item.subject
                .filter((subj) => subj.scheme === field._id && subj.name)
                .forEach((subj) => {
                    subjects.push(
                        <span
                            key={subj.scheme + ':' + subj.qcode}
                            className="tag-label"
                            title={subj.name} // longer names might not fit the area
                        >{getVocabularyItemNameTranslated(subj, this.props.item.language)}</span>,
                    );
                });
        });

        if (subjects.length === 0) {
            return null;
        }

        return subjects;
    }
}
