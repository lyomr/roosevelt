/* eslint-env mocha */

const assert = require('assert')
const cleanupTestApp = require('./util/cleanupTestApp')
const { fork } = require('child_process')
const fs = require('fs-extra')
const generateTestApp = require('./util/generateTestApp')
const path = require('path')
const request = require('supertest')

describe('Roosevelt Routes Tests', function () {
  const appDir = path.join(__dirname, 'app/routesTest')

  // options to pass into test app generator
  const options = { rooseveltPath: '../../../roosevelt', method: 'startServer', stopServer: true }

  beforeEach(function (done) {
    // copy the mvc directory into the test app directory for each test
    fs.copySync(path.join(__dirname, './util/mvc'), path.join(appDir, 'mvc'))
    done()
  })

  afterEach(function (done) {
    // clean up the test app directory after each test
    cleanupTestApp(appDir, (err) => {
      if (err) {
        throw err
      } else {
        done()
      }
    })
  })

  it('should render the teddy test page', function (done) {
    // generate the test app
    generateTestApp({
      appDir: appDir,
      generateFolderStructure: true,
      viewEngine: [
        'html: teddy'
      ],
      onServerStart: '(app) => {process.send(app.get("params"))}'
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

    // when the app starts and sends a message back to the parent try and request the test page
    testApp.on('message', (params) => {
      request(`http://localhost:${params.port}`)
        .get('/teddyTest')
        .expect(200, (err, res) => {
          if (err) {
            assert.fail(err)
            testApp.send('stop')
          }
          // test that the values rendered on the page are correct
          const test1 = res.text.includes('Teddy Test')
          const test2 = res.text.includes('Heading Test')
          const test3 = res.text.includes('This is the first sentence that I am grabbing from my teddy model')
          const test4 = res.text.includes('This is the second sentence that I am grabbing from my teddy model')
          assert.strictEqual(test1, true)
          assert.strictEqual(test2, true)
          assert.strictEqual(test3, true)
          assert.strictEqual(test4, true)
          testApp.send('stop')
        })

      // when the child process exits, finish the test
      testApp.on('exit', () => {
        done()
      })
    })
  })

  it('should render a basic HTML page on request', function (done) {
    // generate the test app
    generateTestApp({
      appDir: appDir,
      generateFolderStructure: true,
      onServerStart: '(app) => {process.send(app.get("params"))}'
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

    // when the app starts and sends a message back to the parent try and request the test page
    testApp.on('message', (params) => {
      request(`http://localhost:${params.port}`)
        .get('/HTMLTest')
        .expect(200, (err, res) => {
          if (err) {
            assert.fail(err)
            testApp.send('stop')
          }
          // test that the values rendered on the page are correct
          const test1 = res.text.includes('TitleX')
          const test2 = res.text.includes('headingX')
          const test3 = res.text.includes('sentence1X')
          const test4 = res.text.includes('sentence2X')
          assert.strictEqual(test1, true)
          assert.strictEqual(test2, true)
          assert.strictEqual(test3, true)
          assert.strictEqual(test4, true)
          testApp.send('stop')
        })

      // when the child process exits, finish the test
      testApp.on('exit', () => {
        done()
      })
    })
  })

  it('should render a basic HTML page with a route prefix of "/prefix/"', function (done) {
    // generate the test app
    generateTestApp({
      appDir: appDir,
      generateFolderStructure: true,
      routers: {
        controllers: [
          {
            prefix: '/prefix',
            files: ['plainHTMLController.js']
          }
        ]
      },
      onServerStart: '(app) => {process.send(app.get("params"))}'
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

    // when the app starts and sends a message back to the parent try and request the test page
    testApp.on('message', (params) => {
      // test the basic HTML Route
      request(`http://localhost:${params.port}`)
        .get('/prefix/HTMLTest')
        .expect(200, (err, res) => {
          if (err) {
            testApp.send('stop')
            assert.fail(err)
          }
          testApp.send('stop')
        })
    })

    // when the child process exits, finish the test
    testApp.on('exit', () => {
      done()
    })
  })

  it('should still create a router even if there\'s no leading slash in the prefix paramater', function (done) {
    // generate the test app
    generateTestApp({
      appDir: appDir,
      generateFolderStructure: true,
      routers: {
        controllers: [
          {
            prefix: 'prefix',
            files: ['plainHTMLController.js']
          }
        ]
      },
      onServerStart: '(app) => {process.send(app.get("params"))}'
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

    // when the app starts and sends a message back to the parent try and request the test page
    testApp.on('message', (params) => {
      // test the basic HTML Route
      request(`http://localhost:${params.port}`)
        .get('/prefix/HTMLTest')
        .expect(200, (err, res) => {
          if (err) {
            testApp.send('stop')
            assert.fail(err)
          }
          testApp.send('stop')
        })
    })

    // when the child process exits, finish the test
    testApp.on('exit', () => {
      done()
    })
  })

  it('should render routes of all controllers within a directory using a route prefix', function (done) {
    // generate the test app
    generateTestApp({
      appDir: appDir,
      generateFolderStructure: true,
      routers: {
        controllers: [
          {
            prefix: '/prefix',
            files: ['routerDir']
          }
        ]
      },
      onServerStart: '(app) => {process.send(app.get("params"))}'
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

    // when the app starts and sends a message back to the parent try and request the test page
    testApp.on('message', (params) => {
      // test the first controller in the directory
      request(`http://localhost:${params.port}`)
        .get('/prefix/controller1')
        .expect(200, (err, res) => {
          if (err) {
            testApp.send('stop')
            assert.fail(err)
          }
          // test the second controller in the directory
          request(`http://localhost:${params.port}`)
            .get('/prefix/controller2')
            .expect(200, (err, res) => {
              if (err) {
                assert.fail(err)
              }
              testApp.send('stop')
            })
        })

      // when the child process exits, finish the test
      testApp.on('exit', () => {
        done()
      })
    })
  })

  it('should render routes of controllers using a schema file within the controllers directory', function (done) {
    // generate the test app
    generateTestApp({
      appDir: appDir,
      generateFolderStructure: true,
      routers: {
        controllers: 'schema.js'
      },
      onServerStart: '(app) => {process.send(app.get("params"))}'
    }, options)

    const schema = `module.exports = [
      {
        prefix: '/prefix',
        files: ['plainHTMLController.js']
      }
    ]`

    fs.outputFileSync(path.join(appDir, 'mvc/controllers/schema.js'), schema)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

    // when the app starts and sends a message back to the parent try and request the test page
    testApp.on('message', (params) => {
      // test basic HTML Route
      request(`http://localhost:${params.port}`)
        .get('/prefix/HTMLTest')
        .expect(200, (err, res) => {
          if (err) {
            testApp.send('stop')
            assert.fail(err)
          }
          testApp.send('stop')
        })

      // when the child process exits, finish the test
      testApp.on('exit', () => {
        done()
      })
    })
  })

  // test for console output for invalid params within routers
  const logOutputTests = [
    {
      logName: 'should warn that there is an invalid configuration in the "routers.controllers" parameter if one of the indices in the files array is not an object',
      routers: {
        controllers: [
          'not an object',
          {}
        ]
      },
      getRequest: '/HTMLTest',
      logMessage: 'Invalid configuration found in the "routers.controllers" parameter. Please make sure it is coded correctly. See documentation at http://github.com/rooseveltframework/roosevelt for examples.'
    },
    {
      logName: 'should warn that there is an invalid configuration in the "routers.controllers" parameter if one of the controller objects is missing the key "prefix"',
      routers: {
        controllers: [
          {
            files: ['plainHTMLController.js']
          }
        ]
      },
      getRequest: '/HTMLtest',
      logMessage: 'Invalid configuration found in the "routers.controllers" parameter. Please make sure it is coded correctly. See documentation at http://github.com/rooseveltframework/roosevelt for examples.'
    },
    {
      logName: 'should warn that there is an invalid configuration in the "routers.controllers" parameter if the prefix includes unsafe URL Characters',
      routers: {
        controllers: [
          {
            prefix: '^invalid',
            files: ['plainHTMLController.js']
          }
        ]
      },
      getRequest: '/HTMLTest',
      logMessage: 'Invalid configuration found in the "routers.controllers" parameter. Please make sure it is coded correctly. See documentation at http://github.com/rooseveltframework/roosevelt for examples.'
    },
    {
      logName: 'should warn that there is an invalid configuration in the "routers.controllers" parameter if one of the controller objects is missing the key "files"',
      routers: {
        controllers: [
          {
            prefix: '/test'
          }
        ]
      },
      getRequest: '/HTMLTest',
      logMessage: 'Invalid configuration found in the "routers.controllers" parameter. Please make sure it is coded correctly. See documentation at http://github.com/rooseveltframework/roosevelt for examples.'
    },
    {
      logName: 'should warn that there is an invalid configuration in the "routers.controllers" parameter if one of the controller objects has invalid data type for the key "files"',
      routers: {
        controllers: [
          {
            prefix: '/test',
            files: true
          }
        ]
      },
      getRequest: '/HTMLTest',
      logMessage: 'Invalid configuration found in the "routers.controllers" parameter. Please make sure it is coded correctly. See documentation at http://github.com/rooseveltframework/roosevelt for examples.'
    },
    {
      logName: 'should warn that there is an invalid configuration in the "routers.controllers" parameter if one of the controller objects has an empty array for the key "files"',
      routers: {
        controllers: [
          {
            prefix: '/test',
            files: []
          }
        ]
      },
      getRequest: '/HTMLTest',
      logMessage: 'Invalid configuration found in the "routers.controllers" parameter. Please make sure it is coded correctly. See documentation at http://github.com/rooseveltframework/roosevelt for examples.'
    },
    {
      logName: 'should warn that there is an invalid configuration in the "routers.controllers" parameter if one of the controller objects has an invalid data type within the key "files"',
      routers: {
        controllers: [
          {
            prefix: '/test',
            files: ['plainHTMLController.js', true]
          }
        ]
      },
      getRequest: '/test/HTMLTest',
      logMessage: 'Invalid configuration found in the "routers.controllers" parameter. Please make sure it is coded correctly. See documentation at http://github.com/rooseveltframework/roosevelt for examples.'
    },
    {
      logName: 'should warn that the app failed to load a controller file associated with a specific router if the file does not exist',
      routers: {
        controllers: [
          {
            prefix: '/prefix',
            files: ['doesnotexist.js', 'plainHTMLController.js']
          }
        ]
      },
      getRequest: '/prefix/HTMLTest',
      logMessage: 'failed to load the file: "doesnotexist.js" to use with the router associated with controller prefix: /prefix'
    },
    {
      logName: 'should warn that the app failed to load a controllers directory associated with a specific router if the directory does not exist',
      routers: {
        controllers: [
          {
            prefix: '/prefix',
            files: ['doesnotexist', 'plainHTMLController.js']
          }
        ]
      },
      getRequest: '/prefix/HTMLTest',
      logMessage: 'failed to load the directory: "doesnotexist" to use with the router associated with controller prefix: /prefix'
    },
    {
      logName: 'should warn that a schema file containing the controller routers could not be loaded by roosevelt',
      routers: {
        controllers: 'doesnotexist.js'
      },
      getRequest: '/HTMLTest',
      logMessage: 'Failed to load file: "doesnotexist.js". All controllers will be routed through the app level router'
    },
    {
      logName: 'should warn that there is an invalid configuration in the "routers.public" parameter if one of the indices in the files array is not an object',
      routers: {
        public: [
          'not an object',
          {}
        ]
      },
      getRequest: '/css/style.css',
      logMessage: 'Invalid configuration found in the "routers.public" parameter. Please make sure it is coded correctly. See documentation at http://github.com/rooseveltframework/roosevelt for examples.'
    },
    {
      logName: 'should warn that the app failed to load a public directory associated with a specific router if the directory does not exist',
      routers: {
        public: [
          {
            prefix: '/prefix',
            dirs: ['doesnotexist', 'css']
          }
        ]
      },
      getRequest: '/prefix/css/style.css',
      logMessage: 'failed to load the directory: "doesnotexist" to use with the router associated with public prefix: /prefix'
    }
  ]

  logOutputTests.forEach(test => {
    let warnBool = false
    let rooseveltLogOutput
    it(test.logName, function (done) {
      fs.outputFileSync(path.join(appDir, 'statics/css/style.css'), 'body { color: red; }')
      // generate the test app
      generateTestApp({
        appDir: appDir,
        generateFolderStructure: true,
        routers: test.routers,
        onServerStart: '(app) => {process.send(app.get("params"))}'
      }, options)

      // fork and run app.js as a child process
      const testApp = fork(path.join(appDir, 'app.js'), ['--dev'], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

      // when the app starts and sends a message back to the parent try and request the test page
      testApp.on('message', (params) => {
        request(`http://localhost:${params.port}`)
          .get(test.getRequest)
          .expect(200, (err, res) => {
            if (err) {
              testApp.send('stop')
              assert.fail(err)
            } else {
              testApp.send('stop')
            }
          })
      })

      testApp.stderr.on('data', message => {
        rooseveltLogOutput = message.toString()
        if (message.toString().includes(test.logMessage)) {
          warnBool = true
        }
      })

      // when the child process exits, finish the test
      testApp.on('exit', () => {
        assert.strictEqual(warnBool, true, `Roosevelt expected the error message: ${test.logMessage} but recieved: ${rooseveltLogOutput}`)
        done()
      })
    })
  })

  const redirectTests = [
    {
      logName: 'should concatenate a route prefix for redirection with res.redirect(address)',
      status: 302,
      redirectArgs: {
        address: '/endpoint'
      },
      location: '/prefix/endpoint'
    },
    {
      logName: 'should concatenate a route prefix for redirection with res.redirect(status, address)',
      status: 302,
      redirectArgs: {
        address: '/endpoint',
        status: '302'
      },
      location: '/prefix/endpoint'
    },
    {
      logName: 'should not concatenate a route prefix for redirection with res.redirect(address, override)',
      status: 302,
      redirectArgs: {
        address: '/endpoint',
        override: 'true'
      },
      location: '/endpoint'
    },
    {
      logName: 'should not concatenate a route prefix for redirection with res.redirect(status, address, override)',
      status: 302,
      redirectArgs: {
        address: '/endpoint',
        status: '302',
        override: 'true'
      },
      location: '/endpoint'
    },
    {
      logName: 'should log an error and redirect to \'/\' if invalid or no arguments are passed to res.redirect()',
      status: 302,
      redirectArgs: {},
      location: '/',
      error: true,
      errorLog: 'Invalid arguments supplied to res.redirect()'
    }
  ]
  redirectTests.forEach(test => {
    it(test.logName, function (done) {
      let location
      let errorBool
      fs.outputFileSync(path.join(appDir, 'statics/css/style.css'), 'body { color: red; }')
      // generate the test app
      generateTestApp({
        appDir: appDir,
        generateFolderStructure: true,
        routers: {
          controllers: [
            {
              prefix: '/prefix',
              files: ['routerDir']
            }
          ]
        },
        onServerStart: '(app) => {process.send(app.get("params"))}'
      }, options)

      // fork and run app.js as a child process
      const testApp = fork(path.join(appDir, 'app.js'), ['--dev'], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

      // when the app starts and sends a message back to the parent try and request the test page
      testApp.on('message', (params) => {
        request(`http://localhost:${params.port}`)
          .post('/prefix/redirect')
          .send(test.redirectArgs)
          .expect(302, (err, res) => {
            if (err) {
              testApp.send('stop')
              assert.fail(err)
            } else {
              location = res.headers.location
              testApp.send('stop')
            }
          })
      })

      if (test.error) {
        testApp.stderr.on('data', data => {
          if (data.includes(test.errorLog)) {
            errorBool = true
          }
        })
      }

      // when the child process exits, finish the test
      testApp.on('exit', () => {
        assert.strictEqual(location, test.location)
        if (test.error) assert.strictEqual(errorBool, true, 'Roosevelt was expected to print an error log if invalid or no arguments are passed to res.redirect()')
        done()
      })
    })
  })

  it('should use a custom port and render a basic HTML page on request', function (done) {
    // generate the test app
    generateTestApp({
      appDir: appDir,
      port: 9000,
      generateFolderStructure: true,
      onServerStart: '(app) => {process.send(app.get("params"))}'
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

    // when the app starts and sends a message back to the parent try and request the test page
    testApp.on('message', (params) => {
      request(`http://localhost:${params.port}`)
        .get('/HTMLTest')
        .expect(200, (err, res) => {
          if (err) {
            assert.fail(err)
            testApp.send('stop')
          }
          // test that the values rendered on the page are correct
          const test1 = res.text.includes('TitleX')
          const test2 = res.text.includes('headingX')
          const test3 = res.text.includes('sentence1X')
          const test4 = res.text.includes('sentence2X')
          assert.strictEqual(test1, true)
          assert.strictEqual(test2, true)
          assert.strictEqual(test3, true)
          assert.strictEqual(test4, true)
          testApp.send('stop')
        })

      // when the child process exits, finish the test
      testApp.on('exit', () => {
        done()
      })
    })
  })

  it('should render the default 404 page if there is a request for an invalid route', function (done) {
    // generate the test app
    generateTestApp({
      appDir: appDir,
      generateFolderStructure: true,
      viewEngine: [
        'html: teddy'
      ],
      onServerStart: '(app) => {process.send(app.get("params"))}'
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

    // when the app starts and sends a message back to the parent try and request an invalid route
    testApp.on('message', () => {
      request('http://localhost:43711')
        .get('/randomURL')
        .expect(404, (err, res) => {
          if (err) {
            assert.fail(err)
            testApp.send('stop')
          }
          // data included on the 404 page
          const test1 = res.text.includes('404 Not Found')
          const test2 = res.text.includes('The requested URL /randomURL was not found on this server')
          assert.strictEqual(test1, true)
          assert.strictEqual(test2, true)
          testApp.send('stop')
        })

      // when the child process exits, finish the test
      testApp.on('exit', () => {
        done()
      })
    })
  })

  it('should render a custom 404 page if there is a request for an invalid route and the 404 parameter is set.', function (done) {
    // copy the custom 404 controller into to the mvc folder
    fs.copyFileSync(path.join(__dirname, './util/404test.js'), path.join(appDir, 'mvc/controllers/404test.js'))

    // generate the test app
    generateTestApp({
      appDir: appDir,
      generateFolderStructure: true,
      errorPages: {
        notFound: '404test.js'
      },
      onServerStart: '(app) => {process.send(app.get("params"))}'
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

    // when the app starts and sends a message back to the parent try and request an invalid route
    testApp.on('message', (params) => {
      request(`http://localhost:${params.port}`)
        .get('/randomURL')
        .expect(404, (err, res) => {
          if (err) {
            assert.fail(err)
            testApp.send('stop')
          }
          // data included on the custom 404 page
          const test1 = res.text.includes('404 custom test error page')
          const test2 = res.text.includes('The page you are looking for is not found')
          const test3 = res.text.includes('This is a test to see if we can make custom 404 controllers and pages')
          assert.strictEqual(test1, true)
          assert.strictEqual(test2, true)
          assert.strictEqual(test3, true)
          testApp.send('stop')
        })

      // when the child process exits, finish the test
      testApp.on('exit', () => {
        done()
      })
    })
  })

  it('should render a custom 500 page if there is a request for a route that will respond with a server error and the 500 parameter is set', function (done) {
    // generate the test app
    generateTestApp({
      appDir: appDir,
      generateFolderStructure: true,
      errorPages: {
        internalServerError: '500test.js'
      },
      onServerStart: '(app) => {process.send(app.get("params"))}'
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

    // when the app starts and sends a message back to the parent try and request the server error route
    testApp.on('message', (params) => {
      request(`http://localhost:${params.port}`)
        .get('/serverError')
        .expect(500, (err, res) => {
          if (err) {
            assert.fail(err)
            testApp.send('stop')
          }
          // data included on the custom 500 page
          const test1 = res.text.includes('500 custom test error page')
          const test2 = res.text.includes('An error had occurred on the server')
          const test3 = res.text.includes('This is a test to see if we can make custom 500 controllers and pages')
          assert.strictEqual(test1, true)
          assert.strictEqual(test2, true)
          assert.strictEqual(test3, true)
          testApp.send('stop')
        })

      // when the child process exits, finish the test
      testApp.on('exit', () => {
        done()
      })
    })
  })

  it('should render the default 500 error page if an error has occured on the server', function (done) {
    // generate the test app
    generateTestApp({
      appDir: appDir,
      generateFolderStructure: true,
      onServerStart: '(app) => {process.send(app.get("params"))}'
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

    // when the app starts and sends a message back to the parent try and request the server error route
    testApp.on('message', (params) => {
      request(`http://localhost:${params.port}`)
        .get('/serverError')
        .expect(500, (err, res) => {
          if (err) {
            assert.fail(err)
            testApp.send('stop')
          }
          // data included on the default 500 page
          const test1 = res.text.includes('500 Internal Server Error')
          const test2 = res.text.includes('The requested URL /serverError is temporarily unavailable at this time.')
          assert.strictEqual(test1, true)
          assert.strictEqual(test2, true)
          testApp.send('stop')
        })

      // when the child process exits, finish the test
      testApp.on('exit', () => {
        done()
      })
    })
  })

  it('should respond with a 503 status when the server is busy', function (done) {
    let detect503 = false

    // generate the test app
    generateTestApp({
      appDir: appDir,
      generateFolderStructure: true,
      onServerStart: '(app) => {process.send(app.get("params"))}',
      toobusy: {
        maxLagPerRequest: 10,
        lagCheckInterval: 16
      }
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

    testApp.on('message', (params) => {
      sendRequest()

      // spam requests until 503 is detected
      function sendRequest () {
        request(`http://localhost:${params.port}`)
          .get('/slow')
          .expect(503, (err, res) => {
            if (err) {
              // do nothing
            } else {
              if (res.text.includes('503 Service Unavailable')) {
                detect503 = true
              }
            }
          })
        if (detect503) {
          testApp.send('stop')
        } else {
          setTimeout(sendRequest, 0)
        }
      }
    })

    // when the child process exits, finish the test
    testApp.on('exit', () => {
      done()
    })
  })

  it('should respond with a custom 503 error page when the server is busy', function (done) {
    let detect503

    // generate the test app
    generateTestApp({
      appDir: appDir,
      generateFolderStructure: true,
      errorPages: {
        serviceUnavailable: '503test.js'
      },
      onServerStart: '(app) => {process.send(app.get("params"))}',
      toobusy: {
        maxLagPerRequest: 10,
        lagCheckInterval: 16
      }
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

    testApp.on('message', (params) => {
      sendRequest()

      // spam requests until a 503 status is detected
      function sendRequest () {
        request(`http://localhost:${params.port}`)
          .get('/slow')
          .expect(503, (err, res) => {
            if (err) {
              // do nothing
            } else {
              if (res.text.includes('503 custom test error page')) {
                detect503 = true
              }
            }
          })
        if (detect503) {
          testApp.send('stop')
        } else {
          setTimeout(sendRequest, 1)
        }
      }
    })

    // when the child process exits, finish the test
    testApp.on('exit', () => {
      done()
    })
  })

  it('should be able to handle multiple viewEngines', function (done) {
    // generate the test app
    generateTestApp({
      appDir: appDir,
      generateFolderStructure: true,
      viewEngine: [
        'html: teddy',
        'jcs: ../test/util/jcsTemplate'
      ],
      onServerStart: '(app) => {process.send(app.get("view engine"))}'
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

    // checks to see if the view engine returned is the first element
    testApp.on('message', (viewEngine) => {
      assert.strictEqual(viewEngine, 'html', 'The view Engine has been set to something else other than the first element')
      testApp.send('stop')
    })

    // when the child process exits, finish the test
    testApp.on('exit', () => {
      done()
    })
  })

  it('should be able to use view engines that are functions and do not have an __express function', function (done) {
    // generate the test app
    generateTestApp({
      appDir: appDir,
      generateFolderStructure: true,
      viewEngine: [
        'jcs: ../test/util/jcsTemplate'
      ],
      onServerStart: '(app) => {process.send(app.get("params"))}'
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

    // when the app starts test the custom view engine
    testApp.on('message', (params) => {
      request(`http://localhost:${params.port}`)
        .get('/jcsTest')
        .expect(200, (err, res) => {
          if (err) {
            assert.fail(err)
            testApp.send('stop')
          }
          assert.strictEqual(res.text.includes('jcs Test'), true)
          assert.strictEqual(res.text.includes('jcsHeader'), true)
          assert.strictEqual(res.text.includes('jcsParagraph'), true)
          testApp.send('stop')
        })
    })

    // when the child process exits, finish the test
    testApp.on('exit', () => {
      done()
    })
  })

  it('should throw an Error if the ViewEngine parameter is formatted incorrectly', function (done) {
    // bool var to hold whether or not the error of the viewEngine param being formatted incorrectly was thrown
    let viewEngineFormattedIncorrectlyBool = false

    // generate the test app
    generateTestApp({
      generateFolderStructure: true,
      appDir: appDir,
      viewEngine: [
        'html: teddy: blah'
      ],
      onServerStart: '(app) => {process.send(app.get("params"))}'
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), ['--dev'], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

    // listen to the stream errors for the view engine error
    testApp.stderr.on('data', (data) => {
      if (data.includes('fatal error: viewEngine param must be formatted')) {
        viewEngineFormattedIncorrectlyBool = true
      }
    })

    // when the app starts, kill it
    testApp.on('message', () => {
      testApp.send('stop')
    })

    // when the child process exits, test the assertion and finish the test
    testApp.on('exit', () => {
      assert.strictEqual(viewEngineFormattedIncorrectlyBool, true, 'Roosevelt did not throw an error when the way viewEngine was formatted incorrectly')
      done()
    })
  })

  it('should throw an Error if the module passed into viewEngine is nonExistent', function (done) {
    let viewEngineConfiguredIncorrectlyBool = false

    // generate the test app
    generateTestApp({
      generateFolderStructure: true,
      appDir: appDir,
      viewEngine: [
        'html: teddyza'
      ],
      onServerStart: '(app) => {process.send(app.get("params"))}'
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), ['--dev'], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

    // look at the error log and see if the error shows up
    testApp.stderr.on('data', (data) => {
      if (data.includes('Failed to register viewEngine')) {
        viewEngineConfiguredIncorrectlyBool = true
      }
    })

    // when the app is starting, kill it
    testApp.on('message', () => {
      testApp.send('stop')
    })

    // when the child process exits, test the assertion and finish the test
    testApp.on('exit', () => {
      assert.strictEqual(viewEngineConfiguredIncorrectlyBool, true, 'Roosevelt did not throw an error when the ViewEngine contains a node module that does not exists')
      done()
    })
  })

  it('should be able to set the viewEngine if it was just a string', function (done) {
    // generate the test app
    generateTestApp({
      generateFolderStructure: true,
      appDir: appDir,
      viewEngine: 'html: teddy',
      onServerStart: '(app) => {process.send(app.get("params"))}'
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), ['--dev'], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

    // when the app finishes its initialization, send a request to the teddy page
    testApp.on('message', (params) => {
      request(`http://localhost:${params.port}`)
        .get('/teddyTest')
        .expect(200, (err, res) => {
          if (err) {
            assert.fail(err)
            testApp.send('stop')
          }
          // test the data rendered on the default teddy page
          const test1 = res.text.includes('Teddy Test')
          const test2 = res.text.includes('Heading Test')
          const test3 = res.text.includes('This is the first sentence that I am grabbing from my teddy model')
          const test4 = res.text.includes('This is the second sentence that I am grabbing from my teddy model')
          assert.strictEqual(test1, true)
          assert.strictEqual(test2, true)
          assert.strictEqual(test3, true)
          assert.strictEqual(test4, true)
          testApp.send('stop')
        })
    })

    // when the child process exits, finish the test
    testApp.on('exit', () => {
      done()
    })
  })

  it('should complete the request even though the server was closed in the middle of it and respond 503 to any other request made afterwards', function (done) {
    let shuttingDownLogBool = false
    let successfulShutdownBool = false
    let port = 0

    // generate the test app
    generateTestApp({
      appDir: appDir,
      generateFolderStructure: true,
      onServerStart: '(app) => {process.send(app.get("params"))}'
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), ['--prod'], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

    // on console.logs, check for correct output
    testApp.stdout.on('data', (data) => {
      if (data.includes('Roosevelt Express received kill signal, attempting to shut down gracefully.')) {
        shuttingDownLogBool = true
      }
      if (data.includes('Roosevelt Express successfully closed all connections and shut down gracefully.')) {
        successfulShutdownBool = true
      }
    })

    // when the app finishes, save the app and send a request to the page that has a long timeout
    testApp.on('message', (params) => {
      if (params.port) {
        port = params.port
        request(`http://localhost:${params.port}`)
          .get('/longWait')
          .expect(200, (err, res) => {
            // it should still respond with longWait done
            if (err) {
              assert.fail(err)
            } else {
              assert.strictEqual(res.text, 'longWait done', 'Roosevelt did not finish a response that was made before it was shut down')
            }
          })
      } else {
        // the controller of /longWait sends back a message, on that msg, kill the app and try to grab a basic page
        testApp.send('stop')
        request(`http://localhost:${port}`)
          .get('/')
          // we should get back a 503 from the request
          .expect(503, (err, res) => {
            if (err) {
              assert.fail(err)
            } else {
              const test = res.text.includes('503 Service Unavailable')
              assert.strictEqual(test, true, 'Roosevelt did not respond back with a 503 page when a page was requested as it was shutting down')
            }
          })
      }
    })

    // when the child process exits, test the assertions and finish the test
    testApp.on('exit', () => {
      assert.strictEqual(shuttingDownLogBool, true, 'Roosevelt did not log that it is gracefully shutting down the server')
      assert.strictEqual(successfulShutdownBool, true, 'Roosevelt did not log that it successfully closed all connections and that its shutting down')
      done()
    })
  })

  it('should force close all active connections and exit the process if the time allotted in the shutdownTimeout has past after shutdown was called and a connection was still active', function (done) {
    let forceCloseLogBool = false
    let shuttingDownLogBool = false

    // generate the test app
    generateTestApp({
      appDir: appDir,
      generateFolderStructure: true,
      onServerStart: '(app) => {process.send(app.get("params"))}',
      shutdownTimeout: 7000
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), ['--prod'], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

    // on console logs, see that the app is shutting down
    testApp.stdout.on('data', (data) => {
      if (data.includes('Roosevelt Express received kill signal, attempting to shut down gracefully.')) {
        shuttingDownLogBool = true
      }
    })

    // on error, see that not all connections are finishing and that its force killing them
    testApp.stderr.on('data', (data) => {
      if (data.includes('Roosevelt Express could not close all connections in time; forcefully shutting down')) {
        forceCloseLogBool = true
      }
    })

    // when the app finishes initialization, ask for longWait
    testApp.on('message', (params) => {
      if (params.port) {
        request(`http://localhost:${params.port}`)
          .get('/longWait')
          // since we are force closing this connection while its still active, it should not send back a response object or a status number
          .expect(200, (err, res) => {
            if (!err) {
              assert.fail('The server responded without error.')
            }
            assert.strictEqual(res, undefined, 'Roosevelt gave back a response object even though the connection for force closed')
          })
      } else {
        testApp.send('stop')
      }
    })

    // when the child process exits, test the assertions and finish the test
    testApp.on('exit', () => {
      assert.strictEqual(forceCloseLogBool, true, 'Roosevelt did not log that it is force closing connections')
      assert.strictEqual(shuttingDownLogBool, true, 'Roosevelt did not log that it is gracefully shutting down the server')
      done()
    })
  })

  it('should force close all active connections and close the HTTP & HTTPS server if the time allotted in the shutdownTimeout has past after shutdown was called and a connection was still active', function (done) {
    // add test app features to use server close and then exit process
    options.close = true
    options.exitProcess = true
    options.serverType = 'httpsServer'

    // bool vars to hold whether or not the correct logs were outputted
    let forceCloseLogBool = false
    let shuttingDownLogBool = false

    // generate the test app
    generateTestApp({
      appDir: appDir,
      generateFolderStructure: true,
      https: {
        enable: true,
        port: 43203
      },
      onServerStart: '(app) => {process.send(app.get("params"))}',
      shutdownTimeout: 7000
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), ['--prod'], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

    // on console logs, see that the app is shutting down
    testApp.stdout.on('data', (data) => {
      if (data.includes('Roosevelt Express received kill signal, attempting to shut down gracefully.')) {
        shuttingDownLogBool = true
      }
    })

    // on error, see that not all connections are finishing and that its force killing them
    testApp.stderr.on('data', (data) => {
      if (data.includes('Roosevelt Express could not close all connections in time; forcefully shutting down')) {
        forceCloseLogBool = true
      }
    })

    // when the app finishes initialization, ask for longWait
    testApp.on('message', (params) => {
      if (params.port) {
        request(`http://localhost:${params.port}`)
          .get('/longWait')
          // since we are force closing this connection while its still active, it should not send back a response object or a status number
          .expect(200, (err, res) => {
            if (!err) {
              assert.fail('The server responded without error.')
            }
            assert.strictEqual(res, undefined, 'Roosevelt gave back a response object even though the connection for force closed')
          })
      } else {
        testApp.send('stop')
      }
    })

    // when the child process exits, test the assertions and finish the test
    testApp.on('exit', () => {
      assert.strictEqual(forceCloseLogBool, true, 'Roosevelt did not log that it is force closing connections')
      assert.strictEqual(shuttingDownLogBool, true, 'Roosevelt did not log that it is gracefully shutting down the server')
      delete options.close
      delete options.exitProcess
      delete options.serverType
      done()
    })
  })

  it('should be able to start the app normally without any controller errors, even though there is a non-controller file in the controller folder', function (done) {
    let appCompletedInitLogBool = false
    let controllerErrorLogBool = false

    // copy the ico file into the controller directory
    fs.copyFileSync(path.join(__dirname, './util/faviconTest.ico'), path.join(appDir, 'mvc/controllers/faviconTest.ico'))

    // generate the test app
    generateTestApp({
      appDir: appDir,
      generateFolderStructure: true,
      onServerStart: '(app) => {process.send(app.get("params"))}'
    }, options)

    // fork and run app.js as a child process
    const testApp = fork(path.join(appDir, 'app.js'), ['--dev'], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })

    // on console logs, see if the app completed its initialization
    testApp.stdout.on('data', (data) => {
      if (data.includes('Roosevelt Express HTTP server listening on port 43711 (development mode)')) {
        appCompletedInitLogBool = true
      }
    })

    // on error logs, see if the app failed to load any controller files
    testApp.stderr.on('data', (data) => {
      if (data.includes('failed to load controller file')) {
        controllerErrorLogBool = true
      }
    })

    // when the app finishes initialization, kill it
    testApp.on('message', () => {
      testApp.send('stop')
    })

    // when the child process exits, test the assertions and finish the test
    testApp.on('exit', () => {
      assert.strictEqual(appCompletedInitLogBool, true, 'Roosevelt did not complete its initalization, probably because of the non-controller file in the controller directory')
      assert.strictEqual(controllerErrorLogBool, false, 'Roosevelt threw an error on a file in the controller directory that it should have passed over')
      done()
    })
  })
})
