import * as React from 'react';
import {IRestApiResponse} from 'superdesk-api';
import {Icon} from 'superdesk-ui-framework';

interface IProps<T> {
    pageSize?: number;
    getItems(pageNo: number, signal: AbortSignal): Promise<IRestApiResponse<T>>;
    children: (items: Array<T>) => JSX.Element;
}

interface IState<T> {
    currentPage: number;
    items: Array<T> | null;
}

function getPagination(currentPage: number, totalPages: number): Array<number | 'dots'> {
    let basePages: ReturnType<typeof getPagination> = [
        currentPage - 2,
        currentPage - 1,
        currentPage,
        currentPage + 1,
        currentPage + 2,
    ].filter((page) => page >= 1 && page <= totalPages);

    if (!basePages.includes(1)) { // include first and maybe dots
        const firstInCurrentList = basePages[0];

        if (firstInCurrentList !== 1) {
            basePages = [
                'dots',
                ...basePages,
            ];
        }

        basePages = [
            1,
            ...basePages,
        ];
    }

    if (!basePages.includes(totalPages)) { // include last and maybe dots
        const lastInCurrentList = basePages[basePages.length - 1];

        if (lastInCurrentList !== totalPages - 1) { // add dots if we're skipping some numbers
            basePages = basePages.concat('dots');
        }

        basePages = [
            ...basePages,
            totalPages,
        ];
    }

    return basePages;
}

function getScrollParent(element: HTMLElement | null): HTMLElement | null {
    if (element == null) {
        return null;
    }

    let pEl: HTMLElement | null = element;

    while (pEl !== null && window.getComputedStyle(pEl).overflowY !== ('auto' || 'scroll')) {
        pEl = element.parentElement ?? null;
    }

    return pEl;
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
        this.getPageSize = this.getPageSize.bind(this);

        this.pageCount = 0;
        this.abortController = new AbortController();
        this.ref = null;
        this.inProgress = false;
    }

    getPageSize() {
        return this.props.pageSize ?? 20;
    }

    switchPage(page: number) {
        if (this.inProgress) {
            this.abortController.abort();
        }

        this.inProgress = true;
        this.props.getItems(page, this.abortController.signal).then((res) => {
            this.inProgress = false;
            this.setState({items: res._items, currentPage: page}, () => {
                const scrollableEl = getScrollParent(this.ref);
                const diff = scrollableEl != null && this.ref?.scrollHeight != null
                    ? scrollableEl.offsetHeight - this.ref?.scrollHeight
                    : null;

                if (scrollableEl != null) {
                    scrollableEl.scrollTop = diff != null ? diff : 0;
                }
            });
        });
    }

    componentDidMount(): void {
        this.props.getItems(1, this.abortController.signal).then((res) => {
            this.pageCount = Math.ceil(res._meta.total / this.getPageSize());
            this.setState({items: res._items});
        });
    }

    render() {
        if (this.state.items == null) {
            return null;
        }

        const pageElements = getPagination(this.state.currentPage, this.pageCount).map((el) => {
            if (el === 'dots') {
                return (
                    <span className='sd-pagination__item sd-pagination__item--more'>...</span>
                );
            } else {
                return (
                    <button
                        className='sd-pagination__item'
                        onClick={() => this.switchPage(el)}
                    >
                        {el}
                    </button>
                );
            }
        });

        pageElements.unshift(
            <>
                <button
                    className='sd-pagination__item sd-pagination__item--start'
                    disabled={this.state.currentPage === 1}
                    onClick={() => this.switchPage(1)}
                >
                    <Icon name='backward-thin' />
                </button>
                <button
                    className='sd-pagination__item sd-pagination__item--start'
                    disabled={this.state.currentPage <= 1}
                    onClick={() => this.switchPage(this.state.currentPage - 1)}
                >
                    <Icon name='chevron-left-thin' />
                </button>
            </>,
        );

        pageElements.push(
            <>
                <button
                    className='sd-pagination__item sd-pagination__item--forward'
                    onClick={() => this.switchPage(this.state.currentPage + 1)}
                    disabled={this.state.currentPage === this.pageCount}
                >
                    <Icon name='chevron-right-thin' />
                </button>
                <button
                    className='sd-pagination__item sd-pagination__item--end'
                    onClick={() => this.switchPage(this.pageCount)}
                    disabled={this.state.currentPage === this.pageCount}
                >
                    <Icon name='forward-thin' />
                </button>
            </>,
        );

        return (
            <div
                style={{height: '100%', width: '100%'}}
                ref={(element) => {
                    this.ref = element;
                }}
            >
                {pageElements}
                {this.props.children(this.state.items)}
                {pageElements}
            </div>
        );
    }
}
