const { Client } = require('ssh2');

const conn = new Client();
const HOST = '81.0.248.108';
const USERNAME = 'root';
const PASSWORD = '172885Moalin';

const nginxConfig = `
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
`;

const setupCommands = [
  `cat << 'EOF' > /etc/nginx/sites-available/revlo\n${nginxConfig}\nEOF`,
  'ln -sf /etc/nginx/sites-available/revlo /etc/nginx/sites-enabled/',
  'rm -f /etc/nginx/sites-enabled/default',
  'systemctl restart nginx',
  'ufw allow 80/tcp',
  'ufw allow 22/tcp',
  'ufw --force enable' // Be careful, but contabo usually has it off
];

conn.on('ready', () => {
  console.log('Client :: ready');
  execCommandList(setupCommands, () => {
    console.log('Nginx configured');
    
    // Check if PM2 has revlo running and its status
    conn.exec('pm2 status', (err, stream) => {
        stream.on('data', data => console.log(data.toString()));
        stream.on('close', () => conn.end());
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
      stream.on('close', () => next()).on('data', (data) => process.stdout.write(data)).stderr.on('data', (data) => process.stderr.write(data));
    });
  }
  next();
}
