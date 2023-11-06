import React from 'react';
import {IconButton, Input, WithPagination} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {Spacer, SpacerBlock} from '../Spacer';
import {IRestApiResponse, ITemplate} from 'superdesk-api';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {DropdownOption} from './dropdown-option';
import {nameof} from 'core/helpers/typescript-helpers';
import {sdApi} from 'api';

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
        const templateDesks = nameof<ITemplate>('template_desks');
        const currentDeskId = sdApi.desks.getCurrentDeskId();

        const deskCriteria: any = [
            {[templateDesks]: {$exists: false}},
            {[templateDesks]: []},
        ];

        if (currentDeskId != null) {
            deskCriteria.push({[templateDesks]: {$in: [currentDeskId]}});
        }

        const criteria = {$or: [{$or: deskCriteria}, {user: sdApi.user.getCurrentUserId()}]};
        const templateName = nameof<ITemplate>('template_name');
        const where = {$and: [criteria]};

        if (this.state.searchString.length < 1) {
            where[templateName] = {
                $regex: this.state.searchString,
                $options: '-i',
            };
        }

        return httpRequestJsonLocal<IRestApiResponse<ITemplate>>({
            method: 'GET',
            path: '/content_templates',
            urlParams: {
                max_results: pageSize,
                page: pageToFetch,
                sort: templateName,
                where: where,
            },
            abortSignal,
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
