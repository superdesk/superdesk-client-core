import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {Item} from 'apps/contacts/components';

/**
 * Contact Item list component
 */
export class ItemList extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    updateTimeout: any;

    constructor(props) {
        super(props);

        this.state = {itemsList: [], itemsById: {}, selected: null, view: 'photogrid'};

        this.select = this.select.bind(this);
        this.setSelectedItem = this.setSelectedItem.bind(this);
        this.getSelectedItem = this.getSelectedItem.bind(this);
        this.handleKey = this.handleKey.bind(this);
    }

    select(item, event?) {
        const {$timeout} = this.props.svc;
        const {scope} = this.props;

        this.setSelectedItem(item);

        $timeout.cancel(this.updateTimeout);
        this.updateTimeout = $timeout(() => {
            if (item && scope.preview) {
                scope.$apply(() => {
                    scope.preview(item);
                });
            }
        }, 500, false);
    }

    setSelectedItem(item) {
        this.setState({selected: item ? item._id : null});
    }

    getSelectedItem() {
        var selected = this.state.selected;

        return this.state.itemsById[selected];
    }

    handleKey(event) {
        const {scope} = this.props;
        const {Keys} = this.props.svc;

        var diff;

        switch (event.keyCode) {
        case Keys.right:
        case Keys.down:
            diff = 1;
            break;

        case Keys.left:
        case Keys.up:
            diff = -1;
            break;
        }

        var highlightSelected = () => {
            for (var i = 0; i < this.state.itemsList.length; i++) {
                if (this.state.itemsList[i] === this.state.selected) {
                    var next = Math.min(this.state.itemsList.length - 1, Math.max(0, i + diff));

                    this.select(this.state.itemsById[this.state.itemsList[next]]);
                    return;
                }
            }
        };

        const checkRemaining = () => {
            event.preventDefault();
            event.stopPropagation();

            if (this.state.selected) {
                highlightSelected();
            } else {
                this.select(this.state.itemsById[this.state.itemsList[0]]);
            }
        };

        // This function is to bring the selected item (by key press) into view if it is out of container boundary.
        var scrollSelectedItemIfRequired = (event, scope) => {
            let container = scope.viewColumn ? $(document).find('.content-list') : $(event.currentTarget);

            let selectedItemElem = $(event.currentTarget.firstChild).children('.list-item-view.active');

            if (selectedItemElem.length > 0) {
                // The following line translated to: top_Of_Selected_Item (minus) top_Of_Scrollable_Div

                let distanceOfSelItemFromVisibleTop = $(selectedItemElem[0]).offset().top - $(document).scrollTop() -
                $(container[0]).offset().top - $(document).scrollTop();

                // If the selected item goes beyond container view, scroll it to middle.
                if (distanceOfSelItemFromVisibleTop >= container[0].clientHeight ||
                    distanceOfSelItemFromVisibleTop < 0) {
                    container.scrollTop(container.scrollTop() + distanceOfSelItemFromVisibleTop -
                    container[0].offsetHeight * 0.5);
                }
            }
        };

        if (!_.isNil(diff)) {
            checkRemaining();
            scrollSelectedItemIfRequired(event, scope);
        }
    }

    render() {
        const {gettextCatalog} = this.props.svc;
        const {scope, svc} = this.props;

        var createItem = function createItem(itemId) {
            var item = this.state.itemsById[itemId];

            var flags = {selected: this.state.selected === itemId};

            return (
                <Item key={itemId}
                    item={item}
                    view={this.state.view}
                    flags={flags}
                    onSelect={this.select}
                    svc={svc}
                    scope={scope}/>
            );
        }.bind(this);
        var isEmpty = !this.state.itemsList.length;

        var cssClass = classNames(
            this.state.view === 'photogrid' ?
                'sd-grid-list sd-grid-list--large sd-grid-list--small-margin' :
                (this.state.view || 'compact') + '-view list-view',
            {'list-without-items': isEmpty}
        );

        var listItems = isEmpty && !scope.loading ?
            <span key="no-items">{gettextCatalog.getString('There are currently no items')}</span>
            : this.state.itemsList.map(createItem);

        return (
            <ul className={cssClass}>
                {listItems}
            </ul>
        );
    }
}

ItemList.propTypes = {
    svc: PropTypes.object.isRequired,
    scope: PropTypes.any.isRequired,
};
