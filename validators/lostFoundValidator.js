// Server-side validation for the Lost & Found post form.
const { LOST_FOUND_TYPES, LOST_FOUND_CATEGORIES } = require('../config/constants');
const { text, isValidDateTimeLocal, toDbDateTime } = require('./common');

// Only http(s) links are allowed as images – this blocks "javascript:" and "data:" URLs.
// Returns the normalised link (quotes, spaces etc. percent-encoded) or null if not allowed.
function normaliseImageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

function validatePost(body) {
  const values = {
    postType: text(body.postType),
    title: text(body.title),
    description: text(body.description),
    category: text(body.category),
    locationLabel: text(body.locationLabel),
    occurredAt: text(body.occurredAt),
    imageUrl: text(body.imageUrl),
    shareContact: body.shareContact === 'yes',
    contactInfo: text(body.contactInfo),
  };
  const errors = {};

  if (!Object.hasOwn(LOST_FOUND_TYPES, values.postType)) errors.postType = 'Choose Lost or Found.';

  if (values.title.length < 5) errors.title = 'Title must be at least 5 characters.';
  else if (values.title.length > 150) errors.title = 'Title must be 150 characters or fewer.';

  if (values.description.length < 10) errors.description = 'Description must be at least 10 characters.';
  else if (values.description.length > 2000) errors.description = 'Description must be 2000 characters or fewer.';

  if (!Object.hasOwn(LOST_FOUND_CATEGORIES, values.category)) errors.category = 'Choose a category.';

  if (!values.locationLabel) errors.locationLabel = 'Enter the general area, e.g. “Library, 2nd floor”.';
  else if (values.locationLabel.length > 150) errors.locationLabel = 'Location must be 150 characters or fewer.';

  if (values.occurredAt) {
    if (!isValidDateTimeLocal(values.occurredAt)) errors.occurredAt = 'Enter a valid date and time.';
    else if (new Date(values.occurredAt) > new Date()) errors.occurredAt = 'This can’t be in the future.';
  }

  if (values.imageUrl) {
    const normalised = normaliseImageUrl(values.imageUrl);
    if (!normalised) errors.imageUrl = 'Enter a link starting with https://';
    else if (normalised.length > 500) errors.imageUrl = 'Image link must be 500 characters or fewer.';
    else values.imageUrl = normalised;
  }

  // Contact info is opt-in: without the tick box it is thrown away, never stored
  if (!values.shareContact) values.contactInfo = '';
  else if (!values.contactInfo) errors.contactInfo = 'Enter how people can contact you, or untick the box.';
  else if (values.contactInfo.length > 150) errors.contactInfo = 'Contact info must be 150 characters or fewer.';

  return { values, errors };
}

function toDbPost(values) {
  return {
    postType: values.postType,
    title: values.title,
    description: values.description,
    category: values.category,
    locationLabel: values.locationLabel,
    occurredAt: toDbDateTime(values.occurredAt),
    imageUrl: values.imageUrl || null,
    contactInfo: values.contactInfo || null,
  };
}

module.exports = { validatePost, toDbPost };
