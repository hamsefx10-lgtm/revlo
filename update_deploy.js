const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();

const HOST = '81.0.248.108';
const USERNAME = 'root';
const PASSWORD = '172885Moalin';

const deployCommands = [
  'echo "Starting Quick Update..."',
  'cd /root/revlo && rm -f update.tar.gz',
  'tar -xzf /root/update.tar.gz -C /root/revlo',
  'cp -af /root/revlo/node_modules/.prisma/client/. /root/revlo/.next/standalone/node_modules/.prisma/client/',
  'cp -af /root/revlo/node_modules/@prisma/client/. /root/revlo/.next/standalone/node_modules/@prisma/client/',
  'cp -r /root/revlo/.next/static /root/revlo/.next/standalone/.next/static',
  'cp -r /root/revlo/public /root/revlo/.next/standalone/public',
  'pm2 restart revlo',
  'sleep 3',
  'pm2 status'
];

function execCommandList(cmds, callback) {
  let i = 0;
  function next() {
    if (i >= cmds.length) return callback();
    const cmd = cmds[i++];
    console.log(`\nExecuting: ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      stream.on('close', (code, signal) => {
        next();
      }).on('data', (data) => {
        process.stdout.write(data);
      }).stderr.on('data', (data) => {
        process.stderr.write(data);
      });
    });
  }
  next();
}

conn.on('ready', () => {
  console.log('SSH Client ready. Connecting SFTP...');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    console.log('Uploading update.tar.gz...');
    sftp.fastPut('update.tar.gz', '/root/update.tar.gz', (err) => {
      if (err) throw err;
      console.log('Upload complete. Running server update script...');
      execCommandList(deployCommands, () => {
        console.log('Update deployed successfully!');
        conn.end();
      });
    });
  });
}).connect({
  host: HOST,
  port: 22,
  username: USERNAME,
  password: PASSWORD
});
