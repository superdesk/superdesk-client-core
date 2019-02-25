import React from 'react';
import PropTypes from 'prop-types';
import {TypeIcon} from './index';
import {gettext} from 'core/utils';

/**
 * @ngdoc React
 * @module superdesk.apps.search
 * @name associations
 * @param {Object} item story to be marked
 * @param {function} openAuthoringView Open the associated item in view mode.
 * @description Creates an icon for the associated item.
 */
export class Associations extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);

        this.openItem = this.openItem.bind(this);
    }

    /**
     * Opens the item in authoring in view mode.
     * @param event
     */
    openItem(event) {
        event.stopPropagation();
        this.props.openAuthoringView(this.props.item.associations.featuremedia._id);
    }

    render() {
        if (this.props.item.associations &&
            this.props.item.associations.featuremedia && this.props.item.associations.featuremedia._id) {
            return (
                <div className="type-icon associations"
                    onClick={this.openItem}
                    title={gettext('Associated ') + this.props.item.associations.featuremedia.type}
                >
                    <TypeIcon type={this.props.item.associations.featuremedia.type} />
                </div>
            );
        }

        return null;
    }
}

/*
 * item: item having associations
 * openAuthoringView: Opens the item in view mode
 */
Associations.propTypes = {
    item: PropTypes.any,
    openAuthoringView: PropTypes.func.isRequired,
};
