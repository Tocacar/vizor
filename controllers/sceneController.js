var Scene = require('../models/scene');
var AssetController = require('./assetController');
var SceneProcessor = require('../lib/sceneProcessor');
var fs = require('fs');
var fsPath = require('path');

function SceneController(sceneService, fs)
{
	var args = Array.prototype.slice.apply(arguments);
	args.unshift(Scene);
	AssetController.apply(this, args);
};

SceneController.prototype = Object.create(AssetController.prototype);

SceneController.prototype.canWriteUpload = function(req, res, next)
{
	var that = this;

	if (!req.files)
		return next(new Error('No files uploaded'));

	var file = req.files.file;
	var folder = '/'+req.params.model;

	// remove .zip from scene name
	var dest = folder + '/'+ fsPath.basename(file.name, fsPath.extname(file.name));

	that._service.canWrite(req.user, dest)
	.then(function(can)
	{
		if (!can)
		{
			fs.unlink(file.path);

			return res.status(403)
				.json({msg: 'Sorry, permission denied'});
		}

		next();
	});
} 

SceneController.prototype.upload = function(req, res, next)
{
	var that = this;

	var file = req.files.file;
	var folder = '/scene'; 
	var dest = folder + '/'+ fsPath.basename(file.name, fsPath.extname(file.name));

	if (file.name.slice(-4) !== '.zip')
	{
		return res.status(400)
			.json({msg: 'Please pack the Scene as a zip file'});
	}

	new SceneProcessor(this._fs)
		.handleUpload(file, dest)
		.then(function(info)
		{
			fs.unlink(file.path);

			return that._service.save(info, req.user)
			.then(function(asset)
			{
				res.json(asset);
			});
		})
		.catch(function(err)
		{
			fs.unlink(file.path);
			next(err);
		});
};

module.exports = SceneController;