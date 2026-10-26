// Help requests: list/search, detail, create, edit, cancel, reopen.
const helpRequestService = require('../services/helpRequestService');
const offerService = require('../services/offerService');
const sessionService = require('../services/sessionService');
const { parseListQuery, hasActiveFilters } = require('../utils/helpRequestQuery');
const { listResponse } = require('../utils/listQuery');
const { validateHelpRequest, toDbValues } = require('../validators/helpRequestValidator');
const { httpError, assertValid, parseId } = require('../utils/httpError');
const { sendResult } = require('../utils/serviceResult');

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

// GET /api/help-requests?q=&category=&mode=&status=&sort=&page=
async function list(req, res) {
  const filters = parseListQuery(req.query);
  const result = await helpRequestService.search(filters);

  res.json(
    listResponse(result.requests, result, {
      filters: { ...filters, page: result.page },
      hasActiveFilters: hasActiveFilters(filters),
    })
  );
}

// GET /api/help-requests/:id
// Everyone sees the request. The owner also gets all offers; another logged-in user
// gets only their own offer. The session is included only for its two participants.
async function detail(req, res) {
  const request = await findRequestOr404(req.params.id);
  const user = req.session.user;
  const isOwner = Boolean(user && user.id === request.user_id);

  let offers = [];
  let myOffer = null;
  let session = null;

  if (user) {
    if (isOwner) offers = await offerService.listForRequest(request.id);
    else myOffer = await offerService.getLatestByHelper(request.id, user.id);

    const latestSession = await sessionService.getLatestForRequest(request.id);
    const isParticipant =
      latestSession && [latestSession.requester_user_id, latestSession.helper_user_id].includes(user.id);
    if (isParticipant) session = latestSession;
  }

  res.json({ data: request, isOwner, offers, myOffer, session });
}

// POST /api/help-requests
async function create(req, res) {
  const { values, errors } = validateHelpRequest(req.body);
  assertValid(errors);

  const id = await helpRequestService.create(req.session.user.id, toDbValues(values));
  res.status(201).json({ data: { id }, message: 'Your help request has been posted.' });
}

// PUT /api/help-requests/:id
async function update(req, res) {
  const request = await findOwnedRequest(req);
  if (request.status !== 'open') throw httpError(409, 'Only open requests can be edited.');

  const { values, errors } = validateHelpRequest(req.body, request);
  assertValid(errors);

  const updated = await helpRequestService.update(request.id, req.session.user.id, toDbValues(values));
  if (!updated) throw httpError(409, 'This request is no longer open, so it can’t be edited.');
  res.json({ message: 'Your changes have been saved.' });
}

// POST /api/help-requests/:id/cancel
async function cancel(req, res) {
  const request = await findOwnedRequest(req);
  const result = await helpRequestService.cancel(request.id, req.session.user.id);
  sendResult(res, result, 'Your help request has been cancelled.');
}

// POST /api/help-requests/:id/reopen – after the help session was cancelled
async function reopen(req, res) {
  const request = await findOwnedRequest(req);
  const result = await helpRequestService.reopen(request.id, req.session.user.id);
  sendResult(res, result, 'Your request is open again. Other students can now offer help.');
}

module.exports = { list, detail, create, update, cancel, reopen };
