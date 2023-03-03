// External Modules
import * as React from 'react';
import {Dispatch} from 'redux';
import {connect} from 'react-redux';

// Types
import {
    ASSET_ACTIONS,
    ASSET_LIST_STYLE,
    ASSET_SORT_FIELD,
    IAssetItem,
    IAssetSearchParams,
    ISetItem,
    LIST_ACTION,
    SET_STATE,
    SORT_ORDER,
} from '../interfaces';
import {samsApi, superdeskApi} from '../apis';
import {IApplicationState} from '../store';

// Redux Actions & Selectors
import {isFilterPanelOpen} from '../store/workspace/selectors';
import {
    getAssetListStyle,
    getAssetListTotal,
    getAssetSearchParams,
    getAssetSetFilter,
    getSelectedAssetIds,
    getSelectedAssetItems,
} from '../store/assets/selectors';
import {getActiveSets, getDisabledSets, getAvailableSetsForDesk} from '../store/sets/selectors';
import {toggleFilterPanelState} from '../store/workspace/actions';
import {
    closeMultiActionBar,
    deleteAssets,
    toggleAssetListStyle,
    updateAssetSearchParamsAndListItems,
} from '../store/assets/actions';

// UI
import {
    Badge,
    Button,
    ButtonGroup,
    Dropdown,
    IconButton,
    NavButton,
    SubNav,
    Tooltip,
} from 'superdesk-ui-framework/react';
import {IMenuGroup} from 'superdesk-ui-framework/react/components/Dropdown';
import {ContentBar, SearchBar, SubNavSpacer} from '../ui';
import {showManageSetsModal} from './sets/manageSetsModal';
import {AssetTypeFilterButtons} from './assets/assetTypeFilterButtons';

// Utils
import {getAssetListSortFieldText} from '../utils/ui';
import {getBulkActions} from '../utils/assets';

interface IProps {
    filterPanelOpen: boolean;
    totalAssets: number;
    listStyle: ASSET_LIST_STYLE;
    searchParams: IAssetSearchParams;
    availableSetIds: Array<ISetItem['_id']>;
    activeSets: Array<ISetItem>;
    disabledSets: Array<ISetItem>;
    currentSet?: ISetItem;
    selectedAssetIds: Array<string> | [];
    selectedAssets: Array<IAssetItem>;
    toggleFilterPanel(): void;
    toggleListStyle(): void;
    closeMultiActionBar(): void;
    updateAssetSearchParamsAndListItems(
        params: Partial<IAssetSearchParams>,
        listAction: LIST_ACTION,
    ): void;
    deleteMultipleAssets(): void;
}

const mapStateToProps = (state: IApplicationState) => ({
    filterPanelOpen: isFilterPanelOpen(state),
    totalAssets: getAssetListTotal(state),
    listStyle: getAssetListStyle(state),
    searchParams: getAssetSearchParams(state),
    activeSets: getActiveSets(state),
    disabledSets: getDisabledSets(state),
    currentSet: getAssetSetFilter(state),
    selectedAssetIds: getSelectedAssetIds(state),
    selectedAssets: getSelectedAssetItems(state),
    availableSetIds: getAvailableSetsForDesk(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    toggleFilterPanel: () => {
        dispatch<any>(toggleFilterPanelState());
    },
    toggleListStyle: () => {
        dispatch<any>(toggleAssetListStyle());
    },
    updateAssetSearchParamsAndListItems: (params: Partial<IAssetSearchParams>, listAction: LIST_ACTION) => {
        dispatch<any>(
            updateAssetSearchParamsAndListItems(
                params,
                listAction,
            ),
        );
    },
    closeMultiActionBar: () => dispatch(closeMultiActionBar()),
    deleteMultipleAssets: () => dispatch<any>(deleteAssets()),
});

export function downloadCompressedBinary(asset_ids: Array<string>): void {
    samsApi.assets.getCompressedBinary(asset_ids);
}

export class WorkspaceSubnavComponent extends React.PureComponent<IProps> {
    subNavMenuActions: Array<IMenuGroup>;
    sortFieldOptions: Array<IMenuGroup>;

    constructor(props: IProps) {
        super(props);

        this.subNavMenuActions = this.getSubNavMenuActions();
        this.sortFieldOptions = this.getSortFieldOptions();

        this.toggleSortOrder = this.toggleSortOrder.bind(this);
        this.setSearchParamText = this.setSearchParamText.bind(this);
        this.onDownloadMultipleAssetsCompressedBinary = this.onDownloadMultipleAssetsCompressedBinary.bind(this);
        this.onCloseMultiActionBar = this.onCloseMultiActionBar.bind(this);
        this.onDeleteMultipleAssets = this.onDeleteMultipleAssets.bind(this);
    }

    getSubNavMenuActions(): Array<IMenuGroup> {
        const {gettext} = superdeskApi.localization;
        const actions: Array<any> = [];

        if (superdeskApi.privileges.hasPrivilege('sams_manage')) {
            actions.push({
                label: gettext('Manage Sets'),
                icon: 'folder-open',
                onSelect: showManageSetsModal,
            });
        }

        return actions.length === 0 ?
            [] :
            [{
                type: 'group',
                label: gettext('Actions'),
                items: [
                    'divider',
                    ...actions,
                ],
            }];
    }

    getSortFieldOptions(): Array<IMenuGroup> {
        const {gettext} = superdeskApi.localization;

        return [{
            type: 'group',
            label: gettext('Sort By'),
            items: [{
                label: gettext('Name'),
                onSelect: () => this.setSortField(ASSET_SORT_FIELD.NAME),
            }, {
                label: gettext('Filename'),
                onSelect: () => this.setSortField(ASSET_SORT_FIELD.FILENAME),
            }, {
                label: gettext('Created'),
                onSelect: () => this.setSortField(ASSET_SORT_FIELD.CREATED),
            }, {
                label: gettext('Updated'),
                onSelect: () => this.setSortField(ASSET_SORT_FIELD.UPDATED),
            }, {
                label: gettext('Size'),
                onSelect: () => this.setSortField(ASSET_SORT_FIELD.SIZE),
            }],
        }];
    }

    getMenuItems(): Array<IMenuGroup> {
        const {gettext} = superdeskApi.localization;
        const filterActiveSets = (set: ISetItem) => (
            this.props.availableSetIds.includes(set._id)
        );

        const activeSets = this.props.activeSets
            .filter(filterActiveSets)
            .map((set) => ({
                label: set.name,
                onSelect: () => this.setSearchParamSetId(set._id),
            }));

        const disabledSets = this.props.disabledSets
            .filter(filterActiveSets)
            .map((set) => ({
                label: set.name + ' ' + gettext('(disabled)'),
                icon: 'lock',
                onSelect: () => this.setSearchParamSetId(set._id),
            }));

        return [{
            type: 'group',
            label: gettext('Sets'),
            items: [
                'divider',
                {
                    label: gettext('All Sets'),
                    onSelect: () => this.setSearchParamSetId(),
                },
                ...activeSets,
                ...disabledSets,
            ],
        }];
    }

    toggleSortOrder() {
        const sortOrder = this.props.searchParams.sortOrder === SORT_ORDER.ASCENDING ?
            SORT_ORDER.DESCENDING :
            SORT_ORDER.ASCENDING;

        this.props.updateAssetSearchParamsAndListItems(
            {sortOrder: sortOrder},
            LIST_ACTION.REPLACE,
        );
    }

    setSortField(field: ASSET_SORT_FIELD) {
        this.props.updateAssetSearchParamsAndListItems(
            {sortField: field},
            LIST_ACTION.REPLACE,
        );
    }

    setSearchParamSetId(setId?: string) {
        this.props.updateAssetSearchParamsAndListItems(
            {setId: setId},
            LIST_ACTION.REPLACE,
        );
    }

    setSearchParamText(searchText?: string) {
        this.props.updateAssetSearchParamsAndListItems(
            {textSearch: searchText},
            LIST_ACTION.REPLACE,
        );
    }

    onDownloadMultipleAssetsCompressedBinary(): void {
        downloadCompressedBinary(this.props.selectedAssetIds);
    }

    onDeleteMultipleAssets(): void {
        this.props.deleteMultipleAssets();
    }

    onCloseMultiActionBar() {
        this.props.closeMultiActionBar();
    }

    render() {
        const {gettext, gettextPlural} = superdeskApi.localization;
        const {numberToString} = superdeskApi.helpers;

        const items = this.getMenuItems();
        const buttonLabel = this.props.currentSet?.name ?? gettext('All Sets');
        const buttonIcon = this.props.currentSet?.state === SET_STATE.DISABLED ? 'lock' : undefined;
        const sortFieldText = getAssetListSortFieldText(this.props.searchParams.sortField);

        return (
            <React.Fragment>
                {(this.props.selectedAssetIds?.length !== 0) ? (
                    <SubNav zIndex={2}>
                        <div className="multi-action-bar">
                            <button className="toggle" onClick={this.props.closeMultiActionBar}>
                                <i className="icon-chevron-up-thin" />
                            </button>
                            <button
                                className="btn"
                                onClick={this.props.closeMultiActionBar}
                            >
                                {gettext('cancel')}
                            </button>
                            <span id="multi-select-count">
                                {gettextPlural(
                                    this.props.selectedAssetIds?.length,
                                    '{{count}} item selected',
                                    '{{count}} items selected',
                                    {count: this.props.selectedAssetIds?.length},
                                )}
                            </span>
                            <div className="pull-right">
                                {getBulkActions(this.props.selectedAssets, [{
                                    action: ASSET_ACTIONS.DELETE,
                                    onSelect: this.onDeleteMultipleAssets,
                                }, {
                                    action: ASSET_ACTIONS.DOWNLOAD,
                                    onSelect: this.onDownloadMultipleAssetsCompressedBinary,
                                }]).map((action) => (
                                    <Tooltip
                                        key={action.id}
                                        text={action.label}
                                        flow="down"
                                    >
                                        <NavButton
                                            icon={action.icon}
                                            text={action.label}
                                            onClick={action.onSelect}
                                        />
                                    </Tooltip>
                                ))}
                            </div>
                        </div>
                    </SubNav>
                ) : (
                    <SubNav zIndex={2}>
                        <ButtonGroup align="inline">
                            <Dropdown items={items}>
                                <button
                                    className="sd-navbtn sd-navbtn--textual"
                                    data-sd-tooltip={gettext('Change Set filter')}
                                    data-flow="right"
                                >
                                    {!buttonIcon ? null : (
                                        <i className={`icon-${buttonIcon}`} />
                                    )}
                                    <span className="sd-navbtn__text">
                                        {buttonLabel}
                                    </span>
                                </button>
                            </Dropdown>
                        </ButtonGroup>
                        <SearchBar
                            placeholder={gettext('Search Assets')}
                            type="expanded"
                            focused={true}
                            onSubmit={this.setSearchParamText}
                            initialValue={this.props.searchParams.textSearch}
                        />
                        <ButtonGroup align="end">
                            {this.subNavMenuActions.length === 0 ?
                                null :
                                (
                                    <Dropdown items={this.subNavMenuActions}>
                                        <button
                                            className="sd-navbtn"
                                            data-sd-tooltip={gettext('Manage SAMS')}
                                            data-flow="down"
                                        >
                                            <i className="icon-dots-vertical" />
                                        </button>
                                    </Dropdown>
                                )
                            }
                            <Tooltip
                                text={gettext('Upload New Asset(s)')}
                                flow="left"
                            >
                                <Button
                                    type="primary"
                                    icon="upload"
                                    text="plus-large"
                                    shape="round"
                                    iconOnly={true}
                                    onClick={() => samsApi.assets.showUploadModal()}
                                />
                            </Tooltip>
                        </ButtonGroup>
                    </SubNav>
                )}
                <SubNav zIndex={1}>
                    <ButtonGroup align="inline">
                        <Tooltip
                            text={gettext('Toggle filters')}
                            flow="right"
                        >
                            <NavButton
                                icon="filter-large"
                                onClick={this.props.toggleFilterPanel}
                                type={this.props.filterPanelOpen === true ?
                                    'primary' :
                                    'default'
                                }
                            />
                        </Tooltip>
                    </ButtonGroup>
                    <AssetTypeFilterButtons />
                    <ButtonGroup align="end">
                        <SubNavSpacer noMargin={true} />
                        <ContentBar>
                            <Tooltip
                                text={gettext(
                                    'Total Assets: {{ total }}',
                                    {total: this.props.totalAssets},
                                )}
                                flow="down"
                            >
                                <span className="sd-margin-end--1">
                                    <span className="sd-margin-end--1">
                                        {gettext('Total:')}
                                    </span>
                                    <Badge text={numberToString(this.props.totalAssets)} />
                                </span>
                            </Tooltip>
                            <Dropdown items={this.sortFieldOptions}>
                                <button
                                    className="dropdown__toggle dropdown-toggle"
                                    data-sd-tooltip={gettext(
                                        'Sort by: {{ field }}',
                                        {field: sortFieldText},
                                    )}
                                    data-flow="down"
                                >
                                    {sortFieldText}
                                    <span className="dropdown__caret" />
                                </button>

                            </Dropdown>
                            <Tooltip
                                key={this.props.searchParams.sortOrder}
                                text={this.props.searchParams.sortOrder === 'ascending' ?
                                    gettext('Sort order: Ascending') :
                                    gettext('Sort order: Descending')
                                }
                                flow="down"
                            >
                                <IconButton
                                    ariaValue={this.props.searchParams.sortOrder}
                                    onClick={this.toggleSortOrder}
                                    icon={this.props.searchParams.sortOrder}
                                />
                            </Tooltip>
                        </ContentBar>
                        <Tooltip
                            key={this.props.listStyle}
                            text={this.props.listStyle === 'list' ?
                                gettext('Switch to grid view') :
                                gettext('Switch to list view')}
                            flow="left"
                        >
                            <NavButton
                                icon={this.props.listStyle === ASSET_LIST_STYLE.GRID ?
                                    'list-view' :
                                    'grid-view'
                                }
                                onClick={this.props.toggleListStyle}
                            />
                        </Tooltip>
                    </ButtonGroup>
                </SubNav>
            </React.Fragment>
        );
    }
}

export const WorkspaceSubnav = connect(
    mapStateToProps,
    mapDispatchToProps,
)(WorkspaceSubnavComponent);
