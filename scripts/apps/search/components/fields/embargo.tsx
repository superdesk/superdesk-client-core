import React from 'react';
import moment from 'moment';
import {gettext} from 'core/utils';
import {IPropsItemListInfo} from '../ListItemInfo';
import {formatDate} from 'core/get-superdesk-api-implementation';

class EmbargoComponent extends React.PureComponent<IPropsItemListInfo> {
    render() {
        const item = this.props.item;
        const embargoed = item.embargo || item.embargoed;
        const embargoedText = item.embargoed_text;

        if (embargoed == null && embargoedText == null) { // no embargo
            return null;
        }

        if (embargoed != null && moment().isAfter(embargoed)) { // expired
            return null;
        }

        return (
            <span
                key="embargo"
                className="state-label state_embargo"
                title={embargoed != null ? (
                    gettext('Embargo until {{date}}', {date: formatDate(embargoed, {longFormat: true})})
                ) : (
                    gettext('Embargo: {{text}}', {text: embargoedText})
                )}
            >{gettext('Embargo')}</span>
        );
    }
}

export const embargo = EmbargoComponent;
