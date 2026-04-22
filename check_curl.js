const { Client } = require('ssh2');

const conn = new Client();

const HOST = '81.0.248.108';
const USERNAME = 'root';
const PASSWORD = '172885Moalin';

conn.on('ready', () => {
  console.log('SSH Client ready. Running curl to local proxy port...');
  conn.exec('curl -I http://localhost:3000/api/projects/accounting/reports', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', (code, signal) => {
      console.log('--- CURL OUTPUT ---');
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
