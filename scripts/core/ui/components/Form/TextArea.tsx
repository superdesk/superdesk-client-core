import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {debounce} from 'lodash';

import './style.scss';

/**
 * @ngdoc react
 * @name TextArea
 * @description Auto-resizing component to multi-line text input
 */
export class TextArea extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    dom: any;
    delayedResize: any;

    constructor(props) {
        super(props);
        this.dom = {input: null};
        this.autoResize = this.autoResize.bind(this);
        this.onChange = this.onChange.bind(this);
        this.delayedResize = null;
    }

    componentDidMount() {
        this.delayedResize = debounce(this.autoResize, this.props.autoHeightTimeout);
        if (this.props.autoHeight) {
            this.delayedResize();
        }
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.autoHeight && nextProps.value !== this.props.value) {
            this.delayedResize(nextProps.value);
        }
    }

    autoResize(value = null) {
        if (this.dom.input) {
            if (value !== null) {
                this.dom.input.value = value;
            }

            // This is required so that when the height is reduced, the scrollHeight
            // is recalculated based on the new height, otherwise it will not
            // shrink the height back down
            this.dom.input.style.height = '5px';

            // Now set the height to the scrollHeight value to display the entire
            // text content
            this.dom.input.style.height = `${this.dom.input.scrollHeight}px`;
        }
    }

    onChange(event) {
        const {nativeOnChange, onChange, field, autoHeight, multiLine} = this.props;

        if (nativeOnChange) {
            onChange(event);
        } else {
            onChange(
                field,
                multiLine ? event.target.value : event.target.value.replace('\n', '')
            );
        }

        if (autoHeight) {
            this.delayedResize();
        }
    }

    render() {
        const {
            field,
            value,
            autoHeight,
            readOnly,
            placeholder,
            paddingRight60,

            // Remove these variables from the props variable
            // So they are not passed down to the textarea dom node
            // eslint-disable-next-line no-unused-vars
            onChange, autoHeightTimeout, nativeOnChange, multiLine,

            ...props
        } = this.props;

        return (
            <textarea
                ref={(node) => this.dom.input = node}
                className={classNames(
                    'sd-line-input__input',
                    {
                        'sd-line-input__input--auto-height': autoHeight,
                        'sd-line-input__input--padding-right-60': paddingRight60,
                    }
                )}
                value={value}
                name={field}
                disabled={readOnly}
                placeholder={readOnly ? '' : placeholder}
                {...props}
                onChange={readOnly ? null : this.onChange}
            />
        );
    }
}

TextArea.propTypes = {
    field: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    autoHeight: PropTypes.bool,
    autoHeightTimeout: PropTypes.number,
    nativeOnChange: PropTypes.bool,
    placeholder: PropTypes.string,
    readOnly: PropTypes.bool,
    paddingRight60: PropTypes.bool,
    multiLine: PropTypes.bool,
};

TextArea.defaultProps = {
    readOnly: false,
    autoHeight: true,
    autoHeightTimeout: 50,
    nativeOnChange: false,
    paddingRight60: false,
    multiLine: true,
};
