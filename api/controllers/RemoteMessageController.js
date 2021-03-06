module.exports = {
  inbox : function (req, res) {
    var user           = req.param('user'),
        threadCriteria = {
          sort : 'updatedAt desc', // updatedAt gets upped on new reply
          where: {
            or: [
              { to  : user },
              { from: user }
            ]
          },
          limit: 60,
        },
        messageCriteria = {
          limit: 1,
          sort : 'createdAt desc'
        },
        findQuery;

    findQuery = sails.models.thread.find(threadCriteria);

    findQuery.populate('from').populate('to').populate('messages', messageCriteria);

    findQuery.exec(function (error, results) {
      if (error) {
        return res.serverError('database_error', error);
      }

      res.json(sails.services.messageservice.flatten(user, results));
    });
  },

  markMsgRead: function (req, res) {
    var user    = req.param('user'),
        message = req.param('message');

    if (!message) {
      return res.badRequest('missing_parameter', 'message');
    }

    sails.models.message.update({to: user, id: message}, {read: true}).exec(function (error) {
      if (error) {
        return res.serverError('database_error', error);
      }

      res.ok({status: 'ok'});
    });
  },

  unreadMessages: function (req, res) {
    var user = req.param('user');

    sails.models.message.count({read: false, to: user}, function (error, unreadCount) {
      if (error) {
        return res.serverError('database_error', error);
      }

      res.ok({count: unreadCount});
    });
  },

  findThread : function (req, res) {
    var user  = req.param('user'),
        where = {
          or: [
            {to  : user},
            {from: user}
          ]
        };

    sails.models.thread.find(where).exec(function (error, result) {
      if (error) {
        return res.serverError('database_error', error);
      }

      res.ok(result);
    });
  },

  markThreadRead: function (req, res) {
    var user   = req.param('user'),
        thread = req.param('thread'),
        searchCriteria;

    if (!thread) {
      return res.badRequest('missing_parameter', 'thread');
    }

    searchCriteria = {
      where: {
        to    : user,
        thread: thread
      }
    };

    return sails.models.message.update(searchCriteria, {read: true}).exec(function (error) {
      if (error) {
        return res.serverError('database_error', error);
      }

      return res.ok({status: 'ok'});
    });
  },

  getThreadCount: function (req, res) {
    var user = req.param('user');

    async.parallel({
      to : function (callback) {
        sails.models.thread.count({to: user}, callback);
      },
      from : function (callback) {
        sails.models.thread.count({from: user}, callback);
      }
    }, function (error, results) {
      if (error) {
        return res.negotiate(error);
      }

      res.ok({count: results.to + results.from});
    });
  },

  loadMessages : function (req, res) {
    var thread  = req.param('thread'),
        user    = req.param('user'),
        query   = {
          where: {
            or: [
              { from: user },
              { to  : user }
            ],
            thread: thread
          },
          limit: 30,
          sort : 'createdAt desc'
        };

    sails.models.message.find(query)
      .populate('from')
      .populate('to')
      .populate('thread')
      .exec(function (error, result) {
        if (error) {
          return res.serverError('database_error', error);
        }

        res.ok(result);
      });
  },

  reply : function (req, res) {
    var user     = req.param('user'),
        thread   = req.param('thread'),
        content  = req.param('content'),
        receiver = req.param('receiver'),
        query;

    if (!thread) {
      return res.badRequest('missing_parameter', 'thread');
    }

    if (!content) {
      return res.badRequest('missing_parameter', 'content');
    }

    if (!receiver) {
      return res.badRequest('missing_parameter', 'receiver');
    }

    query = {
      thread : thread,
      body   : content,
      read   : 0,
      from   : user,
      initial: 0
    };

    // check if receiver exists
    sails.models.user.findOne({username: receiver}).exec(function (error, userResult) {
      if (error) {
        return res.serverError('database_error', error);
      }

      if (!userResult) {
        return res.badRequest('invalid_receiver');
      }

      query.to = userResult.id;

      // check if thread exists
      sails.models.thread.findOne(thread).exec(function (error, threadResult) {
        if (error) {
          return res.serverError('database_error', error);
        }

        if (!threadResult) {
          return res.badRequest('invalid_thread');
        }

        sails.models.message.create(query).exec(function (error, result) {
          if (error) {
            return res.serverError('database_error', error);
          }

          res.ok(result);
        });
      });
    });
  }
};
