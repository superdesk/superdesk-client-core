import _ from 'lodash';
import React from 'react';
import classNames from 'classnames';
import {Item} from './index';
import {isCheckAllowed, closeActionsMenu, bindMarkItemShortcut} from '../helpers';
import {querySelectorParent} from 'core/helpers/dom/querySelectorParent';
import {isMediaEditable} from 'core/config';
import {gettext, IScopeApply} from 'core/utils';
import {IArticle} from 'superdesk-api';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';
import {CHECKBOX_PARENT_CLASS} from './constants';
import ng from 'core/services/ng';

interface IProps {
    itemsList: Array<string>;
    itemsById: any;
    narrow: boolean;
    view: 'compact' | 'mgrid' | 'photogrid';
    selected: string;
    swimlane: any;
    profilesById: any;
    highlightsById: any;
    markedDesksById: any;
    desksById: any;
    ingestProvidersById: any;
    usersById: any;
    onMonitoringItemSelect: any;
    onMonitoringItemDoubleClick: any;
    disableMonitoringMultiSelect: boolean;
    singleLine: any;
    customRender: any;
    viewType: any;
    flags: {
        hideActions: any;
    };
    groupId: any;
    viewColumn: any;
    loading: any;
    scopeApply: IScopeApply;
    scopeApplyAsync: IScopeApply;
    edit(item: IArticle): void;
    preview(item: IArticle): void;
    hideActionsForMonitoringItems(): void;
    multiSelect(items: Array<IArticle>, selected: boolean): void;
    setSelectedItem(itemId: string): void;
}

interface IState {
    bindedShortcuts: Array<any>;
    actioning: {};
}

/**
 * Item list component
 */
export class ItemList extends React.Component<IProps, IState> {
    updateTimeout: any;
    selectedCom: any;
    angularservices: {
        $rootScope: any;
        $timeout: any;
        activityService: any;
        archiveService: any;
        authoringWorkspace: AuthoringWorkspaceService;
        keyboardManager: any;
        Keys: any;
        monitoringState: any;
        multi: any;
        search: any;
        storage: any;
        superdesk: any;
        workflowService: any;
    };

    focusableElement: HTMLUListElement | null;

    constructor(props) {
        super(props);

        this.state = {
            bindedShortcuts: [],
            actioning: {},
        };

        this.select = this.select.bind(this);
        this.selectItem = this.selectItem.bind(this);
        this.selectMultipleItems = this.selectMultipleItems.bind(this);
        this.dbClick = this.dbClick.bind(this);
        this.edit = this.edit.bind(this);
        this.deselectAll = this.deselectAll.bind(this);
        this.setSelectedItem = this.setSelectedItem.bind(this);
        this.getSelectedItem = this.getSelectedItem.bind(this);
        this.handleKey = this.handleKey.bind(this);
        this.setSelectedComponent = this.setSelectedComponent.bind(this);
        this.modifiedUserName = this.modifiedUserName.bind(this);
        this.multiSelectCurrentItem = this.multiSelectCurrentItem.bind(this);
        this.bindActionKeyShortcuts = this.bindActionKeyShortcuts.bind(this);
        this.unbindActionKeyShortcuts = this.unbindActionKeyShortcuts.bind(this);

        this.angularservices = {
            $rootScope: ng.get('$rootScope'),
            $timeout: ng.get('$timeout'),
            activityService: ng.get('activityService'),
            archiveService: ng.get('archiveService'),
            authoringWorkspace: ng.get('authoringWorkspace'),
            keyboardManager: ng.get('keyboardManager'),
            Keys: ng.get('Keys'),
            monitoringState: ng.get('monitoringState'),
            multi: ng.get('multi'),
            search: ng.get('search'),
            storage: ng.get('storage'),
            superdesk: ng.get('superdesk'),
            workflowService: ng.get('workflowService'),
        };
    }

    // Method to check the selectBox of the selected item
    multiSelectCurrentItem() {
        const selectedItem = this.getSelectedItem();

        if (selectedItem) {
            this.props.multiSelect([selectedItem], !selectedItem.selected);
        }
    }

    select(item, event) {
        if (typeof this.props.onMonitoringItemSelect === 'function') {
            this.props.onMonitoringItemSelect(item, event);
            return;
        }

        const {$timeout} = this.angularservices;

        if (event && event.shiftKey) {
            return this.selectMultipleItems(item);
        }

        this.setSelectedItem(item);

        if (event && event.ctrlKey) {
            return this.selectItem(item);
        }

        $timeout.cancel(this.updateTimeout);

        const showPreview = event == null || event.target == null ||
            (querySelectorParent(event.target, '.' + CHECKBOX_PARENT_CLASS) == null &&
            event.target.classList.contains(CHECKBOX_PARENT_CLASS) === false);

        if (item && this.props.preview != null) {
            this.props.scopeApply(() => {
                if (showPreview) {
                    this.props.preview(item);
                }
                this.bindActionKeyShortcuts(item);
            });
        }
    }

    /*
     * Unbind all item actions
     */
    unbindActionKeyShortcuts() {
        const {keyboardManager} = this.angularservices;

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
        const {
            activityService,
            archiveService,
            keyboardManager,
            superdesk,
            workflowService,
        } = this.angularservices;

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

            this.props.multiSelect([item], selected);
        }
    }

    selectMultipleItems(lastItem) {
        const {search} = this.angularservices;
        const itemId = search.generateTrackByIdentifier(lastItem);
        let positionStart = 0;
        const positionEnd = _.indexOf(this.props.itemsList, itemId);
        const selectedItems = [];

        if (this.props.selected) {
            positionStart = _.indexOf(this.props.itemsList, this.props.selected);
        }

        const start = Math.min(positionStart, positionEnd);
        const end = Math.max(positionStart, positionEnd);

        for (let i = start; i <= end; i++) {
            const item = this.props.itemsById[this.props.itemsList[i]];

            if (isCheckAllowed(item)) {
                selectedItems.push(item);
            }
        }

        this.props.multiSelect(selectedItems, true);
    }

    setActioning(item: IArticle, isActioning: boolean) {
        const {search} = this.angularservices;
        const actioning = Object.assign({}, this.state.actioning);
        const itemId = search.generateTrackByIdentifier(item);

        actioning[itemId] = isActioning;
        this.setState({actioning});
    }

    dbClick(item) {
        if (typeof this.props.onMonitoringItemDoubleClick === 'function') {
            this.props.onMonitoringItemDoubleClick(item);
            return;
        }

        const {superdesk, $timeout} = this.angularservices;
        const {authoringWorkspace} = this.angularservices;

        const activities = superdesk.findActivities({action: 'list', type: item._type}, item);
        const canEdit = _.reduce(activities, (result, value) => result || value._id === 'edit.item', false);

        this.setSelectedItem(item);
        $timeout.cancel(this.updateTimeout);

        if (this.props.flags?.hideActions) {
            return;
        }

        if (item._type === 'externalsource') {
            if (!isMediaEditable(item)) {
                return;
            }
            this.setActioning(item, true);
            superdesk.intent('list', 'externalsource', {item: item}, 'fetch-externalsource')
                .then((archiveItem) => {
                    archiveItem.guid = archiveItem._id; // fix item guid to match new item _id
                    this.props.scopeApplyAsync(() => {
                        if (this.props.edit != null) {
                            this.props.edit(archiveItem);
                        } else {
                            authoringWorkspace.open(archiveItem);
                        }
                    });
                })
                .finally(() => {
                    this.setActioning(item, false);
                });
        } else if (canEdit && this.props.edit != null) {
            this.props.scopeApply(() => {
                this.props.edit(item);
            });
        } else {
            this.props.scopeApply(() => {
                authoringWorkspace.open(item);
            });
        }
    }

    edit(item) {
        const {authoringWorkspace} = this.angularservices;
        const {$timeout} = this.angularservices;

        this.setSelectedItem(item);
        $timeout.cancel(this.updateTimeout);

        if (this.props.flags?.hideActions || item == null) {
            return;
        }

        if (this.props.edit != null) {
            this.props.scopeApply(() => {
                this.props.edit(item);
            });
        } else {
            this.props.scopeApply(() => {
                authoringWorkspace.open(item);
            });
        }
    }

    deselectAll() {
        this.props.setSelectedItem(null);
        this.unbindActionKeyShortcuts();
    }

    setSelectedItem(item: IArticle) {
        const {monitoringState, $rootScope, search} = this.angularservices;

        if (monitoringState.state.activeGroup !== this.props.groupId) {
            // If selected item is from another group, deselect all
            $rootScope.$broadcast('item:unselect');
            monitoringState.setState({activeGroup: this.props.groupId});
        }

        this.props.setSelectedItem(item ? search.generateTrackByIdentifier(item) : null);
    }

    getSelectedItem() {
        const selected = this.props.selected;

        return this.props.itemsById[selected];
    }

    handleKey(event) {
        // don't do anything when modifier key is pressed
        // this allows shortcuts defined in activities to work without two actions firing for one shortcut
        if (event.ctrlKey || event.altKey || event.shiftKey) {
            return;
        }

        const {Keys, monitoringState} = this.angularservices;
        const KEY_CODES = Object.freeze({
            X: 'X'.charCodeAt(0),
        });

        let diff;

        const moveActiveGroup = (_event) => {
            _event.preventDefault();
            _event.stopPropagation();
            this.deselectAll(); // deselect active item

            const keyCode = _event.keyCode;

            this.props.scopeApplyAsync(() => {
                monitoringState.moveActiveGroup(keyCode === Keys.pageup ? -1 : 1);
            });
        };

        const openItem = () => {
            if (this.props.selected) {
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
            closeActionsMenu();
            break;

        case Keys.left:
        case Keys.up:
            diff = -1;
            closeActionsMenu();
            break;

        case Keys.enter:
            openItem();
            closeActionsMenu();
            break;

        case Keys.pageup:
        case Keys.pagedown:
            moveActiveGroup(event);
            closeActionsMenu();
            break;

        case KEY_CODES.X:
            performMultiSelect();
            closeActionsMenu();
            break;
        }

        const highlightSelected = (_event) => {
            for (let i = 0; i < this.props.itemsList.length; i++) {
                if (this.props.itemsList[i] === this.props.selected) {
                    const next = Math.min(this.props.itemsList.length - 1, Math.max(0, i + diff));

                    this.select(this.props.itemsById[this.props.itemsList[next]], _event);
                    return;
                }
            }
        };

        const checkRemaining = (_event) => {
            event.preventDefault();
            event.stopPropagation();

            if (this.props.selected) {
                highlightSelected(_event);
            } else {
                this.select(this.props.itemsById[this.props.itemsList[0]], _event);
            }
        };

        // This function is to bring the selected item (by key press) into view if it is out of container boundary.
        const scrollSelectedItemIfRequired = (_event) => {
            const container = this.props.viewColumn ? $(document).find('.content-list') : $(_event.currentTarget);

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
            scrollSelectedItemIfRequired(event);
        }
    }

    componentWillUnmount() {
        this.unbindActionKeyShortcuts();
        closeActionsMenu();
    }

    setSelectedComponent(com) {
        this.selectedCom = com;
    }

    modifiedUserName(versionCreator) {
        return this.props.usersById[versionCreator] ?
            this.props.usersById[versionCreator].display_name : null;
    }

    focus() {
        this.focusableElement?.focus();
    }

    render() {
        const {storage} = this.angularservices;

        const isEmpty = !this.props.itemsList.length;
        const displayEmptyList = isEmpty && !this.props.loading;

        return (
            <ul
                className={classNames(
                    this.props.view === 'photogrid' ?
                        'sd-grid-list sd-grid-list--no-margin' :
                        (this.props.view || 'compact') + '-view list-view',
                    {'list-without-items': displayEmptyList},
                )}
                onClick={closeActionsMenu}
                onKeyDown={(event) => {
                    this.handleKey(event);
                }}
                tabIndex={0}
                ref={(el) => {
                    this.focusableElement = el;
                }}
            >
                {
                    displayEmptyList
                        ? (
                            <li onClick={closeActionsMenu}>
                                {gettext('There are currently no items')}
                            </li>
                        )
                        : this.props.itemsList.map((itemId) => {
                            const item = this.props.itemsById[itemId];
                            const task = item.task || {desk: null};

                            return (
                                <Item
                                    key={itemId}
                                    isNested={false}
                                    item={item}
                                    view={this.props.view}
                                    swimlane={this.props.swimlane || storage.getItem('displaySwimlane')}
                                    flags={{selected: this.props.selected === itemId}}
                                    onEdit={this.edit}
                                    onDbClick={this.dbClick}
                                    onSelect={this.select}
                                    onMultiSelect={this.props.multiSelect}
                                    ingestProvider={this.props.ingestProvidersById[item.ingest_provider] || null}
                                    desk={this.props.desksById[task.desk] || null}
                                    highlightsById={this.props.highlightsById}
                                    markedDesksById={this.props.markedDesksById}
                                    profilesById={this.props.profilesById}
                                    versioncreator={this.modifiedUserName(item.version_creator)}
                                    narrow={this.props.narrow}
                                    hideActions={
                                        this.props.hideActionsForMonitoringItems || this.props.flags?.hideActions
                                    }
                                    multiSelectDisabled={this.props.disableMonitoringMultiSelect}
                                    actioning={!!this.state.actioning[itemId]}
                                    singleLine={this.props.singleLine}
                                    customRender={this.props.customRender}
                                    viewType={this.props.viewType}
                                    scopeApply={this.props.scopeApply}
                                />
                            );
                        })
                }
            </ul>
        );
    }
}
