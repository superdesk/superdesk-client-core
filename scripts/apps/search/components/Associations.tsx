import React from 'react';
import {TypeIcon} from './index';
import {gettext} from 'core/utils';
import {IArticle} from 'superdesk-api';

interface IProps {
    item: IArticle;
    openAuthoringView?: (id: string) => void;
}

/**
 * @ngdoc React
 * @module superdesk.apps.search
 * @name associations
 * @param {Object} item story to be marked
 * @param {function} openAuthoringView Open the associated item in view mode.
 * @description Creates an icon for the associated item.
 */
export class Associations extends React.Component<IProps, any> {
    constructor(props) {
        super(props);

        this.openItem = this.openItem.bind(this);
    }

    /**
     * Opens the item in authoring in view mode.
     */
    openItem(event: React.MouseEvent) {
        event.stopPropagation();
        this.props.openAuthoringView(this.props.item.associations.featuremedia._id);
    }

    render() {
        if (this.props.item.associations?.featuremedia?._id) {
            return (
                <div
                    className="type-icon associations"
                    onClick={this.openItem}
                    title={gettext('Associated ') + this.props.item.associations.featuremedia.type}
                >
                    <TypeIcon
                        type={this.props.item.associations.featuremedia.type}
                        contentProfileId={this.props.item.profile}
                    />
                </div>
            );
        }

        return null;
    }
}
