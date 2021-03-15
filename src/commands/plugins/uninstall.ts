import { Command, flags } from "@oclif/command";
import { Plugin } from "@oclif/config";
import * as chalk from "chalk";
import cli from "cli-ux";

import Plugins from "../../modules/plugins";

import { ColorifyConstants } from "vtex";

export default class PluginsUninstall extends Command {
  static description = "Removes a plugin from the CLI";

  static usage = "plugins uninstall PLUGIN";

  static help = `${ColorifyConstants.COMMAND_OR_VTEX_REF(
    "vtex plugins uninstall"
  )} autoupdate`;

  static variableArgs = true;

  static args = [{ name: "plugin", description: "Plugin to uninstall." }];

  static flags = {
    help: flags.help({ char: "h" }),
    verbose: flags.boolean({ char: "v" }),
  };

  static aliases = ["plugins:unlink", "plugins:remove"];

  plugins = new Plugins(this.config);

  // In this case we want these operations to happen
  // sequentially so the `no-await-in-loop` rule is ugnored
  /* eslint-disable no-await-in-loop */
  async run() {
    const { flags, argv } = this.parse(PluginsUninstall);
    this.plugins = new Plugins(this.config);
    if (flags.verbose) this.plugins.verbose = true;
    if (argv.length === 0) argv.push(".");
    for (const plugin of argv) {
      const friendly = this.removeTags(this.plugins.friendlyName(plugin));
      cli.action.start(`Uninstalling ${friendly}`);
      const unfriendly = await this.plugins.hasPlugin(this.removeTags(plugin));
      if (!unfriendly) {
        const p = this.config.plugins.find((p) => p.name === plugin) as
          | Plugin
          | undefined;
        if (p) {
          if (p && p.parent)
            return this.error(
              `${friendly} is installed via plugin ${
                p.parent!.name
              }, uninstall ${p.parent!.name} instead`
            );
        }
        return this.error(`${friendly} is not installed`);
      }
      try {
        await this.plugins.uninstall(unfriendly.name);
      } catch (error) {
        cli.action.stop(chalk.bold.red("failed"));
        throw error;
      }
      cli.action.stop();
    }
  }
  /* eslint-enable no-await-in-loop */

  private removeTags(plugin: string) {
    if (plugin.includes("@")) {
      const chunked = plugin.split("@");
      const last = chunked[chunked.length - 1];

      if (!last.includes("/") && chunked.length > 1) {
        chunked.pop();
      }

      return chunked.join("@");
    }

    return plugin;
  }
}
