var actionUtils = require('sails/lib/hooks/blueprints/actionUtil');

/**
 * @param req
 * @param res
 * @returns {*}
 */
module.exports = function findOneRecord(req, res) {

  var keys = Object.keys(req.params)
    , criteria = {}
    , key
    , Model
    , query;

  if (keys.length > 1) {
    return res.badRequest('findOneSimple accepts no more than one parameter.');
  }

  key      = keys[0];
  criteria = actionUtils.parseCriteria(req);
  Model    = actionUtils.parseModel(req);

  if (req.param(key)) {
    criteria[key] = req.param(key);
  }

  query = Model.findOne(criteria);
  query = actionUtils.populateEach(query, req);

  query.exec(function found(err, matchingRecord) {
    if (err) {
      return res.serverError(err);
    }

    if (!matchingRecord) {
      return res.notFound('No record found with the specified `'+ key +'`.');
    }

    if (sails.hooks.pubsub && req.isSocket) {
      Model.subscribe(req, matchingRecord);
      actionUtils.subscribeDeep(req, matchingRecord);
    }

    res.ok(matchingRecord);
  });
};
