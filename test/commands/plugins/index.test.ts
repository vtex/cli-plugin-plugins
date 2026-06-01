import {test} from '../../test'
import Plugins from '../../../src/modules/plugins'

const mockPlugin = {version: '1.0.0'}

describe('command', () => {
  test
  .stub(Plugins.prototype, 'install', () => Promise.resolve(mockPlugin))
  .stdout()
  .command(['plugins:install', '@vtex/cli-plugin-lighthouse'], {reset: true})
  .it('installs npm plugin following vtex naming convention')

  test
  .stub(Plugins.prototype, 'install', () => Promise.resolve(mockPlugin))
  .stdout()
  .command(['plugins:install', '@vtex/cli-plugin-lighthouse@latest'], {reset: true})
  .it('installs npm plugin with explicit tag')

  test
  .stub(Plugins.prototype, 'install', () => Promise.resolve(mockPlugin))
  .stdout()
  .command(['plugins:install', 'aliasme'], {reset: true})
  .it('installs via an alias')

  test
  .stub(Plugins.prototype, 'install', () => Promise.resolve(mockPlugin))
  .stdout()
  .command(['plugins:install', 'vtex/cli-plugin-lighthouse'], {reset: true})
  .it('installs git repo following vtex naming convention')

  test
  .nock('https://registry.npmjs.org', api => api
  .get('/@vtex%2fcli-plugin-stubbed')
  .reply(503, ''))
  .command(['plugins:install', 'stubbed'], {reset: true})
  .catch(/HTTP Error 503/)
  .it('does not install if npm registry is unavailable')
})
