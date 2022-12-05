// External Modules
import * as React from 'react';
import {noop} from 'lodash';

// Types
import {ASSET_STATE, IAssetSearchParams, LIST_ACTION, IAutoTaggingSearchResult, IAssetTag} from '../../interfaces';
import {DatePickerLocaleSettings} from 'superdesk-api';
import {superdeskApi, samsApi} from '../../apis';

// UI
import {
    Autocomplete,
    Button,
    DatePicker,
    FormLabel,
    Input,
    Option,
    Select,
    Tag,
} from 'superdesk-ui-framework/react';

import {
    FormGroup,
    FormItem,
    FormRow,
    PanelContent,
    PanelContentBlock,
    PanelFooter,
    PanelHeader,
} from '../../ui';

// Utils
import {convertTagSearchResultToAssetTags} from '../../utils/assets';

interface IProps {
    searchParams: IAssetSearchParams;
    closeFilterPanel(): void;
    updateAssetSearchParamsAndListItems(
        params: Partial<IAssetSearchParams>,
        listAction: LIST_ACTION,
    ): void;
}

interface IState {
    localSearchParams: Partial<IAssetSearchParams>;
    formId?: string;
}

export class AssetFilterPanel extends React.PureComponent<IProps, IState> {
    onChange: Dictionary<string, (value: any) => void>;
    datePickerLocale: DatePickerLocaleSettings;

    constructor(props: IProps) {
        super(props);
        const {stringToNumber, filterKeys} = superdeskApi.helpers;

        this.state = {
            localSearchParams: filterKeys(this.props.searchParams, [
                'name',
                'filename',
                'description',
                'tags',
                'state',
                'sizeFrom',
                'sizeTo',
                'dateFrom',
                'dateTo',
            ]),
            formId: Math.random().toString(36).substr(1),
        };

        this.clearSearch = this.clearSearch.bind(this);
        this.submitSearch = this.submitSearch.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.datePickerLocale = superdeskApi.ui.framework.getLocaleForDatePicker();

        this.onChange = {
            name: (value: string) => this.setLocalAssetSearchParams({name: value}),
            filename: (value: string) => this.setLocalAssetSearchParams({filename: value}),
            description: (value: string) => this.setLocalAssetSearchParams({description: value}),
            tags: (value: IAssetTag) => this.setLocalAssetTagSearchParams(value, 'add'),
            state: (value: ASSET_STATE) => this.setLocalAssetSearchParams({state: value}),
            sizeFrom: (value: string) => this.setLocalAssetSearchParams({sizeFrom: stringToNumber(value)}),
            sizeTo: (value: string) => this.setLocalAssetSearchParams({sizeTo: stringToNumber(value)}),
            dateFrom: (value: Date) => this.setLocalAssetSearchParams({dateFrom: value}),
            dateTo: (value: Date) => this.setLocalAssetSearchParams({dateTo: value}),
        };
    }

    setLocalAssetTagSearchParams(tag: IAssetTag, method?: string) {
        if (method === 'add') {
            this.addTag(tag);
        } else if (method === 'remove') {
            this.removeTag(tag);
        }
    }

    addTag(value: IAssetTag) {
        this.setState((preState) => {
            const oldState = preState;
            const tags: Array<IAssetTag> = preState.localSearchParams.tags! || [];
            const index = tags.findIndex((tag) => {
                return tag.code === value.code;
            });

            if (index === -1) {
                tags!.push(value);
                return {
                    localSearchParams: {
                        tags: tags,
                    },
                };
            }

            return {
                localSearchParams: {
                    tags: oldState.localSearchParams.tags,

                },
            };
        });
    }

    removeTag(value: IAssetTag) {
        this.setState((preState) => {
            const tags: Array<IAssetTag> = preState.localSearchParams.tags!;
            const index = this.state.localSearchParams.tags?.indexOf(value)!;

            tags.splice(index, 1);
            return {
                localSearchParams: {
                    tags: tags,
                },
            };
        });
    }

    setLocalAssetSearchParams(updates: Partial<IAssetSearchParams>) {
        this.setState((state) => ({
            localSearchParams: {
                ...state.localSearchParams,
                ...updates,
            },
        }));
    }

    clearSearch() {
        const emptyFilters: Partial<IAssetSearchParams> = {
            name: undefined,
            filename: undefined,
            description: undefined,
            tags: undefined,
            state: undefined,
            sizeFrom: undefined,
            sizeTo: undefined,
            dateFrom: undefined,
            dateTo: undefined,
        };

        this.setState({
            localSearchParams: emptyFilters,
            formId: Math.random().toString(36).substr(1),
        });
        this.props.updateAssetSearchParamsAndListItems(
            emptyFilters,
            LIST_ACTION.REPLACE,
        );
    }

    submitSearch() {
        this.props.updateAssetSearchParamsAndListItems(
            this.state.localSearchParams,
            LIST_ACTION.REPLACE,
        );
    }

    onKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.submitSearch();
        }
    }

    getSizeOptions() {
        const {gettext} = superdeskApi.localization;

        return (
            <React.Fragment>
                <Option />
                <Option value={'1'}>{gettext('1MB')}</Option>
                <Option value={'5'}>{gettext('5MB')}</Option>
                <Option value={'10'}>{gettext('10MB')}</Option>
                <Option value={'25'}>{gettext('25MB')}</Option>
                <Option value={'50'}>{gettext('50MB')}</Option>
                <Option value={'100'}>{gettext('100MB')}</Option>
                <Option value={'250'}>{gettext('250MB')}</Option>
                <Option value={'500'}>{gettext('500MB')}</Option>
                <Option value={'1024'}>{gettext('1GB')}</Option>
            </React.Fragment>
        );
    }

    searchTags(searchString: string, callback: (result: Array<any>) => void) {
        let cancelled = false;

        samsApi.assets.searchTags(searchString + '*')
            .then((res: IAutoTaggingSearchResult) => {
                if (cancelled !== true) {
                    const result = convertTagSearchResultToAssetTags(res).toArray();

                    callback(result);
                }
            });

        return {
            cancel: () => {
                cancelled = true;
            },
        };
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {config} = superdeskApi.instance;
        const {numberToString} = superdeskApi.helpers;
        const sizeOptions = this.getSizeOptions();
        const sizeValues = [1, 5, 10, 25, 50, 100, 250, 500, 1024];

        return (
            <React.Fragment>
                <PanelHeader
                    title={gettext('Advanced Search')}
                    onClose={this.props.closeFilterPanel}
                    borderB={true}
                />
                <PanelContent>
                    <PanelContentBlock>
                        <form onKeyDown={this.onKeyDown} key={this.state.formId}>
                            <FormGroup>
                                <FormItem>
                                    <Input
                                        label={gettext('Name')}
                                        type="text"
                                        value={this.state.localSearchParams.name ?? ''}
                                        onChange={this.onChange.name}
                                    />
                                </FormItem>
                            </FormGroup>
                            <FormGroup>
                                <FormItem>
                                    <Input
                                        label={gettext('Filename')}
                                        type="text"
                                        value={this.state.localSearchParams.filename ?? ''}
                                        onChange={this.onChange.filename}
                                    />
                                </FormItem>
                            </FormGroup>
                            <FormGroup>
                                <FormItem>
                                    <Input
                                        label={gettext('Description')}
                                        type="text"
                                        value={this.state.localSearchParams.description ?? ''}
                                        onChange={this.onChange.description}
                                    />
                                </FormItem>
                            </FormGroup>
                            <FormGroup>
                                <FormRow>
                                    <Autocomplete
                                        key={(this.state.localSearchParams.tags?.length)}
                                        label={gettext('Tags')}
                                        value={''}
                                        keyValue="name"
                                        items={[]}
                                        search={(searchString, callback) => this.searchTags(searchString, callback)}
                                        onSelect={this.onChange.tags}
                                        onChange={noop}
                                    />
                                </FormRow>
                            </FormGroup>
                            <FormGroup>
                                <FormRow>
                                    {this.state.localSearchParams.tags?.map((tag) => (
                                        <Tag
                                            key={this.state.localSearchParams.tags?.indexOf(tag)}
                                            text={tag.name}
                                            onClick={() => {
                                                this.setLocalAssetTagSearchParams(tag, 'remove');
                                            }}
                                        />
                                    ))}
                                </FormRow>
                            </FormGroup>
                            <FormGroup>
                                <FormRow>
                                    <Select
                                        label={gettext('State')}
                                        value={this.state.localSearchParams.state}
                                        onChange={this.onChange.state}
                                    >
                                        <Option />
                                        <Option value={ASSET_STATE.DRAFT}>
                                            {gettext('Draft')}
                                        </Option>
                                        <Option value={ASSET_STATE.INTERNAL}>
                                            {gettext('Internal')}
                                        </Option>
                                        <Option value={ASSET_STATE.PUBLIC}>
                                            {gettext('Public')}
                                        </Option>
                                    </Select>
                                </FormRow>
                            </FormGroup>
                            <FormGroup>
                                <FormItem>
                                    <Select
                                        label={gettext('Size From:')}
                                        value={numberToString(this.state.localSearchParams.sizeFrom)}
                                        onChange={this.onChange.sizeFrom}
                                    >
                                        {sizeValues.includes(this.state.localSearchParams.sizeFrom ?? 1) ? null : (
                                            <Option value={numberToString(this.state.localSearchParams.sizeFrom)}>
                                                {numberToString(this.state.localSearchParams.sizeFrom)}
                                            </Option>
                                        )}
                                        {sizeOptions}
                                    </Select>
                                </FormItem>
                                <FormItem>
                                    <Select
                                        label={gettext('Size To:')}
                                        value={numberToString(this.state.localSearchParams.sizeTo)}
                                        onChange={this.onChange.sizeTo}
                                    >
                                        {sizeValues.includes(this.state.localSearchParams.sizeTo ?? 1) ? null : (
                                            <Option value={numberToString(this.state.localSearchParams.sizeTo)}>
                                                {numberToString(this.state.localSearchParams.sizeTo)}
                                            </Option>
                                        )}
                                        {sizeOptions}
                                    </Select>
                                </FormItem>
                            </FormGroup>
                            <FormGroup>
                                <FormItem>
                                    <FormLabel text={gettext('Uploaded From:')} />
                                    <DatePicker
                                        value={this.state.localSearchParams.dateFrom ?? null}
                                        onChange={this.onChange.dateFrom}
                                        dateFormat={config.view.dateformat}
                                        locale={this.datePickerLocale}
                                    />
                                </FormItem>
                                <FormItem>
                                    <FormLabel text={gettext('Uploaded To:')} />
                                    <DatePicker
                                        value={this.state.localSearchParams.dateTo ?? null}
                                        onChange={this.onChange.dateTo}
                                        dateFormat={config.view.dateformat}
                                        locale={this.datePickerLocale}
                                    />
                                </FormItem>
                            </FormGroup>
                        </form>
                    </PanelContentBlock>
                </PanelContent>
                <PanelFooter>
                    <Button
                        text={gettext('Clear')}
                        style="hollow"
                        onClick={this.clearSearch}
                    />
                    <Button
                        text={gettext('Submit')}
                        type="primary"
                        onClick={this.submitSearch}
                    />
                </PanelFooter>
            </React.Fragment>
        );
    }
}
