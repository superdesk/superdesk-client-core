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
    selectedT: T | null;
}

export class AutoComplete<T extends IBaseRestApiResponse> extends React.Component<IProps<T>, IState<T>> {
    private _mounted: boolean;
    constructor(props: IProps<T>) {
        super(props);

        this.state = {
            loading: true,
            selectedT: null,
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
            }
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
        this.props.queryById(this.props.selected).then((selectedT) => {
            this.setState({selectedT, loading: false});
        });
    }

    render() {
        const keyedItems: {[key: string]: T} = keyBy(this.state.fetchedItems, (item) => item._id);

        if (this.state.loading && this.state.selectedT == null) {
            return null;
        }

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
                valueT={this.state.selectedT}
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
