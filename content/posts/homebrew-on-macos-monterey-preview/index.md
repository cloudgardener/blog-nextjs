---
title: "How to get Homebrew to work on macOS Monterey Preview?"
date: 2021-06-09T17:18:00+02:00
description: "How to get Homebrew to work on macOS Monterey Preview?"
featured: monterey.png
---

![macOS Monterey beta](monterey.png)

Apple is running their annual developer conference WWDC this week and unveiled the 18th major version of macOS – [macOS Monterey](https://www.apple.com/macos/monterey-preview/). It comes with many neat features, but those are not the topic of this post.

The topic of this post is: "How to get Homebrew to work on macOS Monterey Preview."

> What Does Homebrew Do?
>
> Homebrew installs the stuff you need that Apple didn't.

Following instructions will guide you through the process that allows you to use Homebrew Bottles created for macOS Big Sur on macOS Monterey Preview.

#### Update Homebrew

```bash
% brew update
```

#### Try to upgrade...

```bash
% brew upgrade
Warning: You are using macOS 12.
We do not provide support for this pre-release version.
You will encounter build failures with some formulae.
Please create pull requests instead of asking for help on Homebrew's GitHub,
Twitter or any other official channels. You are responsible for resolving
any issues you experience while you are running this
pre-release version.
```

No luck – the newly released macOS is not supported :´(

Fortunately, the solution to this problem is simple!

#### Fool the Homebrew to believe that we are running macOS Big Sur by modifying `brew.sh`

Edit the line `337` on `brew.sh`. Replace the variable `HOMEBREW_MACOS_VERSION` value with a static value, e.g. `"11.5"`, which is the latest minor version of macOS Big Sur.

On Apple Silicon based Mac you can find `brew.sh` from `/opt/homebrew/Library/Homebrew` folder, and Intel Mac `/usr/local/Homebrew/Library/Homebrew` folder.

#### Diff after the modification

After you have saved the changes to `brew.sh` the git diff should look like this:

```diff
% git diff
diff --git a/Library/Homebrew/brew.sh b/Library/Homebrew/brew.sh
index e2875794a..fc0b054c3 100644
--- a/Library/Homebrew/brew.sh
+++ b/Library/Homebrew/brew.sh
@@ -334,7 +334,7 @@ then
   HOMEBREW_PRODUCT="Homebrew"
   HOMEBREW_SYSTEM="Macintosh"
   [[ "${HOMEBREW_PROCESSOR}" = "x86_64" ]] && HOMEBREW_PROCESSOR="Intel"
-  HOMEBREW_MACOS_VERSION="$(/usr/bin/sw_vers -productVersion)"
+  HOMEBREW_MACOS_VERSION="11.5" #"$(/usr/bin/sw_vers -productVersion)"
   # Don't change this from Mac OS X to match what macOS itself does in Safari on 10.12
   HOMEBREW_OS_USER_AGENT_VERSION="Mac OS X ${HOMEBREW_MACOS_VERSION}"
```

#### Disable Homebrew auto-update

By default, Homebrew auto-updates itself, which means that our changes will be overwritten on every update. To prevent this to happen, add the following:

```bash
# disable homebrew self-update
export HOMEBREW_NO_AUTO_UPDATE=1
```

into your `~/.zshrc` or `~/.bashrc`, and source it to make the change active.

#### Run Homebrew upgrade

```bash
brew upgrade
```

See? – No errors.

#### How about Homebrew config?

```bash
% brew config
HOMEBREW_VERSION: 3.1.11-dirty
ORIGIN: https://github.com/Homebrew/brew
HEAD: 9657303ed2c484a4bd8f7527706940f9e4d43354
Last commit: 2 days ago
Core tap ORIGIN: https://github.com/Homebrew/homebrew-core
Core tap HEAD: 1a1121be16d84fcd03ab06e9a88614b4ff1bb365
Core tap last commit: 22 minutes ago
Core tap branch: master
HOMEBREW_PREFIX: /usr/local
HOMEBREW_CASK_OPTS: []
HOMEBREW_MAKE_JOBS: 16
Homebrew Ruby: 2.6.3 => /System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/bin/ruby
CPU: 16-core 64-bit kabylake
Clang: 12.0.5 build 1205
Git: 2.32.0 => /usr/local/bin/git
Curl: 7.76.0 => /usr/bin/curl
macOS: 11.5-x86_64
CLT: 12.0.0.32.29
Xcode: 12.5
```

As we can see, Homebrew thinks that we are still on macOS Big Sur :)

#### Try to reinstall a package

```bash
% brew reinstall gh
==> Downloading https://ghcr.io/v2/homebrew/core/gh/manifests/1.11.0
Already downloaded: /Users/nikovirtala/Library/Caches/Homebrew/downloads/ddad4ddc988804cf6037325a229259e1d5267e9203e69cf901f3e97c93395f7a--gh-1.11.0.bottle_manifest.json
==> Downloading https://ghcr.io/v2/homebrew/core/gh/blobs/sha256:34313bfaca6995d40836da15f3c1cf7579689f5ac1bdcf3e2e4e50c
Already downloaded: /Users/nikovirtala/Library/Caches/Homebrew/downloads/1eb3f40cf6fa82560f54b235fdedb761b36170a5b9d5c26b58be3d3b9afcb89b--gh--1.11.0.big_sur.bottle.tar.gz
==> Reinstalling gh
==> Pouring gh--1.11.0.big_sur.bottle.tar.gz
==> Caveats
zsh completions have been installed to:
  /usr/local/share/zsh/site-functions
==> Summary
🍺  /usr/local/Cellar/gh/1.11.0: 89 files, 28.6MB
```

That seems to be working too.

#### How about the future?

Naturally, tools like Homebrew don't support new operating system versions on the day they're released to the developer preview, but eventually, the support will follow – until then: happy hacking!
