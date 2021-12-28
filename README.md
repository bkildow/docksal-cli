# Octane CLI Docker image for Docksal

This Docker image adds the following tools to the docksal/cli image:

- pa11y v5
- puppeteer v1.2 (needs testing with v2.x)
- vim
- AWS Cli
- kubectl

# Local development

Generate Dockerfiles:

```
npm install
npm run generate-dockerfiles
```

Test build (for 8.0 for example):

```
docker build build/8.0
```

## Prerequisites

- Nodejs
- Docker
- Git

## Changing the docker image

The entrypoint to make changes to the Dockerfile is `src/Dockerfile_template.njk`. This is a
nunjucks (nodejs template language) file which allows for different variations of the Dockerfile
to be generated. In this case it allows for separate PHP image versions (7.3, 7.4, etc.) to be generated from a single file.

## Adding files to the docker build context

Under `src`, files can be added to either the `shared` directory or individual version dirs 
(i.e. 8.0). The individual version dirs will override anything in the shared dir if named the
same. These files get copied appropriately to the build output dir after running 
`npm run generate-dockerfiles`.

## Adding a new PHP version of docksal cli

To add a new version of docksal cli (8.1 for example), there are two places that need changed:

- config.json needs updated
- A new version dir needs created under `src`

# CI build

The CI build runs on GitHub actions. It uses the build matrix feature to run the multiple php
version builds in parallel. It runs Qemu and docker buildx to handle the multi-arch builds 
(ARM64 and AMD64).
