// External modules
import * as React from 'react';
import {noop} from 'lodash';

// Types
import {superdeskApi} from '../../apis';
import {IDesk} from 'superdesk-api';

// UI
import {Autocomplete, Label, Tag} from 'superdesk-ui-framework/react';
import {FormGroup, FormRow} from '../../ui';

interface IProps {
    label?: string;
    value?: Array<IDesk['_id']>;
    onChange(value: Array<IDesk['_id']>): void;
    disabled?: boolean;
}

interface IState {
    desks: Array<IDesk>;
}

function searchDesks(query: any) {
    return superdeskApi.dataApi.query<IDesk>(
        'desks',
        1,
        {field: 'name', direction: 'ascending'},
        query,
    );
}

export class DesksSelectInput extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {desks: []};

        this.onSearch = this.onSearch.bind(this);
        this.addDesk = this.addDesk.bind(this);
    }

    componentDidMount() {
        if (this.props.value?.length) {
            searchDesks({_id: {$in: this.props.value}})
                .then((response) => {
                    this.setState({desks: response._items});
                });
        }
    }

    onSearch(searchString: string, callback: (result: Array<any>) => void): {cancel: () => void} {
        let cancelled = false;
        const selectedDeskIds = this.state.desks.map((desk) => desk._id);

        searchDesks({
            $and: [
                {name: {$regex: searchString, $options: 'i'}},
                {_id: {$nin: selectedDeskIds}},
            ],
        })
            .then((response) => {
                if (cancelled !== true) {
                    callback(response._items);
                }
            });

        return {
            cancel: () => {
                cancelled = true;
            },
        };
    }

    addDesk(desk: any) {
        this.setState((prevState) => {
            return {
                desks: [
                    ...prevState.desks,
                    desk,
                ],
            };
        }, () => {
            this.props.onChange(this.state.desks.map((d) => d._id));
        });
    }

    removeDesk(desk: IDesk) {
        this.setState((prevState) => {
            return {
                desks: prevState.desks.filter(
                    (d) => d._id !== desk._id,
                ),
            };
        }, () => {
            this.props.onChange(this.state.desks.map((d) => d._id));
        });
    }

    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <React.Fragment>
                <FormGroup>
                    <FormRow>
                        <Autocomplete
                            key={(this.state.desks || []).length}
                            label={this.props.label ?? gettext('Desks')}
                            value={''}
                            keyValue="name"
                            items={[]}
                            search={this.onSearch}
                            onSelect={this.addDesk}
                            onChange={noop}
                            disabled={this.props.disabled}
                        />
                    </FormRow>
                </FormGroup>
                {!this.state.desks.length ? null : (
                    <FormGroup>
                        <FormRow>
                            {this.state.desks.map((desk) => (
                                this.props.disabled ? (
                                    <Label
                                        key={desk._id}
                                        text={desk.name}
                                        style="translucent"
                                        size="large"
                                    />
                                ) : (
                                    <Tag
                                        key={desk._id}
                                        text={desk.name}
                                        onClick={this.removeDesk.bind(this, desk)}
                                    />
                                )
                            ))}
                        </FormRow>
                    </FormGroup>
                )}
            </React.Fragment>
        );
    }
}
