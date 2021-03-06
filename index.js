#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const shell = require('shelljs');
const program = require('commander');
const { table } = require('table');
const pkg = require('./package');

const configPath = `${os.homedir()}/.lssh.json`;

if (!shell.which('ssh')) {
  shell.echo('Sorry, this script requires git');
  shell.exit(1);
}

let servers;
if (fs.existsSync(configPath)) {
  servers = JSON.parse(fs.readFileSync(configPath));
} else {
  servers = [];
}

const saveServerList = (list) => fs.writeFileSync(configPath, JSON.stringify(list, null, 4));

const listServers = () => {
  const data = [['NAME', 'IP']];
  servers
    .sort((a, b) => {
      if (a.name > b.name) return 1;
      if (b.name > a.name) return -1;
      return 0;
    })
    .forEach((s) => data.push([s.name, s.ip]));
  shell.echo(table(data));
};

const connect = (name) => {
  const server = servers.find((s) => s.name === name);
  if (!server) return shell.echo('There is no such server');
  return spawn(`ssh -t ${server.user}@${server.ip}`, { stdio: 'inherit', shell: true });
};

const addNewServer = (name, ip, user) => {
  if (servers.find((s) => s.name === name)) return shell.echo('Server name already exists!');
  servers.push({ name, ip, user });
  saveServerList(servers);
  return shell.echo(`${name} (${ip}) created!`);
};

const removeServer = (name) => {
  const serverIndex = servers.findIndex((s) => s.name === name);
  if (serverIndex === -1) return shell.echo('There is no such server!');
  servers.splice(serverIndex, 1);
  saveServerList(servers);
  return shell.echo(`${name} removed!`);
};

const invalidCommand = () => {
  shell.echo('Invalid command: %s\nSee --help for a list of available commands.', program.args[0]);
  process.exit(1);
};

program
  .version(pkg.version);

program
  .command('add <name> <ip> <user>')
  .description('Add new server')
  .action(addNewServer);

program
  .command('remove <name>')
  .alias('rm')
  .description('Remove server')
  .action(removeServer);

program
  .command('ssh <name>')
  .description('Connect to server')
  .action(connect);

program
  .command('list')
  .alias('ls')
  .description('List all configured servers')
  .action(listServers);

program
  .command('*')
  .action(invalidCommand);

program.parse(process.argv);
