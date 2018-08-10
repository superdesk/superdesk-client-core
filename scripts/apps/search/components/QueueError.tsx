import React from 'react';
import PropTypes from 'prop-types';

/**
 * @ngdoc React
 * @module superdesk.apps.search
 * @name QueueError
 * @param {Object} item published item having error state
 * @description Creates an icon for the published items that have been failed to enqueue.
 */
export class QueueError extends React.Component {
    render() {
        if (this.props.item.queue_state && this.props.item.queue_state === 'error') {
            return (
                <div className="icon-warning-sign queue-error" title={this.props.item.error_message} />
            );
        }

        return null;
    }
}

QueueError.propTypes = {
    item: PropTypes.object.isRequired,
};
