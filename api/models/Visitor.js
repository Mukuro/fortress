module.exports = {

  schema: true,

  attributes: {

    user: {
      model: 'user'
    },

    username: {
      type    : 'string',
      regex   : /^[\w\-]{2,14}$/
    },

    credits: {
      type      : 'integer',
      defaultsTo: 0
    },

    walletId: {
      type      : 'integer',
      index     : true,
      defaultsTo: null
    },

    toJSON: function () {
      var modelInstance = this.toObject();

      modelInstance._modelName = 'visitor';

      return modelInstance;
    }
  }
};
