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
            const fieldSubjects = this.props.item.subject
                .filter((subj) => subj.scheme === field._id && subj.name);

            fieldSubjects.forEach((subject, index) => {
                if (index === 0) {
                    /* Adding the Subject heading only for
                    first time so that seems scheme subjects are grouped together.*/

                    subjects.push(<div>
                        <span
                            key={subject?.scheme + ':' + subject?.qcode}
                            className="inline-label"
                        >{subject?.scheme}</span><br /></div>,
                    );
                }
                subjects.push(
                    <span
                        key={subject.scheme + ':' + subject.qcode}
                        className="tag-label"
                        title={getVocabularyItemNameTranslated(subject, this.props.item.language)}
                    // longer names might not fit the area
                    >{getVocabularyItemNameTranslated(subject, this.props.item.language)}</span>,
                );
            });
        });

        if (subjects.length === 0) {
            return null;
        }

        return subjects;
    }
}
