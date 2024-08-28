import React from 'react';
import {IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';
import {TimeElem} from 'apps/search/components/TimeElem';

interface IProps {
    article: IArticle;
}

export class ModifiedInfo extends React.PureComponent<IProps> {
    render() {
        const {article} = this.props;

        if (article.versioncreated == null || article.pubstatus === 'CANCELED') {
            return null;
        }

        return (
            <dl>
                <dt>{gettext('Modified')}</dt>
                {' '}
                <dd><TimeElem date={article.versioncreated} /></dd>
            </dl>
        );
    }
}
