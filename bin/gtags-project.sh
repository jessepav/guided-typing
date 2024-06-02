#!/bin/bash
# Generates tag files for use with GNU Global

PROJDIR=$(realpath $(dirname "$0")/..)

cd $PROJDIR
rg --files -tweb js > gtags.files
gtags -vi --sqlite3
