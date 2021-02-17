import React from 'react';
import PropTypes from 'prop-types';
import {closeActionsMenu} from 'apps/search/helpers';

export default class PackageGroup extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);
        this.select = this.select.bind(this);
    }

    select() {
        this.props.packages.addPackageGroupItem(this.props.group, this.props.item);
        closeActionsMenu(this.props.item._id);
    }

    render() {
        const group = this.props.group;

        return (
            <li>
                <button data-option={group} onClick={this.select}>
                    <i className="icon-plus" />{group}
                </button>
            </li>
        );
    }
}

PackageGroup.propTypes = {
    group: PropTypes.string,
    item: PropTypes.object,
    packages: PropTypes.object,
};
