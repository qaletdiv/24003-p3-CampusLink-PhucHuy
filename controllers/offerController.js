// Offer Help: send, withdraw, accept, decline, and "My offers".
const helpRequestService = require('../services/helpRequestService');
const offerService = require('../services/offerService');
const { validateOffer } = require('../validators/offerValidator');
const { httpError, parseId } = require('../utils/httpError');

async function findRequestOr404(idParam) {
  const id = parseId(idParam);
  const request = id && (await helpRequestService.getById(id));
  if (!request) throw httpError(404, 'This help request does not exist.');
  return request;
}

async function findOfferOr404(idParam) {
  const id = parseId(idParam);
  const offer = id && (await offerService.getOfferWithRequest(id));
  if (!offer) throw httpError(404, 'This offer does not exist.');
  return offer;
}

// Shows the result of an action as a flash message, then goes back to the request page.
function finish(req, res, requestId, result, successMessage) {
  req.flash(result.ok ? 'success' : 'error', result.ok ? successMessage : result.message);
  res.redirect(`/help/${requestId}`);
}

// GET /help/:id/offer
async function showNewForm(req, res) {
  const request = await findRequestOr404(req.params.id);
  const check = await offerService.checkCanOffer(request, req.session.user.id);

  if (!check.ok) {
    req.flash('error', check.message);
    return res.redirect(`/help/${request.id}`);
  }

  res.render('offers/new', {
    pageTitle: 'Offer help',
    request,
    values: { preferredMode: request.support_mode },
    errors: {},
  });
}

// POST /help/:id/offers
async function create(req, res) {
  const request = await findRequestOr404(req.params.id);
  const { values, errors } = validateOffer(req.body);

  if (Object.keys(errors).length > 0) {
    return res.status(422).render('offers/new', { pageTitle: 'Offer help', request, values, errors });
  }

  const result = await offerService.create(request.id, req.session.user.id, values);
  finish(req, res, request.id, result, 'Your offer has been sent. The request owner will review it.');
}

// POST /offers/:id/withdraw – sender only
async function withdraw(req, res) {
  const offer = await findOfferOr404(req.params.id);
  if (offer.helper_user_id !== req.session.user.id) {
    throw httpError(403, 'You can only withdraw your own offers.');
  }

  const result = await offerService.withdraw(offer.id, req.session.user.id);
  finish(req, res, offer.help_request_id, result, 'Your offer has been withdrawn.');
}

// POST /offers/:id/decline – request owner only
async function decline(req, res) {
  const offer = await findOfferOr404(req.params.id);
  if (offer.owner_user_id !== req.session.user.id) {
    throw httpError(403, 'You can only manage offers on your own requests.');
  }

  const result = await offerService.decline(offer.id, req.session.user.id);
  finish(req, res, offer.help_request_id, result, 'The offer has been declined.');
}

// POST /offers/:id/accept – request owner only
async function accept(req, res) {
  const offer = await findOfferOr404(req.params.id);
  if (offer.owner_user_id !== req.session.user.id) {
    throw httpError(403, 'You can only manage offers on your own requests.');
  }

  const result = await offerService.accept(offer.id, req.session.user.id);
  if (!result.ok) return finish(req, res, offer.help_request_id, result);

  req.flash('success', 'Offer accepted! A help session has been created. Agree on the details with your helper.');
  res.redirect(`/sessions/${result.sessionId}`);
}

// GET /offers
async function listMine(req, res) {
  const offers = await offerService.listByHelper(req.session.user.id);
  res.render('offers/list', { pageTitle: 'My offers', offers });
}

module.exports = { showNewForm, create, withdraw, decline, accept, listMine };
