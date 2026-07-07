#!/usr/bin/env bash

set -e


usage="usage: ./archive-version.sh \"28Gj,28Gk,28Gl\" git@github.com:lebalz/ofi-blog-v26.gitpo>.git v28.domain.ch"

# second argument are comma separated list of versions to deploy to, e.g. "28Gj,28Gk,28Gl"
# split into array using IFS
IFS=',' read -r -a VERSIONS <<< "$1"

REMOTE_URL=$2
DOMAIN=$3

# print the versions to deploy to
# comma separated list of versions to deploy to, e.g. "28Gj,28Gk,28Gl"
VERSIONS_CSV=$(IFS=','; echo "${VERSIONS[*]}")
BRANCH="archive-$(IFS='/'; echo "${VERSIONS[*]}")"
echo "Deploying version $BRANCH to $REMOTE_URL"

# ensure no uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
  echo "Error: You have uncommitted changes. Please commit or stash them before deploying."
  exit 1
fi

# checkout existing branch or create new branch
if git show-ref --verify --quiet refs/heads/$BRANCH; then
  git checkout $BRANCH
else
  git checkout -b $BRANCH
fi

yarn workspace @tdev/material-sync sync
yarn workspace @tdev/material-sync prepareArchive "$VERSIONS_CSV" --domain="$DOMAIN"
git add .
git commit -m "Prepare archive for versions: $VERSIONS_CSV"

yarn run docusaurus build

# only after a successful build, push the branch and tags to the remote repository
git push origin $BRANCH

# call `docusaurus build` directly to avoid prebuild/postbuild hooks

# exit if no REMOTE_URL is provided
if [[ -z "$REMOTE_URL" ]]; then
  echo "No REMOTE_URL provided, skipping deployment."
  exit 0
fi

cd build
git init .
git remote add origin $REMOTE_URL
git add .
git commit -m "initial commit"
git push -u origin main --force
cd ..
rm -rf build

git checkout main
