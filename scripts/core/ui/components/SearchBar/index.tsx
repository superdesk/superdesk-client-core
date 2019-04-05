import React from 'react';
import PropTypes from 'prop-types';
import {DebounceInput} from 'react-debounce-input';
import {isNil, uniqueId} from 'lodash';
import './style.scss';

/**
 * @ngdoc react
 * @name SearchBar
 * @description Component to search by debounced input to fetch results from backend
 */
export default class SearchBar extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    dom: any;

    constructor(props) {
        super(props);
        this.state = {
            // initialize state from props
            searchBarExtended: !isNil(this.props.value),
            searchInputValue: this.props.value || '',
            uniqueId: uniqueId('SearchBar'),
        };

        this.dom = {searchIcon: null};
        this.toggleSearchBar = this.toggleSearchBar.bind(this);
        this.onSearchChange = this.onSearchChange.bind(this);
        this.resetSearch = this.resetSearch.bind(this);
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
        this.props.onSearch();
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
        const {timeout, allowCollapsed} = this.props;
        const {searchBarExtended} = this.state;
        const _uniqueId = this.state.uniqueId;
        const minLength = this.props.minLength ? this.props.minLength : 2;

        return (
            <div className={'SearchBar flat-searchbar' + (searchBarExtended ? ' extended' : '')}>
                <div className="search-handler">
                    <label
                        htmlFor={_uniqueId}
                        className="trigger-icon"
                        onClick={this.toggleSearchBar}
                        ref={(node) => this.dom.searchIcon = node}
                    >
                        <i className="icon-search" />
                    </label>
                    <DebounceInput
                        minLength={minLength}
                        debounceTimeout={timeout}
                        value={this.state.searchInputValue}
                        onChange={this.onSearchChange}
                        id={_uniqueId}
                        placeholder="Search"
                        type="text"
                    />
                    {allowCollapsed && (
                        <button
                            type="button"
                            className="search-close visible"
                            onClick={this.resetSearch}>
                            <i className="icon-remove-sign" />
                        </button>
                    )}
                </div>
            </div>
        );
    }
}

SearchBar.propTypes = {
    onSearch: PropTypes.func.isRequired,
    value: PropTypes.string,
    minLength: PropTypes.number,
    extendOnOpen: PropTypes.bool,
    timeout: PropTypes.number,
    allowCollapsed: PropTypes.bool,
};

SearchBar.defaultProps = {
    timeout: 800,
    allowCollapsed: true,
};
