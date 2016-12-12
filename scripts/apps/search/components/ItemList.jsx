import React from 'react';
import classNames from 'classnames';
import {Item} from 'apps/search/components';
import {isCheckAllowed, closeActionsMenu} from 'apps/search/helpers';

/**
 * Item list component
 */
export class ItemList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {itemsList: [], itemsById: {}, selected: null, view: 'mgrid', narrow: false};

        this.multiSelect = this.multiSelect.bind(this);
        this.select = this.select.bind(this);
        this.selectItem = this.selectItem.bind(this);
        this.selectMultipleItems = this.selectMultipleItems.bind(this);
        this.dbClick = this.dbClick.bind(this);
        this.edit = this.edit.bind(this);
        this.deselectAll = this.deselectAll.bind(this);
        this.updateAllItems = this.updateAllItems.bind(this);
        this.findItemByPrefix = this.findItemByPrefix.bind(this);
        this.setSelectedItem = this.setSelectedItem.bind(this);
        this.getSelectedItem = this.getSelectedItem.bind(this);
        this.updateItem = this.updateItem.bind(this);
        this.handleKey = this.handleKey.bind(this);
        this.closeActionsMenu = closeActionsMenu.bind(this);
        this.setSelectedComponent = this.setSelectedComponent.bind(this);
        this.modifiedUserName = this.modifiedUserName.bind(this);
        this.setNarrowView = this.setNarrowView.bind(this);
    }

    multiSelect(items, selected) {
        const {search, multi} = this.props.svc;
        const {scope} = this.props;

        var itemsById = angular.extend({}, this.state.itemsById);

        items.forEach((item) => {
            var itemId = search.generateTrackByIdentifier(item);

            itemsById[itemId] = angular.extend({}, item, {selected: selected});
            scope.$applyAsync(() => {
                multi.toggle(itemsById[itemId]);
            });
        });

        this.setState({itemsById: itemsById});
    }

    // Function to make narrowView active: when both preview and authoring panes are open.
    setNarrowView() {
        const {superdeskFlags} = this.props.svc;

        if (superdeskFlags.flags.authoring) {
            this.setState({narrow: true});
        }
    }

    select(item, event) {
        const {$timeout} = this.props.svc;
        const {scope} = this.props;

        if (event && event.shiftKey) {
            return this.selectMultipleItems(item);
        }

        this.setSelectedItem(item);

        if (event && event.ctrlKey) {
            return this.selectItem(item);
        }

        $timeout.cancel(this.updateTimeout);
        this.updateTimeout = $timeout(() => {
            if (item && scope.preview) {
                scope.$apply(() => {
                    scope.preview(item);
                });
            }
        }, 500, false);
    }

    selectItem(item) {
        if (isCheckAllowed(item)) {
            var selected = !item.selected;

            this.multiSelect([item], selected);
        }
    }

    selectMultipleItems(lastItem) {
        const {search, multi} = this.props.svc;

        var itemId = search.generateTrackByIdentifier(lastItem),
            positionStart = 0,
            positionEnd = _.indexOf(this.state.itemsList, itemId),
            selectedItems = [];

        if (this.state.selected) {
            positionStart = _.indexOf(this.state.itemsList, this.state.selected);
        }

        for (var i = positionStart; i <= positionEnd; i++) {
            var item = this.state.itemsById[this.state.itemsList[i]];

            if (isCheckAllowed(item)) {
                selectedItems.push(item);
            }
        }

        multi.reset();
        this.multiSelect(selectedItems, true);
    }

    dbClick(item) {
        const {superdesk, $timeout, authoringWorkspace} = this.props.svc;
        const {scope} = this.props;

        var activities = superdesk.findActivities({action: 'list', type: 'archive'}, item);
        var canEdit = _.reduce(activities, (result, value) => result || value._id === 'edit.item', false);

        this.setSelectedItem(item);
        $timeout.cancel(this.updateTimeout);

        if (canEdit && scope.edit) {
            scope.$apply(() => {
                scope.edit(item);
            });
        } else {
            scope.$apply(() => {
                authoringWorkspace.open(item);
            });
        }
    }

    edit(item) {
        const {$timeout, authoringWorkspace} = this.props.svc;
        const {scope} = this.props;

        this.setSelectedItem(item);
        $timeout.cancel(this.updateTimeout);
        if (item && scope.edit) {
            scope.$apply(() => {
                scope.edit(item);
            });
        } else if (item) {
            scope.$apply(() => {
                authoringWorkspace.open(item);
            });
        }
    }

    deselectAll() {
        this.setState({selected: null, narrow: false});
    }

    updateAllItems(itemId, changes) {
        var itemsById = angular.extend({}, this.state.itemsById);

        _.forOwn(itemsById, (value, key) => {
            if (_.startsWith(key, itemId)) {
                itemsById[key] = angular.extend({}, value, changes);
            }
        });

        this.setState({itemsById: itemsById});
    }

    findItemByPrefix(prefix) {
        var item;

        _.forOwn(this.state.itemsById, (val, key) => {
            if (_.startsWith(key, prefix)) {
                item = val;
            }
        });

        return item;
    }

    setSelectedItem(item) {
        const {monitoringState, $rootScope, search} = this.props.svc;
        const {scope} = this.props;

        if (monitoringState.selectedGroup !== scope.$id) {
            // If selected item is from another group, deselect all
            $rootScope.$broadcast('item:unselect');
            monitoringState.selectedGroup = scope.$id;
        }

        this.setState({selected: item ? search.generateTrackByIdentifier(item) : null});
    }

    getSelectedItem() {
        var selected = this.state.selected;

        return this.state.itemsById[selected];
    }

    updateItem(itemId, changes) {
        var item = this.state.itemsById[itemId] || null;

        if (item) {
            var itemsById = angular.extend({}, this.state.itemsById);

            itemsById[itemId] = angular.extend({}, item, changes);
            this.setState({itemsById: itemsById});
        }
    }

    handleKey(event) {
        const {scope} = this.props;
        const {Keys, monitoringState} = this.props.svc;

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

        case Keys.enter:
            if (this.state.selected) {
                this.edit(this.getSelectedItem());
            }

            event.stopPropagation();
            return;

        case Keys.pageup:
        case Keys.pagedown:
            event.preventDefault();
            event.stopPropagation();
            this.select(); // deselect active item
            scope.$applyAsync(() => {
                monitoringState.moveActiveGroup(event.keyCode === Keys.pageup ? -1 : 1);
            });
            return;
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
            if (!_.isNil(diff)) {
                event.preventDefault();
                event.stopPropagation();

                if (this.state.selected) {
                    highlightSelected();
                } else {
                    this.select(this.state.itemsById[this.state.itemsList[0]]);
                }
            }
        };

        checkRemaining();
    }

    componentWillUnmount() {
        this.closeActionsMenu();
    }

    componentWillUpdate() {
        this.closeActionsMenu();
    }

    setSelectedComponent(com) {
        this.selectedCom = com;
    }

    modifiedUserName(versionCreator) {
        return this.props.usersById[versionCreator] ?
            this.props.usersById[versionCreator].display_name : null;
    }

    render() {
        const {storage, gettextCatalog} = this.props.svc;
        const {scope} = this.props;

        var createItem = function createItem(itemId) {
            var item = this.state.itemsById[itemId];
            var task = item.task || {desk: null};

            return React.createElement(Item, {
                key: itemId,
                item: item,
                view: this.state.view,
                swimlane: this.state.swimlane || storage.getItem('displaySwimlane'),
                flags: {selected: this.state.selected === itemId},
                onEdit: this.edit,
                onDbClick: this.dbClick,
                onSelect: this.select,
                onMultiSelect: this.multiSelect,
                ingestProvider: this.props.ingestProvidersById[item.ingest_provider] || null,
                desk: this.props.desksById[task.desk] || null,
                highlightsById: this.props.highlightsById,
                profilesById: this.props.profilesById,
                setSelectedComponent: this.setSelectedComponent,
                versioncreator: this.modifiedUserName(item.version_creator),
                narrow: this.state.narrow,
                svc: this.props.svc,
                scope: scope
            });
        }.bind(this);
        var isEmpty = !this.state.itemsList.length;

        return React.createElement(
            'ul',
            {
                className: classNames(
                    'list-view',
                    this.state.view + '-view',
                    {'list-without-items': isEmpty}
                ),
                onClick: this.closeActionsMenu
            },
            isEmpty && !scope.loading ?
                React.createElement(
                    'li',
                    {onClick: this.closeActionsMenu},
                    gettextCatalog.getString('There are currently no items')
                ) : this.state.itemsList.map(createItem)
        );
    }
}

ItemList.propTypes = {
    svc: React.PropTypes.object.isRequired,
    scope: React.PropTypes.any.isRequired,
    profilesById: React.PropTypes.any,
    highlightsById: React.PropTypes.any,
    desksById: React.PropTypes.any,
    ingestProvidersById: React.PropTypes.any,
    usersById: React.PropTypes.any,
};
