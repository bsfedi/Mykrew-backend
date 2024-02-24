
const figlet = require('figlet');

exports.displayProjectName = () => {
  figlet('My-Krew', (err, data) => {
    if (err) {
      console.log('My-Krew'); 
    } else {
        data.length = 60
      console.log(data);
    }
  });
};

