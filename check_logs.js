const { Client } = require('ssh2');

const conn = new Client();

const HOST = '81.0.248.108';
const USERNAME = 'root';
const PASSWORD = '172885Moalin';

conn.on('ready', () => {
  console.log('SSH Client ready. Fetching PM2 logs...');
  conn.exec('pm2 logs revlo --lines 200 --raw --nostream', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', (code, signal) => {
      console.log('--- PM2 LOGS ---');
      console.log(out);
      conn.end();
    }).on('data', (data) => {
      out += data;
    }).stderr.on('data', (data) => {
      out += data;
    });
  });
}).connect({
  host: HOST,
  port: 22,
  username: USERNAME,
  password: PASSWORD
});
