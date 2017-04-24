# ember-cli-deploy-versioning

#### Configuration

```js
versioning: {

  versioner: null //  The default fn is a json versioner that reads/writes a 
                  //  top level "version" key.
                  //
                  //  If you'd like to provider your own versioner it requires
                  //  a basic API. The main function gets passed the `fileName`
                  //  and it must return an Object with a `read` and `write`
                  //  method. E.g.:
                  //
                  //  // function is bound with the context of the plugin.
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

  incrementer: null //  The default fn is a semver incrementer that uses
                    //  `level` configuration property to determine how much to 
                    //  increment by.
                    //
                    //  You can provide your own incrementer function
                    //  The main function must return an object with an 
                    // `increment` method. The version and `level` are passed in
                    //  as parameters to `increment`.
                    //  E.g.:
                    //
                    //  // function is bound with the context of the plugin.
                    //  incrementer: function(context, { readConfig }) {
                    //    const level = readConfig('level');
                    //
                    //    return {
                    //      increment(version, level) {
                    //        // returns or resolve to next version
                    //      }
                    //    }
                    //  };

  formatter: null //  The default fn prefixes the version with "v".
                  //
                  //  You can provide your own formatter function
                  //  The main function must return a function that accepts
                  //  a `version` parameter. It is only invoked when creating 
                  //  the commit message and tag name.
                  //  E.g.:
                  //
                  //  // function is bound with the context of the plugin.
                  //  formatter: function(context, { readConfig }) {
                  //    const incrementer = readConfig('incrementer');
                  //
                  //    return function(version) {
                  //      if (incrementer === 'semver' && forCommitMessage) {
                  //        return `v${version}`;
                  //      }
                  //    }
                  //  };

}
```

#### Required deploy contexts:
```
{
  distDir // Only required if building a .zip bundle (bundle === true).
          // Supplied from ember-cli-deploy-build
}
```

defaultRequire(this, 'versioner', 'json')
