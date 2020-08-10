import * as React from 'react';

import {IconButton} from 'superdesk-ui-framework/react';

export interface IPanelTools {
    icon: string;
    title: string;
    onClick(): void;
    ariaValue: string;
}

interface IProps {
    children?: React.ReactNode;
    tools: Array<IPanelTools>;
}

export class PanelTools extends React.PureComponent<IProps> {
    render() {
        return (
            <div className="side-panel__tools">
                {this.props.tools.map((tool) => (
                    <IconButton
                        key={tool.title}
                        id={tool.title}
                        icon={tool.icon}
                        ariaValue={tool.ariaValue}
                        onClick={tool.onClick}
                    />
                ))}
            </div>
        );
    }
}
