const { Client } = require('ssh2');
const conn = new Client();
const HOST = '81.0.248.108';
const USERNAME = 'root';
const PASSWORD = '172885Moalin';

const nginxConfig = `
server {
    listen 80;
    server_name revlo.me www.revlo.me;

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
  'systemctl restart nginx',
  'apt-get update',
  'apt-get install -y certbot python3-certbot-nginx'
];

conn.on('ready', () => {
    console.log('Applying Nginx updates...');
    let i = 0;
    function next() {
        if (i >= setupCommands.length) {
            console.log("Nginx & Certbot prepared.");
            return conn.end();
        }
        const cmd = setupCommands[i++];
        console.log(`Executing: ${cmd}`);
        conn.exec(cmd, (err, stream) => {
            if (err) throw err;
            stream.on('data', d => process.stdout.write(d));
            stream.stderr.on('data', d => process.stderr.write(d));
            stream.on('close', next);
        });
    }
    next();
}).connect({ host: HOST, port: 22, username: USERNAME, password: PASSWORD });
