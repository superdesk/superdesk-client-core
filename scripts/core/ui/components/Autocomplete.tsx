import React from 'react';
import {Select2} from './select2';
import {keyBy} from 'lodash';
import {dataApi} from 'core/helpers/CrudManager';
import {ListItem, ListItemColumn, ListItemRow} from 'core/components/ListItem';
import {IBaseRestApiResponse} from 'superdesk-api';

interface IProps<T extends IBaseRestApiResponse> {
    endpoint: string;
    placeholder: string;
    sort: {field: string; direction: 'ascending' | 'descending'};
    getLabel(item: T): string;
    onSelect(item: T): void;
    selected?: string;
    disabled?: boolean;
    onFocus?: boolean;
}

interface IState<T> {
    fetchedItems?: Array<T>;
    loading: boolean;
}

export class AutoComplete<T extends IBaseRestApiResponse> extends React.Component<IProps<T>, IState<T>> {
    constructor(props: IProps<T>) {
        super(props);

        this.state = {
            loading: false,
        };

        this.queryItems = this.queryItems.bind(this);
    }

    queryItems(_searchString: string = '') {
        const searchString = _searchString.trim();

        this.setState({loading: true, fetchedItems: null});

        dataApi.query<T>(
            this.props.endpoint,
            1,
            {field: this.props.sort.field, direction: this.props.sort.direction},
            (
                searchString.length > 0
                    ? {
                        $or: [
                            {
                                [this.props.sort.field]: {
                                    $regex: searchString,
                                    $options: '-i',
                                },
                            },
                        ],
                    }
                    : {}
            ),
            50,
        )
            .then((res) => {
                this.setState({
                    fetchedItems: res._items,
                    loading: false,
                });
            });
    }

    componentDidMount() {
        this.queryItems();
    }

    render() {
        const keyedItems: {[key: string]: T} = keyBy(this.state.fetchedItems, (item) => item._id);

        return (
            <Select2
                onFocus={this.props.onFocus}
                disabled={this.props.disabled}
                placeholder={
                    <ListItem fullWidth noBackground noShadow>
                        <ListItemColumn ellipsisAndGrow>
                            <ListItemRow>{this.props.placeholder}</ListItemRow>
                        </ListItemColumn>
                    </ListItem>
                }
                value={this.props.selected == null ? undefined : this.props.selected}
                items={keyedItems}
                getItemValue={(item) => item._id}
                onSelect={(value) => {
                    this.props.onSelect(keyedItems[value]);
                }}
                renderItem={(item) => (
                    <ListItem fullWidth noBackground noShadow>
                        <ListItemColumn ellipsisAndGrow>
                            <ListItemRow>{this.props.getLabel(item)}</ListItemRow>
                        </ListItemColumn>
                    </ListItem>
                )}
                onSearch={(search) => {
                    this.queryItems(search);
                }}
                loading={this.state.loading}
            />
        );
    }
}
