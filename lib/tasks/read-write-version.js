'use strict';

const RSVP = require('rsvp');

/*
  Uses a `versioner` to read the current version and write new versions to files.

  @class Task.ReadWriteVersion
  @params {Object} options `{ log, versioner }`
*/
class ReadWriteVersion {
  constructor(options) {
    this.log = options.log;
    this.versioner = options.versioner
  }

  /**
    Extracts the version from the first fileName.

    @method readVersion
    @param {Array} fileNames
    @returns {Promise} resolves to a version
  */
  readVersion(fileNames) {
    const fileName = fileNames[0];

    this.log(`Begin reading version from ${fileName}`, { verbose: true });

    const readVersion = this.versioner.read(fileName);

    // wrap incase `read()` does not return a promise
    return RSVP.resolve(readVersion)
      .then(version => {
        this.log(`Done reading version ${version} from ${fileName}`);

        return version;
      });
  }

  /**
    Writes the passed in version to all files.

    @method writeVersion
    @param {Array} fileNames
    @param {String|Number} version
    @returns {Promise}
  */
  writeVersion(fileNames, version) {
    this.log(`Begin writing version ${version} to ${fileNames.join(',')}`, {
      verbose: true
    });

    const promises = fileNames.map(fileName => {
      return this.versioner.write(fileName, version);
    });

    return RSVP.all(promises)
      .then((/* versions */) => {
        this.log(`Done writing version ${version} to ${fileNames.join(',')}`);

        return version
      });
  }
}

module.exports = ReadWriteVersion;
