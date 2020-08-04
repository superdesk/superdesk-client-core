import * as React from 'react';
// import classNames from 'classnames';
import {Icon} from 'superdesk-ui-framework/react';

interface IProps {
    type?: 'expanded' | 'collapsed' | 'boxed';
    placeholder: string; // defaults to light (white)
}

export class SearchBar extends React.PureComponent<IProps> {
    render() {
        // const classes = classNames('sd-searchbar', {
        //     [`sd-searchbar--${this.props.type}`] : this.props.type,
        //     [`sd-searchbar--${this.props.type}`]: this.props.type !== 'expanded' && this.props.type !== undefined,
        // });

        return (
            <div className="sd-searchbar">
                <label className="sd-searchbar__icon" />
                <input id="search-input"
                    className="sd-searchbar__input"
                    type="text"
                    placeholder={this.props.placeholder}
                />
                <button className="sd-searchbar__cancel">
                    <Icon name="remove-sign" />
                </button>
                <button id="sd-searchbar__search-btn" className="sd-searchbar__search-btn">
                    <Icon size="big" name="chevron-right" />
                </button>
            </div>
        );
    }
}