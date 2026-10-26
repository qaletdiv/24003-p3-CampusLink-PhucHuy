// Help request pages (HTML) and REST API endpoints (JSON).
// Both use the same service, so the data and rules stay identical.
const helpRequestService = require('../services/helpRequestService');
const offerService = require('../services/offerService');
const sessionService = require('../services/sessionService');
const {
  SORT_OPTIONS,
  parseListQuery,
  buildListUrl,
  hasActiveFilters,
} = require('../utils/helpRequestQuery');
const { validateHelpRequest, toDbValues } = require('../validators/helpRequestValidator');
const { buildPageList } = require('../utils/pagination');
const { toDateTimeLocal } = require('../utils/format');
const { httpError, parseId } = require('../utils/httpError');

async function findRequestOr404(idParam) {
  const id = parseId(idParam);
  const request = id && (await helpRequestService.getById(id));
  if (!request) throw httpError(404, 'This help request does not exist.');
  return request;
}

// Loads the request and makes sure the logged-in user is its owner.
async function findOwnedRequest(req) {
  const request = await findRequestOr404(req.params.id);
  if (request.user_id !== req.session.user.id) {
    throw httpError(403, 'You can only manage your own help requests.');
  }
  return request;
}

// Database row -> values for the form inputs
function toFormValues(request) {
  return {
    title: request.title,
    description: request.description,
    category: request.category,
    supportMode: request.support_mode,
    locationLabel: request.location_label || '',
    scheduledAt: toDateTimeLocal(request.scheduled_at),
  };
}

function renderForm(res, status, options) {
  res.status(status).render('help/form', {
    errors: {},
    request: null,
    minDateTime: toDateTimeLocal(new Date()),
    ...options,
  });
}

// ----- Pages -----

// GET /help
async function showList(req, res) {
  const filters = parseListQuery(req.query);
  const result = await helpRequestService.search(filters);
  const currentFilters = { ...filters, page: result.page };

  res.render('help/list', {
    pageTitle: 'Find Help',
    filters: currentFilters,
    sortOptions: SORT_OPTIONS,
    hasActiveFilters: hasActiveFilters(filters),
    ...result,
    pageList: buildPageList(result.page, result.totalPages),
    pageUrl: (page) => buildListUrl(currentFilters, { page }),
  });
}

// GET /help/:id
// Everyone sees the request. The owner also sees all offers; another logged-in user
// sees only their own offer. The session link is shown only to its two participants.
async function showDetail(req, res) {
  const request = await findRequestOr404(req.params.id);
  const currentUser = res.locals.currentUser;
  const isOwner = Boolean(currentUser && currentUser.id === request.user_id);

  let offers = [];
  let myOffer = null;
  let session = null;

  if (currentUser) {
    if (isOwner) offers = await offerService.listForRequest(request.id);
    else myOffer = await offerService.getLatestByHelper(request.id, currentUser.id);

    const latestSession = await sessionService.getLatestForRequest(request.id);
    const isParticipant =
      latestSession &&
      [latestSession.requester_user_id, latestSession.helper_user_id].includes(currentUser.id);
    if (isParticipant) session = latestSession;
  }

  res.render('help/detail', {
    pageTitle: request.title,
    request,
    isOwner,
    offers,
    myOffer,
    session,
    loginUrl: `/login?returnTo=${encodeURIComponent(req.originalUrl)}`,
  });
}

// GET /help/new
function showNewForm(req, res) {
  renderForm(res, 200, {
    pageTitle: 'Post a help request',
    values: { supportMode: 'in_person' },
  });
}

// POST /help
async function create(req, res) {
  const { values, errors } = validateHelpRequest(req.body);

  if (Object.keys(errors).length > 0) {
    return renderForm(res, 422, { pageTitle: 'Post a help request', values, errors });
  }

  const id = await helpRequestService.create(req.session.user.id, toDbValues(values));
  req.flash('success', 'Your help request has been posted.');
  res.redirect(`/help/${id}`);
}

// GET /help/:id/edit
async function showEditForm(req, res) {
  const request = await findOwnedRequest(req);

  if (request.status !== 'open') {
    req.flash('error', 'Only open requests can be edited.');
    return res.redirect(`/help/${request.id}`);
  }

  renderForm(res, 200, {
    pageTitle: 'Edit help request',
    request,
    values: toFormValues(request),
  });
}

// POST /help/:id/edit
async function update(req, res) {
  const request = await findOwnedRequest(req);
  const { values, errors } = validateHelpRequest(req.body, request);

  if (Object.keys(errors).length > 0) {
    return renderForm(res, 422, { pageTitle: 'Edit help request', request, values, errors });
  }

  const updated = await helpRequestService.update(request.id, req.session.user.id, toDbValues(values));
  if (!updated) {
    req.flash('error', 'This request is no longer open, so it can’t be edited.');
  } else {
    req.flash('success', 'Your changes have been saved.');
  }
  res.redirect(`/help/${request.id}`);
}

// POST /help/:id/cancel
async function cancel(req, res) {
  const request = await findOwnedRequest(req);
  const result = await helpRequestService.cancel(request.id, req.session.user.id);

  req.flash(result.ok ? 'success' : 'error', result.ok ? 'Your help request has been cancelled.' : result.message);
  res.redirect(`/help/${request.id}`);
}

// POST /help/:id/reopen – after the help session was cancelled
async function reopen(req, res) {
  const request = await findOwnedRequest(req);
  const result = await helpRequestService.reopen(request.id, req.session.user.id);

  req.flash(
    result.ok ? 'success' : 'error',
    result.ok ? 'Your request is open again. Other students can now offer help.' : result.message
  );
  res.redirect(`/help/${request.id}`);
}

// ----- REST API -----

// GET /api/help-requests?q=&category=&mode=&status=&sort=&page=
async function apiList(req, res) {
  const filters = parseListQuery(req.query);
  const { requests, total, page, totalPages, pageSize } = await helpRequestService.search(filters);

  res.json({
    data: requests,
    pagination: { page, pageSize, total, totalPages },
    filters: { ...filters, page },
  });
}

// GET /api/help-requests/:id
async function apiDetail(req, res) {
  const request = await findRequestOr404(req.params.id);
  res.json({ data: request });
}

module.exports = {
  showList,
  showDetail,
  showNewForm,
  create,
  showEditForm,
  update,
  cancel,
  reopen,
  apiList,
  apiDetail,
};
