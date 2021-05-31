---
title: "GitHub Actions Runner on AWS Fargate"
date: 2020-04-23T18:59:00+02:00
description: ""
---

Sometimes it's nice to do something, maybe a little indecisive, just because it's possible. That's the subject of this blog.

It is just two days ago when I asked on Twitter:

> Has anyone deployed their self-hosted #GitHub Actions runners to #AWS #Fargate? – [@nikovirtala](https://twitter.com/nikovirtala/status/1252630501258661894?s=20)

Apparently, no one did, since also Google didn't provide me any hits. 🤷

So, what was all this buzz about and what I actually wanted to achieve?

> [GitHub Actions](https://github.com/features/actions) is a software workflow automation tool with CI/CD capability from GitHub. In November 2019, GitHub open-sourced the [runner](https://github.com/actions/runner) component and added [support to run workflows on self-hosted machines](https://github.blog/changelog/2019-11-05-github-actions-self-hosted-runners/).

> [AWS Fargate](https://aws.amazon.com/fargate/), on the other hand, is a serverless compute engine for containers and one of the best computing inventions of this decade.

**I want to use AWS Fargate to host my GitHub Actions runners!**

Since both technologies are familiar to me, I decided to pull strings together. As an exception to my regular routines, I chose to use [AWS Cloud Development Kit](https://github.com/aws/aws-cdk) as a deployment tool instead of a safe and sound Terraform.

After a few hours of work, I came up with this: a fully functional example of executing self-hosted GitHub Actions runner on AWS Fargate! https://github.com/nikovirtala/github-actions-runner

It’s still raw, but most importantly, it proves the concept works! If you have any questions or comments, poke me on [Twitter](https://twitter.com/nikovirtala) or [GitHub](https://github.com/nikovirtala), I'm all ears. :)

Ps. I right before finishing this post, I noticed that yesterday we also got support for [Organization level self-hosted runners](https://github.blog/changelog/2020-04-22-github-actions-organization-level-self-hosted-runners/). It only means that my newly created side project just got a new feature too! 🤓
