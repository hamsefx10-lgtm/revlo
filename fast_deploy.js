const { Client } = require('ssh2');
const conn = new Client();

const HOST = '81.0.248.108';
const USERNAME = 'root';
const PASSWORD = '172885Moalin';

const deployCommands = [
  'echo "Starting Fast Deployment..."',
  'tar -xzf /root/revlo_deploy.tar.gz -C /root/revlo',
  'cd /root/revlo && npm install',
  'cd /root/revlo && npx prisma generate',
  'cd /root/revlo && npx prisma db push --accept-data-loss',
  'cd /root/revlo && npm run build',
  'pm2 restart revlo || pm2 restart all || true',
];

conn.on('ready', () => {
  console.log('SSH Client ready. Connecting SFTP...');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    console.log('Uploading revlo_deploy.tar.gz...');
    sftp.fastPut('revlo_deploy.tar.gz', '/root/revlo_deploy.tar.gz', (err) => {
      if (err) throw err;
      console.log('Upload complete. Running build and restart...');
      execCommandList(deployCommands, () => {
        console.log('Deployment complete!');
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

function execCommandList(cmds, callback) {
  let i = 0;
  function next() {
    if (i >= cmds.length) return callback();
    const cmd = cmds[i++];
    console.log(`Executing: ${cmd}`);
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
