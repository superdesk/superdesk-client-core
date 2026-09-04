import {Locator, expect} from '@playwright/test';

export interface IContentExpiry {
    days: number;
    hours: number;
    minutes: number;
}

/**
 * Driver for the `sd-content-expiry` directive, which renders the Content
 * Expiry control identically for desks, stages and ingest sources.
 */
export class ContentExpiryField {
    private root: Locator;

    constructor(root: Locator) {
        this.root = root;
    }

    get row(): Locator {
        return this.root.getByTestId('content-expiry');
    }

    /**
     * The "Using <Desk|System> default" / "OFF" badge. It only renders while
     * this level has no expiry of its own, so it shows what the level inherits.
     */
    get effective(): Locator {
        return this.row.getByTestId('content-expiry--effective');
    }

    /** The days / hours / minutes inputs only render while the toggle is on. */
    async set(expiry: IContentExpiry): Promise<void> {
        const days = this.row.getByTestId('content-expiry--days');

        await expect(this.row).toBeVisible();

        if (await days.count() === 0) {
            await this.row.getByTestId('content-expiry--toggle').click();
        }

        await days.fill(String(expiry.days));
        await this.row.getByTestId('content-expiry--hours').fill(String(expiry.hours));
        await this.row.getByTestId('content-expiry--minutes').fill(String(expiry.minutes));
    }

    /** Switching the toggle off stores `-1`, the directive's "no expiry here". */
    async turnOff(): Promise<void> {
        await expect(this.row).toBeVisible();

        if (await this.row.getByTestId('content-expiry--days').count() > 0) {
            await this.row.getByTestId('content-expiry--toggle').click();
        }

        await expect(this.row.getByTestId('content-expiry--days')).toHaveCount(0);
    }

    async expectValue(expiry: IContentExpiry): Promise<void> {
        await expect(this.row.getByTestId('content-expiry--days')).toHaveValue(String(expiry.days));
        await expect(this.row.getByTestId('content-expiry--hours')).toHaveValue(String(expiry.hours));
        await expect(this.row.getByTestId('content-expiry--minutes')).toHaveValue(String(expiry.minutes));
    }
}
