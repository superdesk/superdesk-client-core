import React from 'react';
import PropTypes from 'prop-types';
import {WidgetItem} from './index';


/**
 * @ngdoc React
 * @module superdesk.search
 * @name WidgetItemComponent
 * @param {Boolean} allowed The edit of item in the list is allowed.
 * @param {Boolean} customMonitoringWidget The custom flag from config file
 * @param {Object} svc The superdesk services
 * @param {Function} preview The callback function on item preview
 * @param {Function} select The callback function on item selection
 * @param {Function} edit The callback function on item edit
 * @param {Function} updateCallback The callback function for component state update
 * @description This component is the list of items from a monitoring widget group.
 */
export class WidgetItemList extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    
    
 
    
    

    constructor(props) {
        super(props);
        this.state = {itemIds: [], itemsById: {}, loading: true, selected: null};
        this.updateState = this.updateState.bind(this);

        props.updateCallback(this.updateState);
    }

    updateState(updates) {
        this.setState(updates);
    }

    render() {
        if (this.state.loading) {
            return (
                <div className="item-group__loading"/>
            );
        }

        if (!this.state.itemIds.length) {
            return (
                <div className="item-group__no-items">
                    {this.props.svc.gettextCatalog.getString('No items in this stage')}
                </div>
            );
        }

        return (
            <div tabIndex={0}>
                <ul className="inline-content-items">
                    {
                        this.state.itemIds.map((itemId) => {
                            var item = this.state.itemsById[itemId];

                            return (
                                <WidgetItem
                                    key={this.props.svc.search.generateTrackByIdentifier(item)}
                                    item={item}
                                    selected={this.state.selected && this.state.selected._id === item._id}
                                    allowed ={this.props.allowed}
                                    customMonitoringWidget={this.props.customMonitoringWidget}
                                    svc={this.props.svc}
                                    preview={this.props.preview}
                                    select={this.props.select}
                                    edit={this.props.edit}
                                />
                            );
                        })
                    }
                </ul>
            </div>
        );
    }
}

WidgetItemList.propTypes = {
    allowed: PropTypes.bool,
    customMonitoringWidget: PropTypes.bool,
    svc: PropTypes.object.isRequired,
    preview: PropTypes.func.isRequired,
    select: PropTypes.func.isRequired,
    edit: PropTypes.func.isRequired,
    updateCallback: PropTypes.func.isRequired,
};
