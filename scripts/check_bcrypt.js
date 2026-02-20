const bcrypt = require('bcryptjs');
const hash = '$2a$10$DVV7aCD0DLuMfsqA.7VJveLuAeS6lPrw.TsqKDqP6/W3D4vKXv7Oy';
const ok = bcrypt.compareSync('Admin@123', hash);
console.log('compareSync result:', ok);
console.log('hash length:', hash.length);
