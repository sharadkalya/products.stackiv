module.exports = {
  default: {
    require: ['step_definitions/**/*.js'],
    paths: ['features/**/*.feature'],
    format: [
      'progress',
      'html:reports/cucumber-report.html'
    ],
    parallel: 0,
    publishQuiet: true
  }
};
