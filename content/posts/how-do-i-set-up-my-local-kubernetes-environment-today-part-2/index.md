---
title: "How do I set up my local Kubernetes environment today? — Part 2"
date: 2018-04-19T00:00:00+02:00
image: "images/kubernetes-2.jpg"
tags: ["docker", "kubernetes", "linux", "linuxkit"]
draft: false
---

![](https://cdn-images-1.medium.com/max/1600/1*I533oGWLyOJ3tVKtCrFRaQ.jpeg)

## What’s the story?

This is a second part on my ‘How do I set up my local Kubernetes environment
today?’ series. On the [first
part](https://medium.com/@nikovirtala/how-do-i-set-up-my-local-kubernetes-environment-today-part-1-2f2d83a9a3e1)
I covered how I am utilizing LinuxKit Kubernetes on my local development
environment. If you haven’t read it yet, I strongly recommend to do it now. — It
gives you the background to this story.

## Code, Build, Push, Deploy, Test, Repeat

Code, build, push, deploy, test and repeat. Do you recognize the pattern? How
many times you repeat it while building an image? — Some may say too many.

What if I tell you that there is a tooling available that helps on this. Tooling
that is not as heavy as full blown CI/CD pipeline but something that covers the
most crucial functionalities of it and is lightweight enough to run on our local
development environment. — Got interested?

## Skaffold

Skaffold is relatively new open source project from [Google Could
Platform](https://cloud.google.com/) team and this how they describe their
project on their [GitHub page](https://github.com/GoogleCloudPlatform/skaffold):

> Skaffold is a command line tool that facilitates continuous development for
> Kubernetes applications. You can iterate on your application source code locally
then deploy to local or remote Kubernetes clusters. Skaffold handles the
workflow for building, pushing and deploying your application. It can also be
used in an automated context such as a CI/CD pipeline to leverage the same
workflow and tooling when moving applications to production.

Sound like we have something in our hands that answers to our demand to automate
parts of our development workflow. So, let’s see how it works in practice.

## Installation

At the moment there is two easy ways to install Skaffold on Linux; download the
latest binary release or build from sources.

## Build from source

As the project is relatively young I like to keep up with the latest changes by
building the skaffold from sources. — This requires installation of `go` (1.10
minimum) , `git` and `make` . So, let’s build the Skaffold!

Start by downloading the latest sources:

```bash
[nikovirtala@thinky ~ ]$ go get -u -d github.com/GoogleCloudPlatform/skaffold 
package github.com/GoogleCloudPlatform/skaffold: no Go files in /home/nikovirtala/go/src/github.com/GoogleCloudPlatform/
skaffold 
```

enter into the source folder:

```bash
[nikovirtala@thinky ~ ]$ cd $GOPATH/src/github.com/GoogleCloudPlatform/skaffold
```

build it:

```bash
[nikovirtala@thinky skaffold ]$ make install 
mkdir -p ./out 
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go install -ldflags " -X github.com/GoogleContainerTools/skaffold/pkg/skaffold/ver
sion.version=v0.4.0 -X github.com/GoogleContainerTools/skaffold/pkg/skaffold/version.buildDate=2018-04-18T15:36:12Z -X g
ithub.com/GoogleContainerTools/skaffold/pkg/skaffold/version.gitCommit=7a89445cc34ee6f243fdf9e039c7d9264fd7cd6a -X githu
b.com/GoogleContainerTools/skaffold/pkg/skaffold/version.gitTreeState=clean " -tags "kqueue container_image_ostree_stub 
containers_image_openpgp" github.com/GoogleContainerTools/skaffold/cmd/skaffold
```

and test the installation:

```bash
[nikovirtala@thinky skaffold ]$ which skaffold 
/home/nikovirtala/go/bin/skaffold
```

```bash
[nikovirtala@thinky skaffold ]$ skaffold version 
v0.4.0
```

OK, now we have `skaffold` installed and we are ready to configure our first
project!

## Binary release

An alternative for building the `skaffold` from sources is to download the
latest binary release. At the point of writing the latest binary release version
is `v0.4.0` and the change log is available
[here](https://github.com/GoogleCloudPlatform/skaffold/blob/master/CHANGELOG.md).

Installing binary release can be done simply by running a following one liner. —
If you already build one from sources, you can skip this step.

```bash
curl -Lo skaffold 
  
&& chmod +x skaffold && sudo mv skaffold /usr/local/bin
```

## Set up your first Skaffold project

Skaffold configuration is defined in `skaffold.yaml`. This YAML file defines how
your container image is built, where it is stored and which resources should be
deployed in to Kubernetes cluster.

To be able to demonstrate how the build, push and deploy automation works with
Skaffold we need a little sample application, its `Dockerfile`, repository on
some image registry where to push the image, Kubernetes resource definitions and
a Kubernetes cluster. — I am going to use the same
[whalesay](https://github.com/nikovirtala/whalesay) application that I used on
[first
part](https://medium.com/@nikovirtala/how-do-i-set-up-my-local-kubernetes-environment-today-part-1-2f2d83a9a3e1/#2aa7)
to demonstrate the service deployment on Kubernetes, my repository is a
`nikovirtala/skaffold-demo` on Docker Hub and my Kubernetes cluster is LinuxKit
Kubernetes Project running on my laptop.

You may consider following definitions as a bare minimum required to run to
continuous deployment with Skaffold. So, this is what I have on my project
folder:

```bash
[nikovirtala@thinky whalesay ]$ ls -1 
Dockerfile 
kubernetes-whalesay.yml 
skaffold.yaml 
whalesay.go
```

`whalesay.go` — a little go application to print Moby ASCII and container ID.

```bash
[nikovirtala@thinky whalesay ]$ cat whalesay.go  
package main 
  
import ( 
  "fmt" 
  "log" 
  "net/http" 
  "os" 
) 
  
func handler(w http.ResponseWriter, r *http.Request) { 
  var name, _ = os.Hostname() 
  
  fmt.Fprintf(w, `<!DOCTYPE html> 
<html> 
<head> 
  <meta charset="UTF-8"> 
  <title>nikovirtala/whalesay</title> 
</head> 
<body> 
<pre> 
                    ##        . 
              ## ## ##       == 
            ## ## ## ##      === 
        /""""""""""""""""\___/ === 
  ~~~ {~~ ~~~~ ~~~ ~~~~ ~~ ~ /  ===- ~~~ 
        \______ o          __/ 
          \    \        __/ 
          \____\______/ 
  
          |          | 
        __ |  __   __ | _  __   _ 
      /  \| /  \ /   |/  / _\ | 
      \__/| \__/ \__ |\_ \__  | 
  
This request was processed by: %s 
</pre> 
</body> 
</html> 
`, name) 
log.Print("Served request ",r,"\n") 
} 
  
func main() { 
  log.SetOutput(os.Stderr) 
  log.Println("Starting server ...") 
  http.HandleFunc("/", handler) 
  err := http.ListenAndServe(":80",nil) 
  if err != nil { 
    log.Fatal("ListenAndServer: ", err) 
  } 
}
```

`Dockerfile` — This defines the container image to be built.

```bash
[nikovirtala@thinky whalesay ]$ cat Dockerfile 
FROM golang:alpine as build 
  
WORKDIR /whalesay 
ADD . . 
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o whalesay . 
  
FROM alpine:edge 
LABEL maintainer "Niko Virtala <niko@nikovirtala.io>" 
  
WORKDIR / 
COPY --from=build /whalesay . 
EXPOSE 80 
ENTRYPOINT ["/whalesay"]
```

`kubernetes-whalesay.yml`— Definition for Kubernetes service deployment and
exposure.

```bash
[nikovirtala@thinky whalesay ]$ cat kubernetes-whalesay.yml  
apiVersion: apps/v1 
kind: Deployment 
metadata: 
  name: whalesay 
  labels: 
    app: whalesay 
spec: 
  replicas: 3 
  selector: 
    matchLabels: 
      app: whalesay 
  template: 
    metadata: 
      labels: 
        app: whalesay 
    spec: 
      containers: 
      - name: whalesay 
        image: docker.io/nikovirtala/skaffold-demo 
        ports: 
        - containerPort: 80 
  
--- 
apiVersion: v1 
kind: Service 
metadata: 
  name: whalesay 
  labels: 
    app: whalesay 
spec: 
  type: NodePort 
  ports: 
  - port: 80 
    nodePort: 30001 
    protocol: TCP 
  selector: 
    app: whalesay
```

`skaffold.yaml` — Skaffold build, push and deploy instructions.

```bash
[nikovirtala@thinky whalesay ]$ cat skaffold.yaml 
apiVersion: skaffold/v1alpha2 
kind: Config 
build: 
  artifacts: 
  - imageName: docker.io/nikovirtala/skaffold-demo 
    workspace: ./ 
    docker: {} 
  local: {} 
deploy: 
  kubectl: 
    manifests: 
    - ./kubernetes-whalesay.yml
```

Now we have all necessary configuration defined, so let’s get the party started!

## Start continuous deployment

Just to make this demo clear, let’s make sure that our Kubernetes cluster does
not have any related resources running before we begin:

```bash
[nikovirtala@thinky whalesay ]$ kubectl config current-context 
kubernetes-admin@kubernetes 
[nikovirtala@thinky whalesay ]$ kubectl get pods 
No resources found.
```

Seems we have nothing running, so we are good to begin.

To start continuous deployment run: `skaffold dev` like this:

```bash
[nikovirtala@thinky whalesay ]$ skaffold dev 
Starting build... 
Sending build context to Docker daemon  108.5kB 
Step 1/10 : FROM golang:alpine as build 
  ---> 52d894fca6d4 
Step 2/10 : WORKDIR /whalesay 
  ---> Using cache 
  ---> e247af3d14a2 
Step 3/10 : ADD . . 
  ---> Using cache 
  ---> 26f6a12145a9 
Step 4/10 : RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o whalesay . 
  ---> Using cache 
  ---> 117e35c8159a 
Step 5/10 : FROM alpine:edge 
  ---> 5c4fa780951b 
Step 6/10 : LABEL maintainer "Niko Virtala <niko@nikovirtala.io>" 
  ---> Using cache 
  ---> 6abf21436c87 
Step 7/10 : WORKDIR / 
  ---> Using cache 
  ---> e41edc48d94b 
Step 8/10 : COPY --from=build /whalesay . 
  ---> Using cache 
  ---> 60169baaf4c7 
Step 9/10 : EXPOSE 80 
  ---> Using cache 
  ---> 6ffacee2d0ce 
Step 10/10 : ENTRYPOINT ["/whalesay"] 
  ---> Using cache 
  ---> 7c553383951b 
Successfully built 7c553383951b 
Successfully tagged bcc16f193f0c7bfc2ebe52e66d34892f:latest 
Digest: bcc16f193f0c7bfc2ebe52e66d34892f:latest 
Successfully tagged docker.io/nikovirtala/skaffold-demo:7c553383951b0e099e2ea1e81b86bee59e32c249ffb3279701f31dc799f08e0a 
The push refers to repository [docker.io/nikovirtala/skaffold-demo] 
d18415a0fc1a: Preparing 
c9e8b5c053a2: Preparing 
d18415a0fc1a: Layer already exists 
c9e8b5c053a2: Layer already exists 
7c553383951b0e099e2ea1e81b86bee59e32c249ffb3279701f31dc799f08e0a: digest: sha256:e64b03e193ef96d061b9db5f1db5c7b60d55af32d7db5300f2d
a29252913057a size: 739 
Build complete in 6.041379946s 
Starting deploy... 
Deploying ./kubernetes-whalesay.yml... 
Deploy complete in 444.734517ms 
Watching for changes... 
[whalesay-c47584b84-nzzhp whalesay] 2018/04/19 14:48:06 Starting server ... 
[whalesay-c47584b84-np4cs whalesay] 2018/04/19 14:48:06 Starting server ... 
[whalesay-c47584b84-zk8nn whalesay] 2018/04/19 14:48:07 Starting server ...
```

Quite amazing indeed! So, what really happened here?

1.  Container image was built based on `Dockerfile`
1.  The image was tagged and pushed to repository defined in `skaffold.yaml`
1.  Resources defined in `kubernetes-whalesay.yml` was deployed in to Kubernetes
cluster
1.  Skaffold is waiting for changes …
1.  Log stream to deployed pods was opened

Can we verify it all somehow? — Yes, we can!

First the container image, we should be able to pull it from registry:

```bash
[nikovirtala@thinky whalesay ]$ docker pull docker.io/nikovirtala/skaffold-demo:7c553383951b0e099e2ea1e81b86bee59e32c249ffb3279701f3
1dc799f08e0a 
7c553383951b0e099e2ea1e81b86bee59e32c249ffb3279701f31dc799f08e0a: Pulling from nikovirtala/skaffold-demo 
Digest: sha256:e64b03e193ef96d061b9db5f1db5c7b60d55af32d7db5300f2da29252913057a 
Status: Downloaded newer image for nikovirtala/skaffold-demo:7c553383951b0e099e2ea1e81b86bee59e32c249ffb3279701f31dc799f08e0a
```

It seems that we can. How about the Kubernetes resources, we should be able to
see those too?

```bash
[nikovirtala@thinky whalesay ]$ kubectl get deployments 
NAME       DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE 
whalesay   3         3         3            3           10m 
[nikovirtala@thinky whalesay ]$ kubectl get services 
NAME         TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)        AGE 
kubernetes   ClusterIP   10.96.0.1        <none>        443/TCP        2h 
whalesay     NodePort    10.105.164.190   <none>        80:30001/TCP   10m 
[nikovirtala@thinky whalesay ]$ kubectl get pods 
NAME                       READY     STATUS    RESTARTS   AGE 
whalesay-c47584b84-np4cs   1/1       Running   0          10m 
whalesay-c47584b84-nzzhp   1/1       Running   0          10m 
whalesay-c47584b84-zk8nn   1/1       Running   0          10m
```

As expected the resources we defined are deployed in to our Kubernetes cluster.
So, no magic, just a little automation that makes developer happy.

The voice back of your head may say now: H*ey, that is not continuous!* —Yes, it
is not until we make some change to our code … let me show you a little video:

<span class="figcaption_hack">Skaffold Continuous Deployment Workflow</span>

* On the left pane we have the `skaffold` output.
* On the upper right pane we watch the web page our service produce.
* On the lower right pane we are making changes to our code “on the fly”.

Liked what you just saw? — So did I and Skaffold has became my tool of choice
when developing container images to Kubernetes environment and especially for
the cases where a lots of iterations are needed.

## Conclusion

Skaffold seems to be very powerful and widely configurable continuous deployment
tool; we only scratched the surface and how much we got with just a few lines of
configuration? — A lot, then think what it could do on more complex application
set up. I stand amazed.

## Post Scriptum

This post was a second part of my ‘How do I set up my Kubernetes development
environment today?’ series. On [first
part](https://medium.com/@nikovirtala/how-do-i-set-up-my-local-kubernetes-environment-today-part-1-2f2d83a9a3e1)
we set up a local Kubernetes environment with [LinuxKit Kubernetes
Project](https://github.com/linuxkit/kubernetes) and on this one built up a
continuous deployment workflow with
[Skaffold](https://github.com/GoogleContainerTools/skaffold). In the next part I
am going to build container images without Docker daemon. — See you around!

## To Do

Perhaps I answered to the most fundamental questions about the workflow, there
is always more things to be considered, like:

* How to work with Helm charts?
* How to utilize build cache with LinuxKit Kubernetes; build and deploy container images without pushing them to registry first?
