'use strict';

module.exports = function(grunt) {

  // Project Configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      js: {
        src: [ "src/api/version.js",
            "src/api/index.js",
            "src/screens/index.js",
            "src/screens/addresses.js",
            "src/screens/addressbook.js",
            "src/screens/loading.js",
            "src/screens/masternodes.js",
            "src/screens/mnsconfig.js",
            "src/screens/voting.js",
            "src/screens/overview.js",
            "src/screens/send.js",
            "src/screens/shield.js",
            "src/screens/transactions.js",
            "src/screens/settings.js",
            "src/screens/services.js",
            "src/screens/voting.js",
            "src/renderer.js"
          ],
        dest: 'src/mwapp.js'
      },
      js2: {
        src: [ "src/api/version.js",
          "src/screens/endscreen.js",
          "src/renderer.js"
          ],
        dest: 'src/endscreen.js'
      },
      js3: {
        src: [ "src/api/version.js",
          "src/screens/splashscreen.js",
          "src/renderer.js"
          ],
        dest: 'src/splashscreen.js'
      },
      js4: {
        src: [ "src/api/version.js",
          "src/screens/debuggingscreen.js",
          "src/renderer.js"
          ],
        dest: 'src/debuggingscreen.js'
      },
      js5: {
        src: [ "src/api/version.js",
            "src/main.js"
          ],
        dest: 'src/index.js'
      }
    }
  })

  grunt.loadNpmTasks('grunt-contrib-concat');
}
