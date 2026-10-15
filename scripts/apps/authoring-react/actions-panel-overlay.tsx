import React from 'react';
import ReactDOM from 'react-dom';

export const ACTIONS_PANEL_OVERLAY_TEST_ID = 'authoring-actions-panel-overlay';

/**
 * Hosts the send to / publish panel outside the authoring frame.
 *
 * The panel is not a side widget, and the frame's widget slots are sized for widgets:
 * the overlay track is a zero-width grid column and the pinned track adds
 * `overflow-x: hidden`, so a panel wider than the editor column gets sliced along its
 * inline-start edge. Nesting it any deeper in the editor inherits the same bound,
 * because `.sd-authoring-react` is itself a scroll container the width of the
 * authoring column.
 *
 * Authoring-angular has never had this problem: it renders the same panel as a
 * top-level sibling of the editor (`authoring.html`), which is why it can extend over
 * the monitoring list. A portal is the equivalent for a React tree - the panel leaves
 * the editor's subtree entirely and anchors to the viewport instead.
 */
export class ActionsPanelOverlay extends React.PureComponent {
    render() {
        return ReactDOM.createPortal(
            (
                <div className="authoring-actions-panel-overlay" data-test-id={ACTIONS_PANEL_OVERLAY_TEST_ID}>
                    {this.props.children}
                </div>
            ),
            document.body,
        );
    }
}
