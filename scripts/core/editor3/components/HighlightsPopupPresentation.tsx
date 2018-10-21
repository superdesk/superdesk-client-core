import React from 'react';
import PropTypes from 'prop-types';
import {EditorHighlightsHeader} from '../editorPopup/EditorHighlightsHeader';

interface IProps {
    availableActions: Array<any>;
    header: any;
    content: any;
    scrollableContent: any;
    stickyFooter: any;
    isRoot: boolean;
    editorNode: any;
    className: string;
}

interface IState {
    actionsDropdownOpen: boolean;
}

export class HighlightsPopupPresentation extends React.Component<IProps, IState> {
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

        const popUpContent = [
            this.props.header == null ? null : (
                <EditorHighlightsHeader
                    key="1"
                    availableActions={this.props.availableActions}
                    header={this.props.header}
                />
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
