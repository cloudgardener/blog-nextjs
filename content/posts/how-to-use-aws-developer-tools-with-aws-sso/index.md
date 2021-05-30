---
title: "How To Use AWS Developer Tools With AWS SSO?"
date: 2020-09-12T11:46:00+02:00
description: ""
featured: images/key.jpg
---

![the key](images/key.jpg)

> What I cannot create, I do not understand. ― Richard P. Feynman

As multi-account AWS architectures have become more common, there has also been a need to implement centralized user and access management. The AWS solution to this problem is AWS SSO, which is indeed a neat solution, but ...

Many popular developer tools, including AWS' own CDK (Cloud Development Kit) and Amplify, do not support it yet, as we can find from the GitHub issues:

- [AWS SSO Named Profiles Support](https://github.com/aws/aws-cdk/issues/5455)
- [Problem using CLI via AWS SSO](https://github.com/aws-amplify/amplify-cli/issues/4488)

As usual, the best answer to these problems can be found on Twitter, so also this time. [I complained about the issue](https://twitter.com/nikovirtala/status/1304308556083200006), and very soon, I had the best solution so far in my hands!

[Ben Kehoe](https://twitter.com/ben11kehoe) has written two nice helper tools to go around the problem:

- [benkehoe/aws-sso-credential-process](https://github.com/benkehoe/aws-sso-credential-process)
- [benkehoe/aws-export-credentials](https://github.com/benkehoe/aws-export-credentials)

And [Jared Short](https://twitter.com/ShortJared) came up with a little helper function, which will nicely tie the whole process together.

So, what do I need to do?

1. Install the two tools; [aws-sso-credential-process](https://github.com/benkehoe/aws-sso-credential-process) and [aws-export-credentials](https://github.com/benkehoe/aws-export-credentials)

2. Place following to your `.bashrc`, `.zshrc` or similar: _– Don't forget to replace the start URL and region values._

```bash
export AWS_CONFIGURE_SSO_DEFAULT_SSO_START_URL=https://<your-sso>.awsapps.com/start
export AWS_CONFIGURE_SSO_DEFAULT_SSO_REGION=<your-default-region>

sso(){
  unset AWS_PROFILE
  export AWS_PROFILE=$1
  aws sts get-caller-identity &> /dev/null \
  || aws sso login \
  || (unset AWS_PROFILE && aws-configure-sso-profile --profile)
  eval $(aws-export-credentials --env-export)
}
```

3. Source your profile, run `sso`, and off you go! – The helper tools will configure your shell with credentials that most of the tools can understand, even they wouldn't support AWS SSO yet.
