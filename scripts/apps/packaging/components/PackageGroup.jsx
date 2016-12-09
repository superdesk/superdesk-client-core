import React from 'react';

export default class PackageGroup extends React.Component {
    constructor(props) {
        super(props);
        this.select = this.select.bind(this);
    }

    select() {
        this.props.packages.addPackageGroupItem(this.props.group, this.props.item);
    }

    render() {
        var group = this.props.group;

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
    group: React.PropTypes.string,
    item: React.PropTypes.object,
    packages: React.PropTypes.object
};
