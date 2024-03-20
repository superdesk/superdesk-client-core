import React from 'react';

interface IProps {
    children: any;
    editorNode: any;
}

// do calculations on a cloned element to avoid scroll position jumping to the top on chrome
// when resetting `max-height` to an empty value
function getNextPosition(originalElement, editorNode) {
    const element = originalElement.cloneNode(true) as HTMLElement;
    const mainFlexElement = element.firstElementChild as HTMLElement;

    originalElement.insertAdjacentElement('beforebegin', element);

    if (editorNode == null || element == null || mainFlexElement == null) {
        return;
    }

    const selectionRect = JSON.parse(editorNode.dataset.editorSelectionRect);

    if (selectionRect == null) {
        return;
    }

    // reset calculated values so new calculation can be performed
    element.style.bottom = '';
    mainFlexElement.style['max-height'] = '';

    element.style.left = (editorNode.getBoundingClientRect().left - 360) + 'px';

    const paddingBlockStart = 4;
    const paddingBlockEnd = 4;
    const viewportHeight = $(window).innerHeight();
    const remainingSpaceAtTheBottomOfSelectedText = viewportHeight - selectionRect.top;

    element.style.bottom = (
        remainingSpaceAtTheBottomOfSelectedText > element.offsetHeight
            ? Math.max(remainingSpaceAtTheBottomOfSelectedText - element.offsetHeight, paddingBlockEnd)
            : paddingBlockEnd
    ) + 'px';
    mainFlexElement.style['max-height'] = (
        viewportHeight
        - parseInt(element.style.bottom, 10)
        - paddingBlockStart
    ) + 'px';

    const result = {
        left: element.style.left,
        bottom: element.style.bottom,
        maxHeight: mainFlexElement.style['max-height'],
    };

    element.remove();

    return result;
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

        const nextPosition = getNextPosition(element, editorNode);

        element.style.left = nextPosition.left;
        element.style.bottom = nextPosition.bottom;
        mainFlexElement.style['max-height'] = nextPosition.maxHeight;
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
            <div
                className={'editor-popup editor-popup--open '}
                ref={(el) => {
                    this.highlightsPopupRootElement = el;
                }}
            >
                <div
                    className="editor-popup__main editor-popup__main--floating"
                    ref={(el) => {
                        this.highlightsPopupMainFlexElement = el;
                    }}
                >
                    {this.props.children}
                </div>
            </div>
        );
    }
}
