import { Command, flags } from "@oclif/command";
import chalk = require("chalk");
import cli from "cli-ux";
import { ColorifyConstants, COLORS } from "vtex";
import {FeatureFlag} from 'vtex'

import Plugins from "../../modules/plugins";

export default class PluginsInstall extends Command {
  static description = "Installs a plugin into the CLI.";

  static usage = "plugins install PLUGIN";

  static examples = [
    `${ColorifyConstants.COMMAND_OR_VTEX_REF(
      "vtex plugins install"
    )} lighthouse`,
    `${ColorifyConstants.COMMAND_OR_VTEX_REF(
      "vtex plugins install"
    )} ${chalk.hex(COLORS.BLUE)("https://github.com/vtex/cli-plugin-someplugin")}`,
    `${ColorifyConstants.COMMAND_OR_VTEX_REF(
      "vtex plugins install"
    )} @vtex/cli-plugin-someplugin`,
  ];

  static strict = false

  static args = [
    {name: 'plugin', description: 'plugin to install', required: true},
  ]

  static flags = {
    help: flags.help({ char: "h" }),
    verbose: flags.boolean({ char: "v" }),
    force: flags.boolean({
      char: "f",
      description:
        "Refetches all packages, even the ones that were previously installed.",
    }),
  }

  static aliases = ['plugins:add']

  plugins = new Plugins(this.config)

  // In this case we want these operations to happen
  // sequentially so the `no-await-in-loop` rule is ugnored
  /* eslint-disable no-await-in-loop */
  async run() {
    const { flags, argv } = this.parse(PluginsInstall);
    if (flags.verbose) this.plugins.verbose = true;
    const aliases = this.config.pjson.oclif.aliases || {};
    for (let name of argv) {
      if (aliases[name] === null) this.error(`${name} is blocked`);
      name = aliases[name] || name;
      const p = await this.parsePlugin(name);
      let plugin;
      await this.config.runHook("plugins:preinstall", {
        plugin: p,
      });
      try {
        const pluginsAllowList = FeatureFlag.getSingleton().getFeatureFlagInfo<{allowedNpmScopes: string[]; allowedGitOrgs: string[]}>('PLUGINS_ALLOW_LIST')
        if (p.type === 'npm') {
          this.ensureNpmPackageScopeIsAllowed(p.name, pluginsAllowList.allowedNpmScopes)
          this.ensurePluginFollowsStandardPattern(p.name)

          cli.action.start(
            `Installing plugin ${chalk.cyan(this.plugins.friendlyName(p.name))}`
          );
          plugin = await this.plugins.install(p.name, {
            tag: p.tag,
            force: flags.force,
          });
        } else {
          this.ensureGitOrgIsAllowed(p.url, pluginsAllowList.allowedGitOrgs)
          this.ensurePluginFollowsStandardPattern(p.url)

          cli.action.start(`Installing plugin ${chalk.cyan(p.url)}`)
          plugin = await this.plugins.install(p.url, {force: flags.force})
        }
      } catch (error) {
        cli.action.stop(chalk.bold.red("failed"));
        throw error;
      }
      cli.action.stop(`installed v${plugin.version}`);
    }
  }
  /* eslint-enable no-await-in-loop */

  async parsePlugin(
    input: string,
  ): Promise<
    { name: string; tag: string; type: 'npm' } | { url: string; type: 'repo' }
  > {
    if (input.startsWith('git+ssh://') || input.endsWith('.git')) {
      return {url: input, type: 'repo'}
    }
    if (input.includes("@") && input.includes("/")) {
      input = input.slice(1);
      const [name, tag = "latest"] = input.split("@");
      return { name: "@" + name, tag, type: "npm" };
    }
    if (input.includes("/")) {
      if (input.includes(":")) return { url: input, type: "repo" };
      return { url: `https://github.com/${input}`, type: "repo" };
    }
    const [splitName, tag = "latest"] = input.split("@");
    const name = await this.plugins.maybeUnfriendlyName(splitName);
    return { name, tag, type: "npm" };
  }

  ensureNpmPackageScopeIsAllowed(name: string, allowedNpmScopes: string[]) {
    if (!allowedNpmScopes.some(npmScope => name.startsWith(npmScope))) {
      this.error(
        this.notAllowedPluginErrorMessage(name),
      )
    }
  }

  ensureGitOrgIsAllowed(url: string, allowedGitOrgs: string[]) {
    if (!allowedGitOrgs.some(gitOrg => url.includes(gitOrg))) {
      this.error(this.notAllowedPluginErrorMessage(url))
    }
  }

  ensurePluginFollowsStandardPattern(identifier: string) {
    if (!identifier.includes('cli-plugin-')) {
      this.error('All toolbelt plugins need to follow the naming convention "cli-plugin-{pluginName}"')
    }
  }

  notAllowedPluginErrorMessage(identifier: string) {
    return `Only plugins from a restricted list of vendors are allowed to be installed. ${identifier} is not allowed.`
  }
}
