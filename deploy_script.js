const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();

const HOST = '81.0.248.108';
const USERNAME = 'root';
const PASSWORD = '172885Moalin';

const setupCommands = [
  'echo "Starting Setup..."',
  'apt-get update',
  'apt-get install -y curl build-essential git unzip tar nginx',
  'curl -fsSL https://deb.nodesource.com/setup_20.x | bash -',
  'apt-get install -y nodejs',
  'npm install -g pm2',
  'mkdir -p /root/revlo'
];

const deployCommands = [
  'echo "Starting Deployment..."',
  'tar -xzf /root/revlo_deploy.tar.gz -C /root/revlo',
  'cd /root/revlo && npm install',
  'cd /root/revlo && npx prisma generate',
  'cd /root/revlo && npm run build',
  'pm2 stop revlo || true',
  'pm2 delete revlo || true',
  'cd /root/revlo && pm2 start npm --name "revlo" -- start',
  'pm2 save',
  'env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root || true',
  'pm2 save'
];

conn.on('ready', () => {
  console.log('Client :: ready');
  
  // Create SFTP session
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    console.log('Running setup commands...');
    execCommandList(setupCommands, () => {
      
      console.log('Transferring .env file...');
      sftp.fastPut('.env', '/root/revlo/.env', (err) => {
        if(err) {
          console.error("Error transferring .env (if it doesn't exist locally, that's fine)");
        } else {
             console.log('.env Transferred');
        }
        
        console.log('Transferring codebase archive...');
        sftp.fastPut('revlo_deploy.tar.gz', '/root/revlo_deploy.tar.gz', (err) => {
          if (err) throw err;
          console.log('Codebase Archive Transferred');
          
          console.log('Running deployment commands...');
          execCommandList(deployCommands, () => {
            console.log('Deployment complete!');
            conn.end();
          });
        });
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
        console.log(`Stream :: close :: code: ${code}, signal: ${signal}`);
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
