import React from 'react';
import {IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';
import {TimeElem} from 'apps/search/components/TimeElem';

interface IProps {
    entity: IArticle;
}

export class ModifiedInfo extends React.PureComponent<IProps> {
    render() {
        const {entity} = this.props;

        if (entity.versioncreated == null) {
            return null;
        }

        return (
            <dl data-test-id="modified-info">
                <dt>{gettext('Modified')}</dt>
                {' '}
                <dd data-test-id="modified-info--date"><TimeElem date={entity.versioncreated} /></dd>
            </dl>
        );
    }
}
