import React from 'react';
import {TypeIcon} from './index';
import {CHECKBOX_PARENT_CLASS} from './constants';
import {IArticle} from 'superdesk-api';
import {SelectBox} from './SelectBox';
import {gettext, translateArticleType} from 'core/utils';

interface IProps {
    onMultiSelect: (item: IArticle, value: boolean, multiSelectMode: boolean) => void;
    item: IArticle;
    itemSelected: boolean;
}

interface IState {
    hover: boolean;
}

/**
 * @deprecated Mutates item object.
 */
export class ListTypeIcon extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.state = {hover: false};

        this.setHover = this.setHover.bind(this);
        this.unsetHover = this.unsetHover.bind(this);
    }

    setHover() {
        this.setState({hover: true});
    }

    unsetHover() {
        if (this.state.hover) {
            this.setState({hover: false});
        }
    }

    render() {
        const showSelect = this.state.hover || this.props.itemSelected;

        return (
            <div
                className={'list-field type-icon ' + CHECKBOX_PARENT_CLASS}
                onMouseEnter={this.setHover}
                onMouseLeave={this.unsetHover}
                style={{lineHeight: 0}}
                data-test-id="item-type-and-multi-select"
            >
                {/*
                    When an item is focused with a keyboard, SelectBox is displayed and TypeIcon hidden.
                    A separate always-visible label is required so it's accessible by screen readers.
                */}
                <span className="a11y-only">
                    {gettext('Article Type: {{type}}', {type: translateArticleType(this.props.item.type)})}
                </span>

                {
                    showSelect
                        ? (
                            <SelectBox item={this.props.item} onMultiSelect={this.props.onMultiSelect} />
                        )
                        : (
                            <TypeIcon
                                type={this.props.item.type}
                                contentProfileId={this.props.item.profile}
                                highlight={this.props.item.highlight}
                                aria-hidden={true}
                            />
                        )
                }
            </div>
        );
    }
}
