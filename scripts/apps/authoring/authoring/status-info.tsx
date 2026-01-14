import React from 'react';
import {IArticle} from 'superdesk-api';
import {getStateLabel} from 'apps/search/components/fields/state';

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
        const cssClass = entity.state === 'correction'
            ? 'label pink--500'
            : (entity.state === 'being_corrected'
                ? 'label label--hollow hollow-pink--500'
                : 'state-label state-' + entity.state);

        return (
            <span
                className={cssClass}
                title={label}
            >
                {label}
            </span>
        );
    }
}
