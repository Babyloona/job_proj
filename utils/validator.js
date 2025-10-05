const Joi = require('joi');

const createSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow('', null),
  assignee_id: Joi.number().integer().positive(),
  priority: Joi.string().valid('low','normal','high'),
  due_at: Joi.string().isoDate()
});

const updateSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string().allow('', null),
  assignee_id: Joi.number().integer().positive(),
  priority: Joi.string().valid('low','normal','high'),
  due_at: Joi.string().isoDate(),
  status: Joi.string().valid('todo','in_progress','done')
}).min(1);

module.exports = { createSchema, updateSchema };
