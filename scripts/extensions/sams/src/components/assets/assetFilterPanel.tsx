// External Modules
import * as React from 'react';

// Types
import {ISuperdesk} from 'superdesk-api';
import {ASSET_STATE, IAssetSearchParams, LIST_ACTION} from '../../interfaces';

// UI
import {
    Button,
    DatePicker,
    FormLabel,
    Input,
    Option,
    Select,
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

export function getAssetFilterPanel(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;
    const {config} = superdesk.instance;
    const {stringToNumber, numberToString} = superdesk.helpers;

    return class AssetFilterPanel extends React.PureComponent<IProps, IState> {
        onChange: Dictionary<string, (value: any) => void>;

        constructor(props: IProps) {
            super(props);

            this.state = {
                localSearchParams: {...this.props.searchParams},
                formId: Math.random().toString(36).substr(1),
            };

            this.clearSearch = this.clearSearch.bind(this);
            this.submitSearch = this.submitSearch.bind(this);
            this.onKeyDown = this.onKeyDown.bind(this);
            this.onChange = {
                name: (value: string) => this.setLocalAssetSearchParams({name: value}),
                filename: (value: string) => this.setLocalAssetSearchParams({filename: value}),
                description: (value: string) => this.setLocalAssetSearchParams({description: value}),
                state: (value: ASSET_STATE) => this.setLocalAssetSearchParams({state: value}),
                size_from: (value: string) => this.setLocalAssetSearchParams({size_from: stringToNumber(value)}),
                size_to: (value: string) => this.setLocalAssetSearchParams({size_to: stringToNumber(value)}),
                date_from: (value: Date) => this.setLocalAssetSearchParams({date_from: value}),
                date_to: (value: Date) => this.setLocalAssetSearchParams({date_to: value}),
            };
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
                state: undefined,
                size_from: undefined,
                size_to: undefined,
                date_from: undefined,
                date_to: undefined,
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

        render() {
            const sizeOptions = this.getSizeOptions();

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
                                            value={this.state.localSearchParams.name}
                                            onChange={this.onChange.name}
                                        />
                                    </FormItem>
                                </FormGroup>
                                <FormGroup>
                                    <FormItem>
                                        <Input
                                            label={gettext('Filename')}
                                            value={this.state.localSearchParams.filename}
                                            onChange={this.onChange.filename}
                                        />
                                    </FormItem>
                                </FormGroup>
                                <FormGroup>
                                    <FormItem>
                                        <Input
                                            label={gettext('Description')}
                                            value={this.state.localSearchParams.description}
                                            onChange={this.onChange.description}
                                        />
                                    </FormItem>
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
                                            value={numberToString(this.state.localSearchParams.size_from)}
                                            onChange={this.onChange.size_from}
                                        >
                                            {sizeOptions}
                                        </Select>
                                    </FormItem>
                                    <FormItem>
                                        <Select
                                            label={gettext('Size To:')}
                                            value={numberToString(this.state.localSearchParams.size_to)}
                                            onChange={this.onChange.size_to}
                                        >
                                            {sizeOptions}
                                        </Select>
                                    </FormItem>
                                </FormGroup>
                                <FormGroup>
                                    <FormItem>
                                        <FormLabel text={gettext('Uploaded From:')} />
                                        <DatePicker
                                            value={this.state.localSearchParams.date_from ?? null}
                                            onChange={this.onChange.date_from}
                                            dateFormat={config.view.dateformat}
                                        />
                                    </FormItem>
                                    <FormItem>
                                        <FormLabel text={gettext('Uploaded To:')} />
                                        <DatePicker
                                            value={this.state.localSearchParams.date_to ?? null}
                                            onChange={this.onChange.date_to}
                                            dateFormat={config.view.dateformat}
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
    };
}
