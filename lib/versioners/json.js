'use strict';

const RSVP            = require('rsvp');
const path            = require('path');
const fs              = require('fs');
const writeFileAtomic = require('write-file-atomic')

const readFile  = RSVP.denodeify(fs.readFile);
const writeFile = RSVP.denodeify(writeFileAtomic)

class JSONVersioner {
  /**
    Reads the `version` from base JSON. E.g. { version: '1.2.3' };

    @method read
    @param {String} fileName
    @returns {Promise} resolves to version
    @public
  */
  read(fileName) {
    return this._readJSONFile(fileName)
      .then(({ version }) => version);
  }

  /**
    @method write
    @param {String} fileName
    @param {String|Number} version The version to write into the file
    @returns {Promise} resolves to version
    @public
  */
  write(fileName, version) {
    const promise = this._readJSONFile(fileName)
      .then(data => {
        data.version = version;

        return data;
      })
      .then(data => this._writeJSONFile(data, fileName))
      .then(() => version);

    return promise;
  }

  /**
    @method _readJSONFile
    @param {String} fileName Should be relative to CWD.
    @private
  */
  _readJSONFile(fileName) {
    const filePath = path.join(process.cwd(), fileName);

    const promise = readFile(filePath)
      .then(data => {
        if (data) {
          data = data.toString();
        }

        try {
          data = JSON.parse(data);
        } catch (error) {
          throw new Error(error);
        }

        return data;
      })
      .catch(error => { throw new Error(error); });

    return promise;
  }

  /**
    @method _writeJSONFile
    @param {Object} data The data to save into the file
    @param {fileName} fileName Should be relative to CWD.
    @private
  */
  _writeJSONFile(data, fileName) {
    if (!data || typeof data !== 'object') {
      throw new Error('Must supply JSON to `_writeJSONFile.`');
    }

    const filePath = path.join(process.cwd(), fileName);
    const dataBuff = new Buffer(JSON.stringify(data, null, 2) + '\n');

    return writeFile(filePath, dataBuff);
  }
}

module.exports = JSONVersioner;
