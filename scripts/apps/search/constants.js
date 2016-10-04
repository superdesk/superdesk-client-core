
/**
  * Global search parameters and label mapping.
 */
export const PARAMETERS = Object.freeze({
    unique_name: 'Unique Name',
    original_creator: 'Creator',
    from_desk: 'From Desk',
    to_desk: 'To Desk',
    spike: 'In Spiked',
    subject: 'Subject',
    company_codes: 'Company Codes',
    ingest_provider: 'Provider'
});

/**
 * Facet field and label mapping and used when facets are removed.
 */
export const EXCLUDE_FACETS = Object.freeze({
    notdesk: 'Not Desk',
    nottype: 'Not Type',
    notgenre: 'Not Genre',
    notcategory: 'Not Category',
    noturgency: 'Not Urgency',
    notsource: 'Not Source',
    notpriority: 'Not Priority',
    notlegal: 'Not Legal',
    notsms: 'Not Sms'
});
