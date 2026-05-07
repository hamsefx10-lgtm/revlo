const { Client } = require('ssh2');
const conn = new Client();

const HOST = '81.0.248.108';
const USERNAME = 'root';
const PASSWORD = '172885Moalin';

const deployCommands = [
  'echo "Starting Git Pull Deployment..."',
  'cd /root/revlo && git pull origin master',
  'cd /root/revlo && npx prisma db push --accept-data-loss',
  'cd /root/revlo && npm run build',
  'pm2 restart all'
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
  console.log('SSH Client ready. Running deployment commands...');
  execCommandList(deployCommands, () => {
    console.log('\nDeployment complete!');
    conn.end();
  });
}).connect({
  host: HOST,
  port: 22,
  username: USERNAME,
  password: PASSWORD
});
