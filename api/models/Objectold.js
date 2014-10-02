/**
 * Visitor belongs to object.
 *
 * @type {{attributes: {domain: string, programId: string}}}
 */
module.exports = {
  connection: 'mongoLocal',
  tableName : 'object',
  migrate   : 'safe',
  attributes: {
    host: {
      type  : 'string',
      unique: true,
      index : true
    },

    partnerCode: 'integer',

    partnerInfo: 'string',

    email: {
      type : 'email',
      index: true
    }
  }
};