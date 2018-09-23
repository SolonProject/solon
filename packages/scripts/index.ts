#!/usr/bin/env node

process.on('unhandledRejection', err => {
  throw err;
});

import * as spawn from 'cross-spawn';
const args = process.argv.slice(2);

const commandIndex = args.findIndex(
  x => (
    x === 'build' ||
     x === 'start' || 
     x === 'stop' || 
     x === 'test' || 
     x === 'deploy' || 
     x === 'eject' || 
     x === 'security' ||
     x === 'clean' ||
     x === 'console' 
  )
);
const command = commandIndex === -1 ? args[0] : args[commandIndex];
const nodeArgs = commandIndex > 0 ? args.slice(0, commandIndex) : [];

switch (command) {
  case 'build':
  case 'console':
  case 'deploy':
  case 'clean':
  case 'stop':
  case 'start':
  case 'eject':
  case 'security':
  case 'test': {
    const result = spawn.sync(
      'node',
      nodeArgs.concat(require.resolve(`./${command}`)).concat(args.slice(commandIndex + 1)),
      { stdio: 'inherit' },
    );
    if (result.signal) {
      if (result.signal === 'SIGKILL') {
        console.log(
          'The build failed because the process exited too early. ' +
            'This probably means the system ran out of memory or someone called ' +
            '`kill -9` on the process.',
        );
      } else if (result.signal === 'SIGTERM') {
        console.log(
          'The build failed because the process exited too early. ' +
            'Someone might have called `kill` or `killall`, or the system could ' +
            'be shutting down.',
        );
      }
      process.exit(1);
    }
    process.exit(result.status);
    break;
  }
  default:
    console.log(`Unknown command ${command}.`);
    console.log('Perhaps you need to update solon-scripts?');
    break;
}
