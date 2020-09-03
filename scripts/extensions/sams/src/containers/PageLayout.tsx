import * as React from 'react';
import {HeaderPanel, LayoutContainer, MainPanel, Panel, RightPanel} from '../ui';

interface IProps {
    header?: React.ReactNode;
    main?: React.ReactNode;
    mainClassName?: string;
    rightPanel?: React.ReactNode;
    rightPanelOpen?: boolean;
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
                {this.props.main && (
                    <MainPanel className={this.props.mainClassName}>
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
