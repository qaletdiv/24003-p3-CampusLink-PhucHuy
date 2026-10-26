// Lost & Found pages and read-only API.
const lostFoundService = require('../services/lostFoundService');
const { LOST_FOUND_STATUSES } = require('../config/constants');
const { POSTED_WITHIN, parseListQuery, buildListUrl, hasActiveFilters } = require('../utils/lostFoundQuery');
const { validatePost, toDbPost } = require('../validators/lostFoundValidator');
const { buildPageList } = require('../utils/pagination');
const { toDateTimeLocal } = require('../utils/format');
const { httpError, parseId } = require('../utils/httpError');

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

function toFormValues(post) {
  return {
    postType: post.post_type,
    title: post.title,
    description: post.description,
    category: post.category,
    locationLabel: post.location_label,
    occurredAt: toDateTimeLocal(post.occurred_at),
    imageUrl: post.image_url || '',
    shareContact: Boolean(post.contact_info),
    contactInfo: post.contact_info || '',
  };
}

function renderForm(res, status, options) {
  res.status(status).render('lost-found/form', {
    post: null,
    errors: {},
    maxDateTime: toDateTimeLocal(new Date()),
    ...options,
  });
}

// GET /lost-found
async function list(req, res) {
  const filters = parseListQuery(req.query);
  const result = await lostFoundService.search(filters);
  const currentFilters = { ...filters, page: result.page };

  res.render('lost-found/list', {
    pageTitle: 'Lost & Found',
    filters: currentFilters,
    postedOptions: POSTED_WITHIN,
    hasActiveFilters: hasActiveFilters(filters),
    ...result,
    pageList: buildPageList(result.page, result.totalPages),
    pageUrl: (page) => buildListUrl(currentFilters, { page }),
  });
}

// GET /lost-found/:id
async function showDetail(req, res) {
  const post = await findPostOr404(req.params.id);
  const user = req.session.user;
  res.render('lost-found/detail', {
    pageTitle: post.title,
    post,
    isOwner: Boolean(user && user.id === post.user_id),
  });
}

// GET /lost-found/new
function showNewForm(req, res) {
  const postType = ['lost', 'found'].includes(req.query.type) ? req.query.type : '';
  renderForm(res, 200, { pageTitle: 'Post to Lost & Found', values: { postType } });
}

// POST /lost-found
async function create(req, res) {
  const { values, errors } = validatePost(req.body);
  if (Object.keys(errors).length > 0) {
    return renderForm(res, 422, { pageTitle: 'Post to Lost & Found', values, errors });
  }

  const id = await lostFoundService.create(req.session.user.id, toDbPost(values));
  req.flash('success', 'Your post is live. Remember to mark it Resolved when it’s sorted.');
  res.redirect(`/lost-found/${id}`);
}

// GET /lost-found/:id/edit
async function showEditForm(req, res) {
  const post = await findOwnedPost(req);
  if (post.status !== 'open') {
    req.flash('error', 'Reopen the post before editing it.');
    return res.redirect(`/lost-found/${post.id}`);
  }
  renderForm(res, 200, { pageTitle: 'Edit post', post, values: toFormValues(post) });
}

// POST /lost-found/:id/edit
async function update(req, res) {
  const post = await findOwnedPost(req);
  const { values, errors } = validatePost(req.body);
  if (Object.keys(errors).length > 0) {
    return renderForm(res, 422, { pageTitle: 'Edit post', post, values, errors });
  }

  const updated = await lostFoundService.update(post.id, req.session.user.id, toDbPost(values));
  req.flash(updated ? 'success' : 'error', updated ? 'Your post has been updated.' : 'Reopen the post before editing it.');
  res.redirect(`/lost-found/${post.id}`);
}

// POST /lost-found/:id/status – body: status (open | resolved | closed)
async function setStatus(req, res) {
  const post = await findOwnedPost(req);
  const status = req.body.status;

  if (!Object.hasOwn(LOST_FOUND_STATUSES, status)) {
    req.flash('error', 'Choose a valid status.');
  } else {
    await lostFoundService.setStatus(post.id, req.session.user.id, status);
    req.flash('success', `Post marked as ${LOST_FOUND_STATUSES[status]}.`);
  }
  res.redirect(`/lost-found/${post.id}`);
}

// GET /api/lost-found
async function apiList(req, res) {
  const filters = parseListQuery(req.query);
  const { posts, total, page, totalPages, pageSize } = await lostFoundService.search(filters);
  res.json({ data: posts, pagination: { page, pageSize, total, totalPages }, filters: { ...filters, page } });
}

// GET /api/lost-found/:id
async function apiDetail(req, res) {
  res.json({ data: await findPostOr404(req.params.id) });
}

module.exports = { list, showDetail, showNewForm, create, showEditForm, update, setStatus, apiList, apiDetail };
