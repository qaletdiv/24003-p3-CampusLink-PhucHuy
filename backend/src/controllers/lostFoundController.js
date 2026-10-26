// Lost & Found posts. Viewing is public; posting and managing need login (owner checks here).
const lostFoundService = require('../services/lostFoundService');
const { LOST_FOUND_STATUSES } = require('../config/constants');
const { parseListQuery, hasActiveFilters } = require('../utils/lostFoundQuery');
const { listResponse } = require('../utils/listQuery');
const { validatePost, toDbPost } = require('../validators/lostFoundValidator');
const { httpError, assertValid, parseId } = require('../utils/httpError');

async function findPostOr404(idParam) {
  const id = parseId(idParam);
  const post = id && (await lostFoundService.getById(id));
  if (!post) throw httpError(404, 'This post does not exist.');
  return post;
}

async function findOwnedPost(req) {
  const post = await findPostOr404(req.params.id);
  if (post.user_id !== req.session.user.id) throw httpError(403, 'You can only manage your own posts.');
  return post;
}

// GET /api/lost-found?q=&type=&category=&posted=&status=&page=
async function list(req, res) {
  const filters = parseListQuery(req.query);
  const result = await lostFoundService.search(filters);

  res.json(
    listResponse(result.posts, result, {
      filters: { ...filters, page: result.page },
      hasActiveFilters: hasActiveFilters(filters),
    })
  );
}

// GET /api/lost-found/:id
async function detail(req, res) {
  const post = await findPostOr404(req.params.id);
  const user = req.session.user;
  res.json({ data: post, isOwner: Boolean(user && user.id === post.user_id) });
}

// POST /api/lost-found
async function create(req, res) {
  const { values, errors } = validatePost(req.body);
  assertValid(errors);

  const id = await lostFoundService.create(req.session.user.id, toDbPost(values));
  res.status(201).json({
    data: { id },
    message: 'Your post is live. Remember to mark it Resolved when it’s sorted.',
  });
}

// PUT /api/lost-found/:id
async function update(req, res) {
  const post = await findOwnedPost(req);
  if (post.status !== 'open') throw httpError(409, 'Reopen the post before editing it.');

  const { values, errors } = validatePost(req.body);
  assertValid(errors);

  const updated = await lostFoundService.update(post.id, req.session.user.id, toDbPost(values));
  if (!updated) throw httpError(409, 'Reopen the post before editing it.');
  res.json({ message: 'Your post has been updated.' });
}

// PATCH /api/lost-found/:id/status – body: status (open | resolved | closed)
async function setStatus(req, res) {
  const post = await findOwnedPost(req);
  const status = req.body.status;
  assertValid(Object.hasOwn(LOST_FOUND_STATUSES, status) ? {} : { status: 'Choose a valid status.' });

  await lostFoundService.setStatus(post.id, req.session.user.id, status);
  res.json({ message: `Post marked as ${LOST_FOUND_STATUSES[status]}.` });
}

module.exports = { list, detail, create, update, setStatus };
