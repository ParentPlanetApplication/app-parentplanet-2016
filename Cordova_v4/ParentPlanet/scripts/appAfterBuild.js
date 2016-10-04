var production = process.env.production || 'true';

production = production === 'true';

var fs = require( 'fs' );

console.log(process.env.production);
var configFilesToReplace = {
	"android": "platforms/android/assets/www/config.js",
	"ios": "platforms/ios/www/config.js",
	"browser": "platforms/browser/www/config.js"
};

var srcfile = __dirname + '/../config/config-staging.js';

if (production) {
  console.log( 'Updated Production config for platforms' );
  srcfile = __dirname + '/../config/config-production.js';
} else {
  console.log( 'Updated Staging config for platforms' );
}

Object.keys( configFilesToReplace ).forEach( function ( key ) {
	// var srcContent = fs.readFileSync( srcfile, 'utf8' );
  var destfile = __dirname + '/../' + configFilesToReplace[ key ];

	// fs.writeFileSync( destfile, srcContent, 'utf8' );
  fs.createReadStream(srcfile).pipe(fs.createWriteStream(destfile));
} );
