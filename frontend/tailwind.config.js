/**
 * Tailwind is compiled locally by PostCSS (see postcss.config.js) rather than
 * pulled from cdn.tailwindcss.com, which is not intended for production and
 * prints a console warning that shows up in any screen recording.
 *
 * `content` must list every file that mentions a utility class — Tailwind only
 * emits the classes it can see here. Class names are always written out in full
 * in this codebase (never built by string interpolation), so scanning works.
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {}
  },
  plugins: []
};
