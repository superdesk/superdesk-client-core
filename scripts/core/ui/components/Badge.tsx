import React from 'react';
import classNames from 'classnames';
import {IPropsBadge} from 'superdesk-api';
import {assertNever} from 'core/helpers/typescript-helpers';
import {getSpacingProps} from 'core/helpers/utils';

function getClassNameForBadgeStyle(type: IPropsBadge['type']) {
    switch (type) {
    case 'primary':
        return 'badge--primary';
    case 'success':
        return 'badge--success';
    case 'warning':
        return 'badge--warning';
    case 'alert':
        return 'badge--alert';
    case 'highlight':
        return 'badge--highlight';
    case 'light':
        return 'badge--light';
    default:
        assertNever(type);
    }
}

export class Badge extends React.PureComponent<IPropsBadge> {
    render() {
        return (
            <span
                className={classNames(
                    'badge',
                    getClassNameForBadgeStyle(this.props.type),
                    {'badge--square': this.props.square === true},
                )}
                style={getSpacingProps(this.props)}
            >
                {this.props.children}
            </span>
        );
    }
}
