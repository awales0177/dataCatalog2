import React from 'react';
import RulesMasterList from '../components/RulesMasterList';

/**
 * Full-page data quality rules catalog at `/rules` (UUX dh layout). Per-model editing uses the workbench Rule Builder
 * modal or the model Quality Rules tab.
 */
const RuleBuilderPage = () => <RulesMasterList />;

export default RuleBuilderPage;
