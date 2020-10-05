import React from 'react';
import {TypeIcon} from './index';
import {CHECKBOX_PARENT_CLASS} from './constants';
import {IArticle} from 'superdesk-api';
import {SelectBox} from './SelectBox';

interface IProps {
    selectingDisabled?: boolean;
    onMultiSelect: (items: Array<IArticle>, selected: boolean) => void;
    item: IArticle;
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
        const {selectingDisabled} = this.props;
        const showSelect = selectingDisabled !== true && (this.state.hover || this.props.item.selected);

        return (
            <div
                className={'list-field type-icon ' + CHECKBOX_PARENT_CLASS}
                onMouseEnter={selectingDisabled ? null : this.setHover}
                onMouseLeave={selectingDisabled ? null : this.unsetHover}
                style={{lineHeight: 0}}
            >
                {
                    showSelect
                        ? (
                            <SelectBox item={this.props.item} onMultiSelect={this.props.onMultiSelect} />
                        )
                        : (
                            <TypeIcon type={this.props.item.type} highlight={this.props.item.highlight} />
                        )
                }
            </div>
        );
    }
}
