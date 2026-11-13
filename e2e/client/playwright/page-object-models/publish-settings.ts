import {Locator, Page, expect} from '@playwright/test';

/**
 * Picks a leaf value in an `sd-meta-terms` typeahead by opening it, typing to
 * narrow the list, and clicking the matching option. Clicking the resolved
 * option is deterministic where the keyboard-driven type+ArrowDown+Enter path
 * (used elsewhere) is flaky. Shared between the settings screens and authoring
 * (the Subject field is the same control).
 *
 * Only leaf terms are supported: a parent category would open a subtree instead
 * of committing, and that "choose entire category" flow races with the control's
 * async list reload. Callers pass a leaf (e.g. a subject with no children).
 */
export async function selectMetaTerm(container: Locator, value: string): Promise<void> {
    const input = container.locator('.dropdown__menu input').first();

    // Idempotent open: don't re-toggle (which would close) if already open on a retry.
    if (!(await input.isVisible().catch(() => false))) {
        await container.locator('.dropdown__toggle').first().click();
    }

    await expect(input).toBeVisible();
    await input.fill(value);

    // The matched term renders as a button; `getByRole` ignores the hidden
    // duplicates the CV tree renders in collapsed branches.
    const option = container.getByRole('button', {name: value}).first();

    await expect(option).toBeVisible();
    await option.click();

    await expect(
        container.locator('.terms-list').getByText(value, {exact: false}),
    ).toBeVisible();
}

/**
 * Drives the publishing-related admin settings used to route a published item
 * to a subscriber: filter conditions, content filters, products, and
 * subscribers (with a transmission destination).
 *
 * These settings screens are legacy AngularJS and expose few `data-test-id`
 * hooks, so the methods below locate controls by their `ng-model`/`id`/`ng-click`
 * bindings, mirroring the approach already used by content-filters.spec.ts.
 */
export class PublishSettings {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * These settings dialogs (`sd-modal`) intermittently fail to auto-close after a
     * successful save, and their static backdrop then blocks later clicks. So
     * confirm the save landed via a durable signal (the new row in the list behind
     * the modal) rather than by the modal closing, then close any lingering modal.
     */
    private async confirmSavedAndCloseModal(modal: Locator, listRow: Locator): Promise<void> {
        await expect(listRow.first()).toBeVisible();

        if (await modal.isVisible()) {
            await modal.getByRole('button', {name: 'Cancel', exact: true}).click();
        }
        await expect(modal).not.toBeVisible();
    }

    async openContentFiltersTab(tab: 'filter_conditions' | 'filters'): Promise<void> {
        await this.page.goto('/#/settings/content-filters');
        await this.page.locator(`[ng-click="ctrl.changeTab('${tab}')"]`).click();
    }

    /**
     * Creates a filter condition on a list-valued field (e.g. Subject), whose
     * value is chosen from an `sd-meta-terms` typeahead.
     */
    async createListFilterCondition(options: {
        name: string;
        field: string;
        operator: string;
        value: string;
    }): Promise<void> {
        const {page} = this;

        await page.locator('[data-test-id="add-new-filter-condition"]').click();

        const modal = page.locator('.modal.filter-condition-modal.in');

        await expect(modal).toBeVisible();
        await modal.locator('#filterCondition-name').fill(options.name);
        await modal.locator('select[ng-model="filterCondition.field"]')
            .selectOption({label: options.field});
        await modal.locator('select[ng-model="filterCondition.operator"]')
            .selectOption({label: options.operator});

        await selectMetaTerm(modal.locator('[sd-meta-terms]'), options.value);
        await modal.getByRole('button', {name: 'Save', exact: true}).click();

        // Confirm success by the new condition appearing in the list rather than by
        // the modal closing. The stored value is correct even when its chip is
        // cosmetically hidden: the control keeps it on the model, only the displayed
        // chip is scheme-filtered.
        await expect(
            page.locator('[ng-repeat*="filterCondition in filterConditions"]')
                .filter({hasText: options.name}).first(),
        ).toBeVisible();

        // The modal does not reliably auto-close after saving, and its backdrop would
        // block later clicks (SPA hash navigation does not tear it down). Close it.
        if (await modal.isVisible()) {
            await modal.getByRole('button', {name: 'Cancel', exact: true}).click();
        }
        await expect(modal).not.toBeVisible();
    }

    async createContentFilter(options: {
        name: string;
        filterConditionName: string;
    }): Promise<void> {
        const {page} = this;

        await page.locator('[ng-click="editFilter()"]').click();

        const modal = page.locator('.modal.content-filter-modal.in');

        await expect(modal).toBeVisible();
        await modal.locator('#contentFilter-name').fill(options.name);
        await modal.locator('select[ng-model="filterRow.selected"]').first()
            .selectOption({label: options.filterConditionName});
        await modal.locator('[ng-click="addFilter(filterRow, \'fc\')"]').first().click();

        await modal.getByRole('button', {name: 'Save', exact: true}).click();

        // Like the filter-condition modal, this dialog does not reliably auto-close
        // after saving. Confirm success via the list, then close it so its backdrop
        // cannot block later clicks.
        await expect(
            page.locator('[ng-repeat*="filter in contentFilters"]').filter({hasText: options.name}).first(),
        ).toBeVisible();

        if (await modal.isVisible()) {
            await modal.getByRole('button', {name: 'Cancel', exact: true}).click();
        }
        await expect(modal).not.toBeVisible();
    }

    /**
     * Creates a direct (non-API) product that permits only items matching the
     * given content filter.
     */
    async createProduct(options: {
        name: string;
        contentFilterName: string;
    }): Promise<void> {
        const {page} = this;

        await page.goto('/#/settings/products');
        await page.locator('[ng-click="newProduct()"]').click();

        const modal = page.locator('.modal.in').filter({has: page.locator('#product-name')});

        await expect(page.locator('#product-name')).toBeVisible();
        await page.locator('#product-name').fill(options.name);

        // A direct product is what a transmission (email) subscriber can select;
        // api/both are excluded from the subscriber's direct-products list.
        await page.locator('select[ng-model="product.edit.product_type"]')
            .selectOption({label: 'Direct'});

        await page.locator('select[ng-model="product.edit.content_filter.filter_id"]')
            .selectOption({label: options.contentFilterName});

        // Permitting: only items that pass the filter are routed through.
        await page.locator('.sd-check__group').getByText('Permitting', {exact: true}).click();

        await modal.getByRole('button', {name: 'Save', exact: true}).click();

        await this.confirmSavedAndCloseModal(
            modal,
            page.locator('[ng-repeat*="product in products"]').filter({hasText: options.name}),
        );
    }

    /**
     * Creates an active subscriber targeting all items, holding the given direct
     * product, with a single email destination using the given output format.
     */
    async createSubscriber(options: {
        name: string;
        email: string;
        productName: string;
        destinationName: string;
        format: string;
        recipients: string;
    }): Promise<void> {
        const {page} = this;

        await page.goto('/#/settings/publish');
        await page.locator('#addSubscriber').click();

        const modal = page.locator('.modal.in').filter({has: page.locator('#subscriber-name')});

        await expect(page.locator('#subscriber-name')).toBeVisible();

        // New subscribers default to inactive; an inactive subscriber is skipped
        // during publishing, so activate it via the Status switch.
        await page.locator('[ng-model="subscriber.is_active"]').click();

        await page.locator('#subscriber-name').fill(options.name);
        await page.locator('#subscriber-email').fill(options.email);
        await page.locator('#subType').selectOption({label: 'All'});

        await selectMetaTerm(
            page.locator('[data-field="products"]'),
            options.productName,
        );

        await page.locator('#subscriber-seq_num_settings\\.min').fill('1');
        await page.locator('#subscriber-seq_num_settings\\.max').fill('10');

        await page.locator('[ng-click="addNewDestination()"]').click();

        const destination = page.locator('[data-destination="newDestination"]');

        await destination.locator('#destination-name').fill(options.destinationName);
        await destination.locator('#destination-format').selectOption({label: options.format});
        await destination.locator('#destination-delivery-type').selectOption({label: 'Email'});
        await destination.locator('#recipients').fill(options.recipients);
        await destination.getByRole('button', {name: 'Save', exact: true}).click();

        // Footer Save enables once the destination is committed and the form is valid.
        const saveSubscriber = page.locator('[ng-click="save()"]');

        await expect(saveSubscriber).toBeEnabled();
        await saveSubscriber.click();

        await this.confirmSavedAndCloseModal(
            modal,
            page.getByTestId('subscriber-item').filter({hasText: options.name}),
        );
    }
}
