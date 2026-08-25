/**
 * Turns the @tailwind directives in src/index.css into real CSS at build time.
 * Without this file those directives are copied into dist/ verbatim and every
 * utility class in the app silently does nothing.
 */
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
