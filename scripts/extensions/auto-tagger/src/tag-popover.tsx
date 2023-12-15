import * as React from 'react';
import {ITagUi} from './types';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

interface IProps {
    tag: ITagUi;
    children: React.ReactNode;
    gettext: (text: string) => string;
    display?: 'block' | 'inline-block';
}

export class TagPopover extends React.PureComponent<IProps> {
    render() {
        const {tag, children, gettext} = this.props;

        const overlay = () => (
            <div className="sd-popover" style={{zIndex: 999, opacity: 1}}>
                <div className="sd-popover__header">
                    <h4 className="sd-popover__title">{tag.name}</h4>
                </div>
                <div className="sd-popover__content">
                    {tag.description && (
                        <div>{tag.description}</div>
                    )}
                    {!!tag.aliases?.length && (
                        <div>{gettext('Aliases:')}{' '}{tag.aliases?.join(', ')}</div>
                    )}
                    {tag.original_source && (
                        <div>{gettext('Source:')}{' '}{tag.original_source}</div>
                    )}
                </div>
            </div>
        );

        return (
            <OverlayTrigger overlay={overlay} trigger={['hover', 'focus']} placement={'bottom'} delay={500}>
                <div style={{display: this.props.display ?? 'inline-block'}}>
                    {/* need component here that can use refs */}
                    {children}
                </div>
            </OverlayTrigger>
        );
    }
}
