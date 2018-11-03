import { requireAdminAuthMiddleware } from '../lib/middlewares/AuthMiddleware';
import GroupManager from '../lib/managers/GroupManager';
import {
  adminAddGroupPermission,
  adminCreateGroup,
  adminCreateGroupAccount,
  adminDeleteGroup,
  adminDeleteGroupAccount,
  adminDeleteGroupPermission,
  adminEditGroup,
  adminGetGroup
} from '../lib/helpers/AdminHelper';

export default function handleGroups(server) {
  server.get('/groups', requireAdminAuthMiddleware, async (req, res, next) => {
    const gm = new GroupManager(req.db);
    try {
      const { limit, offset } = req.query;
      const ret = await gm.getAll(Number(limit), Number(offset));
      res.json(ret);
    } catch (err) {
      res.status(500);
      res.json({ status: 500, reason: err.message });
    }
  });

  server.get('/groups/:id', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const ret = await adminGetGroup(req.db, req.params.id);
      res.json(ret);
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  server.post('/groups', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const ret = await adminCreateGroup(req.db, req.body);
      res.json(ret);
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  server.put('/groups/:id', requireAdminAuthMiddleware, async (req, res, next) => {
    const { active } = req.body;
    try {
      const done = await adminEditGroup(req.db, req.params.id, active);
      if (done) {
        res.status(201);
        res.json({ status: 201 });
      } else {
        res.status(500);
        res.json({ status: 500, reason: 'Unkown error' });
      }
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  server.del('/groups/:id', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const done = await adminDeleteGroup(req.db, req.params.id);
      if (done) {
        res.status(201);
        res.json({ status: 201 });
      } else {
        res.status(500);
        res.json({ status: 500, reason: 'Unkown error' });
      }
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  server.post('/groups/:id', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const done = await adminCreateGroupAccount(req.db, req.params.id, req.body.id);
      if (done) {
        res.status(201);
        res.json({ status: 201 });
      } else {
        res.status(500);
        res.json({ status: 500, reason: 'Unkown error' });
      }
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  server.del('/groups/:id/:account_id', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const done = await adminDeleteGroupAccount(req.db, req.params.id, req.params.account_id);
      if (done) {
        res.status(201);
        res.json({ status: 201 });
      } else {
        res.status(500);
        res.json({ status: 500, reason: 'Unkown error' });
      }
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  server.post('/groups/:id/permissions', requireAdminAuthMiddleware, async (req, res, next) => {
    const { user, host } = req.body;
    try {
      const ret = await adminAddGroupPermission(req.db, req.params.id, user, host);
      res.json(ret);
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  server.del('/groups/:id/permissions/:permission_id', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const done = await adminDeleteGroupPermission(req.db, req.params.id, Number(req.params.permission_id));
      if (done) {
        res.status(201);
        res.json({ status: 201 });
      } else {
        res.status(500);
        res.json({ status: 500, reason: 'Unkown error' });
      }
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });
}
