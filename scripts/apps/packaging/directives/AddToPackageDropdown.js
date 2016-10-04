import React from 'react';

AddToPackageDropdown.$inject = ['item', 'className', 'authoringWorkspace', 'packages', 'api', '$rootScope'];
export function AddToPackageDropdown(item, className, authoringWorkspace, packages, api, $rootScope) {
    var PackageGroup = React.createClass({
        select: function() {
            packages.addPackageGroupItem(this.props.group, item);
        },
        render: function() {
            var group = this.props.group;
            return React.createElement(
                'li',
                {},
                React.createElement(
                    'button',
                    {dataOption: group, onClick: this.select},
                    React.createElement('i', {className: 'icon-plus'}),
                    group
                )
            );
        }
    });

    var PackageGroupList = React.createClass({
        getInitialState: function() {
            return {groups: []};
        },

        componentDidMount: function() {
            var pkg = this.props.package;
            if (pkg.highlight) {
                api.find('highlights', pkg.highlight)
                    .then(function(result) {
                        this.setState({groups: result.groups});
                    }.bind(this));
            } else {
                // set it here to avoid flickering
                this.setState({groups: packages.groupList});
            }
        },

        render: function() {
            var createGroup = function(group) {
                return React.createElement(PackageGroup, {group: group, key: 'group-' + group});
            };

            return React.createElement(
                'ul',
                {className: className},
                this.state.groups.length ? this.state.groups.map(createGroup) : null
            );
        }
    });
    return React.createElement(PackageGroupList, {item: item, package: authoringWorkspace.getItem()});
}
