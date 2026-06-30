#!/bin/sh
set -eu

cd "${GITHUB_WORKSPACE:-/workspace}"
exec emp "$@"
