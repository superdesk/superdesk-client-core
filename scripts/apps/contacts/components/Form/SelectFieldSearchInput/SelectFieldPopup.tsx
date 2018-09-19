import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';
import {Popup} from '../../../../contacts/components/Popup';
import {KEYCODES} from '../../../../contacts/constants';
import {onEventCapture, scrollListItemIfNeeded} from '../../../../contacts/helpers';

import './style.scss';

export class SelectFieldPopup extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    dom: {
        itemList: any,
    };

    constructor(props) {
        super(props);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.handleOnChange = this.handleOnChange.bind(this);
        this.state = {activeIndex: -1};
        this.dom = {itemList: null};
    }

    onKeyDown(event) {
        if (event) {
            switch (event.keyCode) {
            case KEYCODES.ENTER:
                onEventCapture(event);
                this.handleEnterKey(event);
                break;
            case KEYCODES.DOWN:
                onEventCapture(event);
                this.handleDownArrowKey(event);
                break;
            case KEYCODES.UP:
                onEventCapture(event);
                this.handleUpArrowKey(event);
                break;
            }
        }
    }

    handleEnterKey(event) {
        this.props.onChange(this.props.dataList[this.state.activeIndex]);
    }

    handleDownArrowKey(event) {
        if (get(this.props, 'dataList.length', 0) > this.state.activeIndex) {
            this.setState({activeIndex: this.state.activeIndex + 1});
            scrollListItemIfNeeded(this.state.activeIndex, this.dom.itemList);
        }
    }

    handleUpArrowKey(event) {
        if (this.state.activeIndex > 0) {
            this.setState({activeIndex: this.state.activeIndex - 1});
            scrollListItemIfNeeded(this.state.activeIndex, this.dom.itemList);
        }
    }

    handleOnChange(item, event) {
        onEventCapture(event);
        this.props.onChange(item);
    }

    render() {
        const {
            onClose,
            target,
            dataList,
        } = this.props;

        return (
            <Popup
                close={onClose}
                target={target}
                onKeyDown={this.onKeyDown}
                inheritWidth={true}
                noPadding={true}
            >
                <div className="field-search__popup">
                    <ul className="field-search__popup-list"
                        ref={(ref) => this.dom.itemList = ref}>
                        {dataList && dataList.length > 0 && dataList.map((fieldItem, index) => (
                            <li key={index} className={
                                classNames('field-search__popup-item',
                                    {'field-search__popup-item--active': index === this.state.activeIndex})}>
                                <button type="button" onClick={this.handleOnChange.bind(null, fieldItem)}>
                                    <div className="field-search__popup-item-label">{fieldItem}</div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </Popup>
        );
    }
}

SelectFieldPopup.propTypes = {
    onClose: PropTypes.func,
    target: PropTypes.string,
    dataList: PropTypes.array,
    onChange: PropTypes.func,
};
