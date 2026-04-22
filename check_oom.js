const { Client } = require('ssh2');

const conn = new Client();

const HOST = '81.0.248.108';
const USERNAME = 'root';
const PASSWORD = '172885Moalin';

conn.on('ready', () => {
  console.log('SSH Client ready. Checking dmesg for OOM...');
  conn.exec('dmesg -T | grep -i "out of memory"', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', (code, signal) => {
      console.log('--- DMESG OOM OUTPUT ---');
      console.log(out || "No OOM errors found.");
      conn.end();
    }).on('data', (data) => {
      out += data;
    });
  });
}).connect({
  host: HOST,
  port: 22,
  username: USERNAME,
  password: PASSWORD
});
