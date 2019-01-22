import _, {get} from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {Item} from './index';
import {isCheckAllowed, closeActionsMenu, bindMarkItemShortcut} from '../helpers';
import {querySelectorParent} from 'core/helpers/dom/querySelectorParent';
import {gettext} from 'core/ui/components/utils';

/**
 * Item list component
 */
export class ItemList extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    closeActionsMenu: any;
    updateTimeout: any;
    selectedCom: any;

    constructor(props) {
        super(props);

        this.state = {
            itemsList: [],
            itemsById: {},
            selected: null,
            view: 'compact',
            narrow: false,
            bindedShortcuts: [],
        };

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
        this.multiSelectCurrentItem = this.multiSelectCurrentItem.bind(this);
        this.bindActionKeyShortcuts = this.bindActionKeyShortcuts.bind(this);
        this.unbindActionKeyShortcuts = this.unbindActionKeyShortcuts.bind(this);
    }

    multiSelect(items, selected, event?) {
        const {search, multi} = this.props.svc;
        const {scope} = this.props;

        const itemsById = angular.extend({}, this.state.itemsById);

        items.forEach((item) => {
            const itemId = search.generateTrackByIdentifier(item);

            itemsById[itemId] = angular.extend({}, item, {selected: selected});
            scope.$applyAsync(() => {
                multi.toggle(itemsById[itemId]);
            });
        });

        this.select(_.last(items), event);
        this.setState({itemsById: itemsById});
    }

    // Method to check the selectBox of the selected item
    multiSelectCurrentItem() {
        const selectedItem = this.getSelectedItem();

        if (selectedItem) {
            this.multiSelect([selectedItem], !selectedItem.selected);
        }
    }

    // Function to make narrowView active/inactive
    setNarrowView(setNarrow) {
        this.setState({narrow: setNarrow});
    }

    select(item, event) {
        if (typeof this.props.onMonitoringItemSelect === 'function') {
            this.props.onMonitoringItemSelect(item, event);
            return;
        }

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

        const showPreview = (event == null || event.target == null) ||
            querySelectorParent(event.target, '.sd-monitoring-item-multi-select-checkbox') == null;

        if (item && scope.preview) {
            if (showPreview) {
                scope.preview(item);
            }
            this.bindActionKeyShortcuts(item);
        }
    }

    /*
     * Unbind all item actions
     */
    unbindActionKeyShortcuts() {
        const {keyboardManager} = this.props.svc;

        this.state.bindedShortcuts.forEach((shortcut) => {
            keyboardManager.unbind(shortcut);
        });
        this.setState({bindedShortcuts: []});
    }

    /*
     * Bind item actions on keyboard shortcuts
     * Keyboard shortcuts are defined with actions
     *
     * @param {Object} item
     */
    bindActionKeyShortcuts(selectedItem) {
        const {superdesk, workflowService, activityService, keyboardManager, archiveService} = this.props.svc;

        // First unbind all binded shortcuts
        if (this.state.bindedShortcuts.length) {
            this.unbindActionKeyShortcuts();
        }

        const intent = {action: 'list', type: archiveService.getType(selectedItem)};

        superdesk.findActivities(intent, selectedItem).forEach((activity) => {
            if (activity.keyboardShortcut && workflowService.isActionAllowed(selectedItem, activity.action)) {
                this.state.bindedShortcuts.push(activity.keyboardShortcut);

                keyboardManager.bind(activity.keyboardShortcut, () => {
                    if (_.includes(['mark.item', 'mark.desk'], activity._id)) {
                        bindMarkItemShortcut(activity.label);
                    } else {
                        activityService.start(activity, {data: {item: selectedItem}});
                    }
                });
            }
        });
    }

    selectItem(item) {
        if (isCheckAllowed(item)) {
            const selected = !item.selected;

            this.multiSelect([item], selected);
        }
    }

    selectMultipleItems(lastItem) {
        const {search} = this.props.svc;
        const itemId = search.generateTrackByIdentifier(lastItem);
        let positionStart = 0;
        const positionEnd = _.indexOf(this.state.itemsList, itemId);
        const selectedItems = [];

        if (this.state.selected) {
            positionStart = _.indexOf(this.state.itemsList, this.state.selected);
        }

        const start = Math.min(positionStart, positionEnd);
        const end = Math.max(positionStart, positionEnd);

        for (let i = start; i <= end; i++) {
            const item = this.state.itemsById[this.state.itemsList[i]];

            if (isCheckAllowed(item)) {
                selectedItems.push(item);
            }
        }

        this.multiSelect(selectedItems, true);
    }

    dbClick(item) {
        if (typeof this.props.onMonitoringItemDoubleClick === 'function') {
            this.props.onMonitoringItemDoubleClick(item);
            return;
        }

        const {superdesk, $timeout, authoringWorkspace} = this.props.svc;
        const {scope} = this.props;

        const activities = superdesk.findActivities({action: 'list', type: item._type}, item);
        const canEdit = _.reduce(activities, (result, value) => result || value._id === 'edit.item', false);

        this.setSelectedItem(item);
        $timeout.cancel(this.updateTimeout);

        if (_.get(scope, 'flags.hideActions')) {
            return;
        }

        if (item._type === 'externalsource') {
            superdesk.intent('list', 'externalsource', {item: item}, 'fetch-externalsource')
                .then((archiveItem) => {
                    archiveItem.guid = archiveItem._id; // fix item guid to match new item _id
                    scope.$applyAsync(() => {
                        scope.edit ? scope.edit(archiveItem) : authoringWorkspace.open(archiveItem);
                    });
                });
        } else if (canEdit && scope.edit) {
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

        if (_.get(scope, 'flags.hideActions')) {
            return;
        }

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
        this.setState({selected: null});
        this.unbindActionKeyShortcuts();
    }

    updateAllItems(itemId, changes) {
        const itemsById = angular.extend({}, this.state.itemsById);

        _.forOwn(itemsById, (value, key) => {
            if (_.startsWith(key, itemId)) {
                itemsById[key] = angular.extend({}, value, changes);
            }
        });

        this.setState({itemsById: itemsById});
    }

    findItemByPrefix(prefix) {
        let item;

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

        if (monitoringState.state.activeGroup !== scope.$id) {
            // If selected item is from another group, deselect all
            $rootScope.$broadcast('item:unselect');
            monitoringState.setState({activeGroup: scope.$id});
        }

        this.setState({selected: item ? search.generateTrackByIdentifier(item) : null});
    }

    getSelectedItem() {
        const selected = this.state.selected;

        return this.state.itemsById[selected];
    }

    updateItem(itemId, changes) {
        const item = this.state.itemsById[itemId] || null;

        if (item) {
            const itemsById = angular.extend({}, this.state.itemsById);

            itemsById[itemId] = angular.extend({}, item, changes);
            this.setState({itemsById: itemsById});
        }
    }

    handleKey(event) {

        // don't do anything when modifier key is pressed
        // this allows shortcuts defined in activities to work without two actions firing for one shortcut
        if (event.ctrlKey || event.altKey || event.shiftKey) {
            return;
        }

        const {scope} = this.props;
        const {Keys, monitoringState} = this.props.svc;
        const KEY_CODES = Object.freeze({
            X: 'X'.charCodeAt(0),
        });

        let diff;

        const moveActiveGroup = () => {
            event.preventDefault();
            event.stopPropagation();
            this.deselectAll(); // deselect active item

            scope.$applyAsync(() => {
                monitoringState.moveActiveGroup(event.keyCode === Keys.pageup ? -1 : 1);
            });
        };

        const openItem = () => {
            if (this.state.selected) {
                this.edit(this.getSelectedItem());
            }

            event.stopPropagation();
        };

        const performMultiSelect = () => {
            event.preventDefault();
            event.stopPropagation();
            this.multiSelectCurrentItem();
        };

        switch (event.keyCode) {
        case Keys.right:
        case Keys.down:
            diff = 1;
            this.closeActionsMenu();
            break;

        case Keys.left:
        case Keys.up:
            diff = -1;
            this.closeActionsMenu();
            break;

        case Keys.enter:
            openItem();
            this.closeActionsMenu();
            break;

        case Keys.pageup:
        case Keys.pagedown:
            moveActiveGroup();
            this.closeActionsMenu();
            break;

        case KEY_CODES.X:
            performMultiSelect();
            this.closeActionsMenu();
            break;
        }

        const highlightSelected = (_event) => {
            for (let i = 0; i < this.state.itemsList.length; i++) {
                if (this.state.itemsList[i] === this.state.selected) {
                    const next = Math.min(this.state.itemsList.length - 1, Math.max(0, i + diff));

                    this.select(this.state.itemsById[this.state.itemsList[next]], _event);
                    return;
                }
            }
        };

        const checkRemaining = (_event) => {
            event.preventDefault();
            event.stopPropagation();

            if (this.state.selected) {
                highlightSelected(_event);
            } else {
                this.select(this.state.itemsById[this.state.itemsList[0]], _event);
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
            checkRemaining(event);
            scrollSelectedItemIfRequired(event, scope);
        }
    }

    componentWillUnmount() {
        this.unbindActionKeyShortcuts();
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
        const {storage} = this.props.svc;
        const {scope} = this.props;

        const createItem = function(itemId) {
            const item = this.state.itemsById[itemId];
            const task = item.task || {desk: null};

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
                markedDesksById: this.props.markedDesksById,
                profilesById: this.props.profilesById,
                setSelectedComponent: this.setSelectedComponent,
                versioncreator: this.modifiedUserName(item.version_creator),
                narrow: this.state.narrow,
                svc: this.props.svc,
                hideActions: scope.hideActionsForMonitoringItems || get(scope, 'flags.hideActions'),
                multiSelectDisabled: scope.disableMonitoringMultiSelect,
                scope: scope,
            });
        }.bind(this);
        const isEmpty = !this.state.itemsList.length;

        return React.createElement(
            'ul',
            {
                className: classNames(
                    this.state.view === 'photogrid' ?
                        'sd-grid-list sd-grid-list--no-margin' :
                        (this.state.view || 'compact') + '-view list-view',
                    {'list-without-items': isEmpty},
                ),
                onClick: this.closeActionsMenu,
            },
            isEmpty && !scope.loading ?
                React.createElement(
                    'li',
                    {onClick: this.closeActionsMenu},
                    gettext('There are currently no items'),
                ) : this.state.itemsList.map(createItem),
        );
    }
}

ItemList.propTypes = {
    svc: PropTypes.object.isRequired,
    scope: PropTypes.any.isRequired,
    profilesById: PropTypes.any,
    highlightsById: PropTypes.any,
    markedDesksById: PropTypes.any,
    desksById: PropTypes.any,
    ingestProvidersById: PropTypes.any,
    usersById: PropTypes.any,
    onMonitoringItemSelect: PropTypes.func,
    onMonitoringItemDoubleClick: PropTypes.func,
};
