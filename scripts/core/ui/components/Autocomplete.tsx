import React from 'react';
import {Select2} from './select2';
import {keyBy} from 'lodash';
import {ListItem, ListItemColumn, ListItemRow} from 'core/components/ListItem';
import {IBaseRestApiResponse, IRestApiResponse} from 'superdesk-api';

interface IProps<T extends IBaseRestApiResponse> {
    placeholder: string;
    query(searchString): Promise<IRestApiResponse<T>>;
    queryById(id): Promise<T>;
    getLabel(item: T): string;
    onSelect(item: T): void;
    selected?: string;
    disabled?: boolean;
    autoFocus?: boolean;
    'data-test-id'?: string;
}

interface IState<T> {
    fetchedItems?: Array<T>;
    loading: boolean;
    selectedItem: T | null;
}

export class AutoComplete<T extends IBaseRestApiResponse> extends React.Component<IProps<T>, IState<T>> {
    private _mounted: boolean;
    constructor(props: IProps<T>) {
        super(props);

        this.state = {
            loading: true,
            selectedItem: null,
        };

        this.queryItems = this.queryItems.bind(this);
        this.fetchSelected = this.fetchSelected.bind(this);
    }

    queryItems(_searchString: string = '') {
        const searchString = _searchString.trim();

        this.setState({loading: true, fetchedItems: null});

        return this.props.query(searchString).then((res) => {
            if (this._mounted) {
                this.setState({
                    fetchedItems: res?._items ?? this.state.fetchedItems,
                    loading: false,
                });
                console.log('fetched items', this.state.fetchedItems)
            }
        }).catch((err) => {
            console.log('error fetching items', err)
        });
    }

    componentDidMount() {
        this._mounted = true;
        this.queryItems();
        this.fetchSelected();
    }

    componentWillUnmount() {
        this._mounted = false;
    }

    fetchSelected() {
        if (this.props.selected != null) {
            console.log('fetching selected item')
            this.props.queryById(this.props.selected).then((selectedItem) => {
                this.setState({selectedItem, loading: false});
                console.log('selected item fetched', selectedItem)
            });
        }
    }

    render() {
        // The keyBy is transforming an array of objects into an object, where the key for each value in the resulting object is based on the _id property of each object in the array.
        const keyedItems: {[key: string]: T} = keyBy(this.state.fetchedItems, (item) => item._id);
        console.log('keyedItems', keyedItems)
        return (
            <Select2
                autoFocus={this.props.autoFocus}
                disabled={this.props.disabled}
                placeholder={(
                    <ListItem fullWidth noBackground noShadow>
                        <ListItemColumn ellipsisAndGrow>
                            <ListItemRow>{this.props.placeholder}</ListItemRow>
                        </ListItemColumn>
                    </ListItem>
                )}
                value={this.props.selected == null ? undefined : this.props.selected}
                valueObject={this.state.selectedItem}
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
                    return this.queryItems(search);
                }}
                loading={this.state.loading}
                data-test-id={this.props['data-test-id']}
            />
        );
    }
}
