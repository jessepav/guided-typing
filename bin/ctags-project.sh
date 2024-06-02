#!/bin/bash

PROJDIR=$(realpath $(dirname "$0")/..)

cd $PROJDIR

if [[ $# -eq 0 ]]; then
    rg --files -tweb js | update-ctags tags
else
    update-ctags tags "$@"
fi
