const pngToIco = require('png-to-ico');
const fs = require('fs');

pngToIco('public/Logo Nodin app resized.png')
    .then(buf => {
        fs.writeFileSync('public/icon.ico', buf);
        console.log('Converted successfully.');
    })
    .catch(console.error);
