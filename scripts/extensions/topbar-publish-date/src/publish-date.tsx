import React = require('react');
import {IArticle, ISuperdesk} from 'superdesk-api';

export function getPublishDate(superdesk: ISuperdesk) {
    return class DisplayPublishedTime extends React.PureComponent<{article: IArticle}> {
        render() {
            const {article} = this.props;
            const {DateTime} = superdesk.components;

            if (article.firstpublished == null) {
                return null;
            } else {
                return (
                    <dl data-test-id="date-published">
                        <dt>{superdesk.localization.gettext('Published')}</dt>
                        {' '}
                        <dd>
                            <DateTime dateTime={article.firstpublished} />
                        </dd>
                    </dl>
                );
            }
        }
    };
}
