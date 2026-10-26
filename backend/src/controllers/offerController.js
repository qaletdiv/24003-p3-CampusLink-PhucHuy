// Offer Help: send, withdraw, accept, decline, and "My offers".
const helpRequestService = require('../services/helpRequestService');
const offerService = require('../services/offerService');
const { validateOffer } = require('../validators/offerValidator');
const { httpError, assertValid, parseId } = require('../utils/httpError');
const { sendResult } = require('../utils/serviceResult');

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

// POST /api/help-requests/:id/offers – body: message, preferredMode
async function create(req, res) {
  const request = await findRequestOr404(req.params.id);

  const check = await offerService.checkCanOffer(request, req.session.user.id);
  if (!check.ok) throw httpError(409, check.message);

  const { values, errors } = validateOffer(req.body);
  assertValid(errors);

  const result = await offerService.create(request.id, req.session.user.id, values);
  if (!result.ok) throw httpError(409, result.message);
  res.status(201).json({
    data: { id: result.offerId },
    message: 'Your offer has been sent. The request owner will review it.',
  });
}

// POST /api/offers/:id/withdraw – sender only
async function withdraw(req, res) {
  const offer = await findOfferOr404(req.params.id);
  if (offer.helper_user_id !== req.session.user.id) {
    throw httpError(403, 'You can only withdraw your own offers.');
  }

  const result = await offerService.withdraw(offer.id, req.session.user.id);
  sendResult(res, result, 'Your offer has been withdrawn.');
}

// POST /api/offers/:id/decline – request owner only
async function decline(req, res) {
  const offer = await findOfferOr404(req.params.id);
  if (offer.owner_user_id !== req.session.user.id) {
    throw httpError(403, 'You can only manage offers on your own requests.');
  }

  const result = await offerService.decline(offer.id, req.session.user.id);
  sendResult(res, result, 'The offer has been declined.');
}

// POST /api/offers/:id/accept – request owner only. Answers with the new help session's id.
async function accept(req, res) {
  const offer = await findOfferOr404(req.params.id);
  if (offer.owner_user_id !== req.session.user.id) {
    throw httpError(403, 'You can only manage offers on your own requests.');
  }

  const result = await offerService.accept(offer.id, req.session.user.id);
  sendResult(
    res,
    result,
    'Offer accepted! A help session has been created. Agree on the details with your helper.',
    { data: { sessionId: result.sessionId } }
  );
}

// GET /api/offers
async function listMine(req, res) {
  res.json({ data: await offerService.listByHelper(req.session.user.id) });
}

module.exports = { create, withdraw, decline, accept, listMine };
