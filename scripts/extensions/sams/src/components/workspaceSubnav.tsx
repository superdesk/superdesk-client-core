// External Modules
import * as React from 'react';

// Types
import {
    ASSET_LIST_STYLE,
    ASSET_SORT_FIELD,
    IAssetSearchParams,
    ISetItem,
    LIST_ACTION,
    SET_STATE,
    SORT_ORDER,
} from '../interfaces';
import {superdeskApi} from '../apis';

// UI
import {
    Badge,
    Button,
    ButtonGroup,
    Dropdown,
    NavButton,
    SubNav,
    IconButton,
    Tooltip,
} from 'superdesk-ui-framework/react';
import {IMenuGroup, IMenuItem} from 'superdesk-ui-framework/react/components/Dropdown';
import {ContentBar, SearchBar, SubNavSpacer} from '../ui';
import {showManageSetsModal} from './sets/manageSetsModal';
import {showUploadAssetModal} from './assets/uploadAssetModal';
import {AssetTypeFilterButtons} from './assets/assetTypeFilterButtons';

// Utils
import {getAssetListSortFieldText} from '../utils/ui';

interface IProps {
    filterPanelOpen: boolean;
    totalAssets: number;
    listStyle: ASSET_LIST_STYLE;
    searchParams: IAssetSearchParams;
    activeSets: Array<ISetItem>;
    disabledSets: Array<ISetItem>;
    currentSet?: ISetItem;
    toggleFilterPanel(): void;
    toggleListStyle(): void;
    updateAssetSearchParamsAndListItems(
        params: Partial<IAssetSearchParams>,
        listAction: LIST_ACTION,
    ): void;
}

export class WorkspaceSubnav extends React.PureComponent<IProps> {
    subNavMenuActions: Array<IMenuGroup>;
    sortFieldOptions: Array<IMenuItem>;

    constructor(props: IProps) {
        super(props);

        this.subNavMenuActions = this.getSubNavMenuActions();
        this.sortFieldOptions = this.getSortFieldOptions();

        this.toggleSortOrder = this.toggleSortOrder.bind(this);
        this.setSearchParamText = this.setSearchParamText.bind(this);
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

    getSortFieldOptions(): Array<IMenuItem> {
        const {gettext} = superdeskApi.localization;

        return [{
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
        }];
    }

    getMenuItems(): Array<IMenuGroup> {
        const {gettext} = superdeskApi.localization;
        const activeSets = this.props.activeSets.map(
            (set) => ({
                label: set.name,
                onSelect: () => this.setSearchParamSetId(set._id),
            }),
        );

        const disabledSets = this.props.disabledSets.map(
            (set) => ({
                label: set.name + ' ' + gettext('(disabled)'),
                icon: 'lock',
                onSelect: () => this.setSearchParamSetId(set._id),
            }),
        );

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

    render() {
        const {gettext} = superdeskApi.localization;
        const {numberToString} = superdeskApi.helpers;
        const items = this.getMenuItems();
        const buttonLabel = this.props.currentSet?.name ?? gettext('All Sets');
        const buttonIcon = this.props.currentSet?.state === SET_STATE.DISABLED ? 'lock' : undefined;
        const sortFieldText = getAssetListSortFieldText(this.props.searchParams.sortField);

        return (
            <React.Fragment>
                <SubNav zIndex={2}>
                    <ButtonGroup align="inline">
                        <Dropdown items={items}>
                            <NavButton
                                text={buttonLabel}
                                onClick={() => false}
                                icon={buttonIcon}
                            />
                        </Dropdown>
                    </ButtonGroup>
                    <SearchBar
                        placeholder={gettext('Search Assets')}
                        type="expanded"
                        focused={true}
                        onSubmit={this.setSearchParamText}
                        initialValue={this.props.searchParams.textSearch}
                    />
                    <ButtonGroup align="right">
                        {this.subNavMenuActions.length === 0 ?
                            null :
                            (
                                <Dropdown items={this.subNavMenuActions}>
                                    <button className="sd-navbtn">
                                        <i className="icon-dots-vertical" />
                                    </button>
                                </Dropdown>
                            )
                        }
                        <Tooltip text={gettext('Upload New Asset(s)')} flow="left">
                            <Button
                                type="primary"
                                icon="upload"
                                text="plus-large"
                                shape="round"
                                iconOnly={true}
                                onClick={showUploadAssetModal}
                            />
                        </Tooltip>
                    </ButtonGroup>
                </SubNav>
                <SubNav zIndex={1}>
                    <ButtonGroup align="inline">
                        <NavButton
                            icon="filter-large"
                            onClick={this.props.toggleFilterPanel}
                            type={this.props.filterPanelOpen === true ?
                                'primary' :
                                'default'
                            }
                        />
                    </ButtonGroup>
                    <AssetTypeFilterButtons />
                    <ButtonGroup align="right">
                        <SubNavSpacer noMargin={true} />
                        <ContentBar>
                            <span className="sd-margin-r--1">
                                <span className="sd-margin-r--1">
                                    {gettext('Total:')}
                                </span>
                                <Badge text={numberToString(this.props.totalAssets)} />
                            </span>
                            <Dropdown items={this.sortFieldOptions}>
                                {sortFieldText}
                            </Dropdown>
                            <IconButton
                                ariaValue={this.props.searchParams.sortOrder}
                                onClick={this.toggleSortOrder}
                                icon={this.props.searchParams.sortOrder}
                            />
                        </ContentBar>
                        <NavButton
                            icon={this.props.listStyle === ASSET_LIST_STYLE.GRID ?
                                'list-view' :
                                'grid-view'
                            }
                            onClick={this.props.toggleListStyle}
                        />
                    </ButtonGroup>
                </SubNav>
            </React.Fragment>
        );
    }
}
