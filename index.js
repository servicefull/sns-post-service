'use strict';

const AWS = require("aws-sdk");

const createResponse = (statusCode, body) => {
	return {
		"statusCode": statusCode,
		"body": body || ""
	};
};

exports.handler = function(event, context, callback) {

	const s3Bucket = process.env.AWS_S3_BUCKET;
	const arn = process.env.AWS_TOPIC_ARN;
	const sns = new AWS.SNS();
	const payload = event.body;

	// RELEASE
	let release = '';
	if (payload.release) release = slugify(payload.release);

	// PAGES
	let pages = parseData(payload.pages);

	pageManager();

	const parseData = (pageData) => {
		let pageArray = [];
		for (var page of pageData) {
			let pageUrl = page.url;
			for (var resolution of page.resolutions) {
				pageArray.push({
					"pageUrl": pageUrl,
					"size": resolution,
					"fileName": release + '-' + slugify(pageUrl) + '-' + resolution + '.png',
					"s3Bucket": s3Bucket
				});
			}
		}
		return pageArray;
	}

	const pageManager = () => {
		if (pages.length > 0) {
			sendPageSNS(pages.pop());
		} else {
			allDone();
		}
	}

	const sendPageSNS = (page) => {
		sns.publish({
			TopicArn: arn,
			Message: JSON.stringify(page, null, 2)
		}, function(err, data) {
			if (err) {
				console.error('error publishing to SNS');
				createError(err);
			} else {
				console.info('message published to SNS');
				console.info(page);
				pageManager();
			}
		});
	}

	const createError = (err) => {
		callback(null, createResponse(500, err));
	}

	const allDone = () => {
		callback(null, createResponse(200, null));
	}

	const slugify = (text) => {
		return text.toString().toLowerCase()
			.replace(/\s+/g, '-') // Replace spaces with -
			.replace(/[^\w\-]+/g, '') // Remove all non-word chars
			.replace(/\-\-+/g, '-') // Replace multiple - with single -
			.replace(/^-+/, ''); // Trim - from start of text
	}
};
