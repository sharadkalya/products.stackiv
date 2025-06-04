module.exports = {
  default: {
    require: ['step_definitions/**/*.js'],  // Updated path
    paths: ['features/**/*.feature'],       // Supports nested feature files too
   // publishQuiet: true,
    parallel: 0
  }
};
