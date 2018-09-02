import chalk from 'chalk';
import { Command } from 'commander';

const packageJson = require('../package.json');

import createApp from './commands/createApp';
import help from './commands/help';
import info from './commands/info';
import projectNameUndefined from './commands/projectNameUndefined';

let projectName: string = '';

const program: Command = new Command(packageJson.name)
  .version(packageJson.version)
  .arguments('<project-directory>')
  .usage(`${chalk.green('<project-directory>')} [options]`)
  .action((name: string) => (projectName = name))
  .option('--verbose', 'print additional logs')
  .option('--info', 'print environment debug info')
  .option('--scripts-version <alternative-package>', 'use a non-standard version of solon-scripts')
  .option('--use-npm')
  .allowUnknownOption()
  .on('--help', help)
  .parse(process.argv);

if (program.info) {
  info();
} else if (projectName === 'undefined') {
  projectNameUndefined(program.name());
  process.exit(1);
} else {
  createApp(projectName, program.verbose, program.scriptsVersion, program.useNpm);
}