import React from 'react';
import {DebounceInput} from 'react-debounce-input';
import {uniqueId} from 'lodash';
import './style.scss';
import {gettext} from 'core/utils';
import {ManualSearch} from './manual';

interface IProps {
    onSearch(queryString: string): void;
    extendOnOpen?: boolean;
    allowCollapsed?: boolean;
    timeout?: number;
    minLength?: number;
    initialValue?: string;
    debounce?: boolean;
}

interface IState {
    searchBarExtended: boolean;
    searchInputValue: string;
    uniqueId: string;
}

export default class SearchBar extends React.Component<IProps, IState> {
    static propTypes: any;
    static defaultProps: any;

    dom: any;

    constructor(props: IProps) {
        super(props);
        this.state = {
            // initialize state from props
            searchBarExtended: !props.allowCollapsed,
            searchInputValue: props.initialValue ?? '',
            uniqueId: uniqueId('SearchBar'),
        };

        this.dom = {searchIcon: null};
        this.toggleSearchBar = this.toggleSearchBar.bind(this);
        this.onSearchChange = this.onSearchChange.bind(this);
        this.resetSearch = this.resetSearch.bind(this);
        this.resetSearchValue = this.resetSearchValue.bind(this);
    }

    componentDidMount() {
        // Doing this to focus the input field
        // Sometimes, user doesn't want to click on the search icon to input search text
        if (this.props.extendOnOpen) {
            this.dom.searchIcon.click();
            this.dom.searchIcon.focus();
        }
    }

    toggleSearchBar() {
        if (this.props.allowCollapsed === false) {
            return;
        }

        this.setState({searchBarExtended: !this.state.searchBarExtended});
    }

    /** Reset the field value, close the search bar and load events */
    resetSearch() {
        this.setState({
            searchBarExtended: false,
            searchInputValue: '',
        });
        this.props.onSearch('');
    }

    resetSearchValue() {
        this.setState({
            searchInputValue: '',
        });
    }

    /** Search events by keywords */
    onSearchChange(event) {
        const value = event.target.value;

        this.setState(
            {searchInputValue: value || ''},
            // update the input value since we are using the DebounceInput `value` prop
            () => this.props.onSearch(value),
        );
    }

    render() {
        const {timeout, debounce} = this.props;
        const {searchBarExtended} = this.state;
        const _uniqueId = this.state.uniqueId;
        const minLength = this.props.minLength ? this.props.minLength : 2;
        const removeButton: React.ReactNode = (
            <button
                type="button"
                className="search-close visible"
                onClick={this.resetSearch}
            >
                <i className="icon-remove-sign" />
            </button>
        );
        const showButtons = searchBarExtended && this.state.searchInputValue.trim().length > 0;

        return (
            <div className={'SearchBar flat-searchbar' + (searchBarExtended ? ' extended' : '')}>
                <div className="search-handler" style={{alignItems: 'center'}}>
                    <label
                        htmlFor={_uniqueId}
                        className="trigger-icon"
                        onClick={this.toggleSearchBar}
                        ref={(node) => this.dom.searchIcon = node}
                    >
                        <i className="icon-search" />
                    </label>
                    {
                        debounce === true
                            ? (
                                <>
                                    <DebounceInput
                                        minLength={minLength}
                                        debounceTimeout={timeout}
                                        value={this.state.searchInputValue}
                                        onChange={this.onSearchChange}
                                        id={_uniqueId}
                                        placeholder={gettext('Search')}
                                        type="text"
                                    />
                                    {showButtons && removeButton}
                                </>
                            )
                            : (
                                <ManualSearch
                                    showButtons={showButtons}
                                    removeButton={removeButton}
                                    onInputChange={(value) => this.setState({
                                        searchInputValue: value,
                                    })}
                                    search={() => this.props.onSearch(this.state.searchInputValue)}
                                />
                            )
                    }
                </div>
            </div>
        );
    }
}

SearchBar.defaultProps = {
    timeout: 800,
    allowCollapsed: true,
};
