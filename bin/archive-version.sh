#!/usr/bin/env bash

set -e


usage="usage: ./archive-version.sh \"28Gj,28Gk,28Gl\" git@github.com:lebalz/ofi-blog-v28.gitpo>.git v28.domain.ch"

# export env variable "BUILD_ARCHIVE" to indicate that we are building the archive version
export BUILD_ARCHIVE=true

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

# ensure that the current branch is main
if [[ $(git rev-parse --abbrev-ref HEAD) != "main" ]]; then
  echo "Error: You are not on the main branch. Please switch to the main branch before deploying."
  exit 1
fi

# checkout existing branch or create new branch
if git show-ref --verify --quiet refs/heads/$BRANCH; then
  echo "Branch $BRANCH already exists. Forcing to delete it and create a new one based on main."
  git branch -D $BRANCH
fi

git checkout -b $BRANCH

yarn workspace @tdev/material-sync sync
yarn workspace @tdev/material-sync prepareArchive "$VERSIONS_CSV" --domain="$DOMAIN"

# inform the user, that now he can make additional changes to the archive versions, e.g. modify landing page or edit the .env file,
# before committing the changes and building the static site
echo "You can now make additional changes to the archive versions, e.g. modify landing page or edit the .env file, before committing the changes and building the static site."
echo "Want to continue? [y/n]"
read -r answer
if [[ "$answer" != "y" ]]; then
  echo "Aborting. Steps to do manually:"
  echo "1. git add . && git commit -m \"Prepare archive for versions: $VERSIONS_CSV\""
  echo "2. yarn run docusaurus build"
  echo "3. git push origin $BRANCH"
  echo "4. cd build && git init . && git add . && git commit -m \"initial commit\" && git branch -M main && git remote add origin $REMOTE_URL"
  echo "5. git push -u origin main --force"
  echo "6. cd .. && rm -rf build # cleanup"
  echo "7. git checkout main"
  exit 1
fi

git add .
git commit -m "Prepare archive for versions: $VERSIONS_CSV"

yarn run docusaurus build

# only after a successful build, push the branch and tags to the remote repository
git push origin $BRANCH --force

# call `docusaurus build` directly to avoid prebuild/postbuild hooks

# exit if no REMOTE_URL is provided
if [[ -z "$REMOTE_URL" ]]; then
  echo "No REMOTE_URL provided, skipping deployment."
  exit 0
fi

cd build
git init .
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin $REMOTE_URL
git push -u origin main --force
cd ..
rm -rf build

git checkout main
