import * as React from 'react';
import classNames from 'classnames';
import nextId from "react-id-generator";
interface IProps {
    checked: boolean;
    label?: {
        text: string,
        side?: 'left' | 'right', // defaults to 'right'
    };
    disabled?: boolean;
    onChange(nextValue: boolean): void;
}
export class Checkbox extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.handleLabel = this.handleLabel.bind(this);
    }
    htmlId = nextId();
    handleChange() {
        if (!this.props.disabled) {
            this.props.onChange(!this.props.checked);
        }
    }

    handleLabel(text: string) {
        const classes = classNames({
            'sd-label--disabled': this.props.disabled,
            'label--active': this.props.checked,
        });

        return <label className={classes} htmlFor={this.htmlId} onClick={this.handleChange}>{text}</label>;
    }

    render() {
        return (
            <span className='sd-check-new__wrapper' label-position={this.props.label ?
                (this.props.label.side === 'left' ? 'left' : null) : null}>
                {this.props.label ? (this.props.label.side === 'left' ?
                    this.handleLabel(this.props.label.text) : null) : null}
                <input type='checkbox' className='visuallyhidden' id={this.htmlId} />
                <span className={'sd-check-new' +
                    (this.props.disabled ? (this.props.checked ? ' sd-check-new--disabled checked' : ' sd-check-new--disabled') :
                        (this.props.checked ? ' checked' : ''))}
                    onClick={this.handleChange} aria-label={String(this.props.checked)}></span>
                {this.props.label ? (!this.props.label.side ? this.handleLabel(this.props.label.text) : null) : null}
            </span>
        );
    }
}
