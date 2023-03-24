-- Step 1: Create helper table to lookup guids, create non-mappable and deal with duplicates
CREATE TABLE IF NOT EXISTS application_etl (
    id SERIAL PRIMARY KEY,
    application_id int,
    card_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    duplicated bool DEFAULT false
);

TRUNCATE application_etl restart identity;

INSERT INTO
    application_etl (application_id, duplicated)
SELECT
    DISTINCT oa.alr_application_id AS application_id,
    CASE
        WHEN a.uuid IS NOT NULL THEN TRUE
        ELSE false
    END AS duplicated
FROM
    oats.oats_alr_applications AS oa
    LEFT JOIN alcs.application AS a ON oa.alr_application_id :: text = a.file_number;

-- Step 2: Create associated card
INSERT INTO
    alcs.card (uuid, audit_created_by, audit_deleted_date_at)
SELECT
    ae.card_uuid,
    'oats_etl',
    NOW()
FROM
    application_etl ae
WHERE
    ae.duplicated IS false;

-- Step 3: Perform a lookup to retrieve the applicant's name or organization for each application ID
WITH applicant_lookup AS (
    SELECT
        DISTINCT oaap.alr_application_id AS application_id,
        string_agg(DISTINCT oo.organization_name, ', ') FILTER (
            WHERE
                oo.organization_name IS NOT NULL
        ) AS orgs,
        string_agg(
            DISTINCT concat(op.first_name || ' ' || op.last_name),
            ', '
        ) FILTER (
            WHERE
                op.last_name IS NOT NULL
                OR op.first_name IS NOT NULL
        ) AS persons
    FROM
        oats.oats_alr_application_parties oaap
        LEFT JOIN oats.oats_person_organizations opo ON oaap.person_organization_id = opo.person_organization_id
        LEFT JOIN oats.oats_persons op ON op.person_id = opo.person_id
        LEFT JOIN oats.oats_organizations oo ON opo.organization_id = oo.organization_id
    WHERE
        oaap.alr_appl_role_code = 'APPL'
    GROUP BY
        oaap.alr_application_id
),
-- Step 4: Perform a lookup to retrieve the region code for each application ID
panel_lookup AS (
    SELECT
        DISTINCT oaap.alr_application_id AS application_id,
        oo2.organization_name AS panel_region
    FROM
        oats.oats_alr_application_parties oaap
        JOIN oats.oats_person_organizations opo ON oaap.person_organization_id = opo.person_organization_id
        JOIN oats.oats_organizations oo ON opo.organization_id = oo.organization_id
        JOIN oats.oats_organizations oo2 ON oo.parent_organization_id = oo2.organization_id
    WHERE
        oo2.organization_type_cd = 'PANEL'
),
-- Step 5: Insert new records into the alcs_applications table
INSERT INTO
    alcs.application (
        file_number,
        date_submitted_to_alc,
        summary,
        created_at,
        card_uuid,
        type_code,
        applicant,
        region_code,
        local_government_uuid,
        oats_import,
        audit_created_by
    )
SELECT
    oa.alr_application_id :: text AS file_number,
    oa.submitted_to_alc_date AS date_submitted_to_alc,
    oa.proposal_summary_desc AS summary,
    oa.created_date AS created_at,
    ae.card_uuid AS card_uuid,
    -- TODO: type code lookup
    'NARU',
    CASE
        WHEN applicant_lookup.orgs IS NOT NULL THEN applicant_lookup.orgs
        WHEN applicant_lookup.persons IS NOT NULL THEN applicant_lookup.persons
        ELSE 'Unknown'
    END AS applicant,
    -- TODO: panel region lookup
    'INTR',
    --Peace river TODO: local government lookup
    '001cfdad-bc6e-4d25-9294-1550603da980',
    -- WIP Import Fields. To be mapped to ALCS fields when created
    json_build_object(
        'application_class_code',
        oa.application_class_code,
        'legacy_application_nbr',
        oa.legacy_application_nbr,
        'submitted_to_alc_date',
        oa.submitted_to_alc_date,
        'proposal_background_desc',
        oa.proposal_background_desc,
        'current_land_use_desc',
        oa.current_land_use_desc,
        'applied_fee_amt',
        oa.applied_fee_amt,
        'fee_waived_ind',
        oa.fee_waived_ind,
        'fee_received_date',
        oa.fee_received_date,
        'split_fee_with_local_gov_ind',
        oa.split_fee_with_local_gov_ind,
        'staff_comment_observations',
        oa.staff_comment_observations,
        'reclamation_measure_desc',
        oa.reclamation_measure_desc,
        'equipment_desc',
        oa.equipment_desc,
        'on_site_processing_ind',
        oa.on_site_processing_ind,
        'agrologist_plan_ind',
        oa.agrologist_plan_ind,
        'project_end_date',
        oa.project_end_date,
        'agricultural_improvement_desc',
        oa.agricultural_improvement_desc,
        'non_agricultural_uses_desc',
        oa.non_agricultural_uses_desc,
        'buildings_desc',
        oa.buildings_desc,
        'created_date',
        oa.created_date,
        'created_guid',
        oa.created_guid,
        'submitted_to_lg_date',
        oa.submitted_to_lg_date,
        'submitted_to_lg_guid',
        oa.submitted_to_lg_guid,
        'accepted_by_lg_date',
        oa.accepted_by_lg_date,
        'accepted_by_lg_guid',
        oa.accepted_by_lg_guid,
        'submitted_to_alc_guid',
        oa.submitted_to_alc_guid,
        'cancelled_date',
        oa.cancelled_date,
        'cancelled_guid',
        oa.cancelled_guid,
        'rejected_by_lg_date',
        oa.rejected_by_lg_date,
        'rejected_by_lg_guid',
        oa.rejected_by_lg_guid,
        'validated_date',
        oa.validated_date,
        'validated_guid',
        oa.validated_guid,
        'zone',
        oa.zone,
        'economic_values_desc',
        oa.economic_values_desc,
        'cultural_values_desc',
        oa.cultural_values_desc,
        'social_values_desc',
        oa.social_values_desc,
        'regional_planning_desc',
        oa.regional_planning_desc,
        'alc_staff_id',
        oa.alc_staff_id,
        'mask_period',
        oa.mask_period,
        'followup_noi_ind',
        oa.followup_noi_ind,
        'followup_noi_number',
        oa.followup_noi_number,
        'ministry_notice_ind',
        oa.ministry_notice_ind,
        'ministry_notice_ref_no',
        oa.ministry_notice_ref_no,
        'audited_ind',
        oa.audited_ind,
        'applicant_file_no',
        oa.applicant_file_no,
        'terms',
        oa.terms,
        'plan_no',
        oa.plan_no,
        'control_no',
        oa.control_no,
        'email_response_date',
        oa.email_response_date,
        'srw_ind',
        oa.srw_ind
    ) AS oats_import,
    'oats_etl'
FROM
    oats.oats_alr_applications AS oa
    JOIN application_etl AS ae ON oa.alr_application_id = ae.application_id
    LEFT JOIN applicant_lookup ON oa.alr_application_id = applicant_lookup.application_id
    LEFT JOIN panel_lookup ON oa.alr_application_id = panel_lookup.application_id
WHERE
    ae.duplicated IS false;