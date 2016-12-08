import React from 'react';

AddToPackageDropdown.$inject = ['item', 'className', 'authoringWorkspace', 'packages', 'api', '$rootScope'];
export function AddToPackageDropdown(item, className, authoringWorkspace, packages, api, $rootScope) {
    class PackageGroup extends React.Component {
        constructor(props) {
            super(props);
            this.select = this.select.bind(this);
        }

        select() {
            packages.addPackageGroupItem(this.props.group, item);
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
        group: React.PropTypes.string
    };

    class PackageGroupList extends React.Component {
        constructor(props) {
            super(props);
            this.state = {groups: []};
        }

        componentDidMount() {
            var pkg = this.props.package;

            if (pkg.highlight) {
                api.find('highlights', pkg.highlight)
                    .then((result) => {
                        this.setState({groups: result.groups});
                    });
            } else {
                // set it here to avoid flickering
                this.setState({groups: packages.groupList});
            }
        }

        render() {
            var createGroup = function(group) {
                return React.createElement(PackageGroup, {group: group, key: 'group-' + group});
            };

            return React.createElement(
                'ul',
                {className: className},
                this.state.groups.length ? this.state.groups.map(createGroup) : null
            );
        }
    }

    PackageGroupList.propTypes = {
        package: React.PropTypes.object
    };

    return React.createElement(PackageGroupList, {item: item, package: authoringWorkspace.getItem()});
}
