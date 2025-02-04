// External Modules
import * as React from 'react';

// UI
import {
    HeaderPanel,
    LayoutContainer,
    LeftPanel,
    MainPanel,
    Panel,
    RightPanel,
} from '../ui';
import {IMainPanelProps} from '../ui/MainPanel';

interface IProps {
    header?: React.ReactNode;
    main?: React.ReactNode;
    mainClassName?: string;
    mainProps?: Omit<IMainPanelProps, 'children'>;
    rightPanel?: React.ReactNode;
    rightPanelOpen?: boolean;
    leftPanel?: React.ReactNode;
    leftPanelOpen?: boolean;
}

export class PageLayout extends React.PureComponent<IProps> {
    render() {
        return (
            <LayoutContainer>
                {this.props.header && (
                    <HeaderPanel>
                        {this.props.header}
                    </HeaderPanel>
                )}
                {this.props.leftPanel && (
                    <LeftPanel open={this.props.leftPanelOpen}>
                        <Panel side="left" background="grey">
                            {this.props.leftPanel}
                        </Panel>
                    </LeftPanel>
                )}
                {this.props.main && (
                    <MainPanel className={this.props.mainClassName} {...this.props.mainProps}>
                        {this.props.main}
                    </MainPanel>
                )}
                {this.props.rightPanel && (
                    <RightPanel open={this.props.rightPanelOpen}>
                        <Panel side="right">
                            {this.props.rightPanel}
                        </Panel>
                    </RightPanel>
                )}
            </LayoutContainer>
        );
    }
}
