import React from 'react';

export class PackageGroupTitle extends React.PureComponent<{label: string}> {
    render() {
        return (
            <div
                style={{fontSize: 12, fontWeight: 500, textTransform: 'uppercase', opacity: 0.7, marginBottom: 4}}
                data-test-id="package-group-title"
            >
                {this.props.label}
            </div>
        );
    }
}
