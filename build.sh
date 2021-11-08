
   
#!/bin/sh

set -ex

# Arguments: $1 tag, $2 CLI_VERSION
build() {
  docker build \
    --build-arg CLI_VERSION="${1}-${2}" \
    -t bk/cli:"${2}-${1}" \
    .
}


for tag in "php7.4"; do
  build $tag "3.0"
done
