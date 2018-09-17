import { Environment, Structure } from '@solon/environment';
import * as chokidar from 'chokidar';
import * as path from 'path';
import { Signale } from 'signale';

import * as compiler from '@solon/compiler';
import { Deployer } from '@solon/deployer';

export function watch(environment: Environment): void {
  const signale = new Signale({ scope: 'Watcher' });
  signale.success('Watcher started.');
  const contracts = environment.compile.contracts.map(contract =>
    path.join(Structure.contracts.src, contract),
  );
  const watcher = chokidar.watch(contracts, { persistent: true });
  watcher.on('change', complileAndDeployAsync.bind(null, environment));
}

async function complileAndDeployAsync(environment: Environment, path: string) {
  const signale = new Signale({ scope: 'Watcher' });
  signale.await(`File Changed: ${path}`);
  await compiler.run(environment.compile);
  new Deployer(environment).run();
}