import React from 'react';
import PackageGroup from './PackageGroup';

export default class PackageGroupList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {groups: []};
    }

    componentDidMount() {
        var pkg = this.props.package;

        if (pkg.highlight) {
            this.props.api.find('highlights', pkg.highlight)
                .then((result) => {
                    this.setState({groups: result.groups});
                });
        } else {
            // set it here to avoid flickering
            this.setState({groups: this.props.packages.groupList});
        }
    }

    render() {
        var createGroup = (group) =>
            React.createElement(PackageGroup, {
                group: group,
                key: 'group-' + group,
                item: this.props.item,
                packages: this.props.packages
            });

        return React.createElement(
            'ul',
            {className: this.props.className},
            this.state.groups.length ? this.state.groups.map(createGroup) : null
        );
    }
}

PackageGroupList.propTypes = {
    package: React.PropTypes.object,
    api: React.PropTypes.func,
    item: React.PropTypes.object,
    className: React.PropTypes.any,
    packages: React.PropTypes.object
};
