export default {
  plugins: [
    require('autoprefixer')({
      overrideBrowserslist: [
        'defaults',
        'last 2 versions',
        '> 1%',
        'not dead',
        'not ie 11',
      ],
      grid: 'autoplace',
      flexbox: 'no-2009',
    }),
  ],
};