/* eslint-disable react/no-multi-comp */

import React from 'react';
import {Map} from 'immutable';
import {IconButton, Input, WithPagination} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {Spacer, SpacerBlock} from '../Spacer';
import {IRestApiResponse, ITemplate} from 'superdesk-api';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {getPaginationInfo} from 'core/helpers/pagination';
import {DropdownOption} from './dropdown-option';
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
    constructor(props: IProps) {
        super(props);

        this.state = {
            loading: true,
            searchString: '',
        };

        this.fetchData = this.fetchData.bind(this);
        this.fetchInitialData = this.fetchInitialData.bind(this);
        this.loadMoreItems = this.loadMoreItems.bind(this);
    }

    fetchData(pageToFetch: number, pageSize: number, abortSignal?: AbortSignal): Promise<IRestApiResponse<ITemplate>> {
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
            abortSignal,
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
        this.fetchInitialData();
    }

    componentDidUpdate(prevProps: IProps, prevState: IState) {
        if (this.state.searchString !== prevState.searchString) {
            this.fetchInitialData();
        }
    }

    render() {
        const {state} = this;

        return (
            <div style={{height: '100%'}}>
                <div style={{padding: 10}}>
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
                        inlineLabel
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
                {
                    state.loading === false && (
                        <WithPagination
                            getItems={(pageNo, signal) =>
                                this.fetchData(pageNo, 10, signal)
                                    .then((res) => Promise.resolve({
                                        items: res._items,
                                        itemCount: res._meta.total,
                                    }))
                            }
                        >
                            {
                                (items: Array<ITemplate>) => (
                                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                                        {
                                            items.map((item) => {
                                                return (
                                                    <DropdownOption
                                                        key={item._id}
                                                        label={item.template_name}
                                                        privateTag={item.is_public !== true}
                                                        icon={{
                                                            name: 'plus-sign',
                                                            color: 'var(--sd-colour-primary)',
                                                        }}
                                                        onClick={() => {
                                                            this.props.onSelect(item);
                                                        }}
                                                    />
                                                );
                                            })
                                        }
                                    </div>
                                )
                            }
                        </WithPagination>
                    )
                }
            </div>
        );
    }
}
