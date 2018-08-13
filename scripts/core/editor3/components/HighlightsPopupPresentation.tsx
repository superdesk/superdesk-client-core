import React from 'react';
import PropTypes from 'prop-types';

export class HighlightsPopupPresentation extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    animationTimer: any;
    highlightsPopupRootElement: any;
    highlightsPopupMainFlexElement: any;

    constructor(props) {
        super(props);
        this.state = {
            actionsDropdownOpen: false,
        };
        this.animationTimer = null;
        this.position = this.position.bind(this);
        this.positionOnNextAnimationFrame = this.positionOnNextAnimationFrame.bind(this);
    }
    positionOnNextAnimationFrame() {
        if (this.animationTimer != null) {
            window.cancelAnimationFrame(this.animationTimer);
        }

        const {position} = this;

        this.animationTimer = window.requestAnimationFrame(() => {
            this.animationTimer = null;
            position();
        });
    }
    toggleActionsDropdown() {
        this.setState({
            actionsDropdownOpen: !this.state.actionsDropdownOpen,
        });
    }
    position() {
        const {editorNode} = this.props;

        const element = this.highlightsPopupRootElement;
        const mainFlexElement = this.highlightsPopupMainFlexElement;

        if (editorNode == null || element == null || mainFlexElement == null) {
            return;
        }

        const selectionRect = JSON.parse(editorNode.dataset.editorSelectionRect);

        if (selectionRect == null) {
            return;
        }

        // reset calculated values so new calculation can be performed
        element.style.top = '';
        element.style.bottom = '';
        mainFlexElement.style['max-height'] = '';

        element.style.left = (this.props.editorNode.getBoundingClientRect().left - 360) + 'px';

        const paddingTop = 4;
        const paddingBottom = 4;
        const viewportHeight = $(window).innerHeight();
        const remainingSpaceAtTheBottomOfSelectedText = viewportHeight - selectionRect.top;

        element.style.bottom = (
            remainingSpaceAtTheBottomOfSelectedText > element.offsetHeight
                ? Math.max(remainingSpaceAtTheBottomOfSelectedText - element.offsetHeight, paddingBottom)
                : paddingBottom
        ) + 'px';
        mainFlexElement.style['max-height'] = (
            viewportHeight
            - parseInt(element.style.bottom, 10)
            - paddingTop
        ) + 'px';
    }
    componentDidMount() {
        this.position();

        window.addEventListener('keydown', this.positionOnNextAnimationFrame);
        window.addEventListener('resize', this.positionOnNextAnimationFrame);
        window.addEventListener('click', this.positionOnNextAnimationFrame);
    }
    componentDidUpdate() {
        this.position();
    }
    componentWillUnmount() {
        window.removeEventListener('keydown', this.positionOnNextAnimationFrame);
        window.removeEventListener('resize', this.positionOnNextAnimationFrame);
        window.removeEventListener('click', this.positionOnNextAnimationFrame);
    }
    render() {
        const {availableActions} = this.props;

        const actionsDropdownStyles:any = this.state.actionsDropdownOpen !== true ? {} : {
            display: 'block',
            position: 'absolute',
            width: 'auto',
            padding: '1rem 0',
            marginBottom: 12, // so the last item doesn't look like it's shaddow is cut off
        };

        const popUpContent = [
            this.props.header == null ? null : (
                <div key="1" className="editor-popup__header">

                    <div className="editor-popup__header-text">
                        {this.props.header}
                    </div>

                    {
                        availableActions.length < 1 ? null : (
                            <div className="editor-popup__header-tools">
                                <div className="dropdown dropdown--align-right">
                                    <button
                                        className="icn-btn dropdown__toggle"
                                        onClick={() => this.toggleActionsDropdown()}>
                                        <i className="icon-dots-vertical" />
                                    </button>

                                    <ul className="dropdown__menu" style={actionsDropdownStyles}>
                                        {
                                            availableActions.map((action, i) => (
                                                <li key={i}>
                                                    <button onClick={() => {
                                                        this.toggleActionsDropdown();
                                                        action.onClick();
                                                    }}>
                                                        <i className={action.icon} />{action.text}
                                                    </button>
                                                </li>
                                            ))
                                        }
                                    </ul>
                                </div>
                            </div>
                        )
                    }
                </div>
            ),
            this.props.content == null ? null : (
                <div key="2" className="editor-popup__content-block">
                    {this.props.content}
                </div>
            ),
            this.props.scrollableContent == null && this.props.stickyFooter == null ? null : (
                <div key="3" className="editor-popup__secondary-content">
                    {
                        this.props.scrollableContent == null ? null : (
                            <div className="editor-popup__content-scrollable ">
                                {this.props.scrollableContent}
                            </div>
                        )
                    }
                    {
                        this.props.stickyFooter == null ? null : (
                            <div className="editor-popup__content-block">
                                {this.props.stickyFooter}
                            </div>
                        )
                    }
                </div>
            ),
        ];


        if (this.props.isRoot) {
            return (
                <div className={'editor-popup editor-popup--open ' + this.props.className} ref={ (el) => {
                    this.highlightsPopupRootElement = el;
                }}>
                    <div className="editor-popup__main editor-popup__main--floating" ref={(el) => {
                        this.highlightsPopupMainFlexElement = el;
                    }}>
                        {popUpContent}
                    </div>
                </div>
            );
        } else {
            return (
                <div className={this.props.className}>
                    {popUpContent}
                </div>
            );
        }
    }
}

HighlightsPopupPresentation.propTypes = {
    availableActions: PropTypes.array,
    header: PropTypes.object,
    content: PropTypes.object,
    scrollableContent: PropTypes.object,
    stickyFooter: PropTypes.object,
    isRoot: PropTypes.bool,
    editorNode: PropTypes.object,
    className: PropTypes.string,
};