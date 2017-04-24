'use strict';

const semver    = require('semver');
const simpleGit = require('simple-git')();
const RSVP      = require('rsvp');

const listTags  = RSVP.denodeify(simpleGit.tags.bind(simpleGit));
const fetch     = RSVP.denodeify(simpleGit.fetch.bind(simpleGit));

const VALID_RELEASE_TYPES = [
  'major',
  'premajor',
  'minor',
  'preminor',
  'patch',
  'prepatch',
  'prerelease'
];

/**
  @class Incrementer.Semver
  @param {Object} options Assigns `{ plugin }` to `this._plugin`.
  @public
*/
class SemverIncrementer {

  /**
    @method validateReleaseType
    @param {String}
    @return {Boolean}
    @static
  */
  static validateReleaseType(releaseType) {
    return VALID_RELEASE_TYPES.includes(releaseType);
  }

  /**
    Increments the largest available tag by
    the amount specified in `versioning.level`

    @method increment
    @param {String} previousVersion The local version before being incremented
    @param {String} level How much to bump the version by
    @returns {Promise} resolves to the new version
    @public
  */
  increment(previousVersion, level) {
    if (!SemverIncrementer.validateReleaseType(level)) {
      throw new Error(`Invalid level provided for semver incrementer. ` +
                  `Possible values include: ${VALID_RELEASE_TYPES.join(', ')}`);
    }

    return this._largestTagVersion()
      .then(largest => this._determineVersion(previousVersion, largest, level));
  }

  /**
    @method _largestTagVersion
    @returns {Promise} resolves to largest known version (considers remote tags)
    @private
  */
  _largestTagVersion() {
    const promise = fetch({ '--tags': true })
      .then(() => listTags())
      .then(tags => {
        const { all } = tags;

        return all.reduce(function(max, curr) {
          if (semver.valid(curr) && semver.gt(curr, max)) {
            return curr;
          }
          return max;
        }, '0.0.0');
      });

    return promise;
  }

  /**
    @method _determineVersion
    @param {String} previous The previous known locally
    @param {String} largest The largest known version
    @param {String} level
    @returns {String} semver
    @private
  */
  _determineVersion(previous, largest, level) {
    previous = previous || '0.0.0';
    largest = largest || '0.0.0';

    if (semver.gt(previous, largest)) {
      return semver.inc(previous, level);
    }

    return semver.inc(largest, level);
  }
}

module.exports = SemverIncrementer;
