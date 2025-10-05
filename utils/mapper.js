const PRIORITY_TO_BITRIX = { low: 1, normal: 2, high: 3 };
const PRIORITY_FROM_BITRIX = { 1: 'low', 2: 'normal', 3: 'high' };
const STATUS_TO_BITRIX = { todo: 1, in_progress: 3, done: 5 };
const STATUS_FROM_BITRIX = { 1: 'todo', 3: 'in_progress', 5: 'done' };

function toBitrixFields(body) {
  // console.log(body.title)
  const f = {};
  if (body.title) f.TITLE =   String(body.title);
  if (body.description) f.DESCRIPTION =   String(body.description);
  if (body.assignee_id) f.RESPONSIBLE_ID = body.assignee_id;
  if (body.priority) f.PRIORITY = PRIORITY_TO_BITRIX[body.priority];
  if (body.due_at) f.DEADLINE = body.due_at;
  if (body.status) f.STATUS = STATUS_TO_BITRIX[body.status];
  return f;
}

function normalizeTask(bitrixTask) {
  const f = bitrixTask;
  return {
    id: f.ID || f.id,
    title: String(f.title || f.title),
    description: String(f.description || f.description),
    assignee_id: f.RESPONSIBLE_ID || f.responsibleId,
    priority: PRIORITY_FROM_BITRIX[f.priority] || null,
    status: STATUS_FROM_BITRIX[f.status] || null,
    due_at: f.deadline || null
  };
}

module.exports = { toBitrixFields, normalizeTask };
