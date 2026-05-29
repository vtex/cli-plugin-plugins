import * as Config from '@oclif/config'
import * as Fancy from '@oclif/test'
import * as fs from 'fs-extra'
import {FeatureFlag} from 'vtex'

const mockPluginsAllowList = {
  allowedNpmScopes: ['@oclif/', '@vtex/', '@heroku-cli/'],
  allowedGitOrgs: ['jdxcode', 'vtex'],
}

export const test = Fancy.test
.stub(FeatureFlag, 'getSingleton', () => ({
  getFeatureFlagInfo: (_flagName: string) => mockPluginsAllowList,
}))
.finally(async () => {
  const config = await Config.load()
  await Promise.all([
    // fs.remove(config.cacheDir),
    fs.remove(config.configDir),
    fs.remove(config.dataDir),
  ])
})

export {expect} from 'fancy-test'
export {Fancy}
