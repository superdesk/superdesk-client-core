/* eslint-disable react/no-multi-comp */

import React from 'react';
import {Map} from 'immutable';
import {IconButton, Input} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {Spacer, SpacerBlock} from '../Spacer';
import {ResizeObserverComponent} from 'core/components/resize-observer-component';
import {IRestApiResponse, ITemplate} from 'superdesk-api';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {getPaginationInfo} from 'core/helpers/pagination';
import {DropdownOption} from './dropdown-option';
import {VirtualList} from '../virtual-lists/virtual-list';
import {nameof} from 'core/helpers/typescript-helpers';

interface IProps {
    onSelect(template: ITemplate): void;
    back(): void;
    height: number;
}

interface IStateLoading {
    loading: true;
    searchString: string;
}

interface IStateLoaded {
    loading: false;
    searchString: string;
    templatesCount: number;
    templatesData: Map<number, ITemplate>;
}

type IState = IStateLoading | IStateLoaded;

export class MoreTemplates extends React.PureComponent<IProps, IState> {
    private itemTemplate: React.ComponentType<{item: ITemplate}>;
    private wrapperEl: HTMLDivElement;
    private headerEl: HTMLDivElement;

    constructor(props: IProps) {
        super(props);

        this.state = {
            loading: true,
            searchString: '',
        };

        this.itemTemplate = class ItemTemplate extends React.PureComponent<{item: ITemplate}> {
            render() {
                const {item} = this.props;

                return (
                    <DropdownOption
                        label={item.template_name}
                        privateTag={item.is_public !== true}
                        icon={{
                            name: 'plus-sign',
                            color: 'var(--sd-colour-primary)',
                        }}
                        onClick={() => {
                            props.onSelect(item);
                        }}
                    />
                );
            }
        };

        this.fetchData = this.fetchData.bind(this);
        this.fetchInitialData = this.fetchInitialData.bind(this);
        this.loadMoreItems = this.loadMoreItems.bind(this);
    }

    fetchData(pageToFetch: number, pageSize: number): Promise<IRestApiResponse<ITemplate>> {
        return httpRequestJsonLocal<IRestApiResponse<ITemplate>>({
            method: 'GET',
            path: '/content_templates',
            urlParams: {
                max_results: pageSize,
                page: pageToFetch,
                sort: nameof<ITemplate>('template_name'),
                where: this.state.searchString.length < 1 ? undefined : {
                    [nameof<ITemplate>('template_name')]: {
                        $regex: this.state.searchString,
                        $options: '-i',
                    },
                },
            },
        });
    }

    fetchInitialData() {
        if (this.state.loading === false) {
            const loadingState: IStateLoading = {
                loading: true,
                searchString: this.state.searchString,
            };

            this.setState(loadingState);
        }

        return new Promise<void>((resolve) => {
            this.fetchData(0, 50).then((res) => {
                this.setState({
                    loading: false,
                    searchString: this.state.searchString,
                    templatesCount: res._meta.total,
                    templatesData: Map(res._items.map((item, i) => [i, item])),
                }, resolve);
            });
        });
    }

    loadMoreItems(fromIndex: number, toIndex: number): Promise<Map<number, ITemplate>> {
        const {state} = this;

        if (state.loading === true) {
            return Promise.resolve(Map());
        }

        const {pageSize, nextPage} = getPaginationInfo(fromIndex, toIndex);

        return this.fetchData(nextPage, pageSize).then((res) => {
            const start = (pageSize * nextPage) - pageSize;

            return Map<number, ITemplate>(res._items.map((item, i) => [start + i, item]));
        });
    }

    componentDidMount() {
        this.fetchInitialData().then(() => {
            // fix height when data first loads to reduce layout flickering
            this.wrapperEl.style.height = this.wrapperEl.offsetHeight + 'px';
        });
    }

    componentDidUpdate(prevProps: IProps, prevState: IState) {
        if (this.state.searchString !== prevState.searchString) {
            this.fetchInitialData();
        }
    }

    render() {
        const {state} = this;

        return (
            <div ref={(el) => this.wrapperEl = el}>
                <div style={{padding: 10}} ref={(el) => this.headerEl = el}>
                    <Spacer h gap="4" justifyContent="start" alignItems="center" noGrow>
                        <IconButton
                            ariaValue={gettext('Back')}
                            icon="chevron-left-thin"
                            onClick={() => {
                                this.props.back();
                            }}
                        />
                        <span className="form-label" style={{minHeight: 0}}>{gettext('More templates')}</span>
                    </Spacer>

                    <SpacerBlock v gap="4" />

                    <Input
                        type="text"
                        labelHidden
                        value={state.searchString}
                        onChange={(val) => {
                            const nextState: IState = {
                                ...state,
                                searchString: val,
                            };

                            this.setState(nextState);
                        }}
                    />

                    <div className="content-create-dropdown--spacer" />
                </div>

                <ResizeObserverComponent>
                    {({width}) => {
                        if (state.loading === true) {
                            return null;
                        } else {
                            return (
                                <VirtualList
                                    width={width}
                                    height={this.props.height - this.headerEl.offsetHeight}
                                    totalItemsCount={state.templatesCount}
                                    initialItems={state.templatesData}
                                    loadItems={this.loadMoreItems}
                                    itemTemplate={this.itemTemplate}
                                    getId={(item) => item._id}
                                />
                            );
                        }
                    }}
                </ResizeObserverComponent>
            </div>
        );
    }
}
