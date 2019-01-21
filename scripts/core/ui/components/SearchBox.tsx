import React from 'react';
import PropTypes from 'prop-types';
import {KEYCODES} from './constants';
import {gettext} from 'core/ui/components/utils';

/**
 * @ngdoc react
 * @name SearchBox
 * @description Search box with input to search
 */
class SearchBox extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);
        this.state = {inputValue: this.props.value};
        this.onChangeHandler = this.onChangeHandler.bind(this);
        this.onKeyPressHandler = this.onKeyPressHandler.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.value !== nextProps.value &&
         this.props.activeFilter !== nextProps.activeFilter) {
            this.setState({inputValue: nextProps.value});
        }

        if (this.state.inputValue !== '' && this.props.value !== '' &&
            nextProps.value === '' && this.props.activeFilter === nextProps.activeFilter) {
            this.setState({inputValue: nextProps.value});
        }
    }

    onChangeHandler(evt) {
        this.setState({inputValue: evt.target.value});
    }

    onKeyPressHandler(evt) {
        if (evt.charCode === KEYCODES.ENTER) {
            this.props.search(this.state.inputValue);
        }
    }

    render() {
        return (
            <div className="sd-searchbar sd-searchbar--focused">
                <label htmlFor="search-input" className="sd-searchbar__icon" />
                <input type="text" id="search-input"
                    autoComplete="off"
                    className="sd-searchbar__input"
                    placeholder={gettext(this.props.label)}
                    value={this.state.inputValue}
                    onChange={this.onChangeHandler}
                    onKeyPress={this.onKeyPressHandler}
                />
                <button className="sd-searchbar__search-btn"
                    onClick={() => this.props.search(this.state.inputValue)}>
                    <i className="big-icon--chevron-right" />
                </button>
            </div>
        );
    }
}

SearchBox.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    search: PropTypes.func.isRequired,
    activeFilter: PropTypes.string.isRequired,
};

export default SearchBox;
