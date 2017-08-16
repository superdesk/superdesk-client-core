import React from 'react';
import {ConceptItem} from 'apps/knowledge/components';

/**
 * Concept Item list component
 */
export class ConceptItemList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {itemsList: [], listView: 'mgrid'};
    }

    render() {
        const {gettextCatalog} = this.props.svc;
        const {scope} = this.props;

        var createItem = function createItem(item) {
            return React.createElement(ConceptItem, {
                key: item._id,
                item: item,
                scope: scope
            });
        };

        var isEmpty = !this.state.itemsList.length;

        return React.createElement('ul', {className: 'list-view'},
            isEmpty ? React.createElement('li', {}, gettextCatalog.getString('There are currently no items'))
                : this.state.itemsList.map(createItem));
    }
}

ConceptItemList.propTypes = {
    svc: React.PropTypes.any.isRequired,
    scope: React.PropTypes.any.isRequired
};
