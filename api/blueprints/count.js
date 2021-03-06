var actionUtil = require('sails/lib/hooks/blueprints/actionUtil');

module.exports = function getCount (req, res) {

  var Model = actionUtil.parseModel(req)
    , criteria = actionUtil.parseCriteria(req);
  
  Model.count(criteria, function(error, response) {
    if (error) {
      return res.serverError('database_error', error);
    }

    res.ok({count: response});
  });
};
