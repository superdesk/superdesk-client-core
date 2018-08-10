import React from 'react';
import PropTypes from 'prop-types';
import PackageGroup from './PackageGroup';

export default class PackageGroupList extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    
    
 
    
    

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
                packages: this.props.packages,
            });

        return React.createElement(
            'ul',
            {className: this.props.className},
            this.state.groups.length ? this.state.groups.map(createGroup) : null
        );
    }
}

PackageGroupList.propTypes = {
    package: PropTypes.object,
    api: PropTypes.func,
    item: PropTypes.object,
    className: PropTypes.any,
    packages: PropTypes.object,
};
