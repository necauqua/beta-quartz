# β-Quartz

A fork of [Quartz](https://github.com/jackyzha0/quartz) which includes my fixes and components.
I'm hoping that most if not all of those will land upstream eventually, but they're dragging their feet idk.

The biggest feature is the possibility to run this version of Quartz standalone - you dont have to
fork this repository! Here's a basic example of how to set it up:

```bash
$ mkdir my-quartz-project && cd my-quartz-project
$ npm i -D quartz@necauqua/beta-quartz # quartz@ prefix is important
$ cp node_modules/quartz/quartz.*.ts . # copy over the default configs
$ rm content/.gitkeep && echo "# Hello World!" > content/index.md
$ npx quartz build --serve # this just works!
$ echo 'body { background: red !important; }' > styles.scss # instead of non-existent quartz/styles/custom.scss
```

And then to update the quartz version to get the latest updates and fixes you just do a little `npm update`, no weird git shenanigans needed.
Note that you're still making your project an npm package, while technically it should work _completely standalone_ (something like `npm install -g quartz@necauqua/quartz`) I haven't tested that yet, there might be unsolved corner-cases.

You can still fork this of course, but the `npx quartz sync` and friends probably wont work - or they might?. I dont use them and I haven't touched or tested them at all.

Other notable features:
 - My customizable `PageProperties` component which renders the frontmatter neatly in case it's an important part of your notes that should be visible.
 - `TransientPage` emitter which creates special pages for links that point to non-existent pages so that you can see backlinks to that non-existent page.
 - `DiscordSpoilers` plugin - allows you to have ||inline spoilers|| similar to Discord - blurs the spoiler text and requires you to click it to reveal.
 - Indexing frontmatter wikilinks to be shown in graph etc. - `PageProperties` depends on that
 - Lowercase URL slugs - this also needed various fixes such as folder names in breadcrumbs, tag names etc.
 - Alias fixes - aliases were pretty broken, some major fixes of mine are already upstreamed in main quartz, the remaining ones are here
 - Goatcounter SPA fix - a lot of other analytics providers also seem broken for SPA, but I use goatcounter so I fixed that.
 - A `substituteComponent` hook that allows you to replace a component used by Quartz by your custom version - this is so that I dont have to fork Quartz to make specific features in default components :P

You might notice that the main branch is a tip of an insane megamerge, which might look _extremely scary_ if you're used to git, the only mainstream VCS out there, and annoying merge conflicts - check out [jj](https://github.com/jj-vcs/jj)!
Not only does it enable weird workflows like this one by having very nice conflict handling, it's also extremely easy to use and understand, and it has novel features like.. undo! And many other cool stuff.

original readme:

# Quartz v4

> “[One] who works with the door open gets all kinds of interruptions, but [they] also occasionally gets clues as to what the world is and what might be important.” — Richard Hamming

Quartz is a set of tools that helps you publish your [digital garden](https://jzhao.xyz/posts/networked-thought) and notes as a website for free.
Quartz v4 features a from-the-ground rewrite focusing on end-user extensibility and ease-of-use.

🔗 Read the documentation and get started: https://quartz.jzhao.xyz/

[Join the Discord Community](https://discord.gg/cRFFHYye7t)

## Sponsors

<p align="center">
  <a href="https://github.com/sponsors/jackyzha0">
    <img src="https://cdn.jsdelivr.net/gh/jackyzha0/jackyzha0/sponsorkit/sponsors.svg" />
  </a>
</p>
