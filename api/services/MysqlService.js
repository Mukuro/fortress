/**
 * @todo fix password hashing on create and update for this import
 * @todo import remaining visitors (because of username)
 *
 *
 * @type {{migrate: Function}}
 */

module.exports = {
  migrate: function () {

    var threadModel = sails.models.thread;
    var messageModel = sails.models.message;
    var oldThreadModel = sails.models.threadold;
    var oldVisitorModel = sails.models.visitorold;
    var visitorModel = sails.models.visitor;
    var userModel = sails.models.user;
    var oldUserModel = sails.models.userold;
    var objectModel = sails.models.object;

    function clean (model) {
      delete model.id;
      delete model._id;
      delete model._modelName;
      delete model.user;

      return model;
    }

    function createThread (thread, callback) {
      if (thread.to === undefined || thread.from === undefined) {
        return callback(false);
      }

      createUser(thread.to, function (to) {
        createUser(thread.from, function (from) {
          thread = clean(thread.toObject());
          var oldMessages = thread.messages;

          thread.from = from.id;
          thread.to = to.id;

          delete thread.messages;

          threadModel.create(thread, function (error, created) {
            if (error) {
              console.error(error);
              process.exit();
            }

            createMessages(created, oldMessages, to, from, callback);
          });
        });
      });
    }

    function createMessage (thread, message, to, from, callback) {
      message = clean(message.toObject());

      message.thread = thread;
      message.from = from;
      message.to = to;

      messageModel.create(message).exec(function (error) {
        if (error) {
          console.log('error!', error);
          process.exit();
        }

        callback();
      });
    }

    function createMessages (thread, messages, to, from, callback) {
      async.eachSeries(messages, function (message, next) {
        createMessage(thread.id, message, to.id, from.id, next);
      }, function (error) {
        if (error) {
          console.log('error!', error);
          process.exit();
        }

        callback();
      });
    }

    function createUser (user, callback) {
      userModel.findOne({email: user.email}, function (error, userMatch) {
        if (error) {
          console.log('error!', error);
          process.exit();
        }

        if (userMatch) {
          return callback(userMatch);
        }

        oldUserModel.findOne(user.id).populate('performer').populate('visitor').exec(function (error, result) {

          var cleanUser = clean(user.toObject());

          if (typeof result.performer === 'object') {
            cleanUser.performer = clean(result.performer.toObject());
          }

          if (typeof result.visitor === 'object') {
            cleanUser.visitor = clean(result.visitor.toObject());
          }

          objectModel.findOne({host: sails.config.system.defaultObject.host}, function (error, res) {
            cleanUser.object = res.id;

            var pwd = cleanUser.password;

            cleanUser = JSON.parse(JSON.stringify(cleanUser));

            cleanUser.password = pwd;
            cleanUser._noHash = true;

            userModel.create(cleanUser).exec(function (error, newlyCreated) {
              if (error) {
                console.log('error!', error);
                process.exit();
              }

              callback(newlyCreated);
            });
          });
        });
      });
    }

    oldThreadModel.find().populateAll().exec(function (error, results) {
      async.eachSeries(results, function (thread, next) {
        createThread(thread, next);
      }, function (error) {
        if (error) {
          console.log('error!', error);
          process.exit();
        }

        oldUserModel.find({roles: ["visitor"]}).exec(function (error, users) {
          if (error) {
            console.log('error!', error);
            process.exit();
          }

          async.eachSeries(users, function (user, next) {
            createUser(user, function () {
              next();
            });
          }, function (error) {
            if (error) {
              console.log('error!', error);
              process.exit();
            }

            console.log('Echt klaar....???');
          });
        });
      });
    });
  }
};
