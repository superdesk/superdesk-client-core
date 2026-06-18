import {SpacerInlineFlex} from 'core/ui/components/Spacer';
import * as React from 'react';
import {IPreviewComponentProps, IDropdownValue, IDropdownConfigManualSource} from 'superdesk-api';
import {DropdownItemTemplate} from '../dropdown-item-template';

type IProps = IPreviewComponentProps<IDropdownValue, IDropdownConfigManualSource>;

export class PreviewManualEntry extends React.PureComponent<IProps> {
    render() {
        const {config, value} = this.props;
        const options = config.options;
        const optionsToPreview =
            (() => {
                if (value == null) {
                    return [];
                } else if (Array.isArray(value)) {
                    return value;
                } else {
                    return [value];
                }
            })()
                .map((val) => options.find((_option) => _option.id === val))
                // an article may still reference an option that was removed from the profile config
                .filter((option) => option != null);

        const noPadding = optionsToPreview.every(({color}) => color == null);

        return (
            <SpacerInlineFlex h gap="8" gapSecondary="8">
                {
                    optionsToPreview.map((option, i) => (
                        <DropdownItemTemplate key={i} option={option} config={config} noPadding={noPadding} />
                    ))
                }
            </SpacerInlineFlex>
        );
    }
}
