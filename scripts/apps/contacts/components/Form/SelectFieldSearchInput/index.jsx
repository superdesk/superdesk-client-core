import React from 'react';
import PropTypes from 'prop-types';
import DebounceInput from 'react-debounce-input';
import {Row, LineInput, Label} from '../';
import {SelectFieldPopup} from './SelectFieldPopup';
import {isEmpty} from 'lodash';


export class SelectFieldSearchInput extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            filteredDataList: this.props.dataList,
            searchText: '',
            openFilterList: false,
            search: false,
        };

        this.openPopup = this.openPopup.bind(this);
        this.closePopup = this.closePopup.bind(this);
        this.filterDataList = this.filterDataList.bind(this);
        this.onItemChange = this.onItemChange.bind(this);
    }

    openPopup() {
        this.setState({openFilterList: true});
    }

    closePopup() {
        this.setState({openFilterList: false});
    }


    filterDataList(event) {
        const {dataList, onChange, querySearch, onQuerySearch} = this.props;

        let value = event.target.value;

        const filterTextNoCase = value ? value.toLowerCase() : '';

        if (querySearch) {
            onQuerySearch(filterTextNoCase);
            this.setState({
                searchText: value,
                openFilterList: !isEmpty(value),
            }, onChange(this.props.field, value));
        } else {
            if (!value) {
                this.setState({
                    filteredDataList: dataList,
                    searchText: '',
                    openFilterList: false,
                }, onChange(this.props.field, value));
                return;
            }

            const newDataList = dataList.filter((fieldItem) => (
                fieldItem.toLowerCase().substr(0, value.length) === filterTextNoCase ||
                    fieldItem.toLowerCase().indexOf(filterTextNoCase) >= 0
            ));

            this.setState({
                filteredDataList: newDataList,
                searchText: value,
                openFilterList: true,
            }, onChange(this.props.field, value));
        }
    }

    onItemChange(inputItem) {
        this.props.onChange(this.props.field, inputItem);
        this.setState({
            openFilterList: false,
            searchText: inputItem,
        });
    }

    render() {
        const {value, dataList, label, readOnly, querySearch} = this.props;

        const listData = querySearch ? dataList : this.state.filteredDataList;

        return (
            <div>
                <Row noPadding={true}>
                    <LineInput noMargin={true}>
                        <Label text={label} />
                    </LineInput>
                </Row>
                {!readOnly && <Row noPadding={true}>
                    <LineInput isSelect={false} noLabel={!!value}>
                        <DebounceInput
                            value={this.state.searchText || value || ''}
                            className="sd-line-input__input"
                            minLength={1}
                            debounceTimeout={500}
                            onChange={this.filterDataList}
                            placeholder="Search" />

                        {this.state.openFilterList && (
                            <SelectFieldPopup
                                onClose={this.closePopup}
                                target="sd-line-input__input"
                                dataList={listData}
                                onChange={this.onItemChange} />
                        )}
                    </LineInput>
                </Row>}
            </div>
        );
    }
}

SelectFieldSearchInput.propTypes = {
    field: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    dataList: PropTypes.array,
    readOnly: PropTypes.bool,
    querySearch: PropTypes.bool,
    onQuerySearch: PropTypes.func,
};

SelectFieldSearchInput.defaultProps = {
    querySearch: false,
};
