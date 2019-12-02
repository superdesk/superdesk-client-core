import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {Item} from 'apps/contacts/components';
import {gettext} from 'core/utils';

import {IContact} from '../Contacts';

interface IProps {
    svc: {
        $timeout: any;
        Keys: {
            right: any;
            down: any;
            left: any;
            up: any;
        };
    };
    scope: {
        preview(item: IContact): void;
        $apply: any;
        viewColumn: boolean;
        loading: boolean;
    };
}

interface IState {
    itemsList: Array<any>;
    itemsById: {[key: string]: IContact};
    selected: string;
    view: string;
}

export class ItemList extends React.Component<IProps, IState> {
    static propTypes: any;
    static defaultProps: any;

    updateTimeout: any;

    constructor(props) {
        super(props);

        this.state = {
            itemsList: [],
            itemsById: {},
            selected: null,
            view: 'photogrid',
        };

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
        }, 0, false);
    }

    setSelectedItem(item) {
        this.setState({selected: item ? item._id : null});
    }

    getSelectedItem() {
        const selected = this.state.selected;

        return this.state.itemsById[selected];
    }

    handleKey(event) {
        const {scope} = this.props;
        const {Keys} = this.props.svc;

        let diff;

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

        const highlightSelected = () => {
            for (let i = 0; i < this.state.itemsList.length; i++) {
                if (this.state.itemsList[i] === this.state.selected) {
                    const next = Math.min(this.state.itemsList.length - 1, Math.max(0, i + diff));

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
        const scrollSelectedItemIfRequired = (_event, _scope) => {
            const container = _scope.viewColumn ? $(document).find('.content-list') : $(_event.currentTarget);

            const selectedItemElem = $(_event.currentTarget.firstChild).children('.list-item-view.active');

            if (selectedItemElem.length > 0) {
                // The following line translated to: top_Of_Selected_Item (minus) top_Of_Scrollable_Div

                const distanceOfSelItemFromVisibleTop = $(selectedItemElem[0]).offset().top - $(document).scrollTop() -
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
        const {scope, svc} = this.props;

        const _createItem = function createItem(itemId) {
            const item = this.state.itemsById[itemId];

            const flags = {selected: this.state.selected === itemId};

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
        const isEmpty = !this.state.itemsList.length;

        const cssClass = classNames(
            this.state.view === 'photogrid' ?
                'sd-grid-list sd-grid-list--large sd-grid-list--small-margin' :
                (this.state.view || 'compact') + '-view list-view',
            {'list-without-items': isEmpty},
        );

        const listItems = isEmpty && !scope.loading ?
            <span key="no-items">{gettext('There are currently no items')}</span>
            : this.state.itemsList.map(_createItem);

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
