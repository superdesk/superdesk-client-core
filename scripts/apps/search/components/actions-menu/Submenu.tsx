import React from 'react';
import PropTypes from 'prop-types';
import {LEFT_SIDEBAR_WIDTH} from 'core/ui/constants';

/**
 * Submenu in SubmenuDropdown.
 *
 * When added to dom it checks its position and if it goes too far left
 * it will toggle the class to stay on the right side.
 */
export default class Submenu extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    element: HTMLElement;

    constructor(props) {
        super(props);
        this.state = {position: 'left'};
    }

    componentDidMount() {
        const rect = this.element.getBoundingClientRect();

        if (rect.left <= LEFT_SIDEBAR_WIDTH) {
            this.setState({position: 'right'});
        }
    }

    render() {
        return (
            <ul className={'dropdown__menu foo dropdown__menu--submenu-' + this.state.position}
                ref={(ref) => this.element = ref}>
                {this.props.children}
            </ul>
        );
    }
}

Submenu.propTypes = {
    children: PropTypes.arrayOf(PropTypes.node),
};