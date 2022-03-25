import * as React from 'react';
import {IPreviewComponentProps} from 'superdesk-api';
import {IDropdownValue, IDropdownConfigRemoteSource} from '..';

type IProps = IPreviewComponentProps<IDropdownValue, IDropdownConfigRemoteSource>;

export class PreviewRemoteSource extends React.PureComponent<IProps> {
    render() {
        const {config, value} = this.props;
        const optionsToPreview =
            (Array.isArray(value) ? value : [value]);

        return (
            <div>
                {
                    optionsToPreview.map((option, i) => (
                        <span key={i}>
                            {config.getLabel(option)}
                        </span>
                    ))
                }
            </div>
        );
    }
}
