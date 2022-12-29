import * as React from 'react';

interface IProps<T> {
    getItems(pageNo: number, signal: AbortSignal): Promise<{items: Array<T>, pageCount: number}>;
    children: (items: Array<T>) => JSX.Element;
}

interface IState<T> {
    currentPage: number;
    items: Array<T> | null;
}

export class WithPagination<T> extends React.PureComponent<IProps<T>, IState<T>> {
    private pageCount: number;
    private abortController: AbortController;
    private ref: HTMLDivElement | null;
    private inProgress: boolean;

    constructor(props: IProps<T>) {
        super(props);

        this.state = {
            currentPage: 1,
            items: null,
        };

        this.switchPage = this.switchPage.bind(this);

        this.pageCount = 0;
        this.abortController = new window.AbortController();
        this.ref = null;
        this.inProgress = false;
    }

    switchPage(page: number) {
        if (this.inProgress) {
            this.abortController.abort();
        }

        this.inProgress = true;
        this.props.getItems(page, this.abortController.signal).then((res) => {
            this.inProgress = false;
            this.setState({items: res.items, currentPage: page}, () => {
                const scrollableEl = this.getScrollParent(this.ref);
                const diff = scrollableEl != null && this.ref?.scrollHeight != null
                    ? parseInt(window.getComputedStyle(scrollableEl).height, 10) - this.ref?.clientHeight
                    : null;

                if (scrollableEl != null) {
                    scrollableEl.scrollTop = diff != null ? diff - 18 : 0;
                }
            });
        });
    }

    getScrollParent(element: HTMLElement | null): HTMLElement | null {
        if (element == null) {
            return null;
        }

        let pEl: HTMLElement | null = element;

        while (pEl !== null && window.getComputedStyle(pEl).overflowY !== ('auto' || 'scroll')) {
            pEl = element.parentElement ?? null;
        }

        return pEl;
    }

    componentDidMount(): void {
        this.props.getItems(1, this.abortController.signal).then((res) => {
            this.pageCount = res.pageCount ?? 20;
            this.setState({items: res.items});
        });
    }

    render() {
        if (this.state.items == null) {
            return null;
        }

        const pagination = (
            <div className="sd-pagination" ref={(el) => this.ref = el}>
                <button
                    data-test-id="button1"
                    className="sd-pagination__item sd-pagination__item--start"
                    disabled={this.state.currentPage === 1}
                    onClick={() => this.switchPage(1)}
                >
                    <div>icon1</div>
                </button>
                <button
                    data-test-id="button2"
                    className="sd-pagination__item sd-pagination__item--start"
                    disabled={this.state.currentPage <= 1}
                    onClick={() => this.switchPage(this.state.currentPage - 1)}
                >
                    <div>icon1-1</div>
                </button>
                {
                    (this.state.currentPage === this.pageCount || this.state.currentPage === this.pageCount - 1) && (
                        <>
                            <button
                                data-test-id="button3"
                                className="sd-pagination__item"
                                onClick={() => this.switchPage(1)}
                            >
                                {1}
                            </button>
                            <span className="sd-pagination__item sd-pagination__item--more">...</span>
                        </>
                    )
                }
                {
                    this.pageCount === this.state.currentPage && this.state.currentPage - 2 > 0 &&
                    (
                        <button
                            data-test-id="button4"
                            className="sd-pagination__item"
                            onClick={() => this.switchPage(this.state.currentPage - 2)}
                        >
                            {this.state.currentPage - 2}
                        </button>
                    )
                }
                {
                    this.state.currentPage > 1 &&
                    (
                        <button
                            data-test-id="button5"
                            className="sd-pagination__item"
                            onClick={() => this.switchPage(this.state.currentPage - 1)}
                        >
                            {this.state.currentPage - 1}
                        </button>
                    )
                }
                <button
                    data-test-id="button6"
                    className="sd-pagination__item sd-pagination__item--active"
                    onClick={() => this.switchPage(this.state.currentPage)}
                >
                    {this.state.currentPage}
                </button>
                {
                    this.state.currentPage < this.pageCount && (
                        <button
                            data-test-id="button7"
                            onClick={() => this.switchPage(this.state.currentPage + 1)}
                        >
                            {this.state.currentPage + 1}
                        </button>
                    )
                }
                {
                    this.state.currentPage !== this.pageCount - 1 && this.state.currentPage !== this.pageCount && (
                        <>
                            <span className="sd-pagination__item sd-pagination__item--more">...</span>
                            <button
                                data-test-id="button8"
                                className="sd-pagination__item"
                                onClick={() => this.switchPage(this.pageCount)}
                            >
                                {this.pageCount}
                            </button>
                        </>
                    )
                }
                <button
                    data-test-id="button9"
                    className="sd-pagination__item sd-pagination__item--forward"
                    onClick={() => this.switchPage(this.state.currentPage + 1)}
                    disabled={this.state.currentPage === this.pageCount}
                >
                    <div>icon2</div>
                </button>
                <button
                    data-test-id="button10"
                    className="sd-pagination__item sd-pagination__item--end"
                    onClick={() => this.switchPage(this.pageCount)}
                    disabled={this.state.currentPage === this.pageCount}
                >
                    <div>icon2-1</div>
                </button>
            </div>
        );

        return (
            <div
                style={{height: '100%', width: '100%'}}
                ref={(element) => {
                    this.ref = element;
                }}
            >
                {pagination}
                {this.props.children(this.state.items)}
                {pagination}
            </div>
        );
    }
}
