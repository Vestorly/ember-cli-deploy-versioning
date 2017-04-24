'use strict';

const RSVP        = require('rsvp');
const path        = require('path');
const nodeExec    = require('child_process').exec;
const exec        = RSVP.denodeify(nodeExec);

/*
  Bundles the current repo.

  @class Task.BundleVersion
  @params {Object} options `{ log }`
  @public
*/
class BundleVersion {
  constructor(options) {
    this.log = options.log;
  }

  /**
    @method zip
    @param {String} outputDir The directory to place the zip file
    @param {String} fileName The filename to give the zip file (leave off .zip)
    @returns {Promise} resolves to the path of the zip file.
    @public
  */
  zip(outputDir, fileName) {
    fileName = `${fileName}.zip`;

    const output = path.join(outputDir, fileName);

    this.log(`Begin bundling HEAD to ${output}`, { verbose: true });

    return exec(`git archive --format=zip --output=${output} HEAD`)
      .then(() => {
        this.log(`Done bundling HEAD to ${output}`);

        return output;
      });
  }
}

module.exports = BundleVersion;
