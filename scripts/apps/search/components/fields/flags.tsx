import React from 'react';
import {gettext} from 'core/utils';
import {IPropsItemListInfo} from '../ListItemInfo';

class FlagsComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const props = this.props;

        const _flags = props.item.flags || {};
        const elems = [
            _flags.marked_for_not_publication ?
                React.createElement(
                    'span', {
                        className: 'state-label not-for-publication',
                        title: gettext('Not For Publication'),
                        key: 'not-for-publication',
                    }, gettext('Not For Publication'))
                : null,
            _flags.marked_for_legal ?
                React.createElement(
                    'span', {
                        className: 'state-label legal',
                        title: gettext('Legal'),
                        key: 'legal',
                    }, gettext('Legal'))
                : null,
            _flags.marked_for_sms ?
                React.createElement(
                    'span', {
                        className: 'state-label sms',
                        key: 'sms'},
                    gettext('Sms'))
                : null,
        ].filter(angular.identity);

        return elems.length ? React.createElement('span', {className: 'sd-wrap-helper', key: 'flags'}, elems) : null;
    }
}

export const flags = FlagsComponent;
