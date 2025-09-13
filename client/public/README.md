Public static files served by Vite from the `public/` folder.

How to use:

- Files placed in `client/public/` are served at the root of the dev server. For example:
  - `client/public/favicon.svg` -> `http://localhost:5173/favicon.svg`
  - `client/public/hello.txt` -> `http://localhost:5173/hello.txt`

Notes:
- Keep `index.html` in the project root; reference static assets with absolute paths like `/favicon.svg`.
