# The Open Witness Archive

A static edition of the original-fiction archive at Fandom. The `content/` folder contains the article sources. Editing a `.wikitext` file and pushing it to the repository causes Vercel to run `node build.mjs` and publish the updated HTML.

Run locally with `node build.mjs`. The generated site is in `public/`.

The site is publicly readable and has no visitor editing interface. Repository access controls who can edit and deploy. The Fandom original remains online; this edition attributes it and follows its CC BY-SA 3.0 license.
