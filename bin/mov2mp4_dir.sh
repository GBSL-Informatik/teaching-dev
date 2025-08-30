#!/usr/bin/env bash

set -e

usage="usage: ./mov2mp4_dir.sh path/to/folder"

if [ -z "$1" ]; then
  echo "$usage"
  exit 1
fi

FOLDER=$1

for MOV in "$FOLDER"/*.mov; 
do
  if [ -f "$MOV" ]; then
    TEMP_FILE="${MOV//\.mov/-temp\.mp4}"
    ffmpeg -i "$MOV" -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k "$TEMP_FILE"
    mv "$TEMP_FILE" "${MOV//\.mov/\.mp4}"
    rm "$MOV"
    echo "Recomputed and overwritten: ${MOV//\.mov/\.mp4}"
  fi
done