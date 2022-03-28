import {SpacerInline} from 'core/ui/components/Spacer';
import * as React from 'react';
import {IPreviewComponentProps} from 'superdesk-api';
import {IDropdownValue, IDropdownTreeConfig} from '..';

type IProps = IPreviewComponentProps<IDropdownValue, IDropdownTreeConfig>;

export class PreviewDropdownTree extends React.PureComponent<IProps> {
    render() {
        const {config, value} = this.props;
        const optionsToPreview =
            (Array.isArray(value) ? value : [value]);

        function defaultTemplate({item}) {
            return (
                <span>{config.getLabel(item)}</span>
            );
        }

        const Template = config.valueTemplate ?? config.optionTemplate ?? defaultTemplate;

        return (
            <div>
                {
                    optionsToPreview.map((option, i) => (
                        <span key={i}>
                            {i !== 0 && (<SpacerInline h gap="8" />)}
                            <Template item={option} />
                        </span>
                    ))
                }
            </div>
        );
    }
}
