# ember-cli-deploy-versioning
This ember-cli-deploy plugin versions each deployment with a commit + annotated tag.   
The affect of this plugin is that all deploys are tied to a specific version 
and a .zip file is optionaly included in the `distFiles` to be uploaded (when used with ember-cli-deploy-s3).

#### Configuration Options
Supply configuration options in config/deploy.js under the `ENV.versioning` hash.

```js
// config/deploy.js

// ENV.versioning
versioning: {
  level: 'patch'  
  // The level to increment this particular deploy. Is used by the incrementer. 
  // Currently only supports semver levels:
  // major, premajor, minor, preminor, patch, prepatch, prerelease

  versionFiles: ['package.json']  
  // Where to read and write the new version to. If multiple files are supplied
  // then the old version is read from the first, and new one is written to all.

  bundle: false
  // Whether or not to include a `.zip` of the repo with the distFiles

  gitAdd: ['package.json']
  // Which files to add to the version commit

  gitRemote: 'origin'
  // Which remote to use. Be sure your entire team has their remote branches
  // configured to the same name.

  gitBranch: ''
  // When left blank it defaults to the current branch.

  gitTagMessage: 'Releasing %FV'
  // The message to annotate the tag with. %FV is replaced with formatted version
  // and %V is replaced with raw version.

  versioner: 'json' 
  //  The default fn is a json versioner that reads/writes a top level "version" key.
  //
  //  You can provide your own versioner function.
  //
  //  It must return an Object or Function with a `read` and `write` method.
  //  E.g.:
  //
  //  versioner: function(context, { readConfig }) {
  //    const level = readConfig('versionFiles');
  //
  //    return {
  //      read(fileName) {
  //        // returns or resolves to version
  //      },
  //  
  //      write(fileName, version) {
  //        // returns or resolves promise
  //      }
  //    }
  //  };

  incrementer: 'semver' 
  //  The default function is a semver incrementer that uses `level` 
  //  configuration property to determine how much to increment by.
  //
  //  You can provide your own incrementer function.
  //  
  //  The main function must return an Object or Function with an `increment` 
  //  method. `version` and `level` are passed in as parameters.
  //  E.g.:
  //  
  //  incrementer: function(context, { readConfig }) {
  //    const level = readConfig('level');
  //  
  //    return {
  //      increment(version, level) {
  //        // returns or resolve to next version
  //      }
  //    }
  //  };


  formatter: null 
  //  The default fn prefixes the version with "v".
  //
  //  You can provide your own formatter function
  //
  //  The main function must return an Function that accepts `version` parameter.
  //  It is only invoked when creating the commit message and tag name.
  //  E.g.:
  //
  //  formatter: function(context, { readConfig }) {
  //    const incrementer = readConfig('incrementer');
  //
  //    // function is bound with the context of the plugin.
  //    return function(version) {
  //      if (incrementer === 'semver') {
  //        return `v${version}`;
  //      }
  //    }
  //  };

}
```

#### Usage
If you want to skip versioning just supply a `--skip-versioning` flag with your deploy command:
```bash
ember deploy development --skip-versioning
```

#### Deployment context
This plugin creates the following object on the deployment context: 
```js
versioning: {
  previous: '1.0.0',
  current: '1.1.0',
  tagName: 'v1.1.0',
  bundlePath: 'tmp/deploy-dist/v1.1.0.zip',
  bundlePathRelative: 'v1.1.0.zip'
}
```

#### Required deployment context key/values:
```js
{
  distDir // Only required if building a .zip bundle (bundle === true).
          // Supplied from ember-cli-deploy-build
}
```
