import React from 'react';
import PropTypes from 'prop-types';
import {createMarkUp} from '../helpers';
import {FetchedDesksInfo} from './index';
import {gettext} from 'core/utils';

/**
 * Media Info - renders item metadata
 */
export const MediaInfo: React.StatelessComponent<any> = (props) => {
    const {datetime} = props.svc;

    const item = props.item;
    const meta = [];
    let source = props.ingestProvider ? props.ingestProvider.source : '';

    if (item.source) {
        source = item.source;
    }
    if (source) {
        meta.push(
            React.createElement('dt', {key: 1}, gettext('source')),
            React.createElement('dd', {key: 2, className: 'provider'}, source),
        );
    }

    meta.push(
        React.createElement('dt', {key: 3}, gettext('updated')),
        React.createElement('dd', {key: 4}, datetime.shortFormat(item.versioncreated)),
    );

    if (item.is_spiked) {
        meta.push(React.createElement('dt', {key: 5}, gettext('expires')));
        meta.push(React.createElement('dd', {key: 6}, datetime.shortFormat(item.expiry)));
    }

    const info = [];
    const flags = item.flags || {};

    info.push(React.createElement(
        'h5',
        {key: 1,
            dangerouslySetInnerHTML: createMarkUp(item.headline || item.slugline || item.type)},

    ));

    info.push(React.createElement(
        'dl',
        {key: 2},
        meta,
    ));

    if (flags.marked_for_legal) {
        info.push(React.createElement(
            'div',
            {key: 3, className: 'state-label legal'},
            gettext('Legal'),
        ));
    }

    if (item.archived) {
        info.push(React.createElement(
            'div',
            {className: 'fetched-desk', key: 4},
            React.createElement(FetchedDesksInfo, {
                item: item,
                svc: props.svc,
            }),
        ));
    }

    return React.createElement('div', {className: 'media-info'}, info);
};

MediaInfo.propTypes = {
    svc: PropTypes.object.isRequired,
    item: PropTypes.any,
    ingestProvider: PropTypes.any,
};
