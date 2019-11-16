import React from 'react';
import {flatMap} from 'lodash';
import {extensions} from 'appConfig';

interface IProps {
    provider: any;
    params: any;
    setParams: (updates: any) => void;
}

export class SearchPanelWidgets extends React.PureComponent<IProps> {
    render() {
        const widgets = flatMap(
            Object.values(extensions)
                .map((extension) => extension.activationResult.contributions.searchPanelWidgets)
                .filter((_widgets) => _widgets != null),
        );

        if (widgets.length === 0) {
            return null;
        }

        return (
            <React.Fragment>
                {widgets.map((Widget, index) =>
                    <Widget key={index}
                        provider={this.props.provider}
                        params={this.props.params}
                        setParams={(updates) => this.props.setParams(updates)}
                    />,
                )}
            </React.Fragment>
        );
    }
}
