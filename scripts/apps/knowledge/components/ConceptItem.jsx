import React from 'react';
import classNames from 'classnames';

import {
    ListItem,
    RoleLabel
} from 'apps/knowledge/components';

/**
 * Concept Item component
 */
export class ConceptItem extends React.Component {
    render() {
        var item = this.props.item,
            contents = [
                'div',
                {
                    className: classNames(
                        'media-box'
                    )

                }
            ];

        if (this.props.listView === 'mgrid') {
            contents.push(
                React.createElement('p', {}, item.first_name)
            );
        } else {
            contents.push(
                React.createElement('span', {className: 'state-border'}),
                React.createElement(ListItem, {
                    item: item,
                    svc: this.props.svc
                }),
                React.createElement(RoleLabel, {
                    item: item,
                    svc: this.props.svc
                })
            );
        }

        return React.createElement(
            'li', {
                id: item._id,
                key: item._id,
                className: classNames(
                    'sd-list-item'
                ),
            },
            React.createElement.apply(null, contents)
        );
    }
}

ConceptItem.propTypes = {
    svc: React.PropTypes.any.isRequired,
    listView: React.PropTypes.any,
    item: React.PropTypes.any
};
