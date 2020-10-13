import * as React from 'react';
import classNames from 'classnames';
import {Icon} from 'superdesk-ui-framework/react';
import nextId from 'react-id-generator';

interface IProps {
    type?: 'expanded' | 'collapsed' | 'boxed';
    placeholder: string; // defaults to light (white)
    initialValue?: string;
    focused?: boolean;
    onChange?(newValue: string): void;
    onSubmit(newValue: string): void;
}

interface IState {
    value: string;
}

export class SearchBar extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            value: this.props.initialValue ?? '',
        };

        this.handleKeydown = this.handleKeydown.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.clearValue = this.clearValue.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    htmlId = nextId();

    handleKeydown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.handleSubmit();
        }
    }

    handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setValue(event.target.value);
    }

    clearValue() {
        this.setValue('');
        this.props.onSubmit('');
    }

    setValue(value: string) {
        this.setState({value: value});

        if (this.props.onChange != null) {
            this.props.onChange(value);
        }
    }

    handleSubmit() {
        this.props.onSubmit(this.state.value);
    }

    render() {
        let classes = classNames('sd-searchbar', {
            [`sd-searchbar--${this.props.type}`]: this.props.type,
            'sd-searchbar--expanded': this.props.type === 'expanded' || this.props.type === undefined,
            'sd-searchbar--focused': this.props.focused,
        });

        return (
            <div className={classes}>
                <label className="sd-searchbar__icon" />
                <input
                    id={this.htmlId}
                    className="sd-searchbar__input"
                    type="text"
                    value={this.state.value}
                    aria-label={this.props.placeholder}
                    aria-describedby={this.htmlId}
                    placeholder={this.props.placeholder}
                    onChange={this.handleChange}
                    onKeyDown={this.handleKeydown}
                />
                <button
                    className="sd-searchbar__cancel"
                    onClick={this.clearValue}
                >
                    <Icon name="remove-sign" />
                </button>
                <button
                    id="sd-searchbar__search-btn"
                    className="sd-searchbar__search-btn"
                    onClick={this.handleSubmit}
                >
                    <Icon name="chevron-right-thin" />
                </button>
            </div>
        );
    }
}
