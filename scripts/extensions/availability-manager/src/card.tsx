import * as React from 'react';

interface IProps {
    children: React.ReactNode;
}

/**
 * PR-TODO: move to ui-framework
 */
export class Card extends React.PureComponent<IProps> {
    render() {
        return (
            <div style={{
                width: '100%',
                background: 'var(--sd-item__main-Bg)',
                borderRadius: 'var(--b-radius--medium)',
                padding: 'calc(3* var(--base-increment))',
                boxShadow: 'var(--sd-shadow--z2)',
            }}>
                {this.props.children}
            </div>
        );
    }
}
