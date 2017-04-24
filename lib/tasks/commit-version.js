'use strict';

const simpleGit   = require('simple-git')();
const RSVP        = require('rsvp');
const exec        = require('child_process').execSync;
const EOL         = require('os').EOL;

const addFiles  = RSVP.denodeify(simpleGit.add.bind(simpleGit));
const commit    = RSVP.denodeify(simpleGit.commit.bind(simpleGit));
const addTag    = RSVP.denodeify(simpleGit.addAnnotatedTag.bind(simpleGit));
const push      = RSVP.denodeify(simpleGit.push.bind(simpleGit));

/*
  Uses a `versioner` to read the current version and write new versions to files.

  @class Task.CommitVersion
  @params {Object} options `{ branch, remote, formatter, log }`
  @public
*/
class CommitVersion {
  constructor(options) {
    this.branch = options.branch;
    this.remote = options.remote;
    this.formatter = options.formatter;
    this.log = options.log;
  }

  /**
    @method stageFiles
    @param {Array} files
    @public
  */
  stageFiles(files) {
    return addFiles(files);
  }

  /**
    @method commitVersion
    @param {String|Number} version
    @returns {Promise}
    @public
  */
  commitVersion(version, message) {
    const formattedVersion = this.formatter(version);
    const remote = this._remote();
    const branch = this._branch();

    message = this._formatMessage(message, { version, formattedVersion });

    this.log(`Begin committing "${message}" to ${remote} ${branch}`, {
      verbose: true
    });

    return commit(message)
      .then(() => push(remote, branch))
      .then(() => {
        this.log(`Done committing "${message}" to ${remote} ${branch}`);
      });
  }

  /**
    @method tagVersion
    @param {String|Number} version
    @returns {Promise}
    @public
  */
  tagVersion(version, annotation) {
    const formattedVersion = this.formatter(version);

    annotation = this._formatMessage(annotation, { version, formattedVersion });

    this.log(`Begin tagging w/ message "${annotation}"`, { verbose: true });

    return addTag(formattedVersion, annotation)
      .then(() => push(this._remote(), formattedVersion))
      .then(() => {
        this.log(`Done tagging "${formattedVersion}"`);

        return formattedVersion;
      });
  }

  _formatMessage(message, options = {}) {
    return (message || '')
      .replace('%V', options.version)
      .replace('%FV', options.formattedVersion);
  }

  /**
    @method _remote
    @private
  */
  _remote() {
    return this.remote;
  }

  /**
    @method _branch
    @private
  */
  _branch() {
    return this.branch ||
      exec('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' })
      .replace(EOL, '');
  }
}

module.exports = CommitVersion;
