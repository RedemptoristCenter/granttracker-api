const mysql = require("mysql");



const connection = mysql.createConnection(process.env.JAWSDB_URL);
  
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