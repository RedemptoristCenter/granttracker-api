const mysql = require("mysql");


const connection = mysql.createConnection( 'mysql://hstwem82ictjruyc:o6gwltjx2ortrhwa@i5x1cqhq5xbqtv00.cbetxkdyhwsb.us-east-1.rds.amazonaws.com:3306/mmk1x9zngrjkrhpq' );
  
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