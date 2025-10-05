const express = require('express');
const router = express.Router();
const { createSchema, updateSchema } = require('../utils/validator');
const { toBitrixFields, normalizeTask } = require('../utils/mapper');
const bitrix = require('../services/bitrix');

router.post('/', async (req, res, next) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ error: { code:'VALIDATION_ERROR', message: error.message, details: error.details }});
    const fields = toBitrixFields(value);
    const result = await bitrix.callMethod('tasks.task.add', { fields });
    
    const id = (result.task && result.task.id) || result.taskId || result;
 
    const fetched = await bitrix.callMethod('tasks.task.get', { taskId: id, select: ['ID','TITLE','DESCRIPTION','RESPONSIBLE_ID','PRIORITY','STATUS','DEADLINE']});
    return res.status(201).json(normalizeTask(fetched.task || fetched));
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    const { status, assignee, created_from, created_to, due_from, due_to, limit=20, offset=0 } = req.query;
    const filter = {};
    if (assignee) filter.RESPONSIBLE_ID = assignee;
    if (status) {
      const map = { todo:1, in_progress:3, done:5 };
      filter.STATUS = map[status];
    }
    if (created_from) filter['>=CREATED_DATE'] = created_from;
    if (created_to) filter['<=CREATED_DATE'] = created_to;
    if (due_from) filter['>=DEADLINE'] = due_from;
    if (due_to) filter['<=DEADLINE'] = due_to;

    const params = {
      filter,
      select: ['ID','TITLE','DESCRIPTION','RESPONSIBLE_ID','PRIORITY','STATUS','DEADLINE'],
      start: parseInt(offset,10)
    };
    const result = await bitrix.callMethod('tasks.task.list', params);
    const items = (result.tasks || result).map(normalizeTask);
    res.json({ items, total: result.total || items.length, offset: parseInt(offset,10) });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = await bitrix.callMethod('tasks.task.get', { taskId: id, select: ['ID','TITLE','DESCRIPTION','RESPONSIBLE_ID','PRIORITY','STATUS','DEADLINE']});
    if (!result) return res.status(404).json({ error: { code:'NOT_FOUND', message:'Task not found' }});
    res.json(normalizeTask(result.task || result));
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { error, value } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: { code:'VALIDATION_ERROR', message: error.message }});
    const fields = toBitrixFields(value);
    const id = Number(req.params.id);
    await bitrix.callMethod('tasks.task.update', { taskId: id, fields });
    const result = await bitrix.callMethod('tasks.task.get', { taskId: id, select: ['ID','TITLE','DESCRIPTION','RESPONSIBLE_ID','PRIORITY','STATUS','DEADLINE']});
    res.json(normalizeTask(result.task || result));
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const strategy = (process.env.DELETE_STRATEGY || 'soft').toLowerCase();
    if (strategy === 'soft') {
      await bitrix.callMethod('tasks.task.update', { taskId: id, fields: { STATUS: 5 }});
      const result = await bitrix.callMethod('tasks.task.get', { taskId: id });
      return res.json({ message: 'closed', task: normalizeTask(result.task || result) });
    } else {
      await bitrix.callMethod('tasks.task.delete', { taskId: id });
      return res.json({ message: 'deleted' });
    }
  } catch (err) { next(err); }
});

router.post('/:id/comments', async (req, res, next) => {
  try {
    const body = req.body;
    if (!body.body) return res.status(400).json({ error: { code:'VALIDATION_ERROR', message:'body required' }});
    const id = Number(req.params.id);
    const r = await bitrix.callMethod('task.commentitem.add', { taskId:id,fields: { POST_MESSAGE: body.body }});
    res.status(201).json({ id: r });
  } catch (err) { next(err); }
});

router.get('/:id/comments', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { limit=20, offset=0 } = req.query;
    const result = await bitrix.callMethod('task.commentitem.getlist', { taskId: id, order: { ID: 'ASC' }, start: Number(offset) });
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
