const mysql = require("mysql");

const db = process.env.JAWSDB_URL || 'mysql://iqa3i8yxefs23sju:oitfmqsjnm2m7ifu@tuy8t6uuvh43khkk.cbetxkdyhwsb.us-east-1.rds.amazonaws.com:3306/hib864cfwergasw4';

const connection = mysql.createConnection(db);
  
  connection.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }
    console.log('connected as id ' + connection.threadId);
    
    // connection.query('select * from client', function(err, res, fields) {
    // console.log(res);
//   })
});

module.exports = connection;