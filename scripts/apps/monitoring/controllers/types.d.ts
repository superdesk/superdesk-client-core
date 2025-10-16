import {IMonitoringFilter, IMonitoringGroup, IDesk, IContentProfile, IStage} from 'superdesk-api';

interface IPersonalGroup {
    type: string;
    header: string;
    query?: Dictionary<string, any>;
    fileType?: string | null;
    contentProfile?: string | null;
    customFilters?: string | null;
}

interface IEditGroup {
    _id: string;
    selected: boolean;
    type: string;
    max_items?: number;
    order: number;
}

type IActiveFilters = {[key: string]: Array<string>} & {
    contentProfile: Array<string>;
    fileType: Array<string>;
    customFilters: {[key: string]: IMonitoringFilter};
}

interface IActiveFilterTag {
    id: string;
    label: string;
}

interface ISettings {
    type: string;
    groups: Array<IMonitoringGroup>;
    desk?: IDesk;
}

interface IWidget {
    _id: string;
    multiple_id: string;
    configuration: {
        groups: Array<IMonitoringGroup>;
        label: string;
    };
}

interface IExpandedState {
    [key: string]: boolean;
}

interface IState {
    expanded: IExpandedState;
    solo?: IMonitoringGroup;
}

export interface IAggregateCtrl {
    loading: boolean;
    selected: any;
    groups: Array<IMonitoringGroup>;
    spikeGroups: Array<IMonitoringGroup>;
    personalGroups: {[key: string]: IPersonalGroup};
    defaultPersonalGroup: IPersonalGroup;
    modalActive: boolean;
    displayOnlyCurrentStep: boolean;
    columnsLimit: number | null;
    currentStep: string;
    searchLookup: {[key: string]: any};
    deskLookup: {[key: string]: IDesk};
    stageLookup: {[key: string]: IStage};
    fileTypes: any;
    monitoringSearch: boolean;
    searchQuery: string | null;
    isOutputType: (type: string) => boolean;
    activeProfiles: Array<IContentProfile>;
    activeFilters: IActiveFilters;
    desks: Array<IDesk>;
    deskStages: {[key: string]: Array<IStage>};
    searches: Array<any>;
    settings?: ISettings;
    widget?: IWidget;
    cards?: Array<IMonitoringGroup>;
    editGroups?: {[key: string]: IEditGroup};
    state: IState;

    setWidget: (widget: IWidget) => void;
    readSettings: () => Promise<ISettings>;
    refreshGroups: () => Promise<void> | null;
    hasFileType: (fileType: string) => boolean;
    isCustomFilterActive: (filter: IMonitoringFilter) => boolean;
    toggleCustomFilter: (filter: IMonitoringFilter) => void;
    toggleContentProfileFilter: (profile: IContentProfile) => void;
    isContentProfileFilterActive: (id: IContentProfile['_id']) => boolean;
    setCustomFilter: (filter: IMonitoringFilter) => void;
    setFileFilter: (filterValue: string, $event?: any) => void;
    removeFilter: (filter?: string, type?: string) => void;
    preview: (item: any) => void;
    edit: (currentStep?: string, displayOnlyCurrentStep?: boolean) => void;
    searchOnEnter: ($event: KeyboardEvent, query: string) => void;
    search: (query: string) => void;
    switchExpandedState: (key: string) => void;
    getExpandedState: (key: string) => boolean;
    setSoloGroup: (group: IMonitoringGroup) => void;
    getMaxHeightStyle: (maxItems?: number) => {[key: string]: string};
    togglePersonalGroup: (id: string, group: IPersonalGroup) => void;
}
