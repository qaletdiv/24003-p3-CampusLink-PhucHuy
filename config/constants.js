// Shared fixed values. Each key is what MySQL stores,
// each value is the label shown in the UI.

const HELP_CATEGORIES = {
  programming: 'Programming',
  math: 'Math',
  writing: 'Writing',
  campus_life: 'Campus Life',
  other: 'Other',
};

const SUPPORT_MODES = {
  in_person: 'In person',
  online: 'Online',
};

const HELP_REQUEST_STATUSES = {
  open: 'Open',
  matched: 'Matched',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const OFFER_STATUSES = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
  closed: 'Closed',
};

const SESSION_STATUSES = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const LOST_FOUND_TYPES = {
  lost: 'Lost',
  found: 'Found',
};

// Separate from HELP_CATEGORIES on purpose
const LOST_FOUND_CATEGORIES = {
  electronics: 'Electronics',
  wallets_bags: 'Wallets & bags',
  keys: 'Keys',
  cards_ids: 'Cards & IDs',
  clothing: 'Clothing',
  books_stationery: 'Books & stationery',
  other: 'Other',
};

const LOST_FOUND_STATUSES = {
  open: 'Open',
  resolved: 'Resolved',
  closed: 'Closed',
};

module.exports = {
  LOST_FOUND_TYPES,
  LOST_FOUND_CATEGORIES,
  LOST_FOUND_STATUSES,
  HELP_CATEGORIES,
  SUPPORT_MODES,
  HELP_REQUEST_STATUSES,
  OFFER_STATUSES,
  SESSION_STATUSES,
};
