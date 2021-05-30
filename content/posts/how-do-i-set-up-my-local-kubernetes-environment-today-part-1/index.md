---
title: "How do I set up my local Kubernetes environment today? — Part 1"
date: 2018-03-19T00:00:00+02:00
image: "images/kubernetes-1.jpg"
tags: ["docker", "kubernetes", "linux", "linuxkit"]
draft: false
---

![](https://cdn-images-1.medium.com/max/1600/1*I533oGWLyOJ3tVKtCrFRaQ.jpeg)

## Background

Last ten years I have been using macOS as a my main operating system on desktop
but after recurring disappointments with the latest Sierra and High Sierra
releases I decided to jump back to Linux.

I chose [Arch Linux](https://www.archlinux.org/) distribution and run it on
Lenovo T-series laptop. — I don’t know whether I get more stable environment by
doing this but at least I have better control to my system. :)

## Problem

Lately I have been using [Docker for Mac Edge
channel](https://docs.docker.com/docker-for-mac/kubernetes/) release with
Kubernetes as my local Kubernetes development environment but with Linux I do
not have this luxary anymore, so I had to find some other solution to fill the
gap.

## LinuxKit

If you’re familiar at all with the Docker for Mac or Windows tech stack you may
have heard that it is based on something called
[LinuxKit](https://github.com/linuxkit/).

LinuxKit is a toolkit for building secure, portable and lean operating systems
for containers and less surprisingly these guys build also a Kubernetes
distribution that you can run on `hyperkit` on macOS or `qemu` on Linux. So,
maybe here is a solution for my problem? — Let’s give it a try.

## Requirements

LinuxKit tool is built with [Go](https://golang.org/) and following guide expect
that you have Go installed and set up. Instructions how to install and set up Go
environment can be found [here](https://golang.org/doc/install).

You’ll need also following tools: `make` , `docker` ,`qemu` , `libvirt` , `git`
and `kubectl`

## Set up networking

By default linuxkit uses user mode networking which does not support access from
the host and it also means that you will not be able to run worker nodes since
individual instances cannot see each other.

To enable networking between host and instances we need to configure a bridge
and setup the bridge mode privileged helper. — This requires `root` privileges.
If you already use `qemu` and have a bridge created by e.g. `virt-manager` you
can re-use it.

I am using `virsh` to set up the network. You can find complete reference with
examples from [here](https://libvirt.org/sources/virshcmdref/html/).

First, let’s see whether we have any networks defined:

```bash
[nikovirtala@thinky ~ ]$ sudo virsh net-list 
  Name                 State      Autostart     Persistent 
----------------------------------------------------------
```

It seems we have none. Let’s define one:

```bash
[nikovirtala@thinky ~ ]$ cat <<'EOF' >> default.xml 
> <network> 
>   <name>default</name> 
>   <forward mode='nat'> 
>     <nat> 
>       <port start='1024' end='65535'/> 
>     </nat> 
>   </forward> 
>   <bridge name='virbr0' stp='on' delay='0'/> 
>   <ip address='192.168.122.1' netmask='255.255.255.0'> 
>     <dhcp> 
>       <range start='192.168.122.2' end='192.168.122.254'/> 
>     </dhcp> 
>   </ip> 
> </network> 
> EOF
```

```bash
[nikovirtala@thinky ~ ]$ sudo virsh net-define default.xml  
Network default defined from default.xml
```

Now we can check the network created:

```bash
[nikovirtala@thinky ~ ]$ sudo virsh net-list --all          
  Name                 State      Autostart     Persistent 
---------------------------------------------------------- 
  default              inactive   no            yes
```

It seems that our newly defined network is not active and is not started
automatically on boot, so let’s make some changes and check them:

```bash
[nikovirtala@thinky ~ ]$ sudo virsh net-autostart default 
Network default marked as autostarted 
  
[nikovirtala@thinky ~ ]$ sudo virsh net-start default          
Network default started

[nikovirtala@thinky ~ ]$ sudo virsh net-list          
  Name                 State      Autostart     Persistent 
---------------------------------------------------------- 
  default              active     yes           yes
```

Now we have a network up and running and we are able to proceed to enable
`qemu-bridge-mode-helper`. This helper runs with higher privileges and allows
`qemu` to be invoked as a non-privileged user. — You don’t want to run your
virtual machines with `root` privileges.

First turn on the [setuid](https://en.wikipedia.org/wiki/Setuid) attribute:

```bash
[nikovirtala@thinky ~ ]$ sudo chmod u+x /usr/lib/qemu/qemu-bridge-helper
```

and create ACL allow the bridge `virbr0` to be used by non-privileged users:

```bash
[nikovirtala@thinky ~ ]$ sudo sh -c 'echo allow virbr0 >> /etc/qemu/bridge.conf'
```
## Get LinuxKit

Installation of LinuxKit can be done simply with single command:

```bash
[nikovirtala@thinky ~ ]$ go get -u github.com/linuxkit/linuxkit/src/cmd/linuxkit
```

```bash
[nikovirtala@thinky ~ ]$ linuxkit --help 
USAGE: linuxkit [options] COMMAND 
  
Commands: 
  build       Build an image from a YAML file 
  metadata    Metadata utilities 
  pkg         Package building 
  push        Push a VM image to a cloud or image store 
  run         Run a VM image on a local hypervisor or remote cloud 
  serve       Run a local http server (for iPXE booting) 
  version     Print version information 
  help        Print this message 
  
Run 'linuxkit COMMAND --help' for more information on the command 
  
Options: 
  -q    Quiet execution 
  -v    Verbose execution
```

## Get and Build LinuxKit Kubernetes

Once we have required tools installed and configured we can download the
LinuxKit Kubernetes distribution:

```bash
[nikovirtala@thinky linuxkit ]$ git clone https://github.com/linuxkit/kubernetes.git 
Cloning into 'kubernetes'... 
remote: Counting objects: 2541, done. 
remote: Compressing objects: 100% (34/34), done. 
remote: Total 2541 (delta 16), reused 30 (delta 13), pack-reused 2494 
Receiving objects: 100% (2541/2541), 410.64 KiB | 264.00 KiB/s, done. 
Resolving deltas: 100% (1477/1477), done.
```

To be able to execute Kubernetes we need to build the .iso installation images;
`kube-master.iso` and `kube-node.iso`.

LinuxKit Kubernetes can be built with two different container runtimes, Docker
or Containerd. — Docker is the current default.

Build with Docker:

```bash
nikovirtala@thinky kubernetes ]$ make all 
curl -L -o kube-weave.yaml https://cloud.weave.works/k8s/v1.8/net?v=v2.2.1 
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current 
                                  Dload  Upload   Total   Spent    Left  Speed 
100  6696  100  6696    0     0   6059      0  0:00:01  0:00:01 --:--:--  6059 
linuxkit  build  -name kube-master -format iso-bios yml/kube.yml yml/docker.yml yml/docker-master.yml yml/weave.yml 
Extract kernel image: linuxkit/kernel:4.14.26 
Add init containers: 
Process init image: linuxkit/init:b212cfeb4bb6330e0a7547d8010fe2e8489b677a 
WARN[0008] Error while downloading remote metadata, using cached timestamp - this might not be the latest version avai
lable remotely  
Process init image: linuxkit/runc:7c39a68490a12cde830e1922f171c451fb08e731 
Process init image: linuxkit/containerd:37e397ebfc6bd5d8e18695b121166ffd0cbfd9f0 
Process init image: linuxkit/ca-certificates:0a188e40108b6ece8c2aefdfaaad94acc84368ce 
Add onboot containers: 
  Create OCI config for linuxkit/sysctl:d58499a8af6988929e2d7da357d5203634f5748e 
  Create OCI config for linuxkit/sysfs:43b21be975bb33fe8c60b1f005dd354bea265333 
  Create OCI config for linuxkit/dhcpcd:0f90a720d88896fd7a415476ba9b2749d4376d6b 
  Create OCI config for linuxkit/metadata:b14cfe4ecc8ec42cafc2ca9c6afe2d52f2bf24f4 
  Create OCI config for linuxkit/format:55aa87f123be212da4e2229257aac37dad3be8c3 
  Create OCI config for linuxkit/mount:6cdb5653a69586f448698203ed295cd8fbdd579d 
Add service containers: 
  Create OCI config for linuxkit/getty:49c4e22cf44edf27ad6aea899153c7d717192c7a 
  Create OCI config for linuxkit/rngd:12dfee0c1f63b98b9e311b5f37d0a18a76b03eba 
  Create OCI config for linuxkit/openntpd:e4e9073946e29683fc5a09c30e010c41911d36f8 
  Create OCI config for linuxkit/sshd:4f403fe5ae53dc3e45c8f6972dced9dddf900ae6 
  Create OCI config for linuxkit/kubelet:c8408d29a2b75f8da5631e737fe6897a7a9dc015 
  Create OCI config for docker:17.12.0-ce-dind 
  Create OCI config for linuxkit/kubernetes-docker-image-cache-common:3908afb90636922c6b4bcb1e68afe93e57f07881 
  Create OCI config for linuxkit/kubernetes-docker-image-cache-control-plane:14734b322d88a8c9495e74a8d414eb9984a28fcb 
Add files: 
  etc/linuxkit.yml 
  /etc/kubernetes 
  /etc/os-release 
  /usr/libexec/kubernetes/kubelet-plugins 
  /etc/kubeadm/ 
  /etc/sysctl.d/01-kubernetes.conf 
  /etc/cni/net.d 
  /opt/cni/bin 
  root/.ssh/authorized_keys 
  /etc/kubelet.sh.conf 
  /etc/kubeadm/kube-system.init/50-weave.yaml 
Create outputs: 
  kube-master.iso 
linuxkit  build  -name kube-node -format iso-bios yml/kube.yml yml/docker.yml yml/weave.yml 
Extract kernel image: linuxkit/kernel:4.14.26 
Add init containers: 
Process init image: linuxkit/init:b212cfeb4bb6330e0a7547d8010fe2e8489b677a 
Process init image: linuxkit/runc:7c39a68490a12cde830e1922f171c451fb08e731 
Process init image: linuxkit/containerd:37e397ebfc6bd5d8e18695b121166ffd0cbfd9f0 
Process init image: linuxkit/ca-certificates:0a188e40108b6ece8c2aefdfaaad94acc84368ce 
Add onboot containers: 
  Create OCI config for linuxkit/sysctl:d58499a8af6988929e2d7da357d5203634f5748e 
  Create OCI config for linuxkit/sysfs:43b21be975bb33fe8c60b1f005dd354bea265333 
  Create OCI config for linuxkit/dhcpcd:0f90a720d88896fd7a415476ba9b2749d4376d6b 
  Create OCI config for linuxkit/metadata:b14cfe4ecc8ec42cafc2ca9c6afe2d52f2bf24f4 
  Create OCI config for linuxkit/format:55aa87f123be212da4e2229257aac37dad3be8c3 
  Create OCI config for linuxkit/mount:6cdb5653a69586f448698203ed295cd8fbdd579d 
Add service containers: 
  Create OCI config for linuxkit/getty:49c4e22cf44edf27ad6aea899153c7d717192c7a 
  Create OCI config for linuxkit/rngd:12dfee0c1f63b98b9e311b5f37d0a18a76b03eba 
  Create OCI config for linuxkit/openntpd:e4e9073946e29683fc5a09c30e010c41911d36f8 
  Create OCI config for linuxkit/sshd:4f403fe5ae53dc3e45c8f6972dced9dddf900ae6 
  Create OCI config for linuxkit/kubelet:c8408d29a2b75f8da5631e737fe6897a7a9dc015 
  Create OCI config for docker:17.12.0-ce-dind 
  Create OCI config for linuxkit/kubernetes-docker-image-cache-common:3908afb90636922c6b4bcb1e68afe93e57f07881 
Add files: 
  etc/linuxkit.yml 
  /etc/kubernetes 
  /etc/os-release 
  /usr/libexec/kubernetes/kubelet-plugins 
  /etc/kubeadm/ 
  /etc/sysctl.d/01-kubernetes.conf 
  /etc/cni/net.d 
  /opt/cni/bin 
  root/.ssh/authorized_keys 
  /etc/kubelet.sh.conf 
  /etc/kubeadm/kube-system.init/50-weave.yaml 
Create outputs: 
  kube-node.iso
```

or build with `cri-containerd` :

```bash
[nikovirtala@thinky kubernetes ]$ make all KUBE_RUNTIME=cri-containerd
```

## Boot up Kubernetes Master

Once we have build our installation images we can boot up the Kubernetes Master
node using `boot.sh`. As we want our cluster to be reachable for host and other
nodes we define the bridge networking with `KUBE_NETWORKING` variable and let
the installation initialize our Kubernetes cluster by defining
`KUBE_MASTER_AUTOINIT` variable.

```bash
[nikovirtala@thinky kubernetes ]$ KUBE_NETWORKING=bridge,virbr0 
Loading /boot/kernel... o
[    0.000000] Linux version 4.14.26-linuxkit (root@02474662be5f) (gcc version 6.4.0 (Alpine 6.4.0)) #1 SMP Mon Mar 18

...
  
Welcome to LinuxKit 
  
                        ##         . 
                  ## ## ##        == 
                ## ## ## ## ##    === 
            /"""""""""""""""""\___/ === 
          {                       /  ===- 
            \______ O           __/ 
              \    \         __/ 
              \____\_______/ 
  
eth0: waiting for carrier 
eth0: carrier acquired 
DUID 00:01:00:01:22:41:45:f8:02:3b:51:ab:29:dd 
eth0: IAID 51:ab:29:dd 
eth0: adding address fe80::f767:e9d:a73d:963e 
eth0: soliciting an IPv6 router 
eth0: soliciting a DHCP lease 
eth0: offered 192.168.122.47 from 192.168.122.1 
eth0: leased 192.168.122.47 for 3600 seconds 
eth0: adding route to 192.168.122.0/24 
eth0: adding default route via 192.168.122.1 
exiting due to oneshot 
dhcpcd exited 
2018/03/18 15:45:15 Trying CDROM /dev/sr0 
2018/03/18 15:45:15 Trying CDROM /dev/sr1 
2018/03/18 15:45:15 CDROM /dev/sr1: Probe succeeded 
...
2018/03/18 15:45:16 Creating partition on /dev/sda 
2018/03/18 15:45:18 Partition /dev/sda1 successfully created! 
...
linuxkit-023b51ab29dd login: root (automatic login) 
  
Welcome to LinuxKit! 
  
NOTE: This system is namespaced. 
The namespace you are currently in may not be the root. 
login[625]: root login on 'ttyS0' 
(ns: getty) linuxkit-023b51ab29dd:~#
```

It seems that our Kubernetes is up and running! We can also see from the output
that it has got an IP address `192.168.122.47` from the network we defined
earlier. Maybe we can login to it remotely with SSH?

For remote access we can use `ssh_into_kubelet.sh` script:

```bash
[nikovirtala@thinky kubernetes ]$ ./ssh_into_kubelet.sh 192.168.122.47 
linuxkit-023b51ab29dd:/#
```

We are in! Let’s see how our Kubernetes is doing?

```bash
linuxkit-023b51ab29dd:/# kubectl get nodes 
NAME                    STATUS    ROLES     AGE       VERSION 
linuxkit-023b51ab29dd   Ready     master    12m       v1.9.4
```

```bash
linuxkit-023b51ab29dd:/# kubectl get pods --all-namespaces 
NAMESPACE     NAME                                            READY     STATUS    RESTARTS   AGE 
kube-system   etcd-linuxkit-023b51ab29dd                      1/1       Running   0          11m 
kube-system   kube-apiserver-linuxkit-023b51ab29dd            1/1       Running   0          11m 
kube-system   kube-controller-manager-linuxkit-023b51ab29dd   1/1       Running   0          11m 
kube-system   kube-dns-6f4fd4bdf-5cjrb                        3/3       Running   0          12m 
kube-system   kube-proxy-jd4q5                                1/1       Running   0          12m 
kube-system   kube-scheduler-linuxkit-023b51ab29dd            1/1       Running   0          11m 
kube-system   weave-net-v7cmm                                 2/2       Running   1          12m
```

`etcd` , `apiserver` , `controller-manager` , `dns` , `proxy` , `scheduler` as
well as `weave-net` are all up and running! — Seems that LinuxKit Kubernetes is
quite easy way to get a local Kubenetes cluster installed.

## Allow containers to be executed on master node

In a normal Kubernetes setup your application containers are running on separate
worker nodes but in development environment that is not really necessary. We can
allow container execution on our master by tainting it:

```bash
linuxkit-023b51ab29dd:/# kubectl taint nodes --all node-
role.kubernetes.io/master- --kubeconfig /etc/kubernetes/admin.conf 
  
node "linuxkit-023b51ab29dd" untainted
```

## Set up kubectl

Ok, now we have Kubernetes “cluster” which can run containers but do we want to
always SSH in to it to be able to control it? — No. So, let’s configure
`kubectl` on our host machine to use our newly set up Kubernetes cluster.

Find out the `admin.conf` from the master node:

```bash
linuxkit-023b51ab29dd:/# cat /etc/kubernetes/admin.conf
apiVersion: v1 
clusters: 
- cluster: 
    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUN5RENDQWJDZ0F3SUJBZ0lCQURB...
lGSUNBVEUtLS0tLQo= 
    server: https://192.168.122.47:6443 
  name: kubernetes 
contexts: 
- context: 
    cluster: kubernetes 
    user: kubernetes-admin 
  name: kubernetes-admin@kubernetes 
current-context: kubernetes-admin@kubernetes 
kind: Config 
preferences: {} 
users: 
- name: kubernetes-admin 
  user: 
    client-certificate-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUM4akNDQWRxZ0F3SUJBZ0lJYmhi...
VMXFrY3lmVT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo= 
    client-key-data: LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFb2dJQkFBS0NBUUVBdHhM...
ERHZBdTQ9Ci0tLS0tRU5EIFJTQSBQUklWQVRFIEtFWS0tLS0tCg==
```

and copy it’s content to kubectl configuration file `~/.kube/config` on your
host:

```bash
[nikovirtala@thinky ~ ]$ cat /home/nikovirtala/.kube/config  
apiVersion: v1 
clusters: 
- cluster: 
    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUN5RENDQWJDZ0F3SUJBZ0lCQURB...
lGSUNBVEUtLS0tLQo= 
    server: https://192.168.122.47:6443 
  name: kubernetes 
contexts: 
- context: 
    cluster: kubernetes 
    user: kubernetes-admin 
  name: kubernetes-admin@kubernetes 
current-context: kubernetes-admin@kubernetes 
kind: Config 
preferences: {} 
users: 
- name: kubernetes-admin 
  user: 
    client-certificate-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUM4akNDQWRxZ0F3SUJBZ0lJYmhi...
VMXFrY3lmVT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo= 
    client-key-data: LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFb2dJQkFBS0NBUUVBdHhM...
ERHZBdTQ9Ci0tLS0tRU5EIFJTQSBQUklWQVRFIEtFWS0tLS0tCg==
```

then try with `kubectl` :

```bash
[nikovirtala@thinky ~ ]$ kubectl config current-context 
kubernetes-admin@kubernetes

[nikovirtala@thinky ~ ]$ kubectl get nodes           
NAME                    STATUS     ROLES     AGE       VERSION 
linuxkit-023b51ab29dd   Ready      master    46m       v1.9.4
```

Boom! We have Docker for Mac / Minikube like local Kubernetes setup up, running
and reachable on our localhost. Easy, I would say. :)

## Test it!

Before we can really say that our cluster deployment is fully functional we want
to make a little service deployment test.

Let’s define a `deployment` that has three pods listening on port `80` and
expose it as a `service` that listens node port `30001` :

```bash
[nikovirtala@thinky ~ ]$ cat <<'EOF' > whalesay.yml 
> apiVersion: apps/v1 
> kind: Deployment 
> metadata: 
>   name: whalesay 
>   labels: 
>     app: whalesay 
> spec: 
>   replicas: 3 
>   selector: 
>     matchLabels: 
>       app: whalesay 
>   template: 
>     metadata: 
>       labels: 
>         app: whalesay 
>     spec: 
>       containers: 
>       - name: whalesay 
>         image: nikovirtala/whalesay:latest 
>         ports: 
>         - containerPort: 80 
>  
> --- 
> apiVersion: v1 
> kind: Service 
> metadata: 
>   name: whalesay 
>   labels: 
>     app: whalesay 
> spec: 
>   type: NodePort 
>   ports: 
>   - port: 80 
>     nodePort: 30001 
>     protocol: TCP 
>   selector: 
>     app: whalesay 
> EOF
```

deploy it:

```bash
[nikovirtala@thinky ~ ]$ kubectl apply -f whalesay.yml   
deployment "whalesay" created 
service "whalesay" created
```

check whether the deployment, service and pods are created:

```bash
[nikovirtala@thinky ~ ]$ kubectl get deployment whalesay 
NAME       DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE 
whalesay   3         3         3            3           6m
```

```bash
[nikovirtala@thinky ~ ]$ kubectl get service whalesay           
NAME       TYPE       CLUSTER-IP     EXTERNAL-IP   PORT(S)        AGE 
whalesay   NodePort   10.110.61.13   <none>        80:30001/TCP   11m
```

```bash
[nikovirtala@thinky ~ ]$ kubectl get pods 
NAME                        READY     STATUS    RESTARTS   AGE 
whalesay-6659c7bbc8-l42nv   1/1       Running   0          6m 
whalesay-6659c7bbc8-pwbn8   1/1       Running   0          6m 
whalesay-6659c7bbc8-zqtbm   1/1       Running   0          6m
```

Seems that everything is up, so we can try to access the service:

```bash
[nikovirtala@thinky ~ ]$ curl http://192.168.122.47:30001 
<!DOCTYPE html> 
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
  
This request was processed by: whalesay-6659c7bbc8-pwbn8 
</pre> 
</body> 
</html>
```

Nice! We have done our first deployment to our local Kubernetes cluster and
confirm that it is working fine.

## Conclusion

The LinuxKit Kubernetes is very nice and easy way to set up and is very good
alternative for Docker for Mac or Minikube as a local Kubernetes environment.

## Post Scriptum

This post was a first part of my ‘How do I set up my Kubernetes development
environment today?’ series. In the next part I am going to write few words about
[Skaffold](https://github.com/GoogleCloudPlatform/skaffold) and how we can
leverage it in our local Kubernetes development environment.

pps. This was my very first blog post ever and therefore I am more than
interested to hear your feedback about it.

## To Do

If you found this setup useful you should probably take a look and find answer
for following questions:

* How to start LinuxKit Kubernetes automatically on host boot?
* Check which kind of CPU and memory settings are used and how those can be adjusted?
