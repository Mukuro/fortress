/**
 * Message.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  attributes: {
    thread: {
      model: 'thread'
    },
    body: 'text',
    read: {
      type: 'boolean',
      defaultsTo: false
    },
    from: {
      model: 'user'
    },
    to: {
      model: 'user'
    },
    toJSON: function() {
      var modelInstance = this.toObject();

      modelInstance._modelName = 'message';

      return modelInstance;
    }
  },

  afterCreate: function(newMessage, next) {
    var threadId = newMessage.thread;

    if (typeof newMessage.thread === 'object') {
      threadId = newMessage.thread.id;
    }

    // Update the updatedAt date for inbox sorting.
    sails.models.thread.update(threadId, {}).exec(function(error, results) {
      next();

      var messageService = sails.services.messageservice;

      // Yes, this can be ran after calling next() because the email isn't that important.
      messageService.sendNotification(newMessage);
      messageService.abuseCheck(newMessage);
    });
  }
};
