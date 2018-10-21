import React from 'react';

interface IProps {
    children: any;
    editorNode: any;
}

export class HighlightsPopupPositioner extends React.Component<IProps> {
    static propTypes: any;
    static defaultProps: any;

    animationTimer: any;
    highlightsPopupRootElement: any;
    highlightsPopupMainFlexElement: any;

    constructor(props) {
        super(props);
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
        return (
            <div className={'editor-popup editor-popup--open '} ref={ (el) => {
                this.highlightsPopupRootElement = el;
            }}>
                <div className="editor-popup__main editor-popup__main--floating" ref={(el) => {
                    this.highlightsPopupMainFlexElement = el;
                }}>
                    {this.props.children}
                </div>
            </div>
        );
    }
}
