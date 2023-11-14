import React from 'react';
import {IconButton, Input, WithPagination} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {Spacer, SpacerBlock} from '../Spacer';
import {
    IComparison,
    ILogicalOperator,
    IRestApiResponse,
    ISortOptions,
    ISuperdeskQuery,
    ITemplate,
} from 'superdesk-api';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {DropdownOption} from './dropdown-option';
import {nameof} from 'core/helpers/typescript-helpers';
import {sdApi} from 'api';
import {prepareSuperdeskQuery} from 'core/helpers/universal-query';

interface IProps {
    onSelect(template: ITemplate): void;
    back(): void;
}

interface IState {
    searchString: string;
}

export class MoreTemplates extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            searchString: '',
        };

        this.fetchData = this.fetchData.bind(this);
    }

    fetchData(pageToFetch: number, pageSize: number, abortSignal?: AbortSignal): Promise<IRestApiResponse<ITemplate>> {
        const template_desks = nameof<ITemplate>('template_desks');
        const currentDeskId = sdApi.desks.getCurrentDeskId();

        const templateDesks: Array<IComparison | ILogicalOperator> = [
            {[template_desks]: {$exists: false}},
            {[template_desks]: {$eq: []}},
        ];

        const criteria: ILogicalOperator = {
            $or: [
                {
                    $and: [
                        {is_public: {$eq: false}},
                        {user: {$eq: sdApi.user.getCurrentUserId()}},
                    ],
                },
                {
                    $and: [
                        {is_public: {$eq: true}},
                        {$or: templateDesks},
                    ],
                },
            ],
        };

        if (currentDeskId != null) {
            templateDesks.push({$and: [{[template_desks]: {$in: [currentDeskId]}}, {is_public: {$eq: true}}]});
        }

        const templateName = nameof<ITemplate>('template_name');
        const sort: ISortOptions = [{[templateName]: 'desc'}];
        const filtered: ILogicalOperator = {
            $and: [
                criteria,
                {[templateName]: {$stringContains: {val: this.state.searchString, options: null}}},
            ],
        };
        const maybeFiltered: ILogicalOperator = this.state.searchString.length < 1 ? criteria : filtered;

        const query: ISuperdeskQuery = {
            filter: maybeFiltered,
            page: pageToFetch,
            max_results: pageSize,
            sort: sort,
        };

        return httpRequestJsonLocal<IRestApiResponse<ITemplate>>({
            ...prepareSuperdeskQuery('/content_templates', query),
            abortSignal: abortSignal,
        });
    }

    render() {
        return (
            <div
                style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    paddingBottom: 10,
                }}
            >
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
                        inlineLabel
                        labelHidden
                        type="text"
                        label=""
                        value={this.state.searchString}
                        onChange={(val) => {
                            this.setState({searchString: val});
                        }}
                        data-test-id="search"
                    />
                    <div className="content-create-dropdown--spacer" />
                </div>

                <div style={{height: '100%', overflow: 'auto'}}>
                    <WithPagination
                        key={this.state.searchString}
                        getItems={(pageNo, pageSize, signal) => this.fetchData(pageNo, pageSize, signal)
                            .then((res) => ({items: res._items, itemCount: res._meta.total}))
                        }
                    >
                        {
                            (items: Array<ITemplate>) => (
                                <Spacer v alignItems="center" gap="8">
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
                                </Spacer>
                            )
                        }
                    </WithPagination>
                </div>
            </div>
        );
    }
}
