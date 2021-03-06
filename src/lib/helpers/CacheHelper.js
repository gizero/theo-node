import { getCacheModule } from '../cache/modules';
import EventHelper from './EventHelper';
let _instance;

class CacheHelper {
  constructor(settings) {
    if (!settings) {
      return;
    }
    if (settings.type && settings.type !== 'false') {
      const ManagerClass = getCacheModule(settings.type);
      if (!ManagerClass) {
        throw new Error('Invalid cache module ' + settings.type);
      }
      this.manager = new ManagerClass(settings.settings);
    }
    EventHelper.on('theo:flushdb', () => {
      setImmediate(async () => {
        try {
          await this.manager.flush();
        } catch (e) {}
      });
    });
  }

  getManager() {
    return this.manager;
  }
}

const getInstance = settings => {
  if (!_instance) {
    _instance = new CacheHelper(settings);
  }
  return _instance;
};

export const loadCacheManager = function() {
  const ch = getInstance();
  const cm = ch.getManager();
  if (!cm) {
    return false;
  }
  return cm;
};

export default getInstance;
