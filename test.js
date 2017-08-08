var index = require('./index');
index.handler({
	"body": {
		"pages": [{
			"url": "http://www.cnn.com",
			"resolutions": ["1024x768", "800x600"]
		}]
	}
});
