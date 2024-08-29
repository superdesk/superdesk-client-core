import React = require('react');
import {IArticle} from 'superdesk-api';
import {superdesk} from './superdesk';

export function getPublishDate() {
    return class DisplayPublishedTime extends React.PureComponent<{article: IArticle}> {
        render() {
            const {article} = this.props;
            const {DateTime} = superdesk.components;

            if (article.firstpublished == null || article.pubstatus.toLowerCase() === 'canceled') {
                return null;
            } else {
                return (
                    <dl data-test-id="date-published">
                        <dt>{superdesk.localization.gettext('First Published')}</dt>
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
