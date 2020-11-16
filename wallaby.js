module.exports = () => {

  return {
    files: [
      'src/**/*.ts',
      'test/**/*.ts',
      '!test/**/*.spec.ts'
    ],
    tests: [
      'test/**/*.spec.ts'
    ],

    workers: {
      initial: 4,
      regular: 1,
      restart: true
    },

    testFramework: 'mocha',
    env: { type: 'node' },
    debug: true
  };
};