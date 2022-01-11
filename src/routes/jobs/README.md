# Jobs page and subscriptions

Please don't hate me...

The .md files in this folder are PURELY md files. They do not understand any
Svelte-isms. They are parsed as text for the RSS/JSON feeds and are run through
a markdown component to display (when "active" on the website.)

## Frontmatter

- title: string. shown in the rss feed and on the jobs page
- active: boolean. whether to show on jobs page
- feed: boolean. whether to include in the rss/json feeds
- updatedDate: ISO string... if _really_ necessary something like
  "2022-01-04T04:01:45.251Z"

## Content

Since these are regular .md files and cannot know what the live url of the site
is (local, PR, production), we search and replace the string `__URL__` with
the live url.
