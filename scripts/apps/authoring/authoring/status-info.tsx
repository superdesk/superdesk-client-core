import React from 'react';
import {IArticle} from 'superdesk-api';
import {getStateLabel} from 'apps/search/components/fields/state';
import {StateLabel} from 'superdesk-ui-framework';

interface IProps {
    entity: IArticle;
}

export class StatusInfo extends React.PureComponent<IProps> {
    render() {
        const {entity} = this.props;

        if (entity.state == null) {
            return null;
        }

        const label = getStateLabel(entity.state);

        return (
            <StateLabel
                state={entity.state}
                text={label}
            />
        );
    }
}
