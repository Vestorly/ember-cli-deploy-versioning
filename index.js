/* eslint-env node */
'use strict';

const BasePlugin  = require('ember-cli-deploy-plugin');
const path        = require('path');
const RSVP        = require('rsvp');

module.exports = {
  name: 'ember-cli-deploy-versioning',

  isDevelopingAddon() {
    return true;
  },

  createDeployPlugin: function(options) {
    var DeployPlugin = BasePlugin.extend({
      name: options.name,

      defaultConfig: {

        level: 'patch',           // the amount to increment the version by

        versionFiles: ['package.json'], // Which files to apply versioning to.
                                        // The first file in this list is where
                                        // the previous version is read from.

        bundle: false,            // whether to create an archive .zip from
                                  // HEAD of current branch.

        gitAdd: ['package.json'], // which files to add to the version commit

        gitRemote: 'origin',      // origin to push commit + tag to

        gitBranch: '',            // defaults to current working branch

        gitTagMessage: 'Releasing %FV', // Can supply custom tag message.
                                        // %V will be replaced by the
                                        // version.
                                        // %FV will be replaced by the
                                        // formatted version.

        versioner: 'json',        // The versioner to use. You can provide your
                                  // own function.

        incrementer: 'semver',    // Which incrementer to use on the version.
                                  // You can provide your own function.

        formatter: null           // Formats the version for the `versionFiles`,
                                  // tagging, and the commit message. You can
                                  // provide your own function.
      },

      versioner: null,

      incrementer: null,

      formatter: null,

      /**
        Assigns `versioner`, `incrementer`, `formatter`, and `versioning` hash
        to the deploy context.

        @method setup
        @param {Object} context
        @public
      */
      setup(context) {
        this.versioner = this._getVersioner();
        this.incrementer = this._getIncrementer();
        this.formatter = this._getFormatter();

        context.versioning = {};
      },

      /**
        1. Reads first versionFile to extract the (soon to be) previous version.
        2. Applies the `previous` value to `versioning` object.

        @method setup
        @param {Object} context
        @public
      */
      willDeploy(context) {
        const ReadWriteVersionTask = require('./lib/tasks/read-write-version');
        const { versioner } = this;
        const files = this.readConfig('versionFiles');

        const readWriteVersionTask = new ReadWriteVersionTask({
          versioner,
          log: this.log.bind(this)
        });

        return readWriteVersionTask
          .readVersion(files)
          .then(version => setVersioningContext(context, 'previous', version));
      },

      /**
        2. Increments the previous version - assigned on context as `versioning.current`
        2. Loops through each `versionFiles` - saving the new version
        4. Exports previous version as `process.env.EMBER_DEPLOY_PREVIOUS_VERSION`
        5. Exports current version as `process.env.EMBER_DEPLOY_CURRENT_VERSION`

        @method willBuild
        @param {Object} context
        @public
      */
      willBuild(context) {
        const { versioning } = context;
        const { previous } = versioning;
        const { incrementer, versioner } = this;

        if (this._shouldSkipVersioning(context)) {
          return setVersioningContext(context, 'current', previous);
        }

        const ReadWriteVersionTask = require('./lib/tasks/read-write-version');
        const readWriteVersionTask = new ReadWriteVersionTask({
          versioner,
          log: this.log.bind(this)
        });

        const files = this.readConfig('versionFiles');
        const level = this.readConfig('level');
        const version = incrementer.increment(previous, level);

        return RSVP.resolve(version)
          .then(current => readWriteVersionTask.writeVersion(files, current))
          .then(current => setVersioningContext(context, 'current', current));
      },

      /**
        1. Stages the version files (configured in `versioning.gitAdd`)
        2. Creates a commit with the versioned files
        3. Pushes commit
        4. Creates an annotated tag
        5. Pushes tag
        6. Assigns `tagName` to `context.versioning`

        @method didBuild
        @param {Object} context
        @public
      */
      didBuild(context) {
        if (this._shouldSkipVersioning(context)) {
          return;
        }

        const { versioning } = context;
        const { current } = versioning;
        const { formatter } = this;

        const files = this.readConfig('gitAdd');
        const remote = this.readConfig('gitRemote');
        const branch = this.readConfig('gitBranch');
        const tagMessage = this.readConfig('gitTagMessage');

        const CommitVersionTask = require('./lib/tasks/commit-version');
        const commitVersionTask = new CommitVersionTask({
          branch,
          remote,
          formatter,
          log: this.log.bind(this)
        });

        return commitVersionTask
          .stageFiles(files)
          .then(() => commitVersionTask.commitVersion(current))
          .then(() => commitVersionTask.tagVersion(current, tagMessage))
          .then(tag => setVersioningContext(context, 'tagName', tag));
      },

      /**
        1. Zips the HEAD into a .zip file
        2. Adds the bundle to distFiles (the output path of the build)

        @method willUpload
        @param {Object} context
        @public
      */
      willUpload(context) {
        const { versioning } = context;
        const { tagName } = versioning;
        const { distDir, distFiles } = context;

        const shouldBundle = this.readConfig('bundle');

        if (!shouldBundle || !distDir || !distFiles) {
          this.log('Skipping bundling', { color: 'yellow', verbose: true });
          return;
        }

        const BundleVersionTask = require('./lib/tasks/bundle-version');
        const bundleVersionTask = new BundleVersionTask({
          log: this.log.bind(this)
        });

        return bundleVersionTask
          .zip(distDir, tagName)
          .then(bundlePath => {
            const relativeBundle = path.relative(distDir, bundlePath);

            context.distFiles.push(relativeBundle);

            setVersioningContext(context, 'bundlePathRelative', relativeBundle);

            return setVersioningContext(context, 'bundlePath', bundlePath);
          });
      },

      /**
        Returns the default or user-provided versioner.

        @method _getVersioner
        @private
      */
      _getVersioner() {
        const versioner = this.readConfig('versioner');

        if (versioner && typeof versioner === 'function') {
          return versioner.bind(this);
        }

        if (versioner && typeof versioner === 'object') {
          return versioner;
        }

        const Versioner = require('./lib/versioners')[versioner];

        if (!Versioner) {
          throw new Error(`Unable to find a versioner for '${versioner}'`);
        }

        return new Versioner();
      },

      /**
        Returns the default or user-provided incrementer.

        @method _getIncrementer
        @private
      */
      _getIncrementer() {
        const incrementer = this.readConfig('incrementer');

        if (incrementer && typeof incrementer === 'function') {
          return { increment: incrementer.bind(this) };
        }

        if (incrementer && typeof incrementer === 'object') {
          return incrementer;
        }

        const Incrementer = require('./lib/incrementers')[incrementer];

        if (!Incrementer) {
          throw new Error(`Unknown Incrementer for type ${incrementer}`);
        }

        return new Incrementer();
      },

      /**
        Returns the default or user-provided formatter.

        @method _getFormatter
        @private
      */
      _getFormatter() {
        const formatter = this.readConfig('formatter');

        if (formatter && typeof formatter === 'function') {
          return formatter.bind(this);
        }

        return function(version) {
          const incrementer = this.readConfig('incrementer');

          if (incrementer === 'semver') {
            return `v${version}`;
          }

          return version;
        }.bind(this);
      },

      /**
        Reads `--skip-versioning` and `--skip-v` cli arg.

        If `--skip-versioning` or `--skip-v` is passed then versionFiles will
        not be incremented and a version commit and tag will not be made.


        @property _shouldSkipVersioning
        @private
      */
      _shouldSkipVersioning(context) {
        const { commandOptions } = context;

        if (commandOptions.skipVersioning || commandOptions.skipV) {
          return true;
        }

        return false;
      }
    });

    return new DeployPlugin();
  }
};

/**
  Assigns values to the `context.versioning` object.

  @property setVersioningContext
  @param {Object} context
  @param {String} key
  @param {Mixed} value
  @private
*/
function setVersioningContext(context, key, value) {
  const { versioning } = context;

  versioning[key] = value;

  if (key === 'previous') {
    process.env.EMBER_DEPLOY_PREVIOUS_VERSION = value;
  }

  if (key === 'current') {
    process.env.EMBER_DEPLOY_CURRENT_VERSION = value;
  }

  return { versioning };
}

/**
  context: {
    versioning: {
      previous: '1.2.2',
      current: '1.2.3',
      tagName: 'v1.2.3',
      bundlePath: 'tmp/deploy-dist/v1.2.3.zip'
      bundlePathRelative: 'v1.2.3.zip`
    }
  }
*/
