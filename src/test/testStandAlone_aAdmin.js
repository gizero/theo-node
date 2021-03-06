import assert from 'assert';

import AppHelper from '../lib/helpers/AppHelper';

import {
  adminAddAccountKey,
  adminAddAccountPermission,
  adminAddGroupPermission,
  adminCreateAccount,
  adminCreateGroup,
  adminCreateGroupAccount,
  adminDeleteAccount,
  adminDeleteAccountKey,
  adminDeleteAccountPermission,
  adminDeleteGroupAccount,
  adminDeleteGroupPermission,
  adminEditAccount,
  adminEditGroup,
  adminGetAccount,
  adminGetGroup
} from '../lib/helpers/AdminHelper';
import DbHelper, { releaseDHInstance } from '../lib/helpers/DbHelper';

const settings = {
  admin: {
    token: ''
  },
  client: {
    tokens: []
  },
  db: {
    engine: 'sqlite',
    storage: ':memory:'
  },
  server: {
    http_port: 9100
  }
};

let ah;

let dh;
const loadDb = function() {
  return new Promise((resolve, reject) => {
    let dm;
    try {
      dh = DbHelper(ah.getSettings('db'));
      dm = dh.getManager();
      if (!dm) {
        console.error('Unable to load DB Manager!!!');
        process.exit(99);
      }
      dh.init()
        .then(() => {
          resolve(dm.getClient());
        })
        .catch(e => {
          console.error('Failed to initialize db', e.message);
          console.error(e);
          process.exit(99);
        });
    } catch (e) {
      console.error('Failed to load DB Manager!!!', e.message);
      console.error(e);
      process.exit(99);
    }
  });
};

describe('Test account', function() {
  this.timeout(10000);
  let db;
  before(async function() {
    ah = AppHelper(settings);
    try {
      db = await loadDb();
    } catch (err) {}
  });

  after(async function() {
    releaseDHInstance();
  });

  describe('with name and email', function() {
    it('should return an account object with no keys nor permissions', async function() {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe@example.com'
      };

      const resAccount = await adminCreateAccount(db, reqAccount);

      assert.strictEqual(typeof resAccount.id, 'number');
      assert.strictEqual(resAccount.name, reqAccount.name);
      assert.strictEqual(resAccount.email, reqAccount.email);
      assert.strictEqual(resAccount.active, 1);
      assert.strictEqual(resAccount.public_keys.length, 0);
      assert.strictEqual(resAccount.permissions.length, 0);
    });
  });

  describe('retrieve account by email', function() {
    it('should return an account object with no keys nor permissions', async function() {
      const email = 'john.doe@example.com';
      const resAccount = await adminGetAccount(db, email);
      assert.strictEqual(typeof resAccount.id, 'number');
      assert.strictEqual(resAccount.email, email);
      assert.strictEqual(resAccount.active, 1);
      assert.strictEqual(resAccount.public_keys.length, 0);
      assert.strictEqual(resAccount.permissions.length, 0);
    });
  });

  describe('without name', function() {
    it('should return an error', async function() {
      const reqAccount = {
        email: 'john.doe@example.com'
      };

      let error;
      let resAccount;
      try {
        resAccount = await adminCreateAccount(db, reqAccount);
      } catch (er) {
        error = er;
      }
      assert.notEqual(typeof error, 'undefined');
      assert.strictEqual(typeof resAccount, 'undefined');
    });
  });

  describe('without email', function() {
    it('should return an error', async function() {
      const reqAccount = {
        name: 'john.doe'
      };

      let error;
      let resAccount;
      try {
        resAccount = await adminCreateAccount(db, reqAccount);
      } catch (er) {
        error = er;
      }
      assert.notEqual(typeof error, 'undefined');
      assert.strictEqual(typeof resAccount, 'undefined');
    });
  });

  describe('with name and email and 1 key', function() {
    it('should return an account object with 1 key and no permissions', async function() {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe.2@example.com',
        keys: ['ssh-rsa AAAAB3Nza john.doe.2@debian']
      };

      const resAccount = await adminCreateAccount(db, reqAccount);

      assert.strictEqual(typeof resAccount.id, 'number');
      assert.strictEqual(resAccount.name, reqAccount.name);
      assert.strictEqual(resAccount.email, reqAccount.email);
      assert.strictEqual(resAccount.active, 1);
      assert.strictEqual(resAccount.public_keys.length, 1);
      assert.strictEqual(resAccount.public_keys[0].public_key, reqAccount.keys[0]);
      assert.strictEqual(resAccount.permissions.length, 0);
    });
  });

  describe('with name and email and 2 keys', function() {
    it('should return an account object with 2 keys and no permissions', async function() {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe.3@example.com',
        keys: ['ssh-rsa AAAAB3Nza john.doe.2@debian', 'ssh-rsa AAAAB3Nza john.doe.3@debian']
      };

      const resAccount = await adminCreateAccount(db, reqAccount);

      assert.strictEqual(typeof resAccount.id, 'number');
      assert.strictEqual(resAccount.name, reqAccount.name);
      assert.strictEqual(resAccount.email, reqAccount.email);
      assert.strictEqual(resAccount.active, 1);
      assert.strictEqual(resAccount.public_keys.length, 2);
      assert.strictEqual(resAccount.public_keys[0].public_key, reqAccount.keys[0]);
      assert.strictEqual(resAccount.public_keys[1].public_key, reqAccount.keys[1]);
      assert.strictEqual(resAccount.permissions.length, 0);
    });
  });

  describe('disable account', function() {
    it('should return an account object with active set to 0', async function() {
      await adminEditAccount(db, 1, false);
      const account = await adminGetAccount(db, 1);
      assert.strictEqual(account.active, 0);
    });
  });

  describe('enable account', function() {
    it('should return an account object with active set to 1', async function() {
      await adminEditAccount(db, 1, true);
      const account = await adminGetAccount(db, 1);
      assert.strictEqual(account.active, 1);
    });
  });

  describe('delete account', function() {
    it('should return 404', async function() {
      await adminDeleteAccount(db, 2);
      try {
        await adminGetAccount(db, 2);
        assert.strictEqual(true, false);
      } catch (err) {
        assert.strictEqual(err.t_code, 404);
      }
    });
  });

  describe('add 1 key to an account', function() {
    it('should return an account object with 1 key and no permissions', async function() {
      const keys = ['ssh-rsa AAAAB3Nza john.doe.2@debian'];

      const retKeys = await adminAddAccountKey(db, 1, keys);
      const resAccount = await adminGetAccount(db, 1);

      assert.strictEqual(retKeys.account_id, 1);
      assert.strictEqual(retKeys.public_keys.length, 1);
      assert.strictEqual(retKeys.public_keys[0].public_key, keys[0]);
      assert.strictEqual(resAccount.public_keys.length, 1);
      assert.strictEqual(resAccount.public_keys[0].public_key, keys[0]);
    });
  });

  describe('delete 1 key to an account', function() {
    it('should return an account object with no key and no permissions', async function() {
      try {
        await adminDeleteAccountKey(db, 1, 4);
      } catch (err) {
        assert.strictEqual(true, false);
      }
      const resAccount = await adminGetAccount(db, 1);
      assert.strictEqual(resAccount.public_keys.length, 0);
    });
  });

  describe('add 1 permission to an account', function() {
    it('should return an account object with no key and 1 permission', async function() {
      const permission = {
        user: 'john',
        host: 'debian'
      };

      const retPermission = await adminAddAccountPermission(db, 1, permission.user, permission.host);
      const resAccount = await adminGetAccount(db, 1);

      assert.strictEqual(retPermission.account_id, 1);
      assert.strictEqual(typeof retPermission.permission_id, 'number');
      assert.strictEqual(resAccount.permissions.length, 1);
      assert.strictEqual(resAccount.permissions[0].user, permission.user);
      assert.strictEqual(resAccount.permissions[0].host, permission.host);
    });
  });

  describe('delete 1 permission to an account', function() {
    it('should return an account object with no key and no permissions', async function() {
      try {
        await adminDeleteAccountPermission(db, 1, 1);
      } catch (err) {
        console.error(err);
        assert.strictEqual(true, false);
      }
      const resAccount = await adminGetAccount(db, 1);
      assert.strictEqual(resAccount.permissions.length, 0);
    });
  });

  describe('Add 1 account with expired date', function() {
    it('should return an account object with expired date', async function() {
      const account = {
        email: 'expired@example.com',
        name: 'Expired',
        expire_at: '2018-01-01'
      };
      try {
        await adminCreateAccount(db, account);
      } catch (err) {
        console.error(err);
        assert.strictEqual(true, false);
      }
      const resAccount = await adminGetAccount(db, account.email);
      assert.strictEqual(resAccount.expire_at, 1514764800000);
    });
  });
});

describe('Test group', function() {
  this.timeout(10000);
  let db;
  before(async function() {
    try {
      db = await loadDb();
    } catch (err) {}
  });

  after(async function() {
    releaseDHInstance();
  });

  let group_id;
  let account_id;
  let permission_id;

  describe('with name', function() {
    it('should return a group object with no accounts nor permissions', async function() {
      const reqGroup = {
        name: 'developers'
      };

      const resGroup = await adminCreateGroup(db, reqGroup);

      group_id = resGroup.id;

      assert.strictEqual(typeof resGroup.id, 'number');
      assert.strictEqual(resGroup.name, reqGroup.name);
      assert.strictEqual(resGroup.active, 1);
      assert.strictEqual(resGroup.accounts.length, 0);
      assert.strictEqual(resGroup.permissions.length, 0);
    });
  });

  describe('without name', function() {
    it('should return an error', async function() {
      const reqGroup = {
        namex: 'developers'
      };

      let error;
      let resGroup;
      try {
        resGroup = await adminCreateGroup(db, reqGroup);
      } catch (er) {
        error = er;
      }
      assert.notEqual(typeof error, 'undefined');
      assert.strictEqual(typeof resGroup, 'undefined');
    });
  });

  describe('edit group status', function() {
    it('should return a group object with active = false and no accounts nor permissions', async function() {
      const res = await adminEditGroup(db, group_id, false);
      assert.strictEqual(res, true);
      const resGroup = await adminGetGroup(db, group_id);
      assert.strictEqual(resGroup.active, 0);
    });
  });

  describe('add account to group', function() {
    it('should return a group object with active = false and 1 accounts and no permissions', async function() {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe.2@example.com',
        keys: ['ssh-rsa AAAAB3Nza john.doe.2@debian']
      };

      const resAccount = await adminCreateAccount(db, reqAccount);
      account_id = resAccount.id;
      const res = await adminCreateGroupAccount(db, group_id, account_id);
      assert.strictEqual(typeof res, 'number');
      assert.ok(res > 0);
      const resGroup = await adminGetGroup(db, group_id);
      assert.strictEqual(resGroup.active, 0);
      assert.strictEqual(resGroup.accounts.length, 1);
      assert.strictEqual(resGroup.accounts[0].id, account_id);
      assert.strictEqual(resGroup.permissions.length, 0);

      const resAccountWithGroup = await adminGetAccount(db, account_id);
      assert.strictEqual(resAccountWithGroup.groups.length, 2);
      assert.strictEqual(resAccountWithGroup.groups[0].id, group_id);
      assert.strictEqual(resAccountWithGroup.groups[0].name, resGroup.name);
    });
  });

  describe('remove account from group', function() {
    it('should return a group object with active = false and 0 accounts and no permissions', async function() {
      const res = await adminDeleteGroupAccount(db, group_id, account_id);
      assert.strictEqual(res, 1);
      const resGroup = await adminGetGroup(db, group_id);
      assert.strictEqual(resGroup.active, 0);
      assert.strictEqual(resGroup.accounts.length, 0);
      assert.strictEqual(resGroup.permissions.length, 0);
    });
  });

  describe('add permission to group', function() {
    it('should return a group object with active = false and 0 accounts and 1 permission', async function() {
      const permission = {
        user: 'john',
        host: 'debian'
      };

      const resPermission = await adminAddGroupPermission(db, group_id, permission.user, permission.host);
      const resGroup = await adminGetGroup(db, group_id);
      assert.strictEqual(resGroup.active, 0);
      assert.strictEqual(resGroup.accounts.length, 0);
      assert.strictEqual(resGroup.permissions.length, 1);
      assert.strictEqual(resGroup.permissions[0].id, resPermission.permission_id);
      assert.strictEqual(resGroup.permissions[0].user, permission.user);
      assert.strictEqual(resGroup.permissions[0].host, permission.host);
    });
  });

  describe('add another permission to group', function() {
    it('should return a group object with active = false and 0 accounts and 2 permission', async function() {
      const permission = {
        user: 'core',
        host: 'coreos'
      };

      const resPermission = await adminAddGroupPermission(db, group_id, permission.user, permission.host);
      permission_id = resPermission.permission_id;
      const resGroup = await adminGetGroup(db, group_id);
      assert.strictEqual(resGroup.active, 0);
      assert.strictEqual(resGroup.accounts.length, 0);
      assert.strictEqual(resGroup.permissions.length, 2);
      assert.strictEqual(resGroup.permissions[1].id, permission_id);
      assert.strictEqual(resGroup.permissions[1].user, permission.user);
      assert.strictEqual(resGroup.permissions[1].host, permission.host);
    });
  });

  describe('delete permission from group', function() {
    it('should return a group object with active = false and 0 accounts and 1 permission', async function() {
      const res = await adminDeleteGroupPermission(db, group_id, permission_id);
      assert.strictEqual(res, true);
      const resGroup = await adminGetGroup(db, group_id);
      assert.strictEqual(resGroup.active, 0);
      assert.strictEqual(resGroup.accounts.length, 0);
      assert.strictEqual(resGroup.permissions.length, 1);
    });
  });
});
