import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';

import {KEYCODES} from '../../constants';
import {onEventCapture} from '../../utils';

import {Popup, Content} from '../../Popup';

import './style.scss';

/**
 * @ngdoc react
 * @name SelectTagPopup
 * @description Popup component to SelectTagInput
 */
export class SelectTagPopup extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    
    
 
    
    

    constructor(props) {
        super(props);

        this.state = {activeOptionIndex: -1};

        this.onKeyDown = this.onKeyDown.bind(this);
    }

    /**
     * @ngdoc method
     * @name SelectTagPopup#onKeyDown
     * @description onKeyDown method to handle keyboard selection of options
     */
    onKeyDown(event) {
        if (event) {
            switch (event.keyCode) {
            case KEYCODES.ENTER:
                onEventCapture(event);
                this.handleEnterKey(event);
                break;
            case KEYCODES.DOWN:
                onEventCapture(event);
                this.handleDownKey(event);
                break;
            case KEYCODES.UP:
                onEventCapture(event);
                this.handleUpKey(event);
                break;
            }
        }
    }

    /**
     * @ngdoc method
     * @name SelectTagPopup#handleEnterKey
     * @description handleEnterKey method to handle enter-key press on a selected option
     */
    handleEnterKey(event) {
        let newTag;

        if (this.state.activeOptionIndex > -1) {
            newTag = this.props.options[this.state.activeOptionIndex];
        } else if (this.props.options.length === 1) {
            newTag = this.props.options[0];
        } else if (this.props.allowCustom) {
            newTag = get(event, 'target.value');
        }

        this.props.onChange(newTag);
    }

    /**
     * @ngdoc method
     * @name SelectTagPopup#handleDownArrowKey
     * @description handleDownArrowKey method to handle down-key press to select options
     */
    handleDownKey(event) {
        if (this.state.activeOptionIndex < this.props.options.length - 1) {
            this.setState({activeOptionIndex: this.state.activeOptionIndex + 1});
        }
    }

    /**
     * @ngdoc method
     * @name SelectTagPopup#handleUpArrowKey
     * @description handleUpArrowKey method to handle up-key press to select options
     */
    handleUpKey(event) {
        if (this.state.activeOptionIndex > -1) {
            this.setState({activeOptionIndex: this.state.activeOptionIndex - 1});
        }
    }

    render() {
        const {
            onClose,
            target,
            popupContainer,
            options,
            labelKey,
        } = this.props;

        return (
            <Popup
                close={onClose}
                target={target}
                popupContainer={popupContainer}
                onKeyDown={this.onKeyDown}
                noPadding={true}
                className="select-tag__popup"
                inheritWidth={true}
            >
                <Content noPadding={true}>
                    {options.length > 0 && (
                        <ul className="select-tag__popup-list">
                            {options.map((o, index) => (
                                <li
                                    key={index}
                                    className={classNames(
                                        'select-tag__popup-item',
                                        {'select-tag__popup-item--active': index === this.state.activeOptionIndex}
                                    )}
                                >
                                    <button onClick={this.props.onChange.bind(null, o)}>
                                        <span>&nbsp;&nbsp;{get(o, labelKey, '')}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </Content>
            </Popup>
        );
    }
}

SelectTagPopup.propTypes = {
    value: PropTypes.array,
    options: PropTypes.array,
    onClose: PropTypes.func,
    target: PropTypes.string,
    onChange: PropTypes.func,
    labelKey: PropTypes.string,
    popupContainer: PropTypes.func,
    allowCustom: PropTypes.bool,
};
